// ──────────────────────────────────────────────
// ECHO — In-Memory Fallback Store
// ──────────────────────────────────────────────

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { EchoMemory, MemoryType } from '@echo/types';
import { logger } from '@echo/types';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, '..', '..', '..', 'data');
const PERSISTENCE_PATH = resolve(DATA_DIR, 'memories.json');

export interface MemoryFilter {
  author?: string;
  channel?: string;
  memoryType?: MemoryType;
}

export class InMemoryStore {
  private memories: Map<string, EchoMemory> = new Map();

  constructor() {
    this.load();
  }

  store(memory: EchoMemory): void {
    this.memories.set(memory.id, memory);
    this.persist();
    logger.debug('Memory stored in fallback store', { id: memory.id });
  }

  recall(query: string, filters?: MemoryFilter, limit = 10): EchoMemory[] {
    const queryLower = query.toLowerCase();
    const results: Array<{ memory: EchoMemory; score: number }> = [];

    for (const memory of this.memories.values()) {
      if (!this.matchesFilters(memory, filters)) continue;

      const contentLower = memory.content.toLowerCase();
      let score = 0;

      // Simple text-match scoring
      const queryWords = queryLower.split(/\s+/);
      for (const word of queryWords) {
        if (contentLower.includes(word)) score += 1;
      }

      // Exact phrase match bonus
      if (contentLower.includes(queryLower)) score += 5;

      // Entity match bonus
      const entities = memory.metadata.entities;
      for (const tech of entities.technologies) {
        if (queryLower.includes(tech.toLowerCase())) score += 3;
      }
      for (const decision of entities.decisions) {
        if (queryLower.includes(decision.toLowerCase())) score += 3;
      }

      if (score > 0) {
        results.push({ memory, score });
      }
    }

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((r) => r.memory);
  }

  getRecent(limit = 20): EchoMemory[] {
    const all = Array.from(this.memories.values());
    return all
      .sort((a, b) => new Date(b.metadata.timestamp).getTime() - new Date(a.metadata.timestamp).getTime())
      .slice(0, limit);
  }

  getAllMemories(): EchoMemory[] {
    return Array.from(this.memories.values());
  }

  getByFilters(filters: MemoryFilter, limit = 20, offset = 0): { memories: EchoMemory[]; total: number } {
    let results = Array.from(this.memories.values());

    results = results.filter((m) => this.matchesFilters(m, filters));
    results.sort((a, b) => new Date(b.metadata.timestamp).getTime() - new Date(a.metadata.timestamp).getTime());

    const total = results.length;
    return {
      memories: results.slice(offset, offset + limit),
      total,
    };
  }

  private matchesFilters(memory: EchoMemory, filters?: MemoryFilter): boolean {
    if (!filters) return true;
    if (filters.author && memory.metadata.author.toLowerCase() !== filters.author.toLowerCase()) return false;
    if (filters.channel && memory.metadata.channel.toLowerCase() !== filters.channel.toLowerCase()) return false;
    if (filters.memoryType && memory.metadata.memoryType !== filters.memoryType) return false;
    return true;
  }

  private persist(): void {
    try {
      if (!existsSync(DATA_DIR)) {
        mkdirSync(DATA_DIR, { recursive: true });
      }
      const data = Array.from(this.memories.entries());
      writeFileSync(PERSISTENCE_PATH, JSON.stringify(data, null, 2), 'utf-8');
      logger.debug('Memories persisted to disk', { count: data.length });
    } catch (err) {
      logger.error('Failed to persist memories', { error: String(err) });
    }
  }

  private load(): void {
    try {
      if (existsSync(PERSISTENCE_PATH)) {
        const raw = readFileSync(PERSISTENCE_PATH, 'utf-8');
        const entries = JSON.parse(raw) as Array<[string, EchoMemory]>;
        for (const [key, value] of entries) {
          this.memories.set(key, value);
        }
        logger.info('Loaded memories from disk', { count: entries.length });
      }
    } catch (err) {
      logger.warn('Failed to load memories from disk, starting fresh', { error: String(err) });
    }
  }
}
