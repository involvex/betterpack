const WebSocket = require('ws');

function createWebSocketServer(server) {
  const wss = new WebSocket.Server({ server });

  console.log('[WebSocket] Server created');

  wss.on('connection', (ws) => {
    console.log('[WebSocket] Client connected');

    ws.on('message', (message) => {
      console.log(`[WebSocket] Received: ${message}`);
      // Handle incoming messages from the client (e.g., user input)
      // For now, we'll just echo the message back
      ws.send(`Echo: ${message}`);
    });

    ws.on('close', () => {
      console.log('[WebSocket] Client disconnected');
    });

    ws.on('error', (error) => {
      console.error('[WebSocket] Error:', error);
    });
  });

  return {
    broadcast: (data) => {
      const message = JSON.stringify(data);
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    },
  };
}

module.exports = { createWebSocketServer };
