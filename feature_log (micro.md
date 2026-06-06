# ECHO — Feature Log
> Living document. Updated every time a feature ships, changes, or gets cut.
> Most recent entries at the TOP.

---

## How to Use This Log

Before starting work each session:
1. Read the last 5 entries
2. Check STATUS of your next planned feature
3. Update this file when you ship, cut, or change scope

**Status Labels:**
- `🟢 SHIPPED` — Feature is live and working
- `🟡 IN PROGRESS` — Actively being built right now
- `🔵 PLANNED` — Confirmed, not started
- `⚪ BACKLOG` — Idea, not committed
- `🔴 CUT` — Removed from scope (with reason)
- `⚠️ BLOCKED` — Needs something before it can proceed

---

## Feature Log

---

### [v0.1] — Project Foundation
**Date:** Day 1
**Status:** 🔵 PLANNED

#### F-001 — Monorepo Setup
**Status:** 🔵 PLANNED
**Scope:** pnpm workspaces, TypeScript strict, shared packages structure
**Acceptance criteria:**
- `pnpm install` works from root
- `pnpm dev` starts all services
- TypeScript compiles with zero errors across all packages
**Notes:** Set up packages/types first — everything depends on shared types.

---

#### F-002 — Hindsight Cloud Connection
**Status:** 🔵 PLANNED
**Scope:** packages/memory — EchoMemoryClient wrapping Hindsight SDK
**Acceptance criteria:**
- `client.store(memory)` successfully stores to Hindsight Cloud
- `client.recall(query)` returns relevant memories
- Error handling and logging in place
- Smoke test script passes
**Notes:** Use promo code MEMHACK6. Validate env vars at startup.

---

#### F-003 — Slack Bot: Basic Connection
**Status:** 🔵 PLANNED
**Scope:** apps/slack-bot — @slack/bolt in socket mode
**Acceptance criteria:**
- Bot connects to Slack workspace
- Bot responds to a mention (@echo hello → "ECHO is alive")
- No crashes on malformed messages
**Notes:** Socket mode avoids needing a public URL — critical for hackathon speed.

---

#### F-004 — Slack Bot: Message Ingestion
**Status:** 🔵 PLANNED
**Scope:** apps/slack-bot — listen to public channels, store to Hindsight
**Acceptance criteria:**
- All messages from public channels captured
- Messages under 20 chars skipped
- Bot messages skipped
- Metadata enriched (author, channel, timestamp, platform: "slack")
- `hindsight.store()` called for each valid message
- Batch interval respected (don't flood Hindsight)
**Notes:** Start ingestion after F-002 and F-003 are both shipped.

---

#### F-005 — Entity Extraction Pipeline
**Status:** 🔵 PLANNED
**Scope:** packages/agent — mini LLM call to extract entities from each message
**Acceptance criteria:**
- Extracts: people mentioned, technologies, decision type, memory type
- Handles Groq tool call errors with retry logic
- Falls back gracefully (stores memory without entities if extraction fails)
- Structured output parsed as JSON
**Notes:** This is where Groq function call errors will hit. Build retry first.

---

#### F-006 — Knowledge Graph: Data Structure
**Status:** 🔵 PLANNED
**Scope:** packages/graph — in-memory graph, serialized to JSON
**Acceptance criteria:**
- Person nodes created/updated from entity extraction
- Concept nodes created/updated
- Edges: person→knows→concept, concept→related→concept
- Edge weights increment on re-mention
- Decay score calculated per node
- Graph serializable to JSON (for persistence + API)
**Notes:** Cap graph at 200 nodes total — use clustering for overflow.

---

#### F-007 — OpenClaw Agent: Core Setup
**Status:** 🔵 PLANNED
**Scope:** packages/agent — OpenClaw agent with Hindsight plugin
**Acceptance criteria:**
- Agent initialized with ECHO system prompt
- `recall_memory` tool working (calls Hindsight search)
- `find_expert` tool working (queries graph + Hindsight)
- `get_decision_history` tool working
- Agent handles Groq errors gracefully
**Notes:** Use official Hindsight × OpenClaw plugin: https://hindsight.vectorize.io/sdks/integrations/openclaw

---

#### F-008 — Slack Bot: @echo Query Response
**Status:** 🔵 PLANNED
**Scope:** apps/slack-bot — route @echo mentions to OpenClaw agent
**Acceptance criteria:**
- @echo mention in any channel captured
- Query extracted from mention (strip @echo prefix)
- OpenClaw agent called with query
- Response posted as Slack thread reply (not channel noise)
- Response formatted with Slack markdown
- Loading indicator shown while agent thinks
**Notes:** Post in thread, not channel. Keeps the workspace clean.

---

#### F-009 — Demo Data Seed Script
**Status:** 🔵 PLANNED
**Scope:** scripts/seed-demo-data.js
**Acceptance criteria:**
- Seeds 30+ realistic memories into Hindsight
- Covers multiple topics: architecture decisions, engineering choices, product discussions
- Uses realistic names and realistic-sounding reasoning
- Seeds knowledge graph with corresponding nodes/edges
- Runnable with: `pnpm run seed`
**Notes:** CRITICAL for demo. Without good seed data, the Amnesia Test falls flat. Use an LLM to generate realistic synthetic conversations.

Suggested seed topics:
- "Why we chose Postgres over MySQL" (decision)
- "Redis caching strategy" (expertise by @sarah)
- "The auth service incident June 1" (problem + solution)
- "Moving from Redux to Zustand" (decision)
- "Our API versioning policy" (preference)
- "Why we use pnpm over npm" (decision)
- "The k8s migration rationale" (decision)
- "Who understands the billing service?" (expertise map)

---

#### F-010 — Backend REST API
**Status:** 🔵 PLANNED
**Scope:** apps/api — Express/Fastify server serving graph + memory data
**Endpoints:**
```
GET  /api/health
GET  /api/graph
GET  /api/memories
GET  /api/experts/:topic
GET  /api/timeline
POST /api/ask
```
**Acceptance criteria:**
- All endpoints return correct ApiResponse envelope
- `/api/graph` returns serialized knowledge graph
- `/api/ask` calls OpenClaw agent, returns structured response
- Error responses follow ApiResponse error format
- CORS configured for web dashboard domain

---

#### F-011 — WebSocket: Live Graph Updates
**Status:** 🔵 PLANNED
**Scope:** apps/api — Socket.io or ws server
**Events:**
- `memory:added` — broadcast when new memory stored
- `graph:pulse` — broadcast node_id to animate
**Acceptance criteria:**
- Web dashboard receives events in real time
- New Slack message → memory stored → graph pulses within 3 seconds
**Notes:** This is what makes the dashboard feel ALIVE during the demo.

---

### [v0.2] — Web Dashboard
**Date:** Day 3
**Status:** 🔵 PLANNED

---

#### F-012 — Dashboard Shell & Navigation
**Status:** 🔵 PLANNED
**Scope:** apps/web — React + Vite app, routing, layout
**Acceptance criteria:**
- Routes: /, /timeline, /experts, /ask, /gaps
- Dark theme applied globally via CSS variables
- Navigation sidebar (icons + labels)
- No flicker on route change
- Fonts loaded: Syne, JetBrains Mono, Outfit
**Design notes:** Navigation should be minimal — icons left, content right. No top navbar (wastes vertical space on the graph).

---

#### F-013 — Knowledge Graph Visualization (D3.js)
**Status:** 🔵 PLANNED
**Scope:** apps/web — KnowledgeGraph.tsx component
**Acceptance criteria:**
- Force-directed graph renders correctly
- Node types visually distinct (color by type)
- Edge thickness reflects weight
- Nodes draggable (for demo positioning)
- Zoom and pan working
- Graph fills full viewport height
- Node click → shows memory summary in sidebar
- Smooth physics simulation (no jitter)
**Special behaviors:**
- `graph:pulse` WebSocket event → node pulses with ring animation
- Decayed nodes render in amber with reduced opacity
- New edges animate in (grow from 0 to full opacity)
**Performance:** Cap at 50 visible nodes, cluster smaller ones

---

#### F-014 — Memory Timeline Page
**Status:** 🔵 PLANNED
**Scope:** apps/web — MemoryTimeline.tsx
**Acceptance criteria:**
- Vertical timeline of memories (newest at top)
- Each entry shows: content, author, channel, timestamp, memory type badge
- Filter by: person, topic, memory type
- Memory type badges styled distinctly per type
- Smooth scroll, no layout jank
**Design notes:** Timeline entries should feel like "posts" — clear, readable, not a data table.

---

#### F-015 — Expert Finder Page
**Status:** 🔵 PLANNED
**Scope:** apps/web — ExpertFinder.tsx
**Acceptance criteria:**
- Search input: type a topic → ranked list of people
- Each person card shows: name, evidence count, top memories, expertise domains
- "Evidence" section: actual memory snippets that justify the ranking
- Animated ranking change when topic changes
**Notes:** This is a core demo moment. Make the evidence visible — judges need to see WHY someone is ranked #1.

---

#### F-016 — Ask ECHO Page (Dashboard Chat)
**Status:** 🔵 PLANNED
**Scope:** apps/web — AskEcho.tsx
**Acceptance criteria:**
- Chat interface, not a basic input box
- Shows "ECHO is searching memory..." while agent thinks
- Response rendered in Markdown
- Sources cited visually (linked memory badges below each response)
- Conversation history shown in session (not persisted)
- Typing indicator animation
**Design notes:** This should feel more like "searching a second brain" than "chatting with a chatbot." Consider a different visual treatment — search-results-like, not messenger-like.

---

#### F-017 — Decay Indicator System
**Status:** 🔵 PLANNED
**Scope:** packages/graph + apps/web
**Acceptance criteria:**
- Decay score calculated daily: 1.0 - (days_since_mention / 30), clamped [0,1]
- Score < 0.4: node renders in amber
- Score < 0.2: node renders faded amber with dashed border
- Web dashboard shows "stale knowledge" indicator in graph legend
- Decay updates visible without page refresh
**Notes:** Decay is a key visual differentiator. Make amber nodes visually striking.

---

### [v0.3] — Multi-Platform Expansion
**Date:** Day 4
**Status:** 🔵 PLANNED

---

#### F-018 — Discord Bot: Basic Query Response
**Status:** 🔵 PLANNED
**Scope:** apps/discord-bot — discord.js
**Acceptance criteria:**
- Bot joins Discord server
- `/echo [query]` slash command works
- Calls same OpenClaw agent as Slack bot
- Response formatted with Discord markdown
- Error handling in place
**Notes:** Build this only after Slack + Web are fully working. Discord is bonus points.

---

#### F-019 — Discord Bot: Message Ingestion
**Status:** 🔵 PLANNED
**Scope:** apps/discord-bot — listen to guild channels
**Acceptance criteria:**
- Public guild channel messages ingested with platform: "discord" metadata
- Same entity extraction pipeline as Slack
- Messages appear in web dashboard timeline with Discord badge
**Notes:** This is stretch. If running out of time, skip ingestion — the query response alone is impressive.

---

#### F-020 — Knowledge Gap Detection (Stretch)
**Status:** ⚪ BACKLOG
**Scope:** apps/web — GapsPage.tsx + packages/agent
**Description:** Identify topics mentioned multiple times but with low expertise coverage, or topics only one person understands.
**Notes:** Deprioritized. Build only if Day 4 has time.

---

### [CUT FEATURES]

#### F-CUT-001 — Telegram Bot
**Status:** 🔴 CUT
**Reason:** Scope management. Three platforms (Slack, Discord, Web) is already compelling. Telegram adds complexity without meaningfully changing the judge's experience. Show the Telegram logo as "roadmap" on the dashboard.
**Cut on:** Day 1 planning
**Original plan:** Telegram bot using python-telegram-bot, same agent backend

---

#### F-CUT-002 — Real-time Collaboration (Multiple Users Editing Graph)
**Status:** 🔴 CUT
**Reason:** WebSocket broadcasting of read events is sufficient. True multi-user collaborative editing requires CRDT or operational transforms — out of scope for a 4-day hackathon.
**Cut on:** Day 1 planning

---

#### F-CUT-003 — Automated Post-Mortem Generation
**Status:** 🔴 CUT
**Reason:** Great product idea, but requires deep integration with incident tracking. Can be pitched as roadmap in the demo.
**Cut on:** Day 1 planning

---

## Technical Debt Log

*Things we knowingly cut corners on for hackathon speed. Document them for the post-hackathon cleanup.*

| Item | Where | What Was Cut | Proper Solution |
|---|---|---|---|
| Graph persistence | packages/graph | JSON file instead of real DB | PostgreSQL + pgvector or Neo4j |
| Auth | apps/api | No authentication on REST API | Slack OAuth + JWT |
| Rate limiting | apps/slack-bot | Simple timer-based batching | Proper queue (Bull/BullMQ) |
| LLM costs | packages/agent | No token budgeting | Implement max_tokens discipline |
| Testing | All | No unit tests | Jest unit tests for agent tools |

---

## Decision Log

*Why we made non-obvious technical choices.*

| Decision | Alternative Considered | Why We Chose This |
|---|---|---|
| D3.js for graph | vis.js, Sigma.js, react-force-graph | D3 gives full control over visual styling. Others have opinionated rendering. Our custom node styles require D3's level of control. |
| Socket mode for Slack | Webhook mode | No public URL needed. Critical for local dev and Render.com deploys without static IPs. |
| In-memory graph + JSON | SQLite, Redis | Zero setup, no extra service. JSON file is good enough for demo data volumes. Mention the migration path to judges. |
| pnpm workspaces | npm workspaces, Turborepo | Faster installs, cleaner lockfile, native workspace protocol. Turbo adds complexity we don't need at this scale. |
| TypeScript strict | JavaScript | Judges look at code. Strict TS signals professionalism. Also catches bugs that matter during demos. |
| OpenClaw + Hindsight plugin | Custom agent from scratch | The official integration already exists. 2 days of saved time. Judges reward using the ecosystem correctly. |

---

*Update this log every time you ship. Future you will thank present you.*
