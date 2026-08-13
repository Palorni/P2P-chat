import React from 'react';
import { Mic, MicOff, Camera, CameraOff, Monitor, Paperclip, Settings, PhoneOff, Volume2, Users, MessageSquare } from 'lucide-react';
import { UserProfile } from '../types';

interface ControlBarProps {
  currentUser: UserProfile;
  onToggleMic: () => void;
  onToggleCam: () => void;
  onToggleScreenShare: () => void;
  onAttachFile: () => void;
  onOpenSettings: () => void;
  onLeaveRoom: () => void;
  onToggleMobileSidebar: () => void;
  onToggleMobileParticipants: () => void;
}

export const ControlBar: React.FC<ControlBarProps> = ({
  currentUser,
  onToggleMic,
  onToggleCam,
  onToggleScreenShare,
  onAttachFile,
  onOpenSettings,
  onLeaveRoom,
  onToggleMobileSidebar,
  onToggleMobileParticipants,
}) => {
  return (
    <div className="h-16 w-full bg-[#12131C]/90 backdrop-blur-2xl border-t border-white/10 px-4 flex items-center justify-between shrink-0 z-30 shadow-[0_-10px_25px_rgba(0,0,0,0.5)]">
      {/* Mobile drawer toggle buttons */}
      <div className="flex items-center gap-2 lg:hidden">
        <button
          onClick={onToggleMobileSidebar}
          className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white"
          title="Canais e Salas"
        >
          <MessageSquare className="w-4 h-4" />
        </button>
        <button
          onClick={onToggleMobileParticipants}
          className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white"
          title="Lista de Participantes"
        >
          <Users className="w-4 h-4" />
        </button>
      </div>

      {/* Main Center Floating Controls Dock */}
      <div className="flex items-center gap-2 sm:gap-3 mx-auto">
        {/* Mic Control */}
        <button
          onClick={onToggleMic}
          className={`p-3 rounded-2xl border font-semibold transition-all transform active:scale-95 shadow-lg flex items-center gap-2 relative ${
            currentUser.micMuted
              ? 'bg-rose-500/20 border-rose-500/50 text-rose-400 shadow-rose-900/20'
              : currentUser.isSpeaking
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 border-emerald-400 text-white shadow-[0_0_20px_rgba(16,185,129,0.5)] ring-2 ring-emerald-400/50 scale-105'
              : 'bg-gradient-to-r from-purple-600 to-pink-600 border-purple-400/30 text-white shadow-purple-900/40'
          }`}
          title={
            currentUser.micMuted
              ? 'Clique para Ativar Microfone 🎙'
              : currentUser.isSpeaking
              ? 'Você está FALANDO agora (Voz transmitida em tempo real)'
              : 'Microfone Ativo — Clique para Mutar 🔇'
          }
        >
          {currentUser.micMuted ? (
            <MicOff className="w-5 h-5" />
          ) : currentUser.isSpeaking ? (
            <div className="flex items-end gap-[2px] h-5">
              <span className="w-1 bg-white rounded-full animate-eq-1" />
              <span className="w-1 bg-white rounded-full animate-eq-2" />
              <span className="w-1 bg-white rounded-full animate-eq-3" />
            </div>
          ) : (
            <Mic className="w-5 h-5" />
          )}
          <span className="hidden md:inline text-xs font-bold">
            {currentUser.micMuted
              ? 'Mutado'
              : currentUser.isSpeaking
              ? 'FALANDO...'
              : 'Microfone'}
          </span>
        </button>

        {/* Camera Control */}
        <button
          onClick={onToggleCam}
          className={`p-3 rounded-2xl border font-semibold transition-all transform active:scale-95 shadow-lg flex items-center gap-2 ${
            currentUser.cameraOff
              ? 'bg-white/5 hover:bg-white/10 border-white/10 text-gray-400'
              : 'bg-gradient-to-r from-cyan-600 to-blue-600 border-cyan-400/30 text-white shadow-cyan-900/40'
          }`}
          title={currentUser.cameraOff ? 'Ligar Câmera 📹' : 'Desligar Câmera 📷'}
        >
          {currentUser.cameraOff ? <CameraOff className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
          <span className="hidden md:inline text-xs">{currentUser.cameraOff ? 'Câmera Off' : 'Câmera'}</span>
        </button>

        {/* Screen Share Control */}
        <button
          onClick={onToggleScreenShare}
          className={`p-3 rounded-2xl border font-semibold transition-all transform active:scale-95 shadow-lg flex items-center gap-2 ${
            currentUser.isScreenSharing
              ? 'bg-emerald-500/30 border-emerald-400 text-emerald-300 shadow-emerald-900/40 animate-pulse'
              : 'bg-white/5 hover:bg-white/10 border-white/10 text-gray-300 hover:text-white'
          }`}
          title={currentUser.isScreenSharing ? 'Parar Compartilhamento 🖥' : 'Compartilhar Tela 🖥'}
        >
          <Monitor className="w-5 h-5" />
          <span className="hidden md:inline text-xs">
            {currentUser.isScreenSharing ? 'Compartilhando' : 'Compartilhar Tela'}
          </span>
        </button>

        {/* File Share Button */}
        <button
          onClick={onAttachFile}
          className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition-all transform active:scale-95 flex items-center gap-2"
          title="Anexar Arquivo P2P 📎"
        >
          <Paperclip className="w-5 h-5 text-purple-400" />
          <span className="hidden md:inline text-xs">Anexar</span>
        </button>

        {/* Settings button */}
        <button
          onClick={onOpenSettings}
          className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition-all transform active:scale-95"
          title="Configurações ⚙"
        >
          <Settings className="w-5 h-5" />
        </button>

        {/* Leave Room Button */}
        <button
          onClick={onLeaveRoom}
          className="p-3 rounded-2xl bg-rose-600 hover:bg-rose-500 border border-rose-400/40 text-white font-bold transition-all transform active:scale-95 shadow-lg shadow-rose-900/40 ml-2"
          title="Sair da Sala 🔴"
        >
          <PhoneOff className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
