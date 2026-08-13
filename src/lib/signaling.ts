export type SignalHandler = (msg: any) => void;

export class SignalingProvider {
  private ws: WebSocket | null = null;
  private serverUrl: string;
  private listeners: Map<string, Set<SignalHandler>> = new Map();
  public isConnected: boolean = false;
  public isDemoMode: boolean = false;

  constructor(customUrl?: string) {
    if (customUrl) {
      this.serverUrl = customUrl;
    } else {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      this.serverUrl = `${protocol}//${window.location.host}/ws`;
    }
  }

  public connect(roomId: string, peerId: string, userName: string, avatar: string, demoMode: boolean = false): Promise<boolean> {
    this.isDemoMode = demoMode;
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
          console.warn('[Signaling] WebSocket error, enabling fallback Demo Mode handling:', err);
          this.isConnected = false;
          this.emit('error', { message: 'Servidor de signaling indisponível. Alternado para modo local.' });
          resolve(false);
        };

        this.ws.onclose = () => {
          this.isConnected = false;
          this.emit('disconnected', {});
        };
      } catch (err) {
        console.error('[Signaling] WebSocket connection exception:', err);
        this.isConnected = false;
        resolve(false);
      }
    });
  }

  public disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
  }

  public send(type: string, roomId: string, peerId: string, payload: any) {
    if (this.isDemoMode) {
      // Echo or simulate for demo mode
      return;
    }
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, roomId, peerId, payload }));
    }
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
