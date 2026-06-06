# ECHO — Project Context
> The "why" behind every decision. Read this before touching any code.
> Version 1.0

---

## What Is ECHO?

**ECHO is a Hindsight-powered collective memory agent for Slack and Discord.**

It silently listens to team conversations, stores meaningful memories (decisions, expertise, problems, solutions) using the Hindsight memory layer, builds a visual knowledge graph of who knows what, and answers questions about the team's history the moment someone asks — in Slack, Discord, or via the web dashboard.

**The core insight:**
> Every team's knowledge lives in chat. Nobody can find it. ECHO makes it findable — permanently.

---

## The Problem We're Solving

**Name:** Knowledge Burial Syndrome

Every Slack and Discord workspace is a graveyard. Valuable information gets posted once, buried under thousands of other messages, and forgotten within days. The consequences are real and expensive:

- New team members spend weeks asking "why did we do X?" questions that were answered a year ago
- Senior engineers waste hours answering the same architectural questions repeatedly
- Decisions made in #architecture-2023 are lost — and unmade in #architecture-2024
- When someone leaves, their expertise leaves with them
- Every "quick question in Slack" is invisible to future team members

**The before:**
"Hey, does anyone know why we moved off Redis for caching?"
→ 3 hours later, one senior dev digs through old channels
→ Or the knowledge is just gone

**The after (with ECHO):**
"@echo why did we move off Redis?"
→ 3 seconds. Full context. Who said it. When. In which channel.

---

## Why This Hackathon, Why This Problem

The hackathon explicitly asks for:
- AI agents that learn from past interactions ✅
- Hindsight memory as the core, not a feature ✅
- Real business problems companies would pay for ✅
- Demo-able wow factor ✅
- Originality beyond "chatbot with memory" ✅

ECHO delivers on all five. The knowledge graph visualization alone is something no other team will have. The "Amnesia Test" demo moment is designed to make judges feel the problem before they see the solution — a classic hackathon-winning structure.

---

## Target User

**Primary:** Engineering teams (5–50 people) using Slack or Discord as their primary communication channel.

**The persona:** "Arun", a senior engineer at a 20-person startup. He's been there 2 years. He spends 30 minutes a day answering questions that newer teammates could find themselves if the context were accessible. He's the human ECHO — and he's exhausted.

**Secondary:** Product teams, design teams, any knowledge-intensive team.

**Anti-persona:** Enterprise with 10,000 Slack users and strict security requirements. Not our hackathon focus. Build for the small team where the demo story resonates.

---

## Design Philosophy

### 1. Memory Is the Product
Not a feature. Not a backend detail. When someone interacts with ECHO, they should feel the memory. Responses cite sources. The graph shows history. Every UI element reinforces: *this system remembers.*

### 2. Invisible Collection, Visible Intelligence
ECHO collects silently (no friction on the team). But when intelligence surfaces, it's vivid and visual. The contrast between invisible input and visual output is deliberate — it makes the "wow" moment bigger.

### 3. Trust Through Transparency
ECHO never makes things up. Every answer cites who said it, when, and in what channel. If ECHO doesn't know, it says so explicitly. This builds trust — judges and users alike.

### 4. The Graph Is the Hero
The D3.js knowledge graph is not decoration. It IS the product for the dashboard. Every interaction should ripple into the graph. Node pulses, edge thickening, decay fading — all of it communicates that the brain is alive and learning.

---

## Visual Design Language

ECHO's aesthetic: **Dark Intelligence — Organic + Technological**

Not another dark dashboard with purple gradients. ECHO should feel like looking at a living neural network — organic, intelligent, slightly alien, but immediately comprehensible.

**The Mood Board Concept:**
- Deep space dark backgrounds (`#050508`) — not pure black, not navy
- Bioluminescent node colors — the graph glows like deep-sea creatures
- Monospace type for data (memory content, timestamps) mixed with a distinctive display font for headings
- Nodes pulse with organic easing, not mechanical linear animations
- Edges are translucent — they breathe, they don't just sit there
- Amber for decay — the color of autumn, of things fading

**What it should NOT look like:**
- Generic dark SaaS (Linear clone)
- AI startup purple gradient on white
- Retro terminal green-on-black
- Bootstrap

**Font Pairing:**
- Display: `Syne` (geometric, slightly eccentric — feels like a future typeface) or `DM Serif Display`
- Monospace data: `JetBrains Mono` (for memory content, code snippets)
- UI body: `Outfit` (clean but slightly warm, not sterile like Inter)

**Color Palette:**
```
Void (background):     #050508
Surface (cards):       #0d0d14
Surface-2 (hover):     #13131f
Border (subtle):       #1a1a2e
Border-2 (active):     #2d2d4a

Pulse (primary):       #6c63ff  — electric indigo
Signal (secondary):    #00d4aa  — bioluminescent teal
Amber (decay):         #f59e0b  — warm amber
Danger (error):        #ef4444

Text Primary:          #e8e8f0  — slightly blue-white
Text Secondary:        #6b7280  — muted grey
Text Muted:            #374151  — near-invisible

Graph Nodes:
  Person:    #6c63ff  (indigo)
  Concept:   #00d4aa  (teal)
  Decision:  #f59e0b  (amber)
  Problem:   #ef4444  (red)
  Solution:  #22c55e  (green)
```

---

## Hindsight Memory Strategy

**What we store:**
- Messages that contain decisions ("we decided", "we're going with", "we chose")
- Messages that demonstrate expertise (long explanations, technical deep dives, "here's how X works")
- Problem reports ("we're seeing", "the bug is", "production is down")
- Solutions ("fixed it by", "the issue was", "turns out")

**What we skip:**
- Short messages under 20 characters
- Pure emoji reactions / +1s
- Bot messages
- Messages in DMs (privacy)

**Entity extraction prompt (mini LLM call):**
```
Given this Slack message, extract:
1. People mentioned (by @handle)
2. Technologies or tools mentioned
3. Decisions made (yes/no + what was decided)
4. The memory type: decision | expertise | problem | solution | preference | factoid

Message: "{message}"

Return JSON only. No explanation.
```

---

## OpenClaw Agent — Personality & Behavior Contract

ECHO is not a generic assistant. It has a specific personality:

**Traits:**
- Confident and precise — it speaks with authority about what it knows
- Humble and explicit about what it doesn't know
- Concise — never rambles, never adds filler
- Cites sources — always attributes to the person + channel + time
- Professional but not cold — feels like a very smart colleague, not a robot

**Response format in Slack/Discord (Markdown):**
```
Based on my memory from #architecture (June 1):

**Decision:** Move from Redux to Zustand
**Why:** Simpler API, smaller bundle size, no boilerplate
**Decided by:** @sarah, confirmed by @arun

*I have 3 related memories from this discussion. Want more context?*
```

**What ECHO never does:**
- Makes up information not in its memory
- Says "As an AI language model..." or similar
- Gives generic advice unrelated to the team's actual history
- Ignores the question and gives a tangential answer

---

## Judging Criteria — Our Positioning

| Criterion | Weight | Our Strategy |
|---|---|---|
| Innovation | 30% | Knowledge graph visualization + Amnesia Test demo = fresh and memorable |
| Hindsight Memory Use | 25% | Memory IS the product. Graph updates live with each memory. Expert finder derives entirely from memory. |
| Technical Implementation | 20% | TypeScript monorepo, clean architecture, working multi-platform bots |
| User Experience | 15% | Judges can interact live. Graph is viscerally compelling. Demo story is tight. |
| Real-world Impact | 10% | Every tech company has this pain. Business case is obvious. |

**Our moat:** No other team will have a live knowledge graph that updates in real time and lets judges interact with the demo directly. That's the thing they'll talk about after the hackathon.

---

## Content Deliverables (Required by Problem Statement)

Per the hackathon rules, all team members must submit:

### Article
**Title:** "We Built an AI That Remembers Everything Your Team Forgets"
**Angle:** Personal story — the pain of lost Slack context, how we built ECHO, what we learned about Hindsight memory.
**Length:** 800–1200 words
**Platform:** Dev.to or Medium
**Key sections:** The problem → The idea → How Hindsight powers it → The demo moment → What's next

### Social Media Post
**Platform:** LinkedIn + Twitter/X
**LinkedIn angle:** Professional — "Here's what we built and why it matters for knowledge retention at scale"
**Twitter angle:** Technical thread — "We built @echo that turns your Slack into a searchable brain. Here's how the architecture works 🧵"

### Video
**Length:** 3–5 minutes
**Structure:**
  1. Open with the problem (30s) — "Have you ever searched Slack for a decision made 6 months ago?"
  2. Show ECHO in action (90s) — Live Slack query → answer → graph update
  3. The Amnesia Test (60s) — side by side comparison
  4. Architecture overview (30s) — Hindsight + OpenClaw + graph
  5. Live judge interaction if possible (30s)

---

## What "Done" Looks Like for the Hackathon

**Minimum Viable Demo (must have):**
- [ ] Slack bot responds to @echo mentions with memory-backed answers
- [ ] Real ingestion happening from at least one Slack channel (can be seeded)
- [ ] Web dashboard: knowledge graph visible and updating
- [ ] Expert finder: "who knows about X?" works
- [ ] Memory timeline: shows last 20 memories

**Strong Demo (should have):**
- [ ] Amnesia Test demo scripted and rehearsed
- [ ] Realistic synthetic data seeded (20+ memories)
- [ ] Node pulse animations live
- [ ] Decay indicators visible on graph
- [ ] Discord bot working (at least basic query response)

**Wow Factor (nice to have):**
- [ ] Judge can type a live question during demo
- [ ] Graph transitions are smooth and beautiful
- [ ] Memory confidence score shown in responses
- [ ] Knowledge gap detection page live

---

## Team Operating Agreement

- **Every build session starts** by reading the latest feature_log.md
- **Every feature goes** in a feature branch, PR back to dev
- **Every deploy** is smoke-tested with the seed data before anyone calls it done
- **The demo flow** is rehearsed at least once before submission
- **If in doubt** about scope: cut the feature, polish what exists

---

*Context is everything. This document is your north star when you're 3 days deep and losing perspective.*
