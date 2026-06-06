import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export function useWebSocket(onEvent: (event: string, data: any) => void) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Connect to websocket
    socketRef.current = io('/');
    
    socketRef.current.on('memory:added', (data) => onEvent('memory:added', data));
    socketRef.current.on('graph:pulse', (data) => onEvent('graph:pulse', data));
    socketRef.current.on('node:decay', (data) => onEvent('node:decay', data));

    return () => {
      socketRef.current?.disconnect();
    };
  }, [onEvent]);

  return socketRef.current;
}
