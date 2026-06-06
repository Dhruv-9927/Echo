import type { KnowledgeGraphData, Memory, Expert, AskResponse } from '../types';

const MOCK_NODES = [
  { id: 'person:arun', label: 'Arun', type: 'person', mentionCount: 15, lastSeen: new Date().toISOString(), decayScore: 1 },
  { id: 'person:sarah', label: 'Sarah', type: 'person', mentionCount: 12, lastSeen: new Date().toISOString(), decayScore: 0.9 },
  { id: 'person:priya', label: 'Priya', type: 'person', mentionCount: 10, lastSeen: new Date().toISOString(), decayScore: 0.8 },
  { id: 'person:dev', label: 'Dev', type: 'person', mentionCount: 8, lastSeen: new Date().toISOString(), decayScore: 0.7 },
  { id: 'person:maya', label: 'Maya', type: 'person', mentionCount: 5, lastSeen: new Date(Date.now() - 20 * 86400000).toISOString(), decayScore: 0.3 },
  { id: 'concept:postgres', label: 'Postgres', type: 'concept', mentionCount: 20, lastSeen: new Date().toISOString(), decayScore: 1 },
  { id: 'concept:mysql', label: 'MySQL', type: 'concept', mentionCount: 4, lastSeen: new Date(Date.now() - 25 * 86400000).toISOString(), decayScore: 0.1 },
  { id: 'decision:db-choice', label: 'DB Choice', type: 'decision', mentionCount: 8, lastSeen: new Date().toISOString(), decayScore: 0.9 },
  { id: 'concept:redis', label: 'Redis', type: 'concept', mentionCount: 18, lastSeen: new Date().toISOString(), decayScore: 0.95 },
  { id: 'problem:auth-incident', label: 'Auth Incident', type: 'problem', mentionCount: 6, lastSeen: new Date().toISOString(), decayScore: 0.8 },
  { id: 'solution:jwt-refresh', label: 'JWT Refresh', type: 'solution', mentionCount: 7, lastSeen: new Date().toISOString(), decayScore: 0.85 },
  { id: 'concept:redux', label: 'Redux', type: 'concept', mentionCount: 14, lastSeen: new Date(Date.now() - 15 * 86400000).toISOString(), decayScore: 0.5 },
  { id: 'concept:zustand', label: 'Zustand', type: 'concept', mentionCount: 19, lastSeen: new Date().toISOString(), decayScore: 1 },
  { id: 'decision:state-mgmt', label: 'State Mgmt', type: 'decision', mentionCount: 9, lastSeen: new Date().toISOString(), decayScore: 0.9 },
  { id: 'concept:k8s', label: 'Kubernetes', type: 'concept', mentionCount: 11, lastSeen: new Date().toISOString(), decayScore: 0.8 }
] as any;

const MOCK_EDGES = [
  { id: 'person:arun--knows--concept:postgres', source: 'person:arun', target: 'concept:postgres', relationship: 'knows', weight: 5 },
  { id: 'person:sarah--knows--concept:redis', source: 'person:sarah', target: 'concept:redis', relationship: 'knows', weight: 8 },
  { id: 'person:priya--knows--concept:zustand', source: 'person:priya', target: 'concept:zustand', relationship: 'knows', weight: 6 },
  { id: 'person:arun--decided--decision:db-choice', source: 'person:arun', target: 'decision:db-choice', relationship: 'decided', weight: 3 },
  { id: 'decision:db-choice--related_to--concept:postgres', source: 'decision:db-choice', target: 'concept:postgres', relationship: 'related_to', weight: 4 },
  { id: 'decision:db-choice--related_to--concept:mysql', source: 'decision:db-choice', target: 'concept:mysql', relationship: 'related_to', weight: 2 },
  { id: 'person:dev--problem--problem:auth-incident', source: 'person:dev', target: 'problem:auth-incident', relationship: 'related_to', weight: 4 },
  { id: 'problem:auth-incident--related_to--solution:jwt-refresh', source: 'problem:auth-incident', target: 'solution:jwt-refresh', relationship: 'related_to', weight: 5 },
  { id: 'person:maya--knows--concept:redux', source: 'person:maya', target: 'concept:redux', relationship: 'knows', weight: 4 },
  { id: 'person:priya--decided--decision:state-mgmt', source: 'person:priya', target: 'decision:state-mgmt', relationship: 'decided', weight: 3 },
  { id: 'decision:state-mgmt--related_to--concept:zustand', source: 'decision:state-mgmt', target: 'concept:zustand', relationship: 'related_to', weight: 5 },
  { id: 'decision:state-mgmt--related_to--concept:redux', source: 'decision:state-mgmt', target: 'concept:redux', relationship: 'related_to', weight: 2 },
  { id: 'person:arun--collaborated_with--person:sarah', source: 'person:arun', target: 'person:sarah', relationship: 'collaborated_with', weight: 10 },
  { id: 'person:priya--collaborated_with--person:maya', source: 'person:priya', target: 'person:maya', relationship: 'collaborated_with', weight: 6 },
  { id: 'person:sarah--knows--concept:k8s', source: 'person:sarah', target: 'concept:k8s', relationship: 'knows', weight: 7 }
] as any;

const MOCK_MEMORIES: Memory[] = [
  {
    id: 'm1',
    content: "We decided to use Postgres over MySQL because we need JSONB support for the user preferences schema.",
    platform: 'slack',
    channel: '#architecture',
    author: 'arun',
    participants: ['priya'],
    memoryType: 'decision',
    entities: { technologies: ['Postgres', 'MySQL'], decisions: ['database choice'], people: ['priya'] },
    timestamp: new Date().toISOString(),
    decayScore: 1
  },
  {
    id: 'm2',
    content: "Moving from Redux to Zustand. It's simpler and has less boilerplate.",
    platform: 'slack',
    channel: '#frontend',
    author: 'priya',
    participants: ['maya'],
    memoryType: 'decision',
    entities: { technologies: ['Redux', 'Zustand'], decisions: ['state management'], people: ['maya'] },
    timestamp: new Date(Date.now() - 5 * 86400000).toISOString(),
    decayScore: 0.9
  },
  {
    id: 'm3',
    content: "The auth service incident was caused by expired JWT tokens not refreshing properly.",
    platform: 'slack',
    channel: '#incidents',
    author: 'dev',
    participants: ['arun'],
    memoryType: 'problem',
    entities: { technologies: ['JWT'], decisions: [], people: ['arun'] },
    timestamp: new Date(Date.now() - 2 * 86400000).toISOString(),
    decayScore: 0.95
  }
];

const MOCK_EXPERTS: Expert[] = [
  {
    name: 'Sarah',
    handle: 'sarah',
    evidenceCount: 25,
    topMemories: [MOCK_MEMORIES[0]],
    expertiseScore: 95,
    domains: ['Redis', 'Kubernetes', 'Backend']
  },
  {
    name: 'Arun',
    handle: 'arun',
    evidenceCount: 22,
    topMemories: [MOCK_MEMORIES[0]],
    expertiseScore: 88,
    domains: ['Postgres', 'Architecture']
  }
];

export const api = {
  async getHealth() {
    return { data: { status: 'ok', ts: Date.now() } };
  },
  
  async getGraph(): Promise<{data: KnowledgeGraphData}> {
    try {
      const res = await fetch('/api/graph');
      if (!res.ok) throw new Error('API down');
      return await res.json();
    } catch {
      return { data: { nodes: MOCK_NODES, edges: MOCK_EDGES } };
    }
  },

  async getMemories(): Promise<{data: Memory[]}> {
    try {
      const res = await fetch('/api/memories');
      if (!res.ok) throw new Error('API down');
      const json = await res.json();
      // Map EchoMemory (nested metadata) to Memory (flat)
      json.data = json.data.map((m: any) => m.metadata ? { id: m.id, content: m.content, ...m.metadata } : m);
      return json;
    } catch {
      return { data: MOCK_MEMORIES };
    }
  },

  async getExperts(topic: string): Promise<{data: Expert[]}> {
    try {
      const res = await fetch(`/api/experts/${topic}`);
      if (!res.ok) throw new Error('API down');
      const json = await res.json();
      if (json.data) {
        json.data.forEach((expert: any) => {
          if (expert.topMemories) {
            expert.topMemories = expert.topMemories.map((m: any) => m.metadata ? { id: m.id, content: m.content, ...m.metadata } : m);
          }
        });
      }
      return json;
    } catch {
      return { data: MOCK_EXPERTS };
    }
  },

  async ask(query: string): Promise<{data: AskResponse}> {
    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      if (!res.ok) throw new Error('API down');
      const json = await res.json();
      if (json.data && json.data.sources) {
        json.data.sources = json.data.sources.map((m: any) => m.metadata ? { id: m.id, content: m.content, ...m.metadata } : m);
      }
      return json;
    } catch {
      return {
        data: {
          answer: `This is a mock answer for "${query}". The backend is currently unavailable, so I am answering from the local simulator. We decided to use Postgres because we needed JSONB.`,
          sources: MOCK_MEMORIES,
          confidence: 0.92
        }
      };
    }
  }
};
