import { getSignalingServerUrl } from './config';

export type SignalHandler = (msg: any) => void;

export class SignalingProvider {
  private ws: WebSocket | null = null;
  private serverUrl: string;
  private listeners: Map<string, Set<SignalHandler>> = new Map();
  public isConnected: boolean = false;
  public isDemoMode: boolean = false;
  private broadcastChannel: BroadcastChannel | null = null;
  private currentRoomId: string = '';
  private currentPeerId: string = '';
  private localUser: { userName: string; avatar: string } = { userName: 'User', avatar: '⚡' };

  constructor(customUrl?: string) {
    this.serverUrl = customUrl || getSignalingServerUrl();
  }

  public connect(roomId: string, peerId: string, userName: string, avatar: string, demoMode: boolean = false): Promise<boolean> {
    this.isDemoMode = demoMode;
    this.currentRoomId = roomId;
    this.currentPeerId = peerId;
    this.localUser = { userName, avatar };

    // Setup local BroadcastChannel signaling for same domain/tab/local web testing
    this.setupBroadcastChannel(roomId, peerId);

    if (demoMode) {
      this.isConnected = true;
      setTimeout(() => {
        this.emit('joined', {
          roomId,
          peerId,
          isHost: true,
          hostPeerId: peerId,
          clients: [
            { peerId, userName, isHost: true, avatar },
            { peerId: 'demo-peer-1', userName: 'CyberNexus_Bot', isHost: false, avatar: '🤖' },
            { peerId: 'demo-peer-2', userName: 'Valkyrie_Gamer', isHost: false, avatar: '⚡' }
          ]
        });
      }, 300);
      return Promise.resolve(true);
    }

    return new Promise((resolve) => {
      try {
        this.ws = new WebSocket(this.serverUrl);

        this.ws.onopen = () => {
          this.isConnected = true;
          this.send('join', roomId, peerId, { userName, avatar });
          resolve(true);
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleIncoming(data);
          } catch (e) {
            console.error('[Signaling] Error parsing message:', e);
          }
        };

        this.ws.onerror = (err) => {
          console.warn('[Signaling] WebSocket unavailable, falling back to local/web signaling:', err);
          this.isConnected = true; // Set true for local/broadcast signaling mode
          this.simulateLocalJoined(roomId, peerId, userName, avatar);
          resolve(true);
        };

        this.ws.onclose = () => {
          if (!this.broadcastChannel) {
            this.isConnected = false;
            this.emit('disconnected', {});
          }
        };
      } catch (err) {
        console.warn('[Signaling] Connection exception, enabling web fallback:', err);
        this.isConnected = true;
        this.simulateLocalJoined(roomId, peerId, userName, avatar);
        resolve(true);
      }
    });
  }

  private setupBroadcastChannel(roomId: string, peerId: string) {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        if (this.broadcastChannel) {
          this.broadcastChannel.close();
        }
        this.broadcastChannel = new BroadcastChannel(`palorni_room_${roomId}`);
        this.broadcastChannel.onmessage = (event) => {
          const data = event.data;
          if (data && data.senderPeerId !== peerId) {
            this.handleIncoming(data);
          }
        };
      } catch (e) {
        console.warn('[Signaling] BroadcastChannel setup failed:', e);
      }
    }
  }

  private simulateLocalJoined(roomId: string, peerId: string, userName: string, avatar: string) {
    setTimeout(() => {
      this.emit('joined', {
        roomId,
        peerId,
        isHost: true,
        hostPeerId: peerId,
        clients: [{ peerId, userName, isHost: true, avatar }]
      });

      // Broadcast join to other tabs/local windows
      this.broadcastLocalMessage({
        type: 'user_joined',
        roomId,
        senderPeerId: peerId,
        client: { peerId, userName, isHost: false, avatar }
      });
    }, 100);
  }

  private broadcastLocalMessage(msg: any) {
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({ ...msg, senderPeerId: this.currentPeerId });
      } catch (e) {
        console.warn('[Signaling] BroadcastChannel send error:', e);
      }
    }
  }

  public disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
      this.broadcastChannel = null;
    }
    this.isConnected = false;
  }

  public send(type: string, roomId: string, peerId: string, payload: any) {
    if (this.isDemoMode) {
      return;
    }

    const messageObj = { type, roomId, peerId, payload, senderPeerId: peerId };

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(messageObj));
    }

    // Always mirror to BroadcastChannel for local/web multi-tab/device testing
    this.broadcastLocalMessage(messageObj);
  }

  public sendOffer(roomId: string, peerId: string, targetPeerId: string, offer: RTCSessionDescriptionInit) {
    this.send('signal', roomId, peerId, { targetPeerId, signal: { type: 'offer', offer } });
  }

  public sendAnswer(roomId: string, peerId: string, targetPeerId: string, answer: RTCSessionDescriptionInit) {
    this.send('signal', roomId, peerId, { targetPeerId, signal: { type: 'answer', answer } });
  }

  public sendIceCandidate(roomId: string, peerId: string, targetPeerId: string, candidate: RTCIceCandidateInit) {
    this.send('signal', roomId, peerId, { targetPeerId, signal: { type: 'candidate', candidate } });
  }

  public lockRoom(roomId: string, peerId: string, locked: boolean) {
    this.send('lock_room', roomId, peerId, { locked });
  }

  public kickUser(roomId: string, peerId: string, targetPeerId: string) {
    this.send('kick_user', roomId, peerId, { targetPeerId });
  }

  public transferHost(roomId: string, peerId: string, newHostPeerId: string) {
    this.send('transfer_host', roomId, peerId, { newHostPeerId });
  }

  public on(event: string, handler: SignalHandler) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
  }

  public off(event: string, handler: SignalHandler) {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.delete(handler);
    }
  }

  private emit(event: string, data: any) {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.forEach((cb) => cb(data));
    }
  }

  private handleIncoming(data: any) {
    const { type } = data;
    switch (type) {
      case 'joined':
        this.emit('joined', data);
        break;
      case 'user_joined':
        this.emit('user_joined', data);
        break;
      case 'user_left':
        this.emit('user_left', data);
        break;
      case 'signal':
        this.emit('signal', data);
        break;
      case 'room_locked':
        this.emit('room_locked', data);
        break;
      case 'user_kicked':
      case 'kicked':
        this.emit('kicked', data);
        break;
      case 'host_transferred':
        this.emit('host_transferred', data);
        break;
      case 'chat_relay':
        this.emit('chat_relay', data);
        break;
      case 'error':
        this.emit('error', data.payload || data);
        break;
    }
  }
}
