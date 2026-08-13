import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ClientInfo {
  ws: WebSocket;
  peerId: string;
  roomId: string;
  userName: string;
  isHost: boolean;
  avatar: string;
}

interface RoomState {
  id: string;
  hostPeerId: string;
  locked: boolean;
  clients: Map<string, {
    peerId: string;
    userName: string;
    isHost: boolean;
    avatar: string;
  }>;
}

const rooms = new Map<string, RoomState>();

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const PORT = 3000;

  app.use(express.json());

  // Healthcheck endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      app: 'Palorni Nexus',
      activeRooms: rooms.size,
      timestamp: new Date().toISOString()
    });
  });

  // WebSocket Signaling Server
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: WebSocket) => {
    let currentPeerId = '';
    let currentRoomId = '';

    ws.on('message', (data: string | Buffer) => {
      try {
        const msg = JSON.parse(data.toString());
        const { type, roomId, peerId, payload } = msg;

        switch (type) {
          case 'join': {
            const { userName, avatar } = payload || {};
            currentPeerId = peerId;
            currentRoomId = roomId;

            let room = rooms.get(roomId);
            if (!room) {
              room = {
                id: roomId,
                hostPeerId: peerId,
                locked: false,
                clients: new Map()
              };
              rooms.set(roomId, room);
            } else if (room.locked) {
              ws.send(JSON.stringify({
                type: 'error',
                payload: { message: 'A sala está bloqueada pelo HOST.' }
              }));
              return;
            }

            const isHost = room.hostPeerId === peerId;
            room.clients.set(peerId, { peerId, userName: userName || 'User', isHost, avatar: avatar || '' });

            // Store metadata on socket
            (ws as any).peerId = peerId;
            (ws as any).roomId = roomId;
            (ws as any).userName = userName;

            // Send joined response to applicant
            const clientsList = Array.from(room.clients.values());
            ws.send(JSON.stringify({
              type: 'joined',
              roomId,
              peerId,
              isHost,
              hostPeerId: room.hostPeerId,
              clients: clientsList
            }));

            // Broadcast room state / user joined to existing peers in room
            wss.clients.forEach((client) => {
              if (client !== ws && (client as any).roomId === roomId && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                  type: 'user_joined',
                  peerId,
                  userName,
                  isHost,
                  avatar,
                  clients: clientsList
                }));
              }
            });
            break;
          }

          case 'signal': {
            // Forward SDP offer/answer/ICE candidates to target peer
            const { targetPeerId, signal } = payload;
            wss.clients.forEach((client) => {
              if ((client as any).peerId === targetPeerId && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                  type: 'signal',
                  senderPeerId: peerId,
                  signal
                }));
              }
            });
            break;
          }

          case 'lock_room': {
            const room = rooms.get(roomId);
            if (room && room.hostPeerId === peerId) {
              room.locked = !!payload.locked;
              wss.clients.forEach((client) => {
                if ((client as any).roomId === roomId && client.readyState === WebSocket.OPEN) {
                  client.send(JSON.stringify({
                    type: 'room_locked',
                    locked: room.locked
                  }));
                }
              });
            }
            break;
          }

          case 'kick_user': {
            const room = rooms.get(roomId);
            if (room && room.hostPeerId === peerId) {
              const targetId = payload.targetPeerId;
              room.clients.delete(targetId);

              wss.clients.forEach((client) => {
                if ((client as any).peerId === targetId && client.readyState === WebSocket.OPEN) {
                  client.send(JSON.stringify({
                    type: 'kicked',
                    payload: { message: 'Você foi removido pelo HOST da sala.' }
                  }));
                } else if ((client as any).roomId === roomId && client.readyState === WebSocket.OPEN) {
                  client.send(JSON.stringify({
                    type: 'user_kicked',
                    peerId: targetId,
                    clients: Array.from(room.clients.values())
                  }));
                }
              });
            }
            break;
          }

          case 'transfer_host': {
            const room = rooms.get(roomId);
            if (room && room.hostPeerId === peerId) {
              const newHostId = payload.newHostPeerId;
              if (room.clients.has(newHostId)) {
                room.hostPeerId = newHostId;
                // update flags
                room.clients.forEach((c, pid) => {
                  c.isHost = pid === newHostId;
                });

                wss.clients.forEach((client) => {
                  if ((client as any).roomId === roomId && client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                      type: 'host_transferred',
                      newHostPeerId: newHostId,
                      clients: Array.from(room.clients.values())
                    }));
                  }
                });
              }
            }
            break;
          }

          case 'leave': {
            handleLeave(ws, currentPeerId, currentRoomId);
            break;
          }

          case 'chat_relay': {
            // Optional relay if DataChannel fails or fallback
            wss.clients.forEach((client) => {
              if (client !== ws && (client as any).roomId === currentRoomId && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                  type: 'chat_relay',
                  senderPeerId: currentPeerId,
                  payload
                }));
              }
            });
            break;
          }
        }
      } catch (e) {
        console.error('Error handling WS message:', e);
      }
    });

    ws.on('close', () => {
      handleLeave(ws, currentPeerId, currentRoomId);
    });

    ws.on('error', (err) => {
      console.error('WS client error:', err);
      handleLeave(ws, currentPeerId, currentRoomId);
    });
  });

  function handleLeave(ws: WebSocket, peerId: string, roomId: string) {
    if (!roomId || !peerId) return;
    const room = rooms.get(roomId);
    if (!room) return;

    room.clients.delete(peerId);

    if (room.clients.size === 0) {
      rooms.delete(roomId);
      return;
    }

    // Migration of Host if host leaves
    let newHostId = room.hostPeerId;
    if (room.hostPeerId === peerId) {
      const remainingPeerIds = Array.from(room.clients.keys());
      newHostId = remainingPeerIds[0];
      room.hostPeerId = newHostId;
      const newHostClient = room.clients.get(newHostId);
      if (newHostClient) newHostClient.isHost = true;
    }

    const updatedClients = Array.from(room.clients.values());

    wss.clients.forEach((client) => {
      if ((client as any).roomId === roomId && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'user_left',
          peerId,
          newHostPeerId: newHostId,
          clients: updatedClients
        }));
      }
    });
  }

  // Vite middleware or static serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Palorni Nexus server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
