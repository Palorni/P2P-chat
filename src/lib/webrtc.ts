import { TransferFile } from '../types';

export interface WebRTCEvents {
  onRemoteStream?: (peerId: string, stream: MediaStream, type: 'camera' | 'screen') => void;
  onRemoteStreamRemoved?: (peerId: string) => void;
  onChatMessage?: (peerId: string, message: any) => void;
  onChatHistory?: (peerId: string, messages: any[]) => void;
  onFileChunkProgress?: (file: TransferFile) => void;
  onFileReceived?: (file: TransferFile, blob: Blob) => void;
  onSpeakingStateChange?: (peerId: string, isSpeaking: boolean) => void;
  onPingUpdate?: (peerId: string, pingMs: number) => void;
}

const CHUNK_SIZE = 64 * 1024; // 64KB chunk size

export class WebRTCManager {
  private peerConnections = new Map<string, RTCPeerConnection>();
  private dataChannels = new Map<string, RTCDataChannel>();
  private remoteStreams = new Map<string, MediaStream>();
  
  public localAudioStream: MediaStream | null = null;
  public localVideoStream: MediaStream | null = null;
  public localScreenStream: MediaStream | null = null;

  private audioAnalyser: AnalyserNode | null = null;
  private audioContext: AudioContext | null = null;
  private isAnalyzingSpeaking = false;

  private receivingFiles = new Map<string, {
    metadata: TransferFile;
    chunks: ArrayBuffer[];
    receivedBytes: number;
  }>();

  private iceServers: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ];

  private events: WebRTCEvents = {};
  public localPeerId: string = '';

  constructor(localPeerId: string, events: WebRTCEvents, customIceServers?: RTCIceServer[]) {
    this.localPeerId = localPeerId;
    this.events = events;
    if (customIceServers && customIceServers.length > 0) {
      this.iceServers = customIceServers;
    }
  }

  public setIceServers(servers: RTCIceServer[]) {
    this.iceServers = servers;
  }

  // --- LOCAL MEDIA HANDLERS ---
  public async enableMicrophone(deviceId?: string): Promise<MediaStream | null> {
    try {
      if (this.localAudioStream) {
        this.localAudioStream.getTracks().forEach((t) => t.stop());
      }
      const constraints: MediaStreamConstraints = {
        audio: deviceId ? { deviceId: { exact: deviceId } } : true
      };
      this.localAudioStream = await navigator.mediaDevices.getUserMedia(constraints);
      this.setupSpeakingDetection(this.localAudioStream);
      this.updatePeerTracks();
      return this.localAudioStream;
    } catch (err) {
      console.error('[WebRTC] Error accessing microphone:', err);
      return null;
    }
  }

  public disableMicrophone() {
    if (this.localAudioStream) {
      this.localAudioStream.getAudioTracks().forEach((track) => {
        track.enabled = false;
      });
    }
  }

  public toggleMicMute(mute: boolean) {
    if (this.localAudioStream) {
      this.localAudioStream.getAudioTracks().forEach((track) => {
        track.enabled = !mute;
      });
    }
  }

  public async enableCamera(deviceId?: string, resolution: string = '720p'): Promise<MediaStream | null> {
    try {
      if (this.localVideoStream) {
        this.localVideoStream.getTracks().forEach((t) => t.stop());
      }

      let resWidth = 1280;
      let resHeight = 720;
      if (resolution === '1080p') {
        resWidth = 1920; resHeight = 1080;
      } else if (resolution === '480p') {
        resWidth = 640; resHeight = 480;
      }

      const constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: resWidth },
          height: { ideal: resHeight },
          deviceId: deviceId ? { exact: deviceId } : undefined
        }
      };

      this.localVideoStream = await navigator.mediaDevices.getUserMedia(constraints);
      this.updatePeerTracks();
      return this.localVideoStream;
    } catch (err) {
      console.error('[WebRTC] Error accessing camera:', err);
      return null;
    }
  }

  public disableCamera() {
    if (this.localVideoStream) {
      this.localVideoStream.getTracks().forEach((track) => track.stop());
      this.localVideoStream = null;
      this.updatePeerTracks();
    }
  }

  public async startScreenShare(): Promise<MediaStream | null> {
    try {
      if (this.localScreenStream) {
        this.localScreenStream.getTracks().forEach((t) => t.stop());
      }
      this.localScreenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false
      });

      this.localScreenStream.getVideoTracks()[0].onended = () => {
        this.stopScreenShare();
      };

      this.updatePeerTracks();
      return this.localScreenStream;
    } catch (err) {
      console.error('[WebRTC] Error starting screen share:', err);
      return null;
    }
  }

  public stopScreenShare() {
    if (this.localScreenStream) {
      this.localScreenStream.getTracks().forEach((track) => track.stop());
      this.localScreenStream = null;
      this.updatePeerTracks();
    }
  }

  // --- PEER CONNECTION LIFECYCLE ---
  public createPeerConnection(
    remotePeerId: string,
    onIceCandidate: (candidate: RTCIceCandidate) => void
  ): RTCPeerConnection {
    if (this.peerConnections.has(remotePeerId)) {
      return this.peerConnections.get(remotePeerId)!;
    }

    const pc = new RTCPeerConnection({ iceServers: this.iceServers });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        onIceCandidate(event.candidate);
      }
    };

    pc.ontrack = (event) => {
      console.log(`[WebRTC] Received remote track from ${remotePeerId}`, event.streams);
      let stream = this.remoteStreams.get(remotePeerId);
      if (!stream) {
        stream = new MediaStream();
        this.remoteStreams.set(remotePeerId, stream);
      }
      event.streams[0].getTracks().forEach((track) => {
        stream!.addTrack(track);
      });

      const trackType = event.track.kind === 'video' && event.track.label.toLowerCase().includes('screen') ? 'screen' : 'camera';
      if (this.events.onRemoteStream) {
        this.events.onRemoteStream(remotePeerId, stream, trackType);
      }
    };

    // Add local tracks to new connection
    this.attachTracksToPC(pc);

    this.peerConnections.set(remotePeerId, pc);
    return pc;
  }

  private attachTracksToPC(pc: RTCPeerConnection) {
    if (this.localAudioStream) {
      this.localAudioStream.getTracks().forEach((track) => pc.addTrack(track, this.localAudioStream!));
    }
    if (this.localVideoStream) {
      this.localVideoStream.getTracks().forEach((track) => pc.addTrack(track, this.localVideoStream!));
    }
    if (this.localScreenStream) {
      this.localScreenStream.getTracks().forEach((track) => pc.addTrack(track, this.localScreenStream!));
    }
  }

  private updatePeerTracks() {
    this.peerConnections.forEach((pc) => {
      // Clear senders and re-add
      const senders = pc.getSenders();
      senders.forEach((sender) => {
        if (sender.track) {
          pc.removeTrack(sender);
        }
      });
      this.attachTracksToPC(pc);
    });
  }

  // --- DATA CHANNEL & MESSAGING ---
  public setupDataChannel(remotePeerId: string, dc: RTCDataChannel) {
    dc.binaryType = 'arraybuffer';

    dc.onopen = () => {
      console.log(`[WebRTC] DataChannel connected with ${remotePeerId}`);
    };

    dc.onmessage = (event) => {
      this.handleDataChannelMessage(remotePeerId, event.data);
    };

    dc.onclose = () => {
      console.log(`[WebRTC] DataChannel closed with ${remotePeerId}`);
      this.dataChannels.delete(remotePeerId);
    };

    this.dataChannels.set(remotePeerId, dc);
  }

  public createDataChannel(remotePeerId: string, pc: RTCPeerConnection): RTCDataChannel {
    const dc = pc.createDataChannel('palorni-nexus-dc');
    this.setupDataChannel(remotePeerId, dc);
    return dc;
  }

  public sendChatMessage(messageObj: any) {
    const payload = JSON.stringify({ type: 'chat', data: messageObj });
    this.dataChannels.forEach((dc) => {
      if (dc.readyState === 'open') {
        dc.send(payload);
      }
    });
  }

  public sendChatHistory(targetPeerId: string, history: any[]) {
    const dc = this.dataChannels.get(targetPeerId);
    if (dc && dc.readyState === 'open') {
      dc.send(JSON.stringify({ type: 'chat_history', data: history }));
    }
  }

  // --- CHUNKED FILE TRANSFER ---
  public async sendFile(file: File, senderName: string, onProgress?: (progress: number) => void) {
    const fileId = `file-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const header = JSON.stringify({
      type: 'file_header',
      data: {
        id: fileId,
        name: file.name,
        size: file.size,
        type: file.type,
        senderName
      }
    });

    // Send header first
    this.dataChannels.forEach((dc) => {
      if (dc.readyState === 'open') {
        dc.send(header);
      }
    });

    // Send binary chunks
    const buffer = await file.arrayBuffer();
    let offset = 0;
    const total = buffer.byteLength;

    while (offset < total) {
      const chunk = buffer.slice(offset, offset + CHUNK_SIZE);
      
      // Prefix chunk with fileId header info
      const fileIdBytes = new TextEncoder().encode(fileId.padEnd(32, ' '));
      const chunkBuffer = new Uint8Array(fileIdBytes.byteLength + chunk.byteLength);
      chunkBuffer.set(fileIdBytes, 0);
      chunkBuffer.set(new Uint8Array(chunk), fileIdBytes.byteLength);

      this.dataChannels.forEach((dc) => {
        if (dc.readyState === 'open') {
          dc.send(chunkBuffer.buffer);
        }
      });

      offset += chunk.byteLength;
      const progress = Math.min(100, Math.round((offset / total) * 100));
      if (onProgress) onProgress(progress);

      // Throttling delay to prevent DataChannel buffer overflow
      await new Promise((r) => setTimeout(r, 10));
    }
  }

  private handleDataChannelMessage(remotePeerId: string, data: any) {
    if (typeof data === 'string') {
      try {
        const parsed = JSON.parse(data);
        if (parsed.type === 'chat') {
          if (this.events.onChatMessage) {
            this.events.onChatMessage(remotePeerId, parsed.data);
          }
        } else if (parsed.type === 'chat_history') {
          if (this.events.onChatHistory) {
            this.events.onChatHistory(remotePeerId, parsed.data);
          }
        } else if (parsed.type === 'speaking') {
          if (this.events.onSpeakingStateChange) {
            this.events.onSpeakingStateChange(remotePeerId, parsed.data?.isSpeaking ?? false);
          }
        } else if (parsed.type === 'file_header') {
          const fileMeta = parsed.data as TransferFile;
          this.receivingFiles.set(fileMeta.id, {
            metadata: { ...fileMeta, progress: 0, status: 'downloading' },
            chunks: [],
            receivedBytes: 0
          });
        }
      } catch (e) {
        console.error('[WebRTC] Error parsing DataChannel JSON:', e);
      }
    } else if (data instanceof ArrayBuffer) {
      // ArrayBuffer file chunk
      try {
        const fileIdBytes = new Uint8Array(data, 0, 32);
        const fileId = new TextDecoder().decode(fileIdBytes).trim();
        const chunkData = data.slice(32);

        const receiving = this.receivingFiles.get(fileId);
        if (receiving) {
          receiving.chunks.push(chunkData);
          receiving.receivedBytes += chunkData.byteLength;
          receiving.metadata.progress = Math.min(100, Math.round((receiving.receivedBytes / receiving.metadata.size) * 100));

          if (this.events.onFileChunkProgress) {
            this.events.onFileChunkProgress(receiving.metadata);
          }

          if (receiving.receivedBytes >= receiving.metadata.size) {
            const blob = new Blob(receiving.chunks, { type: receiving.metadata.type });
            const fileUrl = URL.createObjectURL(blob);
            receiving.metadata.url = fileUrl;
            receiving.metadata.status = 'completed';

            if (this.events.onFileReceived) {
              this.events.onFileReceived(receiving.metadata, blob);
            }
            this.receivingFiles.delete(fileId);
          }
        }
      } catch (e) {
        console.error('[WebRTC] Error handling binary chunk:', e);
      }
    }
  }

  // --- SPEAKING DETECTION ---
  private setupSpeakingDetection(stream: MediaStream) {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = this.audioContext.createMediaStreamSource(stream);
      this.audioAnalyser = this.audioContext.createAnalyser();
      this.audioAnalyser.fftSize = 256;
      source.connect(this.audioAnalyser);

      this.isAnalyzingSpeaking = true;
      this.checkSpeakingLoop();
    } catch (e) {
      console.warn('[WebRTC] Speaking detection setup failed:', e);
    }
  }

  private lastSpeakingState = false;

  private checkSpeakingLoop = () => {
    if (!this.isAnalyzingSpeaking || !this.audioAnalyser) return;
    const dataArray = new Uint8Array(this.audioAnalyser.frequencyBinCount);
    this.audioAnalyser.getByteFrequencyData(dataArray);

    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    const average = sum / dataArray.length;
    const isSpeaking = average > 18; // More sensitive threshold for Web audio/mobile

    if (this.events.onSpeakingStateChange) {
      this.events.onSpeakingStateChange(this.localPeerId, isSpeaking);
    }

    if (this.lastSpeakingState !== isSpeaking) {
      this.lastSpeakingState = isSpeaking;
      const msg = JSON.stringify({ type: 'speaking', data: { isSpeaking } });
      this.dataChannels.forEach((dc) => {
        if (dc.readyState === 'open') {
          try { dc.send(msg); } catch (e) {}
        }
      });
    }

    setTimeout(this.checkSpeakingLoop, 150);
  };

  // --- CLEANUP ---
  public closePeerConnection(remotePeerId: string) {
    const pc = this.peerConnections.get(remotePeerId);
    if (pc) {
      pc.close();
      this.peerConnections.delete(remotePeerId);
    }
    const dc = this.dataChannels.get(remotePeerId);
    if (dc) {
      dc.close();
      this.dataChannels.delete(remotePeerId);
    }
    this.remoteStreams.delete(remotePeerId);
    if (this.events.onRemoteStreamRemoved) {
      this.events.onRemoteStreamRemoved(remotePeerId);
    }
  }

  public destroy() {
    this.isAnalyzingSpeaking = false;
    if (this.audioContext) {
      this.audioContext.close();
    }
    if (this.localAudioStream) {
      this.localAudioStream.getTracks().forEach((t) => t.stop());
    }
    if (this.localVideoStream) {
      this.localVideoStream.getTracks().forEach((t) => t.stop());
    }
    if (this.localScreenStream) {
      this.localScreenStream.getTracks().forEach((t) => t.stop());
    }
    this.peerConnections.forEach((pc) => pc.close());
    this.peerConnections.clear();
    this.dataChannels.clear();
    this.remoteStreams.clear();
  }
}
