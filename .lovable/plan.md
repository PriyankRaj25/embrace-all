# AetherOS — AI Operating System for Enterprise Engineering

An AI-native workspace where users describe a business goal in natural language and watch a swarm of specialized agents plan, design, govern, generate, and simulate a production-ready cloud architecture in real time.

## Scope (v1)

A working prototype with real AI. Not a mock. Not the full 30+ agent farm — a focused, believable subset that demonstrates the vision end-to-end.

## Core experience

1. **Landing** — bold hero explaining AetherOS, the "intelligence layer above coding assistants" positioning, module grid, agent architecture diagram, CTA to launch workspace.
2. **New Project** — user enters a business requirement (e.g. *"Multi-tenant healthcare SaaS for 20M users, HIPAA on AWS"*), picks target cloud (AWS / Azure / GCP), compliance tags, scale hint.
3. **Orchestration Workspace** (the heart of the app) — split layout:
   - **Left rail:** Agent roster with live status pills (idle / thinking / done / awaiting approval).
   - **Center:** Real-time engineering timeline — streaming events ("Requirements analyzed", "Cloud services selected", "Security review passed", "Terraform generated"), each expandable to show the agent's reasoning and artifact.
   - **Right rail:** Artifact viewer tabs — Architecture, Infrastructure, Security & Compliance, Cost, Disaster Recovery, IaC, Docs, ADRs.
   - **Bottom:** Human approval gates ("Approve architecture", "Approve infrastructure", "Approve deployment").
4. **Blueprint view** — final polished report with architecture diagram (SVG generated from JSON), service list, cost projection chart, compliance matrix, downloadable Terraform.
5. **Projects dashboard** — list of past blueprints with status, cost, compliance badges.

## Agent pipeline (v1 subset)

Orchestrated by a Planning Agent, executed with streaming AI SDK tool calls:

- **Planning Agent** — decomposes request, emits execution plan.
- **Requirements Agent** — structures functional/non-functional requirements.
- **Domain Modeling Agent** — bounded contexts, entities.
- **Solution Architecture Agent** — component diagram (JSON → SVG).
- **Cloud Architecture Agent** — picks concrete AWS/Azure/GCP services.
- **Security & IAM Agent** — IAM roles, encryption, network segmentation.
- **Compliance Agent** — maps to HIPAA/SOC2/GDPR/PCI controls.
- **FinOps Agent** — monthly cost projection with breakdown.
- **Reliability Agent** — DR strategy, RPO/RTO, failure scenarios.
- **IaC Generation Agent** — Terraform snippets per service.
- **Documentation Agent** — architecture doc + ADRs.
- **Reviewer/Governance Agent** — critiques and flags risks before human approval.

Each agent = one AI SDK tool call with a Zod schema for its structured output. The Planning Agent runs the loop with `stepCountIs(50)`, streaming `data-*` parts back to the UI so the timeline animates as each agent finishes.

## Design direction

Modern enterprise-AI aesthetic — dark by default:
- Deep charcoal background (`oklch(0.15 0.02 260)`) with subtle grid texture.
- Electric aether accent (violet-cyan gradient: `oklch(0.72 0.19 280)` → `oklch(0.78 0.15 210)`).
- Mono for code/IDs (JetBrains Mono), Geist Sans for UI, Geist for display.
- Glassmorphic panels with hairline borders, glow on active agents.
- Motion: agent nodes pulse while thinking, timeline events slide in with stagger, streaming text shimmer.
- Reference vibe: Linear × Vercel × Warp × Cursor.

## Technical plan

**Stack:** TanStack Start (already set up), Tailwind v4, shadcn, AI SDK, Lovable AI Gateway (`openai/gpt-5.5`), Lovable Cloud (Supabase) for project & blueprint persistence + auth.

**Routes:**
- `/` — landing
- `/auth` — login/signup (email+password + Google)
- `/_authenticated/dashboard` — projects list
- `/_authenticated/new` — requirement intake form
- `/_authenticated/projects/$projectId` — orchestration workspace (live)
- `/_authenticated/projects/$projectId/blueprint` — final report

**Backend:**
- Enable Lovable Cloud + Google auth.
- Tables: `profiles`, `user_roles`, `projects`, `agent_runs` (streamed events), `artifacts` (JSON blobs per agent output), `approvals`.
- RLS scoped to `auth.uid()`; roles table + `has_role()` helper for future admin.
- Server route `src/routes/api/chat.ts` — streams the orchestrator using `streamText` + tools per agent, persists artifacts in `onFinish`. `toUIMessageStreamResponse` with `data-*` parts drives the timeline.
- `createServerFn` for CRUD (create project, list projects, load blueprint).
- `LOVABLE_API_KEY` provisioned via `ai_gateway--create`.

**Frontend:**
- `useChat` bound to `/api/chat` with `id = projectId` — messages are agent events, not user chat.
- Custom message-part renderers for each artifact type (architecture JSON → SVG diagram, cost JSON → Recharts bar, compliance → matrix, IaC → syntax-highlighted code block via `shiki`).
- Framer Motion for timeline stagger + agent status transitions.
- Approval gates call server functions that flip `approvals` rows and unblock the next stage.

## What's explicitly out of scope for v1

- Real cloud deployment / actually running Terraform.
- MCP client integrations with real AWS accounts.
- Live production telemetry ingestion / continuous optimization loop.
- Multi-tenant org management beyond per-user isolation.
- The full 30+ agent catalog — v1 ships the 12 above; the architecture supports adding more later without refactor.

These are the natural next milestones once v1 is validated.

## Build order

1. Enable Lovable Cloud, provision AI key, configure Google auth.
2. Design tokens + landing page.
3. Auth + dashboard shell + sidebar.
4. DB schema (projects, agent_runs, artifacts, approvals) + RLS + grants.
5. Intake form → creates project row → navigates to workspace.
6. Orchestrator server route with the 12 agent tools (Zod-validated structured outputs).
7. Workspace UI: agent roster, streaming timeline, artifact tabs.
8. Approval gates + blueprint view with diagram/cost chart/IaC.
9. Polish: motion, empty states, error handling for 429/402.
