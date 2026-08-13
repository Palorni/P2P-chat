export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  isHost: boolean;
  micMuted: boolean;
  cameraOff: boolean;
  isScreenSharing: boolean;
  isSpeaking: boolean;
  volume: number; // 0 to 100
  pingMs?: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  timestamp: string;
  isSystem?: boolean;
  file?: TransferFile;
}

export interface TransferFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  progress: number; // 0 to 100
  speedKbps?: number;
  status: 'pending' | 'downloading' | 'completed' | 'cancelled' | 'failed';
  senderName: string;
}

export interface RoomInfo {
  id: string;
  name: string;
  hostPeerId: string;
  locked: boolean;
  createdTime: number;
  activeChannel: string; // e.g. 'geral' | 'chat' | 'games'
}

export interface AppSettings {
  selectedMic: string;
  selectedCam: string;
  camResolution: '720p' | '1080p' | '480p';
  volume: number;
  theme: 'dark' | 'synthwave' | 'cyanide';
  glassTransparency: number;
  animationsEnabled: boolean;
  stunServers: string[];
  turnServers: string[];
  signalingServerUrl: string;
  demoMode: boolean;
}

export interface ToastNotification {
  id: string;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'alert';
  time: string;
}

export type ChannelType = 'geral' | 'chat' | 'games' | 'media';
