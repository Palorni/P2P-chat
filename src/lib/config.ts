// Centralized Configuration for PalorniNexus (Web, GitHub Pages & Electron)

export const DEFAULT_STUN_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' },
  { urls: 'stun:global.stun.twilio.com:3478' }
];

export const isWebEnvironment = (): boolean => {
  return typeof window !== 'undefined' && !(window as any).electronAPI;
};

export const isGitHubPages = (): boolean => {
  return typeof window !== 'undefined' && window.location.hostname.includes('github.io');
};

export const getBaseUrl = (): string => {
  if (typeof window === 'undefined') return '/';
  return window.location.pathname.endsWith('/') 
    ? window.location.pathname 
    : window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
};

export const getSignalingServerUrl = (): string => {
  // Check explicit environment variable
  if (import.meta.env.VITE_SIGNALING_URL) {
    return import.meta.env.VITE_SIGNALING_URL;
  }

  if (typeof window === 'undefined') {
    return 'ws://localhost:3000/ws';
  }

  // If on GitHub Pages or static host, use a free public WebSocket relay broker or fallback
  if (isGitHubPages() || window.location.hostname !== 'localhost' && !window.location.host.includes('3000') && !window.location.host.includes('run.app')) {
    // Public WebSocket broker channel for PalorniNexus
    return 'wss://socketsbay.com/app/v2/palorni_nexus_public_signaling';
  }

  // Default local/Cloud Run Express WebSocket route
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/ws`;
};

export const APP_CONFIG = {
  appName: 'PalorniNexus',
  version: '1.2.0-web',
  stunServers: DEFAULT_STUN_SERVERS,
  signalingUrl: getSignalingServerUrl(),
  defaultRoomPrefix: 'NEXUS',
  enableManualP2PFallback: true,
};
