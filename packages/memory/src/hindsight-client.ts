// ──────────────────────────────────────────────
// ECHO — Hindsight API Client
// ──────────────────────────────────────────────

import type { EchoMemory, MemoryMetadata, MemoryType } from '@echo/types';
import { logger } from '@echo/types';

const HINDSIGHT_BASE_URL = 'https://api.vectorize.io/v1';

interface HindsightDocument {
  id: string;
  content: string;
  metadata: Record<string, unknown>;
}

interface HindsightSearchResult {
  id: string;
  content: string;
  metadata: Record<string, unknown>;
  score: number;
}

function toEchoMemory(doc: HindsightDocument | HindsightSearchResult): EchoMemory {
  const meta = doc.metadata;
  return {
    id: doc.id,
    content: doc.content,
    metadata: {
      platform: (meta.platform as MemoryMetadata['platform']) ?? 'web',
      channel: (meta.channel as string) ?? 'unknown',
      author: (meta.author as string) ?? 'unknown',
      participants: (meta.participants as string[]) ?? [],
      entities: {
        technologies: (meta.technologies as string[]) ?? [],
        decisions: (meta.decisions as string[]) ?? [],
        people: (meta.people as string[]) ?? [],
      },
      memoryType: (meta.memoryType as MemoryType) ?? 'factoid',
      timestamp: (meta.timestamp as string) ?? new Date().toISOString(),
      decayScore: (meta.decayScore as number) ?? 1.0,
    },
  };
}

export class HindsightClient {
  private apiKey: string;
  private available = false;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async checkAvailability(): Promise<boolean> {
    try {
      const response = await fetch(`${HINDSIGHT_BASE_URL}/health`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${this.apiKey}` },
        signal: AbortSignal.timeout(5000),
      });
      this.available = response.ok;
      logger.info('Hindsight availability check', { available: this.available });
      return this.available;
    } catch {
      this.available = false;
      logger.warn('Hindsight unavailable, will use fallback store');
      return false;
    }
  }

  isAvailable(): boolean {
    return this.available;
  }

  async store(memory: EchoMemory): Promise<void> {
    const response = await fetch(`${HINDSIGHT_BASE_URL}/documents`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: memory.id,
        content: memory.content,
        metadata: {
          platform: memory.metadata.platform,
          channel: memory.metadata.channel,
          author: memory.metadata.author,
          participants: memory.metadata.participants,
          technologies: memory.metadata.entities.technologies,
          decisions: memory.metadata.entities.decisions,
          people: memory.metadata.entities.people,
          memoryType: memory.metadata.memoryType,
          timestamp: memory.metadata.timestamp,
          decayScore: memory.metadata.decayScore,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Hindsight store failed: ${response.status} ${response.statusText}`);
    }

    logger.debug('Memory stored in Hindsight', { id: memory.id });
  }

  async recall(query: string, limit = 10): Promise<EchoMemory[]> {
    const response = await fetch(`${HINDSIGHT_BASE_URL}/search`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, limit }),
    });

    if (!response.ok) {
      throw new Error(`Hindsight search failed: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as { results: HindsightSearchResult[] };
    return data.results.map(toEchoMemory);
  }
}
