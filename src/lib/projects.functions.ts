import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const CreateInput = z.object({
  name: z.string().min(1).max(120),
  requirement: z.string().min(10).max(4000),
  cloud: z.enum(["aws", "azure", "gcp", "multi"]),
  compliance: z.array(z.string()).max(10),
  scale_hint: z.string().max(200).optional().nullable(),
});

export const createProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => CreateInput.parse(input))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("projects")
      .insert({
        user_id: context.userId,
        name: data.name,
        requirement: data.requirement,
        cloud: data.cloud,
        compliance: data.compliance,
        scale_hint: data.scale_hint ?? null,
        status: "draft",
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

export const listProjects = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("projects")
      .select("id,name,requirement,cloud,compliance,status,estimated_monthly_cost,current_stage,created_at,updated_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const [proj, runs, arts, approvals] = await Promise.all([
      context.supabase.from("projects").select("*").eq("id", data.id).maybeSingle(),
      context.supabase.from("agent_runs").select("*").eq("project_id", data.id).order("started_at", { ascending: true }),
      context.supabase.from("artifacts").select("*").eq("project_id", data.id),
      context.supabase.from("approvals").select("*").eq("project_id", data.id),
    ]);
    if (proj.error) throw new Error(proj.error.message);
    if (!proj.data) throw new Error("Not found");
    return {
      project: proj.data,
      runs: runs.data ?? [],
      artifacts: arts.data ?? [],
      approvals: approvals.data ?? [],
    };
  });

export const setApproval = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      project_id: z.string().uuid(),
      stage: z.string().min(1),
      approved: z.boolean(),
      notes: z.string().optional().nullable(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("approvals").upsert({
      project_id: data.project_id,
      user_id: context.userId,
      stage: data.stage,
      approved: data.approved,
      notes: data.notes ?? null,
      decided_at: new Date().toISOString(),
    }, { onConflict: "project_id,stage" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("projects").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
