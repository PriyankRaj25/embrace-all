import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { convertToModelMessages, generateObject, streamText, type UIMessage } from "ai";
import {
  AGENT_BY_KEY,
  AGENT_PROMPTS,
  AGENT_SCHEMAS,
  STAGE_ORDER,
  type AgentKey,
} from "@/lib/agents";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

/**
 * NDJSON streaming orchestrator.
 * Client POSTs { projectId } with Bearer token; server validates, runs the
 * agent pipeline, persists each artifact + agent_run, and streams events.
 */

type Event =
  | { type: "start"; agent: AgentKey; name: string; at: string }
  | { type: "complete"; agent: AgentKey; name: string; summary: string; output: unknown; at: string; duration_ms: number }
  | { type: "error"; agent: AgentKey; message: string }
  | { type: "done"; overall_status: string };

async function validateBearer(request: Request) {
  const auth = request.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return null;
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return { supabase, userId: data.user.id, token };
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as { projectId?: string; messages?: unknown };

        if (Array.isArray(body.messages)) {
          const apiKey = process.env.LOVABLE_API_KEY;
          if (!apiKey) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

          const gateway = createLovableAiGatewayProvider(apiKey);
          const result = streamText({
            model: gateway("openai/gpt-5.5"),
            system:
              "You are AetherOS, an AI operating system for enterprise engineering. Help users design, review, and explain production cloud architectures. Be concise, structured, investor-demo-ready, and practical. When useful, organize answers as architecture, data flow, security, compliance, reliability, FinOps, and implementation plan.",
            messages: await convertToModelMessages(body.messages as UIMessage[]),
          });

          return result.toUIMessageStreamResponse({ originalMessages: body.messages as UIMessage[] });
        }

        const session = await validateBearer(request);
        if (!session) return new Response("Unauthorized", { status: 401 });

        const { projectId } = body as { projectId?: string };
        if (!projectId) return new Response("Missing projectId", { status: 400 });

        // Load project (RLS enforces ownership)
        const { data: project, error: projErr } = await session.supabase
          .from("projects").select("*").eq("id", projectId).single();
        if (projErr || !project) return new Response("Project not found", { status: 404 });

        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const gateway = createLovableAiGatewayProvider(apiKey);
        const model = gateway("openai/gpt-5.5");

        await session.supabase.from("projects").update({ status: "running", current_stage: "planner" }).eq("id", projectId);

        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          async start(controller) {
            const send = (ev: Event) => controller.enqueue(encoder.encode(JSON.stringify(ev) + "\n"));
            const context: Record<string, unknown> = {
              requirement: project.requirement,
              cloud: project.cloud,
              compliance: project.compliance,
              scale_hint: project.scale_hint,
              name: project.name,
            };

            try {
              for (const key of STAGE_ORDER) {
                const spec = AGENT_BY_KEY[key];
                send({ type: "start", agent: key, name: spec.name, at: new Date().toISOString() });
                const t0 = Date.now();

                // Insert pending run
                const { data: run } = await session.supabase.from("agent_runs").insert({
                  project_id: projectId, user_id: session.userId,
                  agent_key: key, agent_name: spec.name, status: "running",
                }).select("id").single();

                await session.supabase.from("projects").update({ current_stage: key }).eq("id", projectId);

                try {
                  let output: unknown;
                  let summary = "";

                  if (key === "planner") {
                    // Planner: emit textual plan
                    const { object } = await generateObject({
                      model,
                      schema: (await import("zod")).z.object({
                        plan: (await import("zod")).z.array((await import("zod")).z.object({
                          agent: (await import("zod")).z.string(),
                          intent: (await import("zod")).z.string(),
                        })),
                        rationale: (await import("zod")).z.string(),
                      }),
                      system: "You are the Planning Agent of AetherOS, an AI operating system for enterprise engineering. Produce an execution plan naming each downstream agent in order and the intent of its step. Be concise.",
                      prompt: `Business requirement: ${project.requirement}\nCloud: ${project.cloud}\nCompliance: ${(project.compliance || []).join(", ") || "none"}\nScale hint: ${project.scale_hint || "unspecified"}\n\nReturn a plan invoking these agents in order: requirements, domain, solution, cloud, security, compliance, finops, reliability, iac, docs, reviewer.`,
                    });
                    output = object;
                    summary = object.rationale;
                  } else {
                    const schema = AGENT_SCHEMAS[key];
                    const { object } = await generateObject({
                      model,
                      schema,
                      system: `You are the ${spec.name} inside AetherOS, an AI operating system for enterprise engineering. ${spec.role} Ground every decision in the provided context. Be specific, evidence-based, and production-ready.`,
                      prompt: `Context so far:\n${JSON.stringify(context, null, 2)}\n\nTask: ${AGENT_PROMPTS[key]}`,
                    });
                    output = object;
                    summary = deriveSummary(key, object);

                    // Save artifact
                    await session.supabase.from("artifacts").upsert({
                      project_id: projectId, user_id: session.userId,
                      kind: key, data: output as never,
                    }, { onConflict: "project_id,kind" });

                    context[key] = output;
                  }

                  const duration_ms = Date.now() - t0;
                  await session.supabase.from("agent_runs").update({
                    status: "completed", output: output as never, summary,
                    completed_at: new Date().toISOString(), duration_ms,
                  }).eq("id", run!.id);

                  send({ type: "complete", agent: key, name: spec.name, summary, output, at: new Date().toISOString(), duration_ms });
                } catch (e) {
                  const msg = e instanceof Error ? e.message : String(e);
                  await session.supabase.from("agent_runs").update({
                    status: "failed", summary: msg, completed_at: new Date().toISOString(),
                  }).eq("id", run!.id);
                  send({ type: "error", agent: key, message: msg });
                  // continue with remaining agents
                }
              }

              // Compute estimated cost from finops artifact
              const { data: costArt } = await session.supabase
                .from("artifacts").select("data").eq("project_id", projectId).eq("kind", "finops").maybeSingle();
              const cost = (costArt?.data as { total_monthly_usd?: number } | null)?.total_monthly_usd ?? null;

              await session.supabase.from("projects").update({
                status: "completed", current_stage: "done", estimated_monthly_cost: cost,
              }).eq("id", projectId);
              send({ type: "done", overall_status: "completed" });
            } catch (e) {
              await session.supabase.from("projects").update({ status: "failed" }).eq("id", projectId);
              const msg = e instanceof Error ? e.message : String(e);
              controller.enqueue(encoder.encode(JSON.stringify({ type: "error", agent: "planner", message: msg }) + "\n"));
            } finally {
              controller.close();
            }
          },
        });

        return new Response(stream, {
          headers: {
            "Content-Type": "application/x-ndjson; charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
            "X-Accel-Buffering": "no",
          },
        });
      },
    },
  },
});

function deriveSummary(key: AgentKey, output: unknown): string {
  const o = output as Record<string, unknown>;
  switch (key) {
    case "requirements": return `${(o.functional as unknown[])?.length ?? 0} functional, ${(o.non_functional as unknown[])?.length ?? 0} non-functional requirements`;
    case "domain": return `${(o.bounded_contexts as unknown[])?.length ?? 0} bounded contexts identified`;
    case "solution": return `${o.pattern} · ${(o.components as unknown[])?.length ?? 0} components`;
    case "cloud": return `${o.provider} · ${(o.services as unknown[])?.length ?? 0} services in ${o.region}`;
    case "security": return `${(o.iam as unknown[])?.length ?? 0} IAM roles · encryption defined`;
    case "compliance": return `${(o.frameworks as unknown[])?.length ?? 0} frameworks mapped`;
    case "finops": return `$${(o.total_monthly_usd as number)?.toFixed(0)} / month estimated`;
    case "reliability": return `RPO ${o.rpo_minutes}m · RTO ${o.rto_minutes}m · ${o.availability_target}`;
    case "iac": return `${(o.modules as unknown[])?.length ?? 0} ${o.language} modules generated`;
    case "docs": return `${(o.adrs as unknown[])?.length ?? 0} ADRs written`;
    case "reviewer": return `${o.verdict} · score ${o.overall_score}/100`;
    default: return "completed";
  }
}
