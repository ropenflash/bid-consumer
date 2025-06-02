// backend/websocket.ts
import WebSocket from 'ws';
import http from 'http';

const server = http.createServer();
const wss = new WebSocket.Server({ server });

const clients = new Set<WebSocket>();

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log('🟢 Client connected');

  ws.on('close', () => {
    clients.delete(ws);
    console.log('🔴 Client disconnected');
  });
});

export const broadcastBid = (bid: any) => {
  const message = JSON.stringify({ type: 'bid', bid });

  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
};

export const startWebSocketServer = () => {
  const port = 3001; // Choose your port
  server.listen(port, () => {
    console.log(`🚀 WebSocket server running at ws://localhost:${port}`);
  });
};
