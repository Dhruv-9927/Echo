// ──────────────────────────────────────────────
// ECHO — Memory Client (Hindsight + Fallback)
// ──────────────────────────────────────────────

import type { EchoMemory } from '@echo/types';
import { logger } from '@echo/types';
import { HindsightClient } from './hindsight-client.js';
import { InMemoryStore, type MemoryFilter } from './memory-store.js';

export { InMemoryStore, type MemoryFilter } from './memory-store.js';
export { HindsightClient } from './hindsight-client.js';

export class EchoMemoryClient {
  private hindsight: HindsightClient | null = null;
  private fallback: InMemoryStore;
  private useHindsight = false;

  constructor() {
    this.fallback = new InMemoryStore();
  }

  async initialize(): Promise<void> {
    const apiKey = process.env.HINDSIGHT_API_KEY;
    if (apiKey) {
      this.hindsight = new HindsightClient(apiKey);
      try {
        this.useHindsight = await this.hindsight.checkAvailability();
      } catch {
        this.useHindsight = false;
      }
    }

    if (this.useHindsight) {
      logger.info('Memory client initialized with Hindsight backend');
    } else {
      logger.info('Memory client initialized with in-memory fallback');
    }
  }

  async store(memory: EchoMemory): Promise<void> {
    // Always store in fallback for local persistence
    this.fallback.store(memory);

    if (this.useHindsight && this.hindsight) {
      try {
        await this.hindsight.store(memory);
      } catch (err) {
        logger.error('Hindsight store failed, data persisted locally', { error: String(err) });
      }
    }
  }

  async recall(query: string, filters?: MemoryFilter, limit = 10): Promise<EchoMemory[]> {
    if (this.useHindsight && this.hindsight) {
      try {
        return await this.hindsight.recall(query, limit);
      } catch (err) {
        logger.warn('Hindsight recall failed, falling back to local search', { error: String(err) });
      }
    }

    return this.fallback.recall(query, filters, limit);
  }

  getRecent(limit = 20): EchoMemory[] {
    return this.fallback.getRecent(limit);
  }

  getAllMemories(): EchoMemory[] {
    return this.fallback.getAllMemories();
  }

  getByFilters(
    filters: MemoryFilter,
    limit = 20,
    offset = 0
  ): { memories: EchoMemory[]; total: number } {
    return this.fallback.getByFilters(filters, limit, offset);
  }

  getByTimeRange(from: string, to: string): EchoMemory[] {
    const fromTime = new Date(from).getTime();
    const toTime = new Date(to).getTime();

    return this.fallback
      .getAllMemories()
      .filter((m) => {
        const t = new Date(m.metadata.timestamp).getTime();
        return t >= fromTime && t <= toTime;
      })
      .sort((a, b) => new Date(a.metadata.timestamp).getTime() - new Date(b.metadata.timestamp).getTime());
  }

  isUsingHindsight(): boolean {
    return this.useHindsight;
  }
}
