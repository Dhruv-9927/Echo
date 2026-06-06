export const logger = {
  info: (msg: string, meta?: Record<string, unknown>) =>
    console.log(JSON.stringify({ level: 'info', msg, ...meta, ts: Date.now() })),

  error: (msg: string, meta?: Record<string, unknown>) =>
    console.error(JSON.stringify({ level: 'error', msg, ...meta, ts: Date.now() })),

  warn: (msg: string, meta?: Record<string, unknown>) =>
    console.warn(JSON.stringify({ level: 'warn', msg, ...meta, ts: Date.now() })),

  debug: (msg: string, meta?: Record<string, unknown>) => {
    if (process.env.DEBUG === 'true') {
      console.log(JSON.stringify({ level: 'debug', msg, ...meta, ts: Date.now() }));
    }
  },
};
