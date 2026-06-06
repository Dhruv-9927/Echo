# ECHO — Architecture Document
> "The Second Brain for Your Team's Slack & Discord"
> Version 1.0 | Hackathon Edition

---

## 🧠 Judge's Verdict First

Before architecture, hear this from someone who has judged and won multiple hackathons:

**ECHO is a top-3 idea in this hackathon. Here's why:**

| Criterion | Score | Reasoning |
|---|---|---|
| Innovation | ★★★★★ | Knowledge graphs + Slack/Discord are not new alone. Together with live Hindsight memory and a real-time visual brain? That's genuinely novel. |
| Hindsight Memory Use | ★★★★★ | Memory IS the product. Not a feature. Judges will feel this immediately. |
| Technical Depth | ★★★★☆ | D3.js graph + multi-platform bots + OpenClaw + Hindsight = credible complexity without overengineering. |
| UX / Demo-ability | ★★★★★ | The "Amnesia Test" is genius. Judges become participants. You win the room. |
| Real-World Impact | ★★★★★ | Every company with Slack has this pain. The TAM is enormous. |

**One risk to manage:** Scope. The multi-platform play (Slack + Discord + Telegram + Web) is powerful but dangerous in a hackathon. Strategy: Build Slack + Web Dashboard fully. Wire Discord as a bonus. Telegram as stretch. Show all four logos in the UI even if two are "coming soon" — judges judge ambition too.

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        ECHO SYSTEM                              │
│                                                                 │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   │
│  │  Slack   │   │ Discord  │   │ Telegram │   │   Web    │   │
│  │   Bot    │   │   Bot    │   │   Bot    │   │Dashboard │   │
│  └────┬─────┘   └────┬─────┘   └────┬─────┘   └────┬─────┘   │
│       │              │              │               │          │
│       └──────────────┴──────────────┴───────────────┘          │
│                              │                                  │
│                    ┌─────────▼──────────┐                      │
│                    │   OpenClaw Agent   │                      │
│                    │  (Orchestration)   │                      │
│                    └─────────┬──────────┘                      │
│                              │                                  │
│              ┌───────────────┼───────────────┐                 │
│              │               │               │                 │
│    ┌─────────▼──────┐  ┌─────▼──────┐  ┌───▼──────────┐      │
│    │   Hindsight    │  │    LLM     │  │  Knowledge   │      │
│    │  Memory Layer  │  │  (Groq)    │  │  Graph DB    │      │
│    │  (vectorize)   │  │            │  │  (in-memory) │      │
│    └────────────────┘  └────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Core Components

### 1. Ingestion Layer — "The Listener"

Responsible for silently watching conversations across platforms and feeding them into Hindsight.

**Slack Bot**
- Uses Slack Events API (socket mode for hackathon simplicity)
- Listens to: `message.channels`, `message.groups`
- Ignores: bot messages, DMs (privacy)
- Preprocesses: strips mentions, resolves user IDs to display names
- Rate-limits ingestion to avoid Hindsight flooding: batch every 30s

**Discord Bot**
- Uses discord.py with `on_message` event
- Mirrors Slack logic
- Maps Discord guild → Slack workspace concept

**Ingestion Pipeline (shared)**
```
Raw Message
    → Metadata enrichment (author, channel, timestamp, platform)
    → Entity extraction (LLM mini-call: people, decisions, technologies mentioned)
    → Hindsight.store(memory)
    → Knowledge Graph update (nodes + edges)
```

---

### 2. Hindsight Memory Layer — "The Brain"

The core of ECHO. Every stored memory uses structured metadata to power rich retrieval.

**Memory Schema:**
```json
{
  "content": "We decided to use Postgres over MySQL because we need JSONB support for the user preferences schema. Decision made by @arun with @priya agreeing.",
  "metadata": {
    "platform": "slack",
    "channel": "#architecture",
    "author": "arun",
    "participants": ["arun", "priya"],
    "entities": {
      "technologies": ["Postgres", "MySQL", "JSONB"],
      "decisions": ["database choice"],
      "people": ["arun", "priya"]
    },
    "memory_type": "decision",
    "timestamp": "2025-06-01T14:32:00Z",
    "decay_score": 1.0
  }
}
```

**Memory Types Taxonomy:**
- `decision` — "We chose X because Y"
- `expertise` — "Person X explained / solved / built Y"
- `problem` — "We ran into issue X"
- `solution` — "The fix for X was Y"
- `preference` — "Our team prefers X style"
- `factoid` — General knowledge nugget

**Retrieval Modes:**
- Semantic search (Hindsight default)
- Person-scoped: "What does @arun know?"
- Topic-scoped: "Everything about authentication"
- Time-scoped: "Decisions made last week"
- Decay-aware: Boost recent memories, flag stale ones

---

### 3. OpenClaw Agent — "The Thinker"

Uses the official Hindsight × OpenClaw plugin. Handles all query routing.

**Agent Tools:**
```
recall_memory(query, filters)         → Search Hindsight
find_expert(topic)                    → Who knows most about X?
get_decision_history(topic)           → Why did we do X?
get_knowledge_timeline(topic)         → When did we learn about X?
summarize_channel(channel, timespan)  → Channel digest
identify_knowledge_gaps()             → What are we missing?
store_memory(content, metadata)       → Explicit memory save
```

**System Prompt for OpenClaw Agent:**
```
You are ECHO, the collective memory of this team.
You speak in clear, confident sentences. You cite who said what and when.
You never make things up. If you don't know, say: "I don't have a memory of that yet."
When answering expert questions, rank people by memory evidence, not assumption.
Format responses for Slack/Discord markdown.
```

---

### 4. Knowledge Graph — "The Map"

Built in-memory (Node.js Map / Python dict) during hackathon. Serialized to JSON for persistence.

**Graph Schema:**
```
Nodes:
  - Person node: { id, name, platform_handle, expertise_topics[], memory_count }
  - Concept node: { id, label, type, mention_count, last_seen, decay_score }

Edges:
  - person → knows → concept  (weight = frequency)
  - person → decided → concept
  - concept → related_to → concept (co-mention frequency)
  - person → collaborated_with → person
```

**Graph Update Rules:**
- Every new memory triggers a graph update
- Weights increment on repeated mentions
- Decay score = 1.0 - (days_since_last_mention / 30), clamped [0,1]
- Pulse animation triggered on web dashboard when new node/edge added

---

### 5. Web Dashboard — "The Mirror"

Single-page React application. The visual showpiece.

**Pages / Sections:**
```
/ (Home)
  → Live Knowledge Graph (D3.js force layout, full screen)
  → Animated node pulses on new memories

/timeline
  → Vertical memory timeline (scroll through team's learning history)
  → Filter by person, topic, platform

/experts
  → Expert Finder: search topic → ranked list of people
  → Each person: knowledge domains, top memories, activity graph

/ask
  → Chat interface backed by OpenClaw agent
  → Cites sources from memory in responses
  → Shows "memory confidence" score per answer

/gaps  (stretch)
  → Topics mentioned but under-documented
  → Knowledge concentration risk (only one person knows X)
```

---

## Technology Stack

| Layer | Technology | Why |
|---|---|---|
| Memory | Hindsight (Vectorize) | Required. Central to value prop. |
| Agent Orchestration | OpenClaw + Hindsight Plugin | Official integration, saves 2 days of work |
| LLM | Groq (qwen/qwen3-32b) | Fast, free tier, handles function calling |
| Slack Bot | Node.js + `@slack/bolt` | Best Slack SDK, socket mode = no ngrok |
| Discord Bot | Python + `discord.py` OR `discordjs` | Mature, well-documented |
| Backend API | Node.js + Express (or Fastify) | Unified REST API for dashboard |
| Knowledge Graph (runtime) | In-memory JS Map → JSON | No DB setup needed for hackathon |
| Frontend | React + Vite | Fast build, easy deploy |
| Graph Visualization | D3.js (force-directed graph) | No other library does this as well |
| Styling | Custom CSS (no Tailwind) | Full design control for unique aesthetic |
| Animations | Framer Motion | Smooth graph transitions |
| Deployment | Railway / Render (backend) + Vercel (frontend) | Free, fast, demo-ready |

---

## Data Flow — Full Lifecycle

```
1. INGEST
   Team member posts in Slack: "We're dropping Redux for Zustand, it's simpler."
       ↓
   Slack Bot captures → enriches metadata → calls Hindsight.store()
       ↓
   Hindsight stores vector embedding of memory
       ↓
   Knowledge Graph updates:
     - "redux" node weight -0.1 (mentioned as dropped)
     - "zustand" node weight +1
     - "sarah" → knows → "zustand" edge created

2. QUERY (via Slack)
   New member asks: "@echo why did we drop Redux?"
       ↓
   OpenClaw Agent receives query
       ↓
   Agent calls recall_memory("why Redux dropped state management decision")
       ↓
   Hindsight returns top 3 relevant memories with metadata
       ↓
   Agent formats response: "On June 1st, @sarah suggested moving to Zustand
   because it's simpler than Redux. @arun agreed. Decision was made in
   #architecture."
       ↓
   Bot posts in Slack thread

3. VISUALIZE (Web Dashboard)
   Knowledge Graph re-renders:
     - "zustand" node pulses amber (recently active)
     - "redux" node fades (decay score dropping)
     - Edge "sarah → knows → zustand" thickens
     - New memory appears in timeline feed
```

---

## The "Amnesia Test" — Demo Script

**This is your 60-second killer moment.**

```
Scene 1 — The Problem (15 seconds)
  Show generic Slack bot: "@chatbot why did we choose Postgres?"
  Bot responds: "I don't have context about your database decisions."
  Audience feels the pain.

Scene 2 — ECHO (30 seconds)
  "@echo why did we choose Postgres?"
  ECHO responds instantly with full reasoning, who said it, when, and in which channel.
  Show the knowledge graph — Postgres node glowing, edges to the people who made the decision.

Scene 3 — Live Interaction (15 seconds)
  Hand the keyboard to a judge.
  "Ask ECHO anything about our team."
  Whatever they ask — ECHO answers from real ingested memory.
  Judges are now inside your demo. You've won.
```

---

## Hackathon Build Order (Priority Stack)

```
Day 1 — Foundation
  ✅ Hindsight Cloud setup + API working
  ✅ Slack Bot: listen + ingest to Hindsight
  ✅ Basic OpenClaw agent: recall_memory tool working
  ✅ @echo mention in Slack returns a real answer

Day 2 — Intelligence
  ✅ Entity extraction pipeline (who + what + decision type)
  ✅ Knowledge Graph data structure built and updating
  ✅ Expert Finder tool: find_expert(topic)
  ✅ Memory timeline data structure

Day 3 — Visual Showpiece
  ✅ Web Dashboard: D3.js Knowledge Graph live
  ✅ Node pulse animation on new memory
  ✅ Timeline page: scroll through team's learning
  ✅ Expert Finder UI
  ✅ Decay indicator (amber fading nodes)

Day 4 — Polish + Discord
  ✅ Discord bot wired (mirrors Slack logic)
  ✅ "Amnesia Test" demo data seeded
  ✅ README polished
  ✅ Demo video recorded
  ✅ Content deliverables (article, social post)
```

---

## Risk Register

| Risk | Probability | Mitigation |
|---|---|---|
| Hindsight rate limits hit | Medium | Batch ingestion, cache responses |
| Groq function calling errors | High | Retry logic + fallback to simpler prompt |
| D3.js graph too slow with many nodes | Low | Cap displayed nodes at 50, use clustering |
| Slack socket mode disconnects | Medium | Auto-reconnect logic in bolt |
| Discord bot conflicts with Slack scope | Low | Separate processes, shared Hindsight instance |
| Over-scope kills polish | High | **Cut Discord Day 1, add Day 4 only if ahead** |

---

*Architecture designed for a 4-day hackathon build. Ship it.*
