export type MemoryType = 'decision' | 'expertise' | 'problem' | 'solution' | 'preference' | 'factoid';
export type Platform = 'slack' | 'discord' | 'web';

export interface Memory {
  id: string;
  content: string;
  platform: Platform;
  channel: string;
  author: string;
  participants: string[];
  memoryType: MemoryType;
  entities: {
    technologies: string[];
    decisions: string[];
    people: string[];
  };
  timestamp: string;
  decayScore: number;
}

export interface GraphNode {
  id: string;
  label: string;
  type: 'person' | 'concept' | 'decision' | 'problem' | 'solution';
  mentionCount: number;
  lastSeen: string;
  decayScore: number;
  expertiseTopics?: string[];
  memoryCount?: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relationship: 'knows' | 'decided' | 'related_to' | 'collaborated_with';
  weight: number;
}

export interface KnowledgeGraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface Expert {
  name: string;
  handle: string;
  evidenceCount: number;
  topMemories: Memory[];
  expertiseScore: number;
  domains: string[];
}

export type ApiResponse<T> = {
  data: T;
  meta?: { total?: number; page?: number; };
  error?: never;
} | {
  data?: never;
  error: { code: string; message: string; };
};

export interface AskResponse {
  answer: string;
  sources: Memory[];
  confidence: number;
}

export interface MemoryAddedEvent {
  memory: Memory;
  graphDelta: {
    newNodes: GraphNode[];
    newEdges: GraphEdge[];
    updatedNodes: GraphNode[];
  };
}

export interface GraphPulseEvent {
  nodeId: string;
}
