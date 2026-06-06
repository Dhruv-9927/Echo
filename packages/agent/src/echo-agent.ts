// ──────────────────────────────────────────────
// ECHO — Groq LLM Agent
// ──────────────────────────────────────────────

import Groq from 'groq-sdk';
import type { ChatCompletionMessageParam, ChatCompletionTool } from 'groq-sdk/resources/chat/completions';
import type { AskResponse, EchoMemory } from '@echo/types';
import { logger } from '@echo/types';
import { EchoMemoryClient } from '@echo/memory';
import { KnowledgeGraph } from '@echo/graph';
import { ECHO_SYSTEM_PROMPT } from './prompts/echo-system.js';

const MAX_RETRIES = 3;
const RETRY_BASE_MS = 1000;

const TOOLS: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'recall_memory',
      description:
        'Search the team\'s collective memory for relevant information about a topic, decision, or conversation.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The search query to find relevant memories',
          },
          limit: {
            type: 'number',
            description: 'Maximum number of results to return (default: 5)',
          },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'find_expert',
      description:
        'Find team members who are experts on a specific topic, ranked by evidence from team memories.',
      parameters: {
        type: 'object',
        properties: {
          topic: {
            type: 'string',
            description: 'The topic or technology to find experts for',
          },
        },
        required: ['topic'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_decision_history',
      description:
        'Retrieve the history of decisions made about a specific topic or technology.',
      parameters: {
        type: 'object',
        properties: {
          topic: {
            type: 'string',
            description: 'The topic to get decision history for',
          },
        },
        required: ['topic'],
      },
    },
  },
];

export class EchoAgent {
  private groq: Groq;
  private model: string;
  private fallbackModel: string;
  private memory: EchoMemoryClient;
  private graph: KnowledgeGraph;

  constructor(memory: EchoMemoryClient, graph: KnowledgeGraph) {
    this.groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
    this.model = process.env.GROQ_MODEL ?? 'qwen/qwen3-32b';
    this.fallbackModel = 'llama-3.3-70b-versatile';
    this.memory = memory;
    this.graph = graph;
  }

  async ask(query: string): Promise<AskResponse> {
    try {
      return await this.askWithTools(query);
    } catch (err) {
      logger.warn('Function calling failed, falling back to simple prompt', {
        error: String(err),
      });
      return await this.askSimple(query);
    }
  }

  private async askWithTools(query: string): Promise<AskResponse> {
    const messages: ChatCompletionMessageParam[] = [
      { role: 'system', content: ECHO_SYSTEM_PROMPT },
      { role: 'user', content: query },
    ];

    const allSources: EchoMemory[] = [];

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const completion = await this.groq.chat.completions.create({
          model: this.model,
          messages,
          tools: TOOLS,
          tool_choice: 'auto',
          temperature: 0.3,
          max_tokens: 2000,
        });

        const choice = completion.choices[0];
        if (!choice) throw new Error('No completion choice returned');

        const message = choice.message;

        // If no tool calls, we have a final answer
        if (!message.tool_calls || message.tool_calls.length === 0) {
          const answer = message.content ?? "I don't have a memory of that yet.";
          // Clean thinking tags
          const cleanAnswer = answer.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
          return {
            answer: cleanAnswer,
            sources: allSources,
            confidence: allSources.length > 0 ? Math.min(0.95, 0.5 + allSources.length * 0.1) : 0.3,
          };
        }

        // Process tool calls
        messages.push({
          role: 'assistant',
          content: message.content,
          tool_calls: message.tool_calls,
        });

        for (const toolCall of message.tool_calls) {
          const result = await this.executeToolCall(
            toolCall.function.name,
            toolCall.function.arguments,
            allSources
          );

          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: result,
          });
        }

        // Get final response after tool calls
        const finalCompletion = await this.groq.chat.completions.create({
          model: this.model,
          messages,
          temperature: 0.3,
          max_tokens: 2000,
        });

        const finalAnswer =
          finalCompletion.choices[0]?.message?.content ?? "I don't have a memory of that yet.";
        const cleanFinal = finalAnswer.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

        return {
          answer: cleanFinal,
          sources: allSources,
          confidence: allSources.length > 0 ? Math.min(0.95, 0.5 + allSources.length * 0.1) : 0.3,
        };
      } catch (err) {
        logger.warn('Agent ask attempt failed', { attempt, error: String(err) });
        if (attempt < MAX_RETRIES) {
          const delayMs = RETRY_BASE_MS * Math.pow(2, attempt - 1);
          await this.sleep(delayMs);
          // Try fallback model on subsequent attempts
          if (attempt === 2) {
            logger.info('Switching to fallback model', { model: this.fallbackModel });
            this.model = this.fallbackModel;
          }
        } else {
          throw err;
        }
      }
    }

    // Should not reach here, but TypeScript needs a return
    return {
      answer: "I encountered an error processing your question. Please try again.",
      sources: [],
      confidence: 0,
    };
  }

  private async askSimple(query: string): Promise<AskResponse> {
    // Gather context without tool calling
    const memories = await this.memory.recall(query, undefined, 10);
    const experts = this.graph.findExperts(query);

    const contextParts: string[] = [];
    if (memories.length > 0) {
      contextParts.push('## Relevant Memories\n');
      for (const m of memories) {
        contextParts.push(
          `- **${m.metadata.author}** in #${m.metadata.channel} (${m.metadata.timestamp}): ${m.content}`
        );
      }
    }
    if (experts.length > 0) {
      contextParts.push('\n## Team Experts\n');
      for (const e of experts.slice(0, 5)) {
        contextParts.push(
          `- **${e.name}** — ${e.evidenceCount} related memories, expertise score: ${e.expertiseScore}`
        );
      }
    }

    const prompt = `${ECHO_SYSTEM_PROMPT}\n\n## Context\n${contextParts.join('\n')}\n\n## Question\n${query}`;

    try {
      const completion = await this.groq.chat.completions.create({
        model: this.fallbackModel,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 2000,
      });

      const answer = completion.choices[0]?.message?.content ?? "I don't have a memory of that yet.";
      const cleanAnswer = answer.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

      return {
        answer: cleanAnswer,
        sources: memories,
        confidence: memories.length > 0 ? Math.min(0.9, 0.4 + memories.length * 0.1) : 0.2,
      };
    } catch (err) {
      logger.error('Simple ask also failed', { error: String(err) });
      return {
        answer: "I'm having trouble connecting to my thinking engine right now. Please try again in a moment.",
        sources: [],
        confidence: 0,
      };
    }
  }

  private async executeToolCall(
    name: string,
    argsJson: string,
    allSources: EchoMemory[]
  ): Promise<string> {
    try {
      const args = JSON.parse(argsJson) as Record<string, unknown>;

      switch (name) {
        case 'recall_memory': {
          const query = String(args.query ?? '');
          const limit = typeof args.limit === 'number' ? args.limit : 5;
          const memories = await this.memory.recall(query, undefined, limit);
          allSources.push(...memories);
          return JSON.stringify(
            memories.map((m) => ({
              author: m.metadata.author,
              channel: m.metadata.channel,
              timestamp: m.metadata.timestamp,
              content: m.content,
              type: m.metadata.memoryType,
            }))
          );
        }

        case 'find_expert': {
          const topic = String(args.topic ?? '');
          const experts = this.graph.findExperts(topic);
          // Also add expert memories to sources
          for (const expert of experts.slice(0, 3)) {
            allSources.push(...expert.topMemories);
          }
          return JSON.stringify(
            experts.map((e) => ({
              name: e.name,
              handle: e.handle,
              evidenceCount: e.evidenceCount,
              expertiseScore: e.expertiseScore,
              domains: e.domains,
            }))
          );
        }

        case 'get_decision_history': {
          const topic = String(args.topic ?? '');
          const memories = await this.memory.recall(topic, { memoryType: 'decision' }, 10);
          allSources.push(...memories);
          return JSON.stringify(
            memories.map((m) => ({
              author: m.metadata.author,
              channel: m.metadata.channel,
              timestamp: m.metadata.timestamp,
              content: m.content,
              decisions: m.metadata.entities.decisions,
            }))
          );
        }

        default:
          return JSON.stringify({ error: `Unknown tool: ${name}` });
      }
    } catch (err) {
      logger.error('Tool call execution failed', { tool: name, error: String(err) });
      return JSON.stringify({ error: `Tool execution failed: ${String(err)}` });
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
