// ──────────────────────────────────────────────
// ECHO — Knowledge Graph Engine
// ──────────────────────────────────────────────

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type {
  EchoMemory,
  GraphNode,
  GraphEdge,
  KnowledgeGraphData,
  Expert,
  NodeType,
  RelationshipType,
} from '@echo/types';
import { logger } from '@echo/types';
import { calculateDecayScore, slugify } from './decay.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, '..', '..', '..', 'data');
const GRAPH_PATH = resolve(DATA_DIR, 'graph.json');

interface GraphDelta {
  newNodes: GraphNode[];
  newEdges: GraphEdge[];
  updatedNodes: GraphNode[];
}

export class KnowledgeGraph {
  private nodes: Map<string, GraphNode> = new Map();
  private edges: Map<string, GraphEdge> = new Map();
  private nodeMemories: Map<string, EchoMemory[]> = new Map();

  constructor() {
    this.load();
  }

  addMemory(memory: EchoMemory): GraphDelta {
    const delta: GraphDelta = {
      newNodes: [],
      newEdges: [],
      updatedNodes: [],
    };

    const now = memory.metadata.timestamp;
    const { author, participants, entities } = memory.metadata;

    // Create/update person node for the author
    const authorNode = this.upsertNode(
      `person:${slugify(author)}`,
      author,
      'person',
      now,
      delta
    );
    this.addMemoryToNode(authorNode.id, memory);

    // Create/update person nodes for participants
    for (const participant of participants) {
      if (participant.toLowerCase() === author.toLowerCase()) continue;
      const participantNode = this.upsertNode(
        `person:${slugify(participant)}`,
        participant,
        'person',
        now,
        delta
      );
      this.addMemoryToNode(participantNode.id, memory);

      // Edge: author collaborated_with participant
      this.upsertEdge(authorNode.id, participantNode.id, 'collaborated_with', delta);
    }

    // Create/update concept nodes for technologies
    for (const tech of entities.technologies) {
      const conceptNode = this.upsertNode(
        `concept:${slugify(tech)}`,
        tech,
        'concept',
        now,
        delta
      );

      // Edge: person knows concept
      this.upsertEdge(authorNode.id, conceptNode.id, 'knows', delta);

      // Add technology to author's expertise topics
      const personNode = this.nodes.get(authorNode.id);
      if (personNode) {
        if (!personNode.expertiseTopics) personNode.expertiseTopics = [];
        if (!personNode.expertiseTopics.includes(tech.toLowerCase())) {
          personNode.expertiseTopics.push(tech.toLowerCase());
        }
      }
    }

    // Create edges between technologies (related_to)
    for (let i = 0; i < entities.technologies.length; i++) {
      for (let j = i + 1; j < entities.technologies.length; j++) {
        const srcId = `concept:${slugify(entities.technologies[i])}`;
        const tgtId = `concept:${slugify(entities.technologies[j])}`;
        this.upsertEdge(srcId, tgtId, 'related_to', delta);
      }
    }

    // Create decision nodes
    for (const decision of entities.decisions) {
      const decisionNode = this.upsertNode(
        `decision:${slugify(decision)}`,
        decision,
        'decision',
        now,
        delta
      );
      this.addMemoryToNode(decisionNode.id, memory);

      // Edge: person decided decision
      this.upsertEdge(authorNode.id, decisionNode.id, 'decided', delta);

      // Edge: decision related_to each technology
      for (const tech of entities.technologies) {
        const conceptId = `concept:${slugify(tech)}`;
        this.upsertEdge(decisionNode.id, conceptId, 'related_to', delta);
      }
    }

    this.save();
    return delta;
  }

  getGraph(): KnowledgeGraphData {
    return {
      nodes: Array.from(this.nodes.values()),
      edges: Array.from(this.edges.values()),
    };
  }

  findExperts(topic: string): Expert[] {
    const topicLower = topic.toLowerCase();
    const experts: Expert[] = [];

    for (const node of this.nodes.values()) {
      if (node.type !== 'person') continue;

      const memories = this.nodeMemories.get(node.id) ?? [];
      const relevantMemories = memories.filter((m) => {
        const content = m.content.toLowerCase();
        const techs = m.metadata.entities.technologies.map((t) => t.toLowerCase());
        const decisions = m.metadata.entities.decisions.map((d) => d.toLowerCase());
        return (
          content.includes(topicLower) ||
          techs.some((t) => t.includes(topicLower) || topicLower.includes(t)) ||
          decisions.some((d) => d.includes(topicLower) || topicLower.includes(d))
        );
      });

      if (relevantMemories.length === 0) continue;

      // Compute expertise score based on mentions, decay, and direct edges
      const edgeWeight = this.getEdgeWeightForTopic(node.id, topicLower);
      const expertiseScore = relevantMemories.length * 0.6 + edgeWeight * 0.4;

      // Collect domains from expertise topics
      const domains = node.expertiseTopics ?? [];

      experts.push({
        name: node.label,
        handle: node.id.replace('person:', ''),
        evidenceCount: relevantMemories.length,
        topMemories: relevantMemories.slice(0, 5),
        expertiseScore: Math.round(expertiseScore * 100) / 100,
        domains,
      });
    }

    return experts.sort((a, b) => b.expertiseScore - a.expertiseScore);
  }

  getNode(id: string): GraphNode | undefined {
    return this.nodes.get(id);
  }

  calculateDecay(): void {
    for (const node of this.nodes.values()) {
      node.decayScore = calculateDecayScore(node.lastSeen);
    }
    this.save();
    logger.debug('Decay scores recalculated', { nodeCount: this.nodes.size });
  }

  save(): void {
    try {
      if (!existsSync(DATA_DIR)) {
        mkdirSync(DATA_DIR, { recursive: true });
      }

      const data = {
        nodes: Array.from(this.nodes.entries()),
        edges: Array.from(this.edges.entries()),
        nodeMemories: Array.from(this.nodeMemories.entries()).map(([id, mems]) => [
          id,
          mems,
        ]),
      };

      writeFileSync(GRAPH_PATH, JSON.stringify(data, null, 2), 'utf-8');
      logger.debug('Graph saved to disk', {
        nodes: this.nodes.size,
        edges: this.edges.size,
      });
    } catch (err) {
      logger.error('Failed to save graph', { error: String(err) });
    }
  }

  load(): void {
    try {
      if (existsSync(GRAPH_PATH)) {
        const raw = readFileSync(GRAPH_PATH, 'utf-8');
        const data = JSON.parse(raw) as {
          nodes: Array<[string, GraphNode]>;
          edges: Array<[string, GraphEdge]>;
          nodeMemories?: Array<[string, string[]]>;
        };

        for (const [key, value] of data.nodes) {
          this.nodes.set(key, value);
        }
        for (const [key, value] of data.edges) {
          this.edges.set(key, value);
        }
        if (data.nodeMemories) {
          for (const [key, mems] of data.nodeMemories) {
            this.nodeMemories.set(key, mems as any);
          }
        }

        logger.info('Graph loaded from disk', {
          nodes: this.nodes.size,
          edges: this.edges.size,
        });
      }
    } catch (err) {
      logger.warn('Failed to load graph from disk, starting fresh', { error: String(err) });
    }
  }

  // ── Private helpers ───────────────────────────

  private upsertNode(
    id: string,
    label: string,
    type: NodeType,
    lastSeen: string,
    delta: GraphDelta
  ): GraphNode {
    const existing = this.nodes.get(id);
    if (existing) {
      existing.mentionCount += 1;
      existing.lastSeen = lastSeen;
      existing.decayScore = calculateDecayScore(lastSeen);
      if (existing.memoryCount !== undefined) {
        existing.memoryCount += 1;
      }
      if (!delta.updatedNodes.find((n) => n.id === id)) {
        delta.updatedNodes.push(existing);
      }
      return existing;
    }

    const node: GraphNode = {
      id,
      label,
      type,
      mentionCount: 1,
      lastSeen,
      decayScore: calculateDecayScore(lastSeen),
      expertiseTopics: type === 'person' ? [] : undefined,
      memoryCount: 1,
    };

    this.nodes.set(id, node);
    delta.newNodes.push(node);
    return node;
  }

  private upsertEdge(
    source: string,
    target: string,
    relationship: RelationshipType,
    delta: GraphDelta
  ): GraphEdge {
    const id = `${source}--${relationship}--${target}`;
    const existing = this.edges.get(id);
    if (existing) {
      existing.weight += 1;
      return existing;
    }

    const edge: GraphEdge = { id, source, target, relationship, weight: 1 };
    this.edges.set(id, edge);
    delta.newEdges.push(edge);
    return edge;
  }

  private addMemoryToNode(nodeId: string, memory: EchoMemory): void {
    const existing = this.nodeMemories.get(nodeId) ?? [];
    // Avoid duplicates
    if (!existing.find((m) => m.id === memory.id)) {
      existing.push(memory);
      this.nodeMemories.set(nodeId, existing);
    }
  }

  private getEdgeWeightForTopic(personId: string, topicLower: string): number {
    let totalWeight = 0;

    for (const edge of this.edges.values()) {
      if (edge.source !== personId) continue;
      const targetNode = this.nodes.get(edge.target);
      if (!targetNode) continue;
      if (targetNode.label.toLowerCase().includes(topicLower) || topicLower.includes(targetNode.label.toLowerCase())) {
        totalWeight += edge.weight;
      }
    }

    return totalWeight;
  }
}
