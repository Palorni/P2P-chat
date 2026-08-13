import React from 'react';
import { Hash, Plus, MessageSquare, Gamepad2, Shield, Mic, MicOff, Camera, CameraOff, Copy, Share2, Check } from 'lucide-react';
import { ChannelType, RoomInfo, UserProfile } from '../types';

interface SidebarProps {
  currentRoom: RoomInfo | null;
  activeChannel: ChannelType;
  onSelectChannel: (channel: ChannelType) => void;
  recentRooms: string[];
  onSelectRoom: (roomId: string) => void;
  onCreateNewRoom: () => void;
  currentUser: UserProfile;
  onToggleMic: () => void;
  onToggleCam: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  onCopyRoomCode?: () => void;
  onCopyInvite?: () => void;
  copiedCode?: boolean;
  copiedInvite?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRoom,
  activeChannel,
  onSelectChannel,
  recentRooms,
  onSelectRoom,
  onCreateNewRoom,
  currentUser,
  onToggleMic,
  onToggleCam,
  isMobileOpen,
  onCloseMobile,
  onCopyRoomCode,
  onCopyInvite,
  copiedCode,
  copiedInvite,
}) => {
  const channels: { id: ChannelType; name: string; icon: React.ReactNode }[] = [
    { id: 'geral', name: 'Geral', icon: <Hash className="w-4 h-4 text-purple-400" /> },
    { id: 'chat', name: 'Chat', icon: <MessageSquare className="w-4 h-4 text-pink-400" /> },
    { id: 'games', name: 'Games', icon: <Gamepad2 className="w-4 h-4 text-cyan-400" /> },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Main Sidebar Drawer */}
      <aside
        className={`fixed lg:static top-14 left-0 bottom-0 w-64 bg-[#0B0C10]/95 backdrop-blur-xl border-r border-white/10 flex flex-col z-40 transition-transform duration-300 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Servers/Rooms Quick Rail & Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-pink-500 p-0.5">
              <div className="w-full h-full bg-[#0B0C10] rounded-[6px] flex items-center justify-center">
                <Shield className="w-4 h-4 text-purple-300" />
              </div>
            </div>
            <div>
              <h2 className="text-xs font-bold font-['Orbitron',sans-serif] text-white">SALAS</h2>
              <p className="text-[10px] text-gray-400">Palorni Nexus Hub</p>
            </div>
          </div>

          <button
            onClick={onCreateNewRoom}
            className="w-7 h-7 rounded-lg bg-white/5 hover:bg-purple-600/30 border border-white/10 hover:border-purple-500/50 flex items-center justify-center text-purple-300 hover:text-white transition-all"
            title="Criar Nova Sala"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Room Code Card if in room */}
        {currentRoom && (
          <div className="m-3 p-3 bg-gradient-to-br from-purple-900/20 to-pink-900/20 border border-purple-500/30 rounded-2xl space-y-2">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between">
              <span>SALA ATIVA</span>
              <span className="text-emerald-400 font-mono text-[9px]">ONLINE</span>
            </div>
            <div className="flex items-center justify-between font-mono font-black text-sm text-purple-200 bg-black/40 px-2.5 py-1.5 rounded-xl border border-white/10">
              <span>{currentRoom.id}</span>
              {onCopyRoomCode && (
                <button
                  onClick={onCopyRoomCode}
                  className="p-1 hover:bg-white/10 rounded text-purple-300 hover:text-white transition-colors"
                  title="Copiar Código da Sala"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>

            {onCopyInvite && (
              <button
                onClick={onCopyInvite}
                className="w-full py-1.5 bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-all"
              >
                {copiedInvite ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Link Copiado!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5 text-cyan-300" />
                    <span>Compartilhar Link</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* Channels List */}
        <div className="p-3 space-y-1 flex-1 overflow-y-auto">

          <div className="px-2 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            Canais da Sala
          </div>

          {channels.map((chan) => {
            const isActive = activeChannel === chan.id;
            return (
              <button
                key={chan.id}
                onClick={() => {
                  onSelectChannel(chan.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-600/30 to-pink-600/20 text-white border border-purple-500/40 shadow-sm'
                    : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                }`}
              >
                {chan.icon}
                <span># {chan.name}</span>
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_8px_#A855F7]" />
                )}
              </button>
            );
          })}

          {/* Recent Rooms list */}
          {recentRooms.length > 0 && (
            <div className="pt-4 space-y-1">
              <div className="px-2 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Salas Recentes
              </div>
              {recentRooms.map((rId) => {
                const isCurrent = currentRoom?.id === rId;
                return (
                  <button
                    key={rId}
                    onClick={() => {
                      onSelectRoom(rId);
                      onCloseMobile();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-mono transition-all ${
                      isCurrent
                        ? 'bg-white/10 text-purple-300 border border-white/10'
                        : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                    }`}
                  >
                    <span>{rId}</span>
                    {isCurrent && <span className="text-[10px] text-emerald-400 font-sans">Atual</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* User Footer Profile & Quick Media Mute Buttons */}
        <div className="p-3 bg-[#12131C]/90 border-t border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-md">
              {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="truncate">
              <div className="text-xs font-semibold text-white truncate flex items-center gap-1">
                <span>{currentUser.name}</span>
                {currentUser.isHost && (
                  <span title="HOST" className="text-[10px]">👑</span>
                )}
              </div>
              <div className="text-[10px] text-emerald-400 font-mono">Online</div>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={onToggleMic}
              className={`p-1.5 rounded-lg border transition-all ${
                currentUser.micMuted
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                  : 'bg-white/5 hover:bg-white/10 border-white/10 text-gray-300'
              }`}
              title={currentUser.micMuted ? 'Desmutar Microfone' : 'Mutar Microfone'}
            >
              {currentUser.micMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={onToggleCam}
              className={`p-1.5 rounded-lg border transition-all ${
                currentUser.cameraOff
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                  : 'bg-white/5 hover:bg-white/10 border-white/10 text-gray-300'
              }`}
              title={currentUser.cameraOff ? 'Ligar Câmera' : 'Desligar Câmera'}
            >
              {currentUser.cameraOff ? <CameraOff className="w-3.5 h-3.5" /> : <Camera className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
