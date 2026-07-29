# AetherOS — Backend Implementation Doc (GCP Serverless + LangChain, Python)

Target: a fast, fully serverless Python backend on Google Cloud that powers the AetherOS
frontend (projects, 12 design agents, Security Agent suite, Vega assistant, credits/usage,
RBAC, multi-cloud onboarding, billing).

---

## 1. Architecture at a glance

```text
Browser (TanStack Start SPA)
   |  HTTPS (JWT: Firebase Auth / Identity Platform)
   v
Cloud Load Balancer + Cloud Armor + Cloud CDN
   |
   +-- Cloud Run: api            (FastAPI, sync REST + SSE streaming)
   +-- Cloud Run: orchestrator   (LangGraph agent runtime, long-running, min-instances=1)
   +-- Cloud Run Jobs: scanners  (security/FinOps batch scans)
   |
   +-- Pub/Sub  (agent.run.requested, agent.stage.completed, scan.requested)
   +-- Cloud Tasks (retries, fan-out per agent, rate limiting)
   +-- Cloud Scheduler (continuous compliance / red team / drift)
   |
Data
   +-- Cloud SQL (Postgres 16 + pgvector)  -> tenants, projects, runs, artifacts, credits
   +-- Firestore (native)                  -> live run state, chat threads, presence
   +-- Cloud Storage                       -> IaC bundles, diagram SVG, exports, evidence
   +-- Memorystore (Redis)                 -> rate limits, idempotency, hot caches
   +-- Secret Manager                      -> BYO LLM keys, cloud creds, webhook secrets
Models
   +-- Vertex AI (Gemini) + optional OpenAI/Anthropic via BYO key
```

Everything scales to zero except `orchestrator` (min instances 1) and Redis.

### Latency budget
| Path | Target |
| --- | --- |
| REST read (projects, artifacts) | < 120 ms p95 |
| Vega first token (SSE) | < 700 ms p95 |
| Full 12-agent blueprint run | 60–120 s (parallel fan-out) |
| Security scan of 2k resources | < 90 s (Cloud Run Job, 8 parallel shards) |

Speed techniques: Cloud Run gen2 + CPU boost, `min_instances` on hot services,
HTTP/2 + connection reuse to Vertex, Postgres connection pooling via `asyncpg` +
Cloud SQL Connector, `orjson` serialization, aggressive Redis caching of artifacts,
and parallel `asyncio.gather` agent fan-out inside LangGraph.

---

## 2. Services

### 2.1 `api` (Cloud Run, FastAPI)
- Python 3.12, `fastapi`, `uvicorn`, `pydantic v2`, `asyncpg`, `sse-starlette`.
- Responsibilities: auth, RBAC, CRUD, credit accounting, SSE relays, billing webhooks.
- Stateless; concurrency 80; `--cpu-boost`; min instances 1 in prod.

### 2.2 `orchestrator` (Cloud Run, LangGraph)
- Runs the agent graph. Invoked by Pub/Sub push or direct internal call.
- Streams stage events to Firestore (frontend subscribes) **and** to the SSE relay.
- Checkpointer: `langgraph.checkpoint.postgres.AsyncPostgresSaver` → resumable runs.

### 2.3 `scanners` (Cloud Run Jobs)
- Multi-cloud collectors (AWS/Azure/GCP) → normalized asset graph → security findings.
- Triggered by Cloud Scheduler (continuous) or on-demand from the UI.

---

## 3. Data model (Postgres)

```sql
tenants(id, name, plan, created_at)
users(id, tenant_id, email, role)                    -- role: owner|admin|member|viewer
memberships(user_id, tenant_id, role)
invitations(id, tenant_id, email, role, token, expires_at)

projects(id, tenant_id, name, requirement, cloud, compliance[], scale_hint,
         status, current_stage, estimated_monthly_cost, created_by)
agent_runs(id, project_id, agent_key, agent_name, status, summary, output jsonb,
           started_at, completed_at, duration_ms, credits_charged)
artifacts(id, project_id, kind, data jsonb, version, created_at)
blueprint_versions(id, project_id, version, snapshot jsonb, author_id, note)
comments(id, artifact_id, author_id, body, resolved, created_at)
audit_events(id, tenant_id, actor_id, action, target, metadata jsonb, at)

cloud_accounts(id, tenant_id, provider, account_ref, role_arn, external_id,
               secret_name, status, last_synced_at)
llm_keys(id, tenant_id, provider, secret_name, created_by)   -- value in Secret Manager
security_findings(id, tenant_id, resource, severity, framework, status, evidence jsonb)

-- credits & usage
credit_wallets(tenant_id pk, period, included, topups, used, updated_at)
usage_events(id, tenant_id, user_id, kind, credits, ref_id, at)
   -- kind: vega_message | agent_run | security_scan | blueprint
invoices(id, tenant_id, period, amount_cents, status, provider_ref)

embeddings(id, tenant_id, scope, chunk text, vector vector(768))  -- pgvector, RAG
```

All tenant-scoped tables carry `tenant_id` and are enforced by Postgres RLS
(`SET LOCAL app.tenant_id` per request) — defence in depth behind app-level RBAC.

---

## 4. LangChain / LangGraph agent runtime

### 4.1 Graph shape
```text
planner
  └─> requirements ─> domain ─> solution
                                  ├─> cloud ────┐
                                  ├─> security  │  (parallel branch, asyncio)
                                  ├─> compliance│
                                  ├─> finops    │
                                  └─> reliability
                                                v
                                            iac ─> docs ─> reviewer ─> END
```

### 4.2 Skeleton
```python
# orchestrator/graph.py
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
from langchain_google_vertexai import ChatVertexAI
from pydantic import BaseModel

class RunState(BaseModel):
    project_id: str
    tenant_id: str
    requirement: str
    cloud: str
    compliance: list[str] = []
    artifacts: dict = {}

def llm(temperature: float = 0.2):
    return ChatVertexAI(model="gemini-2.5-pro", temperature=temperature,
                        max_output_tokens=8192, streaming=True)

def agent_node(key: str, schema, system: str):
    async def run(state: RunState):
        chain = llm().with_structured_output(schema)     # native tool-calling JSON
        out = await chain.ainvoke([("system", system),
                                   ("human", render_prompt(key, state))])
        await persist_artifact(state, key, out)
        await emit(state, "complete", key, out)
        return {"artifacts": {**state.artifacts, key: out.model_dump()}}
    return run

builder = StateGraph(RunState)
for key, spec in AGENTS.items():
    builder.add_node(key, agent_node(key, spec.schema, spec.system))
builder.set_entry_point("planner")
builder.add_edge("planner", "requirements")
builder.add_edge("requirements", "domain")
builder.add_edge("domain", "solution")
for k in ("cloud", "security", "compliance", "finops", "reliability"):
    builder.add_edge("solution", k)        # fan-out runs concurrently
    builder.add_edge(k, "iac")             # implicit join
builder.add_edge("iac", "docs")
builder.add_edge("docs", "reviewer")
builder.add_edge("reviewer", END)

graph = builder.compile(checkpointer=AsyncPostgresSaver.from_conn_string(DSN))
```

### 4.3 Structured output rules
- Use `with_structured_output(PydanticModel)` — never prompt-and-parse JSON.
- Keep schemas flat and constraint-free (no `min_length`/regex); clamp in Python.
- Wrap every call in a retry (`tenacity`, 3 attempts, jittered backoff) and fall back to
  a repair pass (`OutputFixingParser`) before marking the stage failed.

### 4.4 Tools (LangChain `@tool`)
`aws_pricing_lookup`, `gcp_pricing_lookup`, `azure_pricing_lookup`, `cve_lookup`,
`cis_benchmark_lookup`, `terraform_registry_search`, `asset_graph_query`,
`org_policy_search` (pgvector RAG over tenant docs).
Mutating tools (apply fix, open PR) require `interrupt_before` → human approval.

### 4.5 Vega assistant
A separate lightweight LangGraph ReAct agent with the same tool belt plus
`project_context(project_id)`. Streams over SSE (`astream_events(version="v2")`),
persists threads in Firestore, and charges 1 credit per user message.

### 4.6 Security Agent suite
Six specialist agents (recon, threat-intel, IAM auditor, attack-path, red-team,
compliance) run in parallel with `asyncio.gather`, then a Chief Synthesizer merges
into a single brief. Attack paths are computed with `networkx` over the asset graph.

---

## 5. API surface (FastAPI)

```
POST   /v1/projects                       create + optionally start a run
GET    /v1/projects/:id                   project + artifacts
POST   /v1/projects/:id/runs              start blueprint run  -> {run_id}
GET    /v1/runs/:id/events                SSE stream of stage events
POST   /v1/runs/:id/cancel

POST   /v1/vega/messages                  SSE token stream (1 credit)
GET    /v1/vega/threads                   thread list

GET    /v1/security/overview
POST   /v1/security/scans                 enqueue Cloud Run Job
GET    /v1/security/findings
POST   /v1/security/fixes/:id/approve     human-in-the-loop remediation

GET    /v1/credits                        wallet + ledger
POST   /v1/credits/topup                  Stripe checkout session
GET    /v1/billing/subscription
POST   /v1/webhooks/stripe                signature-verified

POST   /v1/cloud-accounts                 AWS role ARN / GCP SA / Azure SP
POST   /v1/cloud-accounts/:id/verify      STS AssumeRole probe
POST   /v1/llm-keys                       BYO key -> Secret Manager
POST   /v1/invitations                    RBAC invite flow
```

Auth: Firebase Identity Platform JWT → FastAPI dependency resolves
`(user_id, tenant_id, role)`; RBAC enforced with a `require(Permission.X)` dependency.

---

## 6. Credits and usage metering

Server-side is the source of truth (the frontend meter mirrors it):

1. **Reserve** before work: `SELECT ... FOR UPDATE` on `credit_wallets`, check
   `included + topups - used >= cost`, else `402`.
2. **Charge** on success; **refund** the reservation on failure.
3. Append `usage_events` for every charge (idempotency key = `run_id:stage`).
4. Costs: `vega_message=1`, `agent_run=4`, `security_scan=2`, `blueprint=12`.
5. Monthly reset by Cloud Scheduler at period rollover; top-ups persist.
6. Emit `credits.low` (<15% remaining) → in-app banner + email.
7. Export usage to BigQuery for the FinOps dashboards.

---

## 7. Multi-cloud connectivity

| Provider | Mechanism | Stored |
| --- | --- | --- |
| AWS | Cross-account IAM role + external ID, `sts:AssumeRole` | role ARN, external ID |
| GCP | Workload Identity Federation from Cloud Run SA | SA email, pool/provider |
| Azure | App registration + service principal | tenant/client ID, secret ref |

Read-only by default (`SecurityAudit` / `Viewer` / `Reader`). Write scopes only when
the autonomous fix engine is explicitly enabled, and every mutation is gated by
approval + audit event.

---

## 8. Security & compliance

- Cloud Armor WAF + per-tenant rate limits in Redis.
- CMEK on Cloud SQL/GCS; VPC-SC perimeter; all egress via Serverless VPC connector.
- Secrets exclusively in Secret Manager, mounted at runtime; never in env of builds.
- Prompt-injection defence: tool allow-list, output schema validation, no raw shell.
- Full audit trail (`audit_events`) with 1-year retention → BigQuery + Cloud Logging sink.
- SOC 2 / HIPAA evidence artifacts stored in GCS with object versioning + retention lock.

---

## 9. Deployment

```bash
gcloud run deploy aether-api \
  --source services/api --region us-central1 \
  --min-instances 1 --max-instances 100 --concurrency 80 \
  --cpu 2 --memory 2Gi --cpu-boost \
  --set-secrets LLM_KEY=llm-key:latest \
  --add-cloudsql-instances $INSTANCE --allow-unauthenticated
```

- IaC: Terraform (`envs/{dev,stage,prod}`), state in GCS.
- CI/CD: Cloud Build → Artifact Registry → Cloud Deploy with canary (10% → 100%).
- Tests: `pytest` + `pytest-asyncio`, LangGraph runs recorded/replayed with VCR
  cassettes; agent output validated against Pydantic schemas in CI.
- Observability: OpenTelemetry → Cloud Trace, LangSmith for agent traces,
  Error Reporting, SLO alerts on run success rate and first-token latency.

---

## 10. Frontend integration checklist

| Frontend surface | Backend endpoint |
| --- | --- |
| `/dashboard`, `/new` | `/v1/projects` |
| Orchestration overlay & timeline | `/v1/runs/:id/events` (SSE) |
| Blueprint / architecture / artifacts | `/v1/projects/:id` |
| Comments, version history, audit | `/v1/artifacts/*`, `/v1/projects/:id/audit` |
| Vega assistant (global + workspace) | `/v1/vega/messages` |
| Usage meter & credits | `/v1/credits` |
| Billing & plans | `/v1/billing/*`, Stripe webhooks |
| Onboarding (cloud + LLM keys + security) | `/v1/cloud-accounts`, `/v1/llm-keys` |
| Team & RBAC | `/v1/invitations`, `/v1/memberships` |
| Security Agent suite | `/v1/security/*` |

Migration path: keep the current localStorage demo stores as the offline fallback and
swap each one for its endpoint behind a `VITE_API_BASE_URL` feature flag.
