// ──────────────────────────────────────────────
// ECHO — Shared TypeScript Types
// ──────────────────────────────────────────────

export { logger } from './logger.js';

// ── Memory types ──────────────────────────────

export type MemoryType = 'decision' | 'expertise' | 'problem' | 'solution' | 'preference' | 'factoid';

export type Platform = 'slack' | 'discord' | 'web';

export interface MemoryMetadata {
  platform: Platform;
  channel: string;
  author: string;
  participants: string[];
  entities: {
    technologies: string[];
    decisions: string[];
    people: string[];
  };
  memoryType: MemoryType;
  timestamp: string;
  decayScore: number;
}

export interface EchoMemory {
  id: string;
  content: string;
  metadata: MemoryMetadata;
}

// ── Graph types ───────────────────────────────

export type NodeType = 'person' | 'concept' | 'decision' | 'problem' | 'solution';

export interface GraphNode {
  id: string;
  label: string;
  type: NodeType;
  mentionCount: number;
  lastSeen: string;
  decayScore: number;
  expertiseTopics?: string[];
  memoryCount?: number;
}

export type RelationshipType = 'knows' | 'decided' | 'related_to' | 'collaborated_with';

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relationship: RelationshipType;
  weight: number;
}

export interface KnowledgeGraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// ── Expert types ──────────────────────────────

export interface Expert {
  name: string;
  handle: string;
  evidenceCount: number;
  topMemories: EchoMemory[];
  expertiseScore: number;
  domains: string[];
}

// ── API types ─────────────────────────────────

export type ApiResponse<T> =
  | {
      data: T;
      meta?: { total?: number; page?: number };
      error?: never;
    }
  | {
      data?: never;
      error: { code: string; message: string };
    };

// ── Agent types ───────────────────────────────

export interface AskResponse {
  answer: string;
  sources: EchoMemory[];
  confidence: number;
}

// ── Entity extraction types ───────────────────

export interface ExtractedEntities {
  people: string[];
  technologies: string[];
  decisions: string[];
  memoryType: MemoryType;
}

// ── WebSocket event types ─────────────────────

export interface MemoryAddedEvent {
  memory: EchoMemory;
  graphDelta: {
    newNodes: GraphNode[];
    newEdges: GraphEdge[];
    updatedNodes: GraphNode[];
  };
}

export interface GraphPulseEvent {
  nodeId: string;
}
