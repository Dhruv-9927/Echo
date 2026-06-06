// ──────────────────────────────────────────────
// ECHO — Experts Route
// ──────────────────────────────────────────────

import { Router } from 'express';
import type { ApiResponse, Expert, EchoMemory } from '@echo/types';
import type { KnowledgeGraph } from '@echo/graph';
import type { EchoMemoryClient } from '@echo/memory';

export function createExpertsRouter(graph: KnowledgeGraph, memory: EchoMemoryClient): Router {
  const router = Router();

  router.get('/experts/:topic', (req, res) => {
    try {
      const topic = req.params.topic;
      const topicLower = topic.toLowerCase();
      const experts: Expert[] = [];

      // Get all memories from the store
      const allMemories = memory.getAllMemories();

      // Group memories by author and filter by topic relevance
      const authorMemories = new Map<string, EchoMemory[]>();

      for (const mem of allMemories) {
        const content = mem.content.toLowerCase();
        const techs = mem.metadata.entities?.technologies?.map(t => t.toLowerCase()) ?? [];
        const decisions = mem.metadata.entities?.decisions?.map(d => d.toLowerCase()) ?? [];

        const isRelevant =
          content.includes(topicLower) ||
          techs.some(t => t.includes(topicLower) || topicLower.includes(t)) ||
          decisions.some(d => d.includes(topicLower) || topicLower.includes(d));

        if (!isRelevant) continue;

        const author = mem.metadata.author;
        if (!authorMemories.has(author)) {
          authorMemories.set(author, []);
        }
        authorMemories.get(author)!.push(mem);
      }

      // Build expert entries
      for (const [author, relevantMemories] of authorMemories.entries()) {
        // Look up the person node in the graph for extra metadata
        const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const personNode = graph.getNode(`person:${slugify(author)}`);
        const domains = personNode?.expertiseTopics ?? [];

        // Compute expertise score
        const edgeWeight = relevantMemories.length; // Simple proxy
        const expertiseScore = relevantMemories.length * 0.6 + edgeWeight * 0.4;

        experts.push({
          name: author,
          handle: slugify(author),
          evidenceCount: relevantMemories.length,
          topMemories: relevantMemories.slice(0, 5),
          expertiseScore: Math.round(expertiseScore * 100) / 100,
          domains,
        });
      }

      experts.sort((a, b) => b.expertiseScore - a.expertiseScore);

      const response: ApiResponse<Expert[]> = { data: experts };
      res.json(response);
    } catch (err) {
      const response: ApiResponse<Expert[]> = {
        error: { code: 'EXPERTS_ERROR', message: String(err) },
      };
      res.status(500).json(response);
    }
  });

  return router;
}

