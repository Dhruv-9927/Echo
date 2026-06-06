// ──────────────────────────────────────────────
// ECHO — Message Ingestion Pipeline
// ──────────────────────────────────────────────

import { randomUUID } from 'node:crypto';
import type { EchoMemory, Platform, MemoryAddedEvent } from '@echo/types';
import { logger } from '@echo/types';
import { EchoMemoryClient } from '@echo/memory';
import { KnowledgeGraph } from '@echo/graph';
import { EntityExtractor } from '@echo/agent';

export interface IncomingMessage {
  text: string;
  author: string;
  channel: string;
  platform: Platform;
  participants?: string[];
  timestamp?: string;
}

export class IngestionPipeline {
  private memory: EchoMemoryClient;
  private graph: KnowledgeGraph;
  private extractor: EntityExtractor;
  private onMemoryAdded?: (memory: EchoMemory, graphDelta: MemoryAddedEvent['graphDelta']) => void;
  private onGraphPulse?: (nodeId: string) => void;
  private batch: IncomingMessage[] = [];
  private batchTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    memory: EchoMemoryClient,
    graph: KnowledgeGraph,
    extractor: EntityExtractor,
    options?: {
      onMemoryAdded?: (memory: EchoMemory, graphDelta: MemoryAddedEvent['graphDelta']) => void;
      onGraphPulse?: (nodeId: string) => void;
    }
  ) {
    this.memory = memory;
    this.graph = graph;
    this.extractor = extractor;
    this.onMemoryAdded = options?.onMemoryAdded;
    this.onGraphPulse = options?.onGraphPulse;
  }

  async ingest(message: IncomingMessage): Promise<EchoMemory> {
    logger.debug('Ingesting message', { author: message.author, channel: message.channel });

    // Extract entities via Groq
    const entities = await this.extractor.extractEntities(message.text);

    // Build EchoMemory
    const memory: EchoMemory = {
      id: randomUUID(),
      content: message.text,
      metadata: {
        platform: message.platform,
        channel: message.channel,
        author: message.author,
        participants: message.participants ?? [],
        entities: {
          technologies: entities.technologies,
          decisions: entities.decisions,
          people: entities.people,
        },
        memoryType: entities.memoryType,
        timestamp: message.timestamp ?? new Date().toISOString(),
        decayScore: 1.0,
      },
    };

    // Store memory
    await this.memory.store(memory);

    // Update knowledge graph
    const graphDelta = this.graph.addMemory(memory);

    // Broadcast events
    if (this.onMemoryAdded) {
      this.onMemoryAdded(memory, graphDelta);
    }

    // Pulse the author node
    if (this.onGraphPulse) {
      const authorSlug = message.author.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      this.onGraphPulse(`person:${authorSlug}`);
    }

    logger.info('Message ingested', {
      id: memory.id,
      author: message.author,
      type: entities.memoryType,
      techs: entities.technologies.length,
      decisions: entities.decisions.length,
    });

    return memory;
  }

  addToBatch(message: IncomingMessage): void {
    this.batch.push(message);
  }

  startBatchProcessing(intervalMs = 30_000): void {
    if (this.batchTimer) return;

    this.batchTimer = setInterval(async () => {
      if (this.batch.length === 0) return;

      const messages = [...this.batch];
      this.batch = [];

      logger.info('Processing message batch', { count: messages.length });

      for (const msg of messages) {
        try {
          await this.ingest(msg);
        } catch (err) {
          logger.error('Batch ingestion failed for message', {
            author: msg.author,
            error: String(err),
          });
        }
      }
    }, intervalMs);

    logger.info('Batch processing started', { intervalMs });
  }

  stopBatchProcessing(): void {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
      this.batchTimer = null;
    }
  }
}
