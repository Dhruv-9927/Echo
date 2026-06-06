// ──────────────────────────────────────────────
// ECHO — Express + Socket.io Server
// ──────────────────────────────────────────────

import express from 'express';
import { createServer } from 'node:http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import type { EchoMemory, MemoryAddedEvent, GraphPulseEvent } from '@echo/types';
import { logger } from '@echo/types';
import { EchoMemoryClient } from '@echo/memory';
import { KnowledgeGraph } from '@echo/graph';
import { EchoAgent } from '@echo/agent';

import { healthRouter } from './routes/health.js';
import { createGraphRouter } from './routes/graph.js';
import { createMemoriesRouter } from './routes/memories.js';
import { createExpertsRouter } from './routes/experts.js';
import { createTimelineRouter } from './routes/timeline.js';
import { createAskRouter } from './routes/ask.js';

export interface EchoServices {
  memory: EchoMemoryClient;
  graph: KnowledgeGraph;
  agent: EchoAgent;
  io: SocketIOServer;
  emitMemoryAdded: (memory: EchoMemory, graphDelta: MemoryAddedEvent['graphDelta']) => void;
  emitGraphPulse: (nodeId: string) => void;
}

export async function createEchoServer(): Promise<{
  start: (port: number) => void;
  services: EchoServices;
}> {
  // ── Initialize services ─────────────────────
  const memory = new EchoMemoryClient();
  await memory.initialize();

  const graph = new KnowledgeGraph();
  graph.calculateDecay();

  const agent = new EchoAgent(memory, graph);

  // ── Express app ─────────────────────────────
  const app = express();
  app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  }));
  app.use(express.json());

  // ── Routes ──────────────────────────────────
  app.use('/api', healthRouter);
  app.use('/api', createGraphRouter(graph));
  app.use('/api', createMemoriesRouter(memory));
  app.use('/api', createExpertsRouter(graph, memory));
  app.use('/api', createTimelineRouter(memory));
  app.use('/api', createAskRouter(agent));

  // ── Webhooks (from Slack Bot) ──────────────────
  app.post('/api/webhook/ingest', (req, res) => {
    const { memory: mem, graphDelta } = req.body;
    if (!mem) {
      res.sendStatus(400);
      return;
    }
    
    // Update API's local state
    memory.store(mem);
    graph.addMemory(mem);
    
    // Broadcast to UI
    emitMemoryAdded(mem, graphDelta);
    res.sendStatus(200);
  });

  app.post('/api/webhook/pulse', (req, res) => {
    const { nodeId } = req.body;
    if (!nodeId) {
      res.sendStatus(400);
      return;
    }
    emitGraphPulse(nodeId);
    res.sendStatus(200);
  });

  // ── HTTP + Socket.io ────────────────────────
  const httpServer = createServer(app);
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:3001'],
      methods: ['GET', 'POST'],
    },
  });

  // Socket.io connection handler
  io.on('connection', (socket) => {
    logger.info('WebSocket client connected', { id: socket.id });

    // Send current graph state on connection
    socket.emit('graph:state', graph.getGraph());

    socket.on('disconnect', () => {
      logger.debug('WebSocket client disconnected', { id: socket.id });
    });
  });

  // ── Broadcast functions ─────────────────────
  function emitMemoryAdded(
    mem: EchoMemory,
    graphDelta: MemoryAddedEvent['graphDelta']
  ): void {
    const event: MemoryAddedEvent = { memory: mem, graphDelta };
    io.emit('memory:added', event);
    logger.debug('Emitted memory:added event', { memoryId: mem.id });
  }

  function emitGraphPulse(nodeId: string): void {
    const event: GraphPulseEvent = { nodeId };
    io.emit('graph:pulse', event);
  }

  const services: EchoServices = {
    memory,
    graph,
    agent,
    io,
    emitMemoryAdded,
    emitGraphPulse,
  };

  // ── Periodic decay recalculation ────────────
  setInterval(() => {
    graph.calculateDecay();
    io.emit('node:decay', graph.getGraph());
  }, 5 * 60 * 1000); // Every 5 minutes

  return {
    start: (port: number) => {
      httpServer.listen(port, () => {
        logger.info('ECHO API server started', { port, url: `http://localhost:${port}` });
      });
    },
    services,
  };
}
