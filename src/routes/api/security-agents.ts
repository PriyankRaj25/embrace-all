import { createFileRoute } from "@tanstack/react-router";
import { streamText } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

/**
 * Live multi-agent security orchestrator.
 * POST { query, context? } → NDJSON stream:
 *   { type: "start",  agent }
 *   { type: "delta",  agent, text }
 *   { type: "done",   agent }
 *   { type: "final",  text }   (synthesizer)
 *   { type: "error",  agent?, message }
 */

export type SecurityAgentKey =
  | "recon"
  | "threat_intel"
  | "iam_auditor"
  | "attack_path"
  | "compliance"
  | "remediation";

export const SECURITY_AGENTS: {
  key: SecurityAgentKey;
  name: string;
  role: string;
  system: string;
}[] = [
  {
    key: "recon",
    name: "Recon Agent",
    role: "Enumerates exposed surface & assets",
    system:
      "You are the Recon Agent inside AetherOS Security. Enumerate the exposed cloud surface relevant to the user's question using the provided mock inventory. Return concise bullet findings with asset IDs, regions, and exposure vectors. Max 6 bullets. No preamble.",
  },
  {
    key: "threat_intel",
    name: "Threat Intelligence",
    role: "Correlates active TTPs & CVEs",
    system:
      "You are the Threat Intelligence Agent. Map observed indicators to MITRE ATT&CK TTPs and relevant CVEs. Explain likelihood in one line each. Max 5 bullets. No preamble.",
  },
  {
    key: "iam_auditor",
    name: "IAM Auditor",
    role: "Detects privilege escalation & drift",
    system:
      "You are the IAM Auditor Agent. Identify over-privileged principals, escalation chains, and least-privilege gaps. Cite role/user names. Max 5 bullets. No preamble.",
  },
  {
    key: "attack_path",
    name: "Attack Path Analyst",
    role: "Traces reachable blast radius",
    system:
      "You are the Attack Path Analyst. Trace 1–2 concrete multi-hop attack paths from internet to crown-jewel data using the mock topology. Format each as: Hop 1 → Hop 2 → ... with the exploit at each edge. Max 2 paths.",
  },
  {
    key: "compliance",
    name: "Compliance Agent",
    role: "Maps findings to SOC2 / HIPAA / PCI",
    system:
      "You are the Compliance Agent. Map the situation to failing controls across SOC2, HIPAA, PCI-DSS, and CIS AWS. Format: `<Framework> <Control ID> — <one-line reason>`. Max 6 lines. No preamble.",
  },
  {
    key: "remediation",
    name: "Remediation Engineer",
    role: "Generates prioritized IaC fixes",
    system:
      "You are the Remediation Engineer. Produce a prioritized, minimal remediation plan with estimated risk reduction (%) and effort (minutes) per step. Include one short Terraform snippet for the top fix in a fenced ```hcl block. Max 4 steps.",
  },
];

const CONTEXT_BRIEF = `Mock cloud inventory (investor demo):
- AWS account 1234-5678, region us-east-1, VPC vpc-prod
- Public ALB api.healthtracker → EC2 api-worker-4 (private subnet, IMDSv1)
- Lambda analytics-webhook — IAM role 'analytics-lambda' holds AdministratorAccess
- RDS 'hp-prod-patients' — 1.2M PHI rows, not IAM-DB-auth
- S3 'hp-prod-patient-exports' — Block Public Access DISABLED, ACL AllUsers:READ
- Security group sg-0d21 allows 0.0.0.0/0 :5432
- GitHub OIDC deploy role trusts * repos in org
- GuardDuty + CloudTrail on; multi-region OFF in 'sandbox'
- Frameworks in scope: SOC2, HIPAA, PCI-DSS, CIS AWS, ISO 27001, NIST 800-53`;

export const Route = createFileRoute("/api/security-agents")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { query } = (await request.json()) as { query?: string };
        const q = (query ?? "").trim() || "Give me a full posture assessment across identity, data, and network.";

        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const gateway = createLovableAiGatewayProvider(apiKey);
        const model = gateway("openai/gpt-5.5");

        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          async start(controller) {
            const send = (obj: unknown) => {
              try {
                controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));
              } catch {
                /* client disconnected */
              }
            };

            const perAgent = SECURITY_AGENTS.map(async (agent) => {
              send({ type: "start", agent: agent.key });
              try {
                const result = streamText({
                  model,
                  system: agent.system,
                  prompt: `User question: ${q}\n\n${CONTEXT_BRIEF}\n\nAnswer as the ${agent.name}. Keep it under 120 words.`,
                });
                for await (const delta of result.textStream) {
                  send({ type: "delta", agent: agent.key, text: delta });
                }
                send({ type: "done", agent: agent.key });
                return { key: agent.key, text: await result.text };
              } catch (e) {
                const msg = e instanceof Error ? e.message : String(e);
                send({ type: "error", agent: agent.key, message: msg });
                return { key: agent.key, text: "" };
              }
            });

            const results = await Promise.all(perAgent);

            // Synthesizer
            send({ type: "start", agent: "synthesizer" });
            try {
              const synth = streamText({
                model,
                system:
                  "You are the Security Chief Synthesizer. Given the parallel findings of 6 security agents, produce a crisp executive summary: top 3 risks, blast radius, and the single next action. Use markdown headers. Under 180 words.",
                prompt: `User question: ${q}\n\nAgent outputs:\n\n${results
                  .map((r) => `## ${r.key}\n${r.text}`)
                  .join("\n\n")}`,
              });
              for await (const delta of synth.textStream) {
                send({ type: "delta", agent: "synthesizer", text: delta });
              }
              send({ type: "done", agent: "synthesizer" });
              send({ type: "final" });
            } catch (e) {
              const msg = e instanceof Error ? e.message : String(e);
              send({ type: "error", agent: "synthesizer", message: msg });
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
