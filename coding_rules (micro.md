# ECHO — Coding Rules & Standards
> Non-negotiable rules for a hackathon that judges will open the repo for.
> Version 1.0 | Written by someone who has judged 50+ repos.

---

## The Golden Rule

**Every file you write should look like you'd be proud to show it in a job interview.**

Judges DO open repos. Recruiters DO clone projects. The code is part of the demo.

---

## Repository Structure

```
echo/
├── apps/
│   ├── slack-bot/          # Slack Bot (Node.js + @slack/bolt)
│   ├── discord-bot/        # Discord Bot (Node.js + discord.js)
│   └── web/                # React Dashboard (Vite)
├── packages/
│   ├── agent/              # OpenClaw agent + tools (shared)
│   ├── memory/             # Hindsight client wrapper (shared)
│   ├── graph/              # Knowledge Graph engine (shared)
│   └── types/              # Shared TypeScript types
├── scripts/
│   ├── seed-demo-data.js   # Seeds realistic demo memories
│   └── smoke-test.js       # Quick end-to-end sanity check
├── docs/
│   ├── architecture.md
│   ├── coding_rules.md
│   ├── projectcontext.md
│   └── feature_log.md
├── .env.example            # ALL required env vars documented
├── docker-compose.yml      # One-command local dev
├── README.md               # Judges read this first
└── package.json            # Root monorepo (pnpm workspaces)
```

---

## Language & Runtime

- **Primary language**: TypeScript (strict mode ON, no `any`)
- **Runtime**: Node.js 20+
- **Package manager**: `pnpm` (faster, cleaner than npm for monorepos)
- **Module system**: ESM (`"type": "module"` in all package.json)

```json
// tsconfig.json — enforce quality
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true,
    "target": "ES2022",
    "module": "NodeNext"
  }
}
```

---

## Naming Conventions

### Files
```
kebab-case for all files:
  ✅  memory-client.ts
  ✅  knowledge-graph.ts
  ✅  expert-finder.ts
  ❌  memoryClient.ts
  ❌  KnowledgeGraph.ts
```

### Variables & Functions
```typescript
// camelCase for variables and functions
const memoryClient = new HindsightClient();
async function findExpert(topic: string): Promise<Expert[]> {}

// PascalCase for classes and types
class KnowledgeGraph {}
type MemoryMetadata = { ... }
interface ExpertResult { ... }

// SCREAMING_SNAKE_CASE for constants
const MAX_GRAPH_NODES = 50;
const MEMORY_DECAY_DAYS = 30;
```

### React Components
```
PascalCase files and component names:
  ✅  KnowledgeGraph.tsx
  ✅  ExpertFinder.tsx
  ✅  MemoryTimeline.tsx
```

---

## Code Style Rules

### 1. No Magic Numbers
```typescript
// ❌ Bad
setTimeout(ingest, 30000);

// ✅ Good
const INGEST_INTERVAL_MS = 30_000;
setTimeout(ingest, INGEST_INTERVAL_MS);
```

### 2. Explicit Return Types on Public Functions
```typescript
// ❌ Bad
async function recallMemory(query: string) {
  // ...
}

// ✅ Good
async function recallMemory(query: string): Promise<Memory[]> {
  // ...
}
```

### 3. Errors Are Not Swallowed
```typescript
// ❌ Bad
try {
  await hindsight.store(memory);
} catch (e) {
  console.log("oops");
}

// ✅ Good
try {
  await hindsight.store(memory);
} catch (error) {
  logger.error("Failed to store memory", {
    error: error instanceof Error ? error.message : String(error),
    memory_id: memory.id,
  });
  // Re-throw or handle gracefully — never silently eat errors
}
```

### 4. Every Async Function Has Error Handling
No unhandled promise rejections. Period.

### 5. No Console.log in Production Paths
Use a structured logger (even a simple wrapper):
```typescript
// packages/types/logger.ts
export const logger = {
  info: (msg: string, meta?: object) => console.log(JSON.stringify({ level: 'info', msg, ...meta, ts: Date.now() })),
  error: (msg: string, meta?: object) => console.error(JSON.stringify({ level: 'error', msg, ...meta, ts: Date.now() })),
  debug: (msg: string, meta?: object) => process.env.DEBUG && console.log(JSON.stringify({ level: 'debug', msg, ...meta })),
};
```

### 6. Env Variables — Always Validated at Startup
```typescript
// Every app entry point starts with this:
function validateEnv() {
  const required = ['HINDSIGHT_API_KEY', 'GROQ_API_KEY', 'SLACK_BOT_TOKEN'];
  const missing = required.filter(k => !process.env[k]);
  if (missing.length > 0) {
    throw new Error(`Missing required env vars: ${missing.join(', ')}`);
  }
}
```

---

## API Design Rules

### REST Endpoints (Web Dashboard Backend)
```
GET  /api/graph              → Full knowledge graph (nodes + edges)
GET  /api/memories           → Recent memories, supports ?limit=&offset=&topic=
GET  /api/experts/:topic     → Expert ranking for a topic
GET  /api/timeline           → Memory timeline, supports ?from=&to=
POST /api/ask                → Query the OpenClaw agent
GET  /api/health             → Healthcheck (returns { status: "ok", ts: ... })
```

**All responses follow this envelope:**
```typescript
type ApiResponse<T> = {
  data: T;
  meta?: {
    total?: number;
    page?: number;
  };
  error?: never;
} | {
  data?: never;
  error: {
    code: string;
    message: string;
  };
};
```

### WebSocket Events (Graph Live Updates)
```typescript
// Server → Client
'memory:added'     → { memory: Memory, graph_delta: GraphDelta }
'graph:pulse'      → { node_id: string }   // triggers pulse animation
'node:decay'       → { node_id: string, new_decay: number }

// Client → Server
'subscribe:graph'  → Start receiving graph updates
```

---

## Frontend (React) Rules

### Component Structure — Always This Order
```typescript
// 1. Imports
import { useState, useEffect } from 'react';
import type { Expert } from '@echo/types';

// 2. Types local to this file
type Props = {
  topic: string;
  onSelect: (expert: Expert) => void;
};

// 3. Component (one per file)
export function ExpertFinder({ topic, onSelect }: Props) {
  // 4. State (grouped)
  const [experts, setExperts] = useState<Expert[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 5. Effects
  useEffect(() => { ... }, [topic]);

  // 6. Handlers
  function handleSelect(expert: Expert) { ... }

  // 7. Render
  return ( ... );
}
```

### No Inline Styles
```tsx
// ❌ Bad
<div style={{ color: 'red', marginTop: '16px' }}>

// ✅ Good — use CSS custom properties and class names
<div className="expert-card expert-card--highlighted">
```

### CSS Architecture — BEM-inspired, flat
```css
/* Component block */
.knowledge-graph { }

/* Element */
.knowledge-graph__node { }
.knowledge-graph__edge { }

/* Modifier */
.knowledge-graph__node--active { }
.knowledge-graph__node--decayed { }
.knowledge-graph__node--pulsing { }
```

### CSS Variables — Define Everything in :root
```css
:root {
  /* Brand */
  --echo-void: #050508;
  --echo-surface: #0d0d14;
  --echo-border: #1a1a2e;
  --echo-pulse: #6c63ff;
  --echo-signal: #00d4aa;
  --echo-amber: #f59e0b;
  --echo-text-primary: #e8e8f0;
  --echo-text-secondary: #6b7280;

  /* Graph */
  --graph-person-node: #6c63ff;
  --graph-concept-node: #00d4aa;
  --graph-decision-node: #f59e0b;
  --graph-edge-default: rgba(108, 99, 255, 0.2);
  --graph-edge-strong: rgba(108, 99, 255, 0.7);

  /* Motion */
  --transition-snap: 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  --transition-flow: 0.4s cubic-bezier(0.23, 1, 0.32, 1);
  --transition-slow: 0.8s cubic-bezier(0.23, 1, 0.32, 1);
}
```

---

## Hindsight Client Rules

Wrap the Hindsight SDK — never call it raw from business logic:

```typescript
// packages/memory/hindsight-client.ts
export class EchoMemoryClient {
  private client: HindsightClient;

  constructor() {
    this.client = new HindsightClient({ apiKey: process.env.HINDSIGHT_API_KEY! });
  }

  async store(memory: EchoMemory): Promise<void> {
    // Validate before storing
    if (!memory.content || memory.content.trim().length < 10) return;

    await this.client.store({
      content: memory.content,
      metadata: this.serializeMetadata(memory.metadata),
    });
  }

  async recall(query: string, filters?: MemoryFilters): Promise<EchoMemory[]> {
    const results = await this.client.search({ query, ...filters });
    return results.map(this.deserializeMemory);
  }

  // Never expose raw Hindsight objects outside this module
  private serializeMetadata(meta: MemoryMetadata): Record<string, string> { ... }
  private deserializeMemory(raw: HindsightResult): EchoMemory { ... }
}
```

---

## Groq / LLM Rules

### Always Handle Function Calling Errors (as warned in problem statement)
```typescript
async function callAgent(prompt: string, retries = 3): Promise<string> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await groq.chat.completions.create({ ... });
      return response.choices[0].message.content ?? '';
    } catch (error) {
      if (attempt === retries) throw error;

      const isToolCallError = error instanceof Error &&
        error.message.includes('tool');

      if (isToolCallError) {
        logger.warn(`Tool call error, attempt ${attempt}/${retries}`);
        await sleep(500 * attempt); // Exponential backoff
        continue;
      }

      throw error; // Non-retryable error
    }
  }
  throw new Error('Agent call failed after all retries');
}
```

### System Prompt — Externalized, Not Hardcoded
```typescript
// packages/agent/prompts/echo-system.ts
export const ECHO_SYSTEM_PROMPT = `
You are ECHO, the collective memory of this team.
...
`.trim();

// Never write long strings inline in API call code
```

---

## Git Discipline

### Commit Message Format
```
type(scope): short description

Examples:
  feat(slack): add entity extraction to message ingestion
  feat(graph): add decay score calculation
  fix(agent): handle groq tool call timeout gracefully
  style(dashboard): polish knowledge graph node animations
  docs: update architecture with discord bot details
  chore: add .env.example with all required vars
```

### Branch Strategy
```
main          → always demo-ready
dev           → integration branch
feature/*     → individual features
fix/*         → bug fixes
```

### PR Rules (even for solo/small team)
- Every feature gets its own branch
- PR description includes: what changed + how to test
- No broken builds merged to main

---

## README Rules (Judges Read This in 90 Seconds)

Your README must have, in this order:
1. **One-line description** — what ECHO does
2. **30-second demo GIF or screenshot** — above the fold
3. **How memory makes it better** — the Hindsight angle, 2-3 sentences
4. **Quick Start** — working in under 5 commands
5. **Architecture overview** — one diagram or link to architecture.md
6. **Tech stack badges**
7. **Team**

```markdown
# ECHO — Your Team's Second Brain

> ECHO silently learns from every Slack and Discord conversation, builds a living 
> knowledge graph of your team's collective intelligence, and surfaces it the moment 
> someone asks.

![ECHO Demo](docs/demo.gif)

## Why Memory Changes Everything
Without memory: "I don't know why we chose Postgres."  
With ECHO: "On June 1st, @sarah suggested Postgres for JSONB support. @arun agreed."

## Quick Start
\`\`\`bash
git clone https://github.com/yourteam/echo
cp .env.example .env   # Fill in your keys
pnpm install
pnpm dev               # Starts all bots + web dashboard
\`\`\`
```

---

## What NOT to Do

```
❌ Don't use any `any` type — it defeats the purpose of TypeScript
❌ Don't call Hindsight directly from bot event handlers — use the client wrapper
❌ Don't store secrets in code — .env only, .env in .gitignore
❌ Don't block the event loop — everything async/await
❌ Don't use console.log in production — use the logger
❌ Don't skip error handling because "it's a hackathon"
❌ Don't commit node_modules, .env, or build artifacts
❌ Don't deploy without testing the demo flow end-to-end first
❌ Don't let the Discord bot break the Slack demo — build in isolation first
```

---

*Ship clean code. Judges remember the repos that didn't make them cringe.*
