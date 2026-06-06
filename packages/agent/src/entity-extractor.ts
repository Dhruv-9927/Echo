// ──────────────────────────────────────────────
// ECHO — Entity Extractor (Groq-powered)
// ──────────────────────────────────────────────

import Groq from 'groq-sdk';
import type { ExtractedEntities, MemoryType } from '@echo/types';
import { logger } from '@echo/types';
import { ENTITY_EXTRACTION_PROMPT } from './prompts/echo-system.js';

const MAX_RETRIES = 3;
const RETRY_BASE_MS = 500;

const VALID_MEMORY_TYPES: MemoryType[] = [
  'decision',
  'expertise',
  'problem',
  'solution',
  'preference',
  'factoid',
];

function isValidMemoryType(value: string): value is MemoryType {
  return VALID_MEMORY_TYPES.includes(value as MemoryType);
}

export class EntityExtractor {
  private groq: Groq;
  private model: string;

  constructor(groq: Groq, model: string) {
    this.groq = groq;
    this.model = model;
  }

  async extractEntities(message: string): Promise<ExtractedEntities> {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const completion = await this.groq.chat.completions.create({
          model: this.model,
          messages: [
            {
              role: 'user',
              content: `${ENTITY_EXTRACTION_PROMPT}\n\n${message}`,
            },
          ],
          temperature: 0.1,
          max_tokens: 500,
          response_format: { type: 'json_object' },
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) {
          throw new Error('Empty response from Groq');
        }

        // Clean content - handle thinking tags
        const cleaned = content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

        const parsed = JSON.parse(cleaned) as Record<string, unknown>;
        return this.validateEntities(parsed);
      } catch (err) {
        logger.warn('Entity extraction attempt failed', {
          attempt,
          error: String(err),
        });

        if (attempt < MAX_RETRIES) {
          const delayMs = RETRY_BASE_MS * Math.pow(2, attempt - 1);
          await this.sleep(delayMs);
        }
      }
    }

    // Fallback: return empty entities
    logger.warn('Entity extraction failed after all retries, using empty fallback');
    return {
      people: [],
      technologies: [],
      decisions: [],
      memoryType: 'factoid',
    };
  }

  private validateEntities(raw: Record<string, unknown>): ExtractedEntities {
    const people = Array.isArray(raw.people)
      ? (raw.people as unknown[]).filter((p): p is string => typeof p === 'string')
      : [];

    const technologies = Array.isArray(raw.technologies)
      ? (raw.technologies as unknown[]).filter((t): t is string => typeof t === 'string')
      : [];

    const decisions = Array.isArray(raw.decisions)
      ? (raw.decisions as unknown[]).filter((d): d is string => typeof d === 'string')
      : [];

    const rawType = typeof raw.memoryType === 'string' ? raw.memoryType : 'factoid';
    const memoryType: MemoryType = isValidMemoryType(rawType) ? rawType : 'factoid';

    return { people, technologies, decisions, memoryType };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
