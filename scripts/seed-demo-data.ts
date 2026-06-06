// ──────────────────────────────────────────────
// ECHO — Seed Demo Data
// ──────────────────────────────────────────────

import dotenv from 'dotenv';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import type { EchoMemory, MemoryType, Platform } from '../packages/types/src/index.js';
import { logger } from '../packages/types/src/index.js';
import { EchoMemoryClient } from '../packages/memory/src/index.js';
import { KnowledgeGraph } from '../packages/graph/src/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '..', '.env') });

// ── Helpers ───────────────────────────────────

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function createMemory(
  content: string,
  author: string,
  channel: string,
  memoryType: MemoryType,
  technologies: string[],
  decisions: string[],
  people: string[],
  participants: string[],
  daysBack: number,
  platform: Platform = 'slack'
): EchoMemory {
  return {
    id: randomUUID(),
    content,
    metadata: {
      platform,
      channel,
      author,
      participants,
      entities: { technologies, decisions, people },
      memoryType,
      timestamp: daysAgo(daysBack),
      decayScore: 1.0,
    },
  };
}

// ── Seed Data ─────────────────────────────────

const SEED_MEMORIES: EchoMemory[] = [
  // Postgres vs MySQL debate
  createMemory(
    "I've evaluated PostgreSQL vs MySQL for our main database. PostgreSQL has better JSON support, superior indexing with GIN/GiST indexes, and handles complex queries much better. My recommendation is PostgreSQL.",
    'Arun', '#architecture', 'decision', ['PostgreSQL', 'MySQL'], ['Use PostgreSQL for main database'], ['Arun', 'Sarah'], ['Sarah', 'Dev'], 14
  ),
  createMemory(
    "I agree with Arun on PostgreSQL. The JSONB columns alone will save us from needing a separate document store. Plus, pg_trgm for fuzzy text search is excellent.",
    'Sarah', '#architecture', 'decision', ['PostgreSQL', 'JSONB'], ['Use PostgreSQL for main database'], ['Sarah', 'Arun'], ['Arun'], 14
  ),
  createMemory(
    'One concern with PostgreSQL — we need to be careful with connection pooling. I suggest PgBouncer in front of the database. MySQL handles connections better out of the box.',
    'Dev', '#architecture', 'expertise', ['PostgreSQL', 'PgBouncer', 'MySQL'], [], ['Dev'], ['Arun', 'Sarah'], 13
  ),

  // Redux → Zustand migration
  createMemory(
    "I'm proposing we migrate from Redux to Zustand for state management. Our Redux boilerplate is out of control — 200+ lines of action creators, reducers, and selectors for simple features. Zustand can do the same in 30 lines.",
    'Maya', '#frontend', 'decision', ['Redux', 'Zustand'], ['Migrate from Redux to Zustand'], ['Maya', 'Priya'], ['Priya'], 10
  ),
  createMemory(
    "I did a POC with Zustand. Bundle size dropped by 12KB and the developer experience is much better. No more Provider wrapping, no more connect() HOCs. Let's do it.",
    'Priya', '#frontend', 'solution', ['Zustand', 'Redux'], ['Migrate from Redux to Zustand'], ['Priya', 'Maya'], ['Maya'], 9
  ),
  createMemory(
    'The Zustand migration is 60% done. I migrated the auth store and product catalog store. Cart and checkout stores are next. No issues so far.',
    'Maya', '#frontend', 'expertise', ['Zustand'], [], ['Maya'], ['Priya'], 5
  ),

  // Auth incident
  createMemory(
    'INCIDENT: Auth service went down at 2:17 AM. Users were unable to log in for approximately 45 minutes. Root cause: Redis connection pool exhaustion caused by a connection leak in the session middleware.',
    'Dev', '#incidents', 'problem', ['Redis', 'Auth'], [], ['Dev'], ['Arun', 'Zach'], 7
  ),
  createMemory(
    'Post-mortem for the auth incident: Added connection pool limits (max 50 connections), implemented connection health checks every 30s, and added Prometheus metrics for pool utilization. Also added PagerDuty alerts.',
    'Dev', '#incidents', 'solution', ['Redis', 'Prometheus', 'PagerDuty'], ['Add Redis connection pool limits', 'Add connection health monitoring'], ['Dev'], ['Arun', 'Zach'], 6
  ),
  createMemory(
    'Follow-up on auth incident: I audited all Redis usage across services. Found 3 other potential connection leaks. All patched now. Created a shared Redis client wrapper with built-in pool management.',
    'Zach', '#incidents', 'solution', ['Redis'], ['Create shared Redis client wrapper'], ['Zach', 'Dev'], ['Dev'], 5
  ),

  // API versioning
  createMemory(
    "We need to decide on API versioning strategy. Options: URL path (/api/v1/), query param (?version=1), custom header (X-API-Version), or Accept header. I'm leaning toward URL path for simplicity.",
    'Sarah', '#backend', 'decision', ['REST API'], ['Use URL path for API versioning'], ['Sarah'], ['Arun', 'Maya'], 12
  ),
  createMemory(
    "URL path versioning is the way to go. It's visible, cacheable, and every developer understands it immediately. Header-based versioning adds complexity without real benefit for our use case.",
    'Arun', '#backend', 'preference', ['REST API'], ['Use URL path for API versioning'], ['Arun', 'Sarah'], ['Sarah'], 12
  ),

  // Kubernetes migration
  createMemory(
    "Kubernetes migration plan: Phase 1 (this sprint) — set up EKS cluster, create Helm charts, migrate staging. Phase 2 (next sprint) — production cutover with blue-green deployment.",
    'Zach', '#devops', 'decision', ['Kubernetes', 'EKS', 'Helm'], ['Kubernetes migration plan'], ['Zach'], ['Dev', 'Arun'], 8
  ),
  createMemory(
    "Helm charts are ready for all 6 microservices. I've configured HPA (Horizontal Pod Autoscaler) for the API gateway and auth service. Resource limits set based on last month's monitoring data.",
    'Zach', '#devops', 'expertise', ['Kubernetes', 'Helm', 'HPA'], [], ['Zach'], ['Dev'], 6
  ),
  createMemory(
    'Staging is now fully running on Kubernetes. Load testing shows 40% better response times compared to our EC2 setup. Memory usage is also 25% lower due to better container optimization.',
    'Dev', '#devops', 'factoid', ['Kubernetes', 'EC2', 'Docker'], [], ['Dev', 'Zach'], ['Zach'], 4
  ),

  // Billing service rewrite
  createMemory(
    'The billing service rewrite is critical. Stripe is deprecating v2 API by end of Q3. We need to migrate to v4 API which has a completely different webhook model. I can lead this.',
    'Priya', '#backend', 'problem', ['Stripe', 'Billing'], ['Rewrite billing service with Stripe v4'], ['Priya'], ['Sarah', 'Dev'], 11
  ),
  createMemory(
    "I've designed the new billing architecture. Using Stripe v4 with webhook-first approach. Key change: instead of polling for payment status, we'll rely entirely on webhooks with idempotency keys for reliability.",
    'Priya', '#backend', 'solution', ['Stripe', 'Webhooks'], ['Use webhook-first billing architecture'], ['Priya'], ['Sarah'], 8
  ),
  createMemory(
    'Billing service v2 is deployed to staging. All 15 payment scenarios passing in integration tests. Webhook delivery is at 99.97% reliability. Ready for production review.',
    'Priya', '#backend', 'factoid', ['Stripe', 'Billing'], [], ['Priya'], ['Sarah', 'Dev'], 3
  ),

  // Caching strategy
  createMemory(
    "Our product catalog API is too slow — P95 is 800ms. I propose a multi-layer caching strategy: L1 in-memory cache (LRU, 5min TTL), L2 Redis cache (15min TTL), and CDN caching for public endpoints.",
    'Arun', '#backend', 'solution', ['Redis', 'CDN', 'Caching'], ['Implement multi-layer caching'], ['Arun'], ['Priya'], 9
  ),
  createMemory(
    'Caching implementation is live. Results: P50 latency dropped from 400ms to 12ms, P95 from 800ms to 45ms. Redis hit rate is 94%. Cache invalidation uses pub/sub pattern.',
    'Arun', '#backend', 'factoid', ['Redis', 'Caching'], [], ['Arun'], ['Priya', 'Sarah'], 4
  ),

  // pnpm vs npm
  createMemory(
    "Switching from npm to pnpm today. Benefits: strict dependency resolution (no phantom deps), 3x faster installs, and native workspace support. I've already converted the monorepo config.",
    'Dev', '#engineering', 'decision', ['pnpm', 'npm', 'Monorepo'], ['Switch from npm to pnpm'], ['Dev'], ['Maya', 'Zach'], 15
  ),
  createMemory(
    'pnpm migration complete. CI pipeline install time dropped from 4 minutes to 90 seconds. node_modules size decreased by 40% thanks to content-addressable storage.',
    'Dev', '#engineering', 'factoid', ['pnpm', 'CI/CD'], [], ['Dev'], ['Maya'], 14
  ),

  // Additional realistic memories
  createMemory(
    "Set up Grafana dashboards with Prometheus metrics. We now track: request latency (P50/P95/P99), error rates by service, pod CPU/memory utilization, and database query performance.",
    'Zach', '#devops', 'expertise', ['Grafana', 'Prometheus', 'Monitoring'], ['Set up observability stack'], ['Zach'], ['Dev'], 7
  ),
  createMemory(
    "JWT migration plan: Phase 1 — add JWT support alongside sessions. Phase 2 — migrate mobile clients to JWT. Phase 3 — deprecate sessions for API clients. Sessions stay for web browser auth.",
    'Dev', '#backend', 'decision', ['JWT', 'Authentication'], ['Migrate to JWT for API clients'], ['Dev'], ['Sarah', 'Arun'], 10
  ),
  createMemory(
    'Found and fixed XSS vulnerability in the comment system. The markdown renderer was not sanitizing script tags in code blocks. Added DOMPurify and wrote 20 test cases for edge cases.',
    'Priya', '#security', 'problem', ['XSS', 'DOMPurify', 'Security'], ['Add DOMPurify for input sanitization'], ['Priya'], ['Maya', 'Dev'], 6
  ),
  createMemory(
    "Switching to Tailwind CSS for the new admin dashboard. Benefits over styled-components: zero runtime overhead, consistent design tokens, and much faster iteration. Design system docs are at /docs/design.",
    'Maya', '#frontend', 'decision', ['Tailwind CSS', 'styled-components'], ['Use Tailwind CSS for admin dashboard'], ['Maya'], ['Priya'], 8
  ),
  createMemory(
    "Prisma migration is worth it. I replaced 2000 lines of raw SQL with 500 lines of Prisma schema + queries. Type safety is end-to-end: from schema to API response. Zero runtime type errors since migration.",
    'Arun', '#backend', 'expertise', ['Prisma', 'TypeScript', 'SQL'], ['Adopt Prisma as ORM'], ['Arun'], ['Sarah', 'Priya'], 11
  ),
  createMemory(
    "GraphQL gateway N+1 problem solved with DataLoader. Before: product listing page made 150 DB queries. After: batched down to 5 queries. Page load time dropped from 3s to 200ms.",
    'Sarah', '#backend', 'solution', ['GraphQL', 'DataLoader'], ['Implement DataLoader for query batching'], ['Sarah'], ['Arun'], 7
  ),
  createMemory(
    "Docker multi-stage builds are a game changer. Our API image went from 1.2GB to 180MB. Build time dropped from 8 minutes to 2 minutes. Also added .dockerignore for node_modules.",
    'Dev', '#devops', 'solution', ['Docker'], ['Use multi-stage Docker builds'], ['Dev'], ['Zach'], 9
  ),
  createMemory(
    'Rate limiting implemented on public API using sliding window algorithm backed by Redis. Limits: 100 req/min for free tier, 1000 req/min for pro, 10000 req/min for enterprise.',
    'Zach', '#backend', 'solution', ['Redis', 'Rate Limiting'], ['Implement sliding window rate limiting'], ['Zach'], ['Dev', 'Sarah'], 5
  ),
  createMemory(
    "WebSocket reconnection logic is now in place. Using exponential backoff with jitter (base 1s, max 30s). Added connection state management in the frontend so UI shows proper disconnect/reconnect states.",
    'Arun', '#frontend', 'solution', ['WebSocket'], ['Add WebSocket reconnection with backoff'], ['Arun'], ['Maya'], 3
  ),
  createMemory(
    "E2E testing strategy decided: Playwright for critical user journeys (login, checkout, onboarding), Vitest for unit/integration. Target: 80% coverage for business logic, 100% for payment flows.",
    'Sarah', '#engineering', 'decision', ['Playwright', 'Vitest', 'Testing'], ['Use Playwright for E2E testing'], ['Sarah'], ['Arun', 'Maya', 'Priya'], 2
  ),
  createMemory(
    "Elasticsearch cluster is set up for the search feature. Configured with 3 nodes, 2 replicas. Indexing pipeline handles ~5000 documents/second. Search relevancy is significantly better than PostgreSQL full-text.",
    'Priya', '#backend', 'expertise', ['Elasticsearch', 'PostgreSQL'], ['Use Elasticsearch for product search'], ['Priya'], ['Arun', 'Sarah'], 4
  ),
  createMemory(
    "GitHub Actions CI/CD is fully configured. PR pipeline: typecheck → lint → test → build (parallel where possible). Deploy pipeline: staging auto-deploy on main merge, production manual approval.",
    'Maya', '#devops', 'expertise', ['GitHub Actions', 'CI/CD'], ['GitHub Actions CI/CD pipeline'], ['Maya'], ['Dev', 'Zach'], 6
  ),
];

// ── Main ──────────────────────────────────────

async function seed(): Promise<void> {
  logger.info('Starting demo data seed', { memoryCount: SEED_MEMORIES.length });

  const memory = new EchoMemoryClient();
  await memory.initialize();

  const graph = new KnowledgeGraph();

  let count = 0;
  for (const mem of SEED_MEMORIES) {
    await memory.store(mem);
    graph.addMemory(mem);
    count += 1;
  }

  graph.calculateDecay();
  graph.save();

  const graphData = graph.getGraph();

  logger.info('Seed complete', {
    memoriesStored: count,
    graphNodes: graphData.nodes.length,
    graphEdges: graphData.edges.length,
  });
}

seed().catch((err) => {
  logger.error('Seed failed', { error: String(err) });
  process.exit(1);
});
