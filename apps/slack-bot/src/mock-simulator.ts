// ──────────────────────────────────────────────
// ECHO — Mock Message Simulator
// ──────────────────────────────────────────────

import { logger } from '@echo/types';
import type { IngestionPipeline, IncomingMessage } from './ingestion.js';

// MockPerson interface removed

// TEAM array removed

const CHANNELS = ['#engineering', '#backend', '#frontend', '#architecture', '#devops', '#general'];

const MESSAGES: Array<{ text: string; author: string; participants: string[] }> = [
  {
    text: "I've been comparing PostgreSQL vs MySQL for our main database. PostgreSQL handles JSON columns much better and has better indexing for our use case.",
    author: 'Arun',
    participants: ['Sarah', 'Dev'],
  },
  {
    text: "We should switch from Redux to Zustand for state management. It's much simpler and we won't need all the boilerplate.",
    author: 'Maya',
    participants: ['Priya'],
  },
  {
    text: 'The auth service went down last night at 2am. Root cause was a Redis connection pool exhaustion. I added connection limits and monitoring.',
    author: 'Dev',
    participants: ['Arun', 'Zach'],
  },
  {
    text: "For API versioning, I think we should use URL path versioning like /api/v1/ instead of header-based. It's simpler for clients to use.",
    author: 'Sarah',
    participants: ['Arun', 'Maya'],
  },
  {
    text: "The Kubernetes migration is going well. I've set up Helm charts for all services. We should target next sprint for the production cutover.",
    author: 'Zach',
    participants: ['Dev', 'Arun'],
  },
  {
    text: 'The billing service needs a complete rewrite. The current codebase is using Stripe v2 API which is being deprecated. I can lead this effort.',
    author: 'Priya',
    participants: ['Sarah', 'Dev'],
  },
  {
    text: "We should add Redis caching for the product catalog API. Current response times are 800ms, we can get that under 50ms with proper caching.",
    author: 'Arun',
    participants: ['Priya'],
  },
  {
    text: "I'm switching our package manager from npm to pnpm. The workspace support is much better and installs are 3x faster.",
    author: 'Dev',
    participants: ['Maya', 'Zach'],
  },
  {
    text: "The GraphQL gateway is causing N+1 query problems. I'm implementing DataLoader to batch database queries.",
    author: 'Sarah',
    participants: ['Arun'],
  },
  {
    text: 'We need to implement rate limiting on the public API. I suggest using a sliding window algorithm with Redis backing.',
    author: 'Zach',
    participants: ['Dev', 'Sarah'],
  },
  {
    text: 'Docker build times are too long. I optimized the Dockerfile with multi-stage builds and layer caching. Build time went from 8 min to 2 min.',
    author: 'Dev',
    participants: ['Zach'],
  },
  {
    text: "For the search feature, we should use Elasticsearch instead of full-text search in Postgres. The relevancy scoring is much better.",
    author: 'Priya',
    participants: ['Arun', 'Sarah'],
  },
  {
    text: "I've set up GitHub Actions for CI/CD. Pull requests now auto-run tests, lint, and type checking before merge.",
    author: 'Maya',
    participants: ['Dev', 'Zach'],
  },
  {
    text: 'The WebSocket connection keeps dropping for users on mobile. I think we need to implement reconnection logic with exponential backoff.',
    author: 'Arun',
    participants: ['Maya'],
  },
  {
    text: "We decided to use TypeScript strict mode across all packages. No more 'any' types allowed in new code.",
    author: 'Sarah',
    participants: ['Arun', 'Priya', 'Dev', 'Maya', 'Zach'],
  },
  {
    text: 'The monitoring dashboard is now live. I integrated Grafana with Prometheus metrics. We can track request latency, error rates, and resource usage.',
    author: 'Zach',
    participants: ['Dev'],
  },
  {
    text: 'For authentication, we should migrate from session-based auth to JWT tokens. This will make our microservices architecture cleaner.',
    author: 'Dev',
    participants: ['Sarah', 'Arun'],
  },
  {
    text: "I found a critical XSS vulnerability in the comment system. Patched it with proper input sanitization. We should audit all user input fields.",
    author: 'Priya',
    participants: ['Maya', 'Dev'],
  },
  {
    text: "Let's use Tailwind CSS instead of styled-components for the new dashboard. Performance is better and the design system is easier to maintain.",
    author: 'Maya',
    participants: ['Priya'],
  },
  {
    text: "The database migration framework should be changed from Knex to Prisma. Prisma's type safety with TypeScript is a game changer.",
    author: 'Arun',
    participants: ['Sarah', 'Priya'],
  },
];

export class MockSimulator {
  private pipeline: IngestionPipeline;
  private timer: ReturnType<typeof setInterval> | null = null;
  private messageIndex = 0;

  constructor(pipeline: IngestionPipeline) {
    this.pipeline = pipeline;
  }

  start(intervalMs = 15_000): void {
    logger.info('Mock simulator started', { intervalMs });

    // Process first message immediately
    this.sendNextMessage();

    this.timer = setInterval(() => {
      this.sendNextMessage();
    }, intervalMs);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      logger.info('Mock simulator stopped');
    }
  }

  private sendNextMessage(): void {
    const msgTemplate = MESSAGES[this.messageIndex % MESSAGES.length];
    const channel = CHANNELS[Math.floor(Math.random() * CHANNELS.length)];

    const message: IncomingMessage = {
      text: msgTemplate.text,
      author: msgTemplate.author,
      channel,
      platform: 'slack',
      participants: msgTemplate.participants,
      timestamp: new Date().toISOString(),
    };

    this.pipeline
      .ingest(message)
      .then(() => {
        logger.debug('Mock message sent', {
          author: message.author,
          channel: message.channel,
          index: this.messageIndex,
        });
      })
      .catch((err) => {
        logger.error('Mock message ingestion failed', { error: String(err) });
      });

    this.messageIndex += 1;
  }
}
