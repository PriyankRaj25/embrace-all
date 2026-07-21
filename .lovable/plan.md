## Direction
Strip AetherOS to a minimal, AI-agent-first product with a **Salt & Pepper** identity: pure black, pure white, and a single ink-grey scale. No color accents. One core loop: **chat → agents run → blueprint + architecture**. Everything per-project.

## 1. Salt & Pepper design system
Rewrite `src/styles.css`:
- Background: `#ffffff` (light) / `#0a0a0a` (dark). Dark by default.
- Surfaces: `#111111`, `#161616`, `#1c1c1c` step scale.
- Foreground: `#f5f5f5`. Muted: `#a1a1a1`, `#6b6b6b`.
- Borders: white/8 hairlines.
- **No color accents.** All emphasis via weight, contrast, and whitespace. Focus/selection = pure white ring on black (or inverse). "Success/warning/destructive" use grey scale + iconography, not color.
- Utilities: `hairline` (1px white/10 border), `paper` (bright inverted card), `noise-overlay` (subtle SVG grain), `ink-gradient-text` (white→grey text mask).
- Typography: Geist Sans everywhere; Geist Mono for metadata/IDs. Tight tracking on display H1s, generous line-height on body.
- Motion: reserved — `fade-up`, `text-reveal`, slow `orbit`. No glow, no aurora.
- Kill every purple/indigo/ember token and `text-aether` usage across the repo.

## 2. Information architecture — remove bloat
Compare to PRD. Keep only what serves the core agent loop.

**Delete** (route files + sidebar entries): `activity`, `adrs`, `approvals`, `deployments`, `governance`, `integrations`, `knowledge`, `marketplace`, `operations`, `organization`, `simulation`, `well-architected`, `agents` (standalone), `finops` (standalone), `compliance` (standalone), `settings` (standalone).

**Keep** 5 surfaces:
- `/` — landing
- `/auth` — sign in
- `/dashboard` — project list
- `/new` — intake
- `/projects/$projectId` — the workspace (everything per-project lives here)

Sidebar collapses to: Projects, New, user menu. No "modules" nav.

## 3. Landing (`src/routes/index.tsx`)
Minimal, cinematic, monochrome:
- Full-viewport hero: giant display headline in white with ink-gradient reveal, one-line subhead, single CTA "Open workspace", ghost "See demo".
- Behind headline: slow low-opacity agent orbit (12 white nodes on black) + fine noise grain.
- One scroll: 3-tile capability strip → mini blueprint preview → footer.
- No auto-redirect. No teaser prompt. No marquee.

## 4. Project workspace (`_authenticated/projects.$projectId.tsx`)
Redesign as a 3-pane layout. All removed "modules" fold in here per-project.

```
┌──────────────────────────────────────────────────────────┐
│ Top bar: project · status · Open blueprint · Diagram     │
├────────────┬─────────────────────────┬───────────────────┤
│ Left rail  │ Center canvas           │ Right rail        │
│ (agents +  │ (active artifact or     │ (per-project      │
│  timeline) │  architecture diagram)  │  option tabs)     │
├────────────┴─────────────────────────┴───────────────────┤
│ Bottom: chat composer (always visible, Cursor-style)     │
└──────────────────────────────────────────────────────────┘
```

- **Left rail (240px):** 12 agents vertical, status dot + duration. Click focuses that agent's artifact in the center.
- **Center canvas:** default = selected artifact via `ArtifactView`. Toggle to full architecture diagram inline. Minimal chrome, wide breathing room.
- **Right rail (320px, tabbed):** per-project options:
  - Overview (requirements, NFRs)
  - Compliance (this project's HIPAA/SOC2/GDPR matrix)
  - FinOps (this project's cost + forecast)
  - Governance (this project's approvals + policies)
  - Comments (per selected artifact)
  - Versions (blueprint snapshots)
  - Audit (this project's timeline)
  - Settings (per-project model + agent prefs)
- **Bottom chat composer:** slim always-visible input, white focus ring. Submit triggers orchestration overlay. Uses existing `useChat` + local thread store, thread scoped to project.

Threads sidebar / standalone chat page **removed**. Delete `/chat/$threadId` route and `chat.$threadId` file. Delete `ai-chat.tsx`; replace with lean `workspace-chat.tsx`.

## 5. Fullscreen orchestration overlay
`src/components/orchestration-overlay.tsx`:
- Fires on chat submit / agent start. Full-screen frosted black.
- Left: 12-agent stack, current one bright white, others dimmed to grey.
- Center: per-stage minimal monochrome scene (requirement chips flowing in, domain graph drawing, cloud nodes assembling, compliance stamps, cost bars, terraform typing). One scene at a time.
- Right: streaming reasoning log (mono, dim grey).
- On completion: overlay recedes → lands on blueprint view. Minimize + skip controls.
- Driven by `demoRuns` timing in demo mode; NDJSON stream otherwise.

## 6. Blueprint + Architecture — make them wonderful
`projects.$projectId.blueprint.tsx`:
- Editorial long-form. Centered 720px column, generous type, off-white on black.
- Thin left-gutter section anchors. Numbered headings (01 Requirements → 11 Reviewer) with a one-line summary, then rich `ArtifactView`.
- Full-bleed architecture diagram inline at the Solution section.
- Sticky top bar: project · Download PDF · Open diagram · version selector.
- White pull-quotes, hairline callouts. No color anywhere.

`architecture-diagram.tsx` + `projects.$projectId.architecture.tsx`:
- Recolor Mermaid to white nodes / grey edges on black. Selected node fills white, others dim.
- Full-bleed canvas, floating minimal control cluster (zoom, fit, orientation, isolate, export SVG/PNG).
- Slim right inspector shows selected node metadata only.

## 7. Component sweep
- **Delete:** `ai-chat.tsx`, every removed route file.
- **Add:** `workspace-chat.tsx`, `orchestration-overlay.tsx`, `project-right-rail.tsx`, `agent-stack.tsx`, `flare-logo.tsx` (now a mono mark), `landing/hero.tsx`, `landing/agent-orbit.tsx`.
- **Update:** `_authenticated/route.tsx` (minimal sidebar), `dashboard.tsx` (minimal card grid), `new.tsx` (minimal form), `blueprint.tsx` (editorial), `architecture-diagram.tsx` (mono recolor + inspector), `artifact-view.tsx` (mono accents, tighter spacing).
- Repo-wide search-replace: purple/ember tokens → salt & pepper greyscale.

## Out of scope
- No backend / schema / RLS / server-fn changes.
- No auth flow changes.
- `demo-blueprint.ts` reused; presentation only.

## Technical notes
- Framer Motion (installed) drives orbit, overlay transitions, scroll reveals.
- All colors as OKLCH tokens in `@theme inline`; no hex in components.
- Right-rail tabs reuse `demoArtifacts` in demo mode and existing Supabase queries otherwise — no new fetchers.
