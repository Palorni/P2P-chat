import React from 'react';
import { Shield, Mic, MicOff, Camera, CameraOff, Monitor, UserX, Crown, Lock, Unlock, Users } from 'lucide-react';
import { UserProfile } from '../types';

interface ParticipantsPanelProps {
  users: UserProfile[];
  currentUserId: string;
  isHost: boolean;
  isRoomLocked: boolean;
  onLockRoom: (lock: boolean) => void;
  onKickUser: (peerId: string) => void;
  onTransferHost: (peerId: string) => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const ParticipantsPanel: React.FC<ParticipantsPanelProps> = ({
  users,
  currentUserId,
  isHost,
  isRoomLocked,
  onLockRoom,
  onKickUser,
  onTransferHost,
  isMobileOpen,
  onCloseMobile,
}) => {
  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      <aside
        className={`fixed lg:static top-14 right-0 bottom-0 w-64 bg-[#0B0C10]/95 backdrop-blur-xl border-l border-white/10 flex flex-col z-40 transition-transform duration-300 ${
          isMobileOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Panel Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-400" />
            <h2 className="text-xs font-bold font-['Orbitron',sans-serif] text-white">
              PARTICIPANTES ({users.length})
            </h2>
          </div>

          {isHost && (
            <button
              onClick={() => onLockRoom(!isRoomLocked)}
              className={`p-1.5 rounded-lg border text-xs font-semibold transition-all flex items-center gap-1 ${
                isRoomLocked
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                  : 'bg-white/5 border-white/10 text-gray-300 hover:text-white'
              }`}
              title={isRoomLocked ? 'Desbloquear entrada na sala' : 'Bloquear entrada na sala'}
            >
              {isRoomLocked ? <Lock className="w-3.5 h-3.5 text-rose-400" /> : <Unlock className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>

        {/* Users List */}
        <div className="p-3 space-y-2 flex-1 overflow-y-auto">
          {users.map((user) => {
            const isMe = user.id === currentUserId;
            return (
              <div
                key={user.id}
                className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="relative">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white shrink-0 transition-all ${
                        user.isSpeaking
                          ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 ring-2 ring-emerald-400 ring-offset-1 ring-offset-black shadow-[0_0_12px_rgba(16,185,129,0.8)] scale-105'
                          : 'bg-gradient-to-tr from-purple-600 to-pink-500'
                      }`}
                    >
                      {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <span
                      className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-gray-900 ${
                        user.isSpeaking ? 'bg-emerald-400 animate-ping' : 'bg-emerald-400'
                      }`}
                    />
                  </div>

                  <div className="truncate">
                    <div className="text-xs font-semibold text-white truncate flex items-center gap-1">
                      <span>{user.name}</span>
                      {isMe && <span className="text-[10px] text-purple-400">(Você)</span>}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      {user.isHost && (
                        <span className="text-[9px] font-bold text-amber-300 flex items-center gap-0.5">
                          👑 HOST
                        </span>
                      )}
                      {user.isScreenSharing && (
                        <span className="text-[9px] font-bold text-cyan-300 flex items-center gap-0.5">
                          <Monitor className="w-2.5 h-2.5" /> SCREEN
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status Badges & Host Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {user.isSpeaking && (
                    <div className="flex items-end gap-[2px] h-3 px-1.5 py-0.5 bg-emerald-500/20 border border-emerald-400/40 rounded">
                      <span className="w-0.5 bg-emerald-400 rounded-full animate-eq-1" />
                      <span className="w-0.5 bg-emerald-400 rounded-full animate-eq-2" />
                      <span className="w-0.5 bg-emerald-400 rounded-full animate-eq-3" />
                    </div>
                  )}

                  <div className="text-gray-400">
                    {user.micMuted ? (
                      <MicOff className="w-3.5 h-3.5 text-rose-400" />
                    ) : user.isSpeaking ? (
                      <Mic className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                    ) : (
                      <Mic className="w-3.5 h-3.5 text-emerald-400/80" />
                    )}
                  </div>

                  <div className="text-gray-400">
                    {user.cameraOff ? (
                      <CameraOff className="w-3.5 h-3.5 text-gray-500" />
                    ) : (
                      <Camera className="w-3.5 h-3.5 text-cyan-400" />
                    )}
                  </div>

                  {/* Host Context Controls */}
                  {isHost && !isMe && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 ml-1">
                      <button
                        onClick={() => onTransferHost(user.id)}
                        className="p-1 hover:bg-amber-500/20 text-amber-300 rounded"
                        title="Transferir HOST para este usuário"
                      >
                        <Crown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onKickUser(user.id)}
                        className="p-1 hover:bg-rose-500/20 text-rose-400 rounded"
                        title="Expulsar da sala"
                      >
                        <UserX className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Lock Room Status Bar */}
        {isRoomLocked && (
          <div className="p-3 bg-rose-500/10 border-t border-rose-500/20 text-[11px] text-rose-300 font-semibold flex items-center gap-2">
            <Lock className="w-4 h-4 shrink-0 text-rose-400" />
            <span>Sala bloqueada para novos membros</span>
          </div>
        )}
      </aside>
    </>
  );
};
