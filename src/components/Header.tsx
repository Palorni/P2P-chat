import React from 'react';
import { Shield, Wifi, Users, Download, Settings, Copy, Check, PlayCircle, Share2, Activity } from 'lucide-react';
import { AppSettings, RoomInfo } from '../types';

interface HeaderProps {
  roomInfo: RoomInfo | null;
  userCount: number;
  pingMs: number;
  isP2PConnected: boolean;
  canInstallPWA: boolean;
  onInstallPWA: () => void;
  onOpenSettings: () => void;
  onCopyRoomCode: () => void;
  copiedCode: boolean;
  onCopyInvite: () => void;
  copiedInvite: boolean;
  settings: AppSettings;
  onToggleDemoMode: () => void;
  onOpenDiagnostics?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  roomInfo,
  userCount,
  pingMs,
  isP2PConnected,
  canInstallPWA,
  onInstallPWA,
  onOpenSettings,
  onCopyRoomCode,
  copiedCode,
  onCopyInvite,
  copiedInvite,
  settings,
  onToggleDemoMode,
  onOpenDiagnostics,
}) => {
  return (
    <header className="h-14 w-full bg-[#12131C]/80 backdrop-blur-md border-b border-white/10 px-3 sm:px-4 flex items-center justify-between shrink-0 z-30 shadow-lg">
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-pink-500 to-cyan-400 p-[1.5px] shadow-[0_0_15px_rgba(139,92,246,0.3)] shrink-0">
          <div className="w-full h-full bg-[#0B0C10] rounded-[10px] flex items-center justify-center">
            <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
          </div>
        </div>
        <div>
          <h1 className="font-['Orbitron',sans-serif] font-black text-xs sm:text-sm tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-300 to-cyan-300">
            PALORNI NEXUS
          </h1>
          <p className="text-[9px] sm:text-[10px] text-gray-400 font-medium tracking-tight hidden xs:block">Connect. Share. Directly.</p>
        </div>

        {/* Quick Room Code & Share Buttons */}
        {roomInfo && (
          <div className="flex items-center gap-1.5 ml-1 sm:ml-4">
            {/* Copy Room Code Button */}
            <button
              onClick={onCopyRoomCode}
              title="Clique para copiar o CÓDIGO da sala"
              className="px-2.5 py-1 bg-purple-600/20 hover:bg-purple-600/35 border border-purple-500/40 hover:border-purple-400 rounded-lg text-xs font-mono font-bold text-purple-200 flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
            >
              {copiedCode ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-emerald-300">COPIADO!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-purple-300 shrink-0" />
                  <span>{roomInfo.id}</span>
                </>
              )}
            </button>

            {/* Copy Full Link Button */}
            <button
              onClick={onCopyInvite}
              title="Copiar link de convite completo"
              className="px-2 py-1 bg-cyan-600/20 hover:bg-cyan-600/35 border border-cyan-500/40 hover:border-cyan-400 rounded-lg text-xs font-semibold text-cyan-200 flex items-center gap-1 transition-all active:scale-95"
            >
              {copiedInvite ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="hidden sm:inline text-emerald-300">LINK COPIADO</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
                  <span className="hidden sm:inline">LINK</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5 sm:gap-3">
        {settings.demoMode ? (
          <button
            onClick={onToggleDemoMode}
            className="flex items-center gap-1 px-2 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] sm:text-xs font-semibold animate-pulse"
            title="Clique para alternar para modo P2P Real"
          >
            <PlayCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">DEMO MODE</span>
          </button>
        ) : (
          <button
            onClick={onOpenDiagnostics}
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] sm:text-xs font-medium border transition-all hover:scale-105 active:scale-95 ${
              isP2PConnected
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
            }`}
            title="Clique para abrir Diagnóstico WebRTC P2P"
          >
            <Wifi className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{isP2PConnected ? 'P2P CONNECTED' : 'DISCONNECTED'}</span>
          </button>
        )}

        <div className="hidden lg:flex items-center gap-1 px-2 py-1 bg-white/5 border border-white/10 rounded-md text-xs font-mono text-gray-300">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>PING {pingMs}ms</span>
        </div>

        {roomInfo && (
          <div className="flex items-center gap-1 px-2 py-1 bg-white/5 border border-white/10 rounded-md text-xs font-mono text-purple-300">
            <Users className="w-3.5 h-3.5 text-purple-400" />
            <span>{userCount}</span>
          </div>
        )}

        {roomInfo && (
          <button
            onClick={onOpenDiagnostics}
            className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-cyan-400 hover:text-cyan-300 transition-colors hidden sm:block"
            title="Diagnóstico de Conexão WebRTC"
          >
            <Activity className="w-4 h-4" />
          </button>
        )}

        {canInstallPWA && (
          <button
            onClick={onInstallPWA}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-semibold shadow-md shadow-purple-900/30 transition-all transform active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Instalar</span>
          </button>
        )}

        <button
          onClick={onOpenSettings}
          className="p-1.5 sm:p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-300 hover:text-white transition-colors"
          title="Configurações"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};

