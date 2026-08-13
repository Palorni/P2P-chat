import React, { useRef, useEffect } from 'react';
import { MicOff, Monitor, CameraOff } from 'lucide-react';
import { UserProfile } from '../types';

interface MediaGridProps {
  users: UserProfile[];
  localStream: MediaStream | null;
  localScreenStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
  activeScreenSharer?: UserProfile | null;
  currentUserId: string;
}

export const MediaGrid: React.FC<MediaGridProps> = ({
  users,
  localStream,
  localScreenStream,
  remoteStreams,
  activeScreenSharer,
  currentUserId,
}) => {
  return (
    <div className="w-full h-full p-4 flex flex-col justify-center items-center gap-4 overflow-hidden">
      {/* Screen Share Spotlight Layout */}
      {activeScreenSharer ? (
        <div className="w-full h-full flex flex-col lg:flex-row gap-4 overflow-hidden">
          {/* Main Large Screen Share Container */}
          <div className="flex-1 bg-[#12131C]/90 backdrop-blur-md border border-purple-500/30 rounded-2xl p-2 relative overflow-hidden shadow-[0_0_30px_rgba(139,92,246,0.2)] flex flex-col">
            <div className="absolute top-4 left-4 z-10 px-3 py-1 bg-purple-600/80 backdrop-blur-md rounded-lg border border-purple-400/40 text-xs font-semibold text-white flex items-center gap-2 shadow-lg">
              <Monitor className="w-4 h-4 text-cyan-300 animate-pulse" />
              <span>{activeScreenSharer.name} está compartilhando a tela</span>
            </div>

            <div className="w-full h-full rounded-xl overflow-hidden bg-black flex items-center justify-center relative">
              <VideoFeed
                stream={
                  activeScreenSharer.id === currentUserId
                    ? localScreenStream
                    : remoteStreams.get(activeScreenSharer.id)
                }
                isLocal={false}
                objectFit="contain"
              />
            </div>
          </div>

          {/* Side Small Video Feed Strip */}
          <div className="w-full lg:w-72 h-40 lg:h-full flex lg:flex-col gap-3 overflow-x-auto lg:overflow-y-auto shrink-0 pb-2 lg:pb-0">
            {users.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                isLocal={user.id === currentUserId}
                localStream={localStream}
                remoteStream={remoteStreams.get(user.id)}
                compact
              />
            ))}
          </div>
        </div>
      ) : (
        /* Regular Responsive Grid Layout */
        <div
          className={`w-full h-full grid gap-4 place-items-center auto-rows-fr ${
            users.length === 1
              ? 'grid-cols-1 max-w-3xl max-h-[500px]'
              : users.length === 2
              ? 'grid-cols-1 md:grid-cols-2 max-w-5xl'
              : users.length <= 4
              ? 'grid-cols-2 max-w-5xl'
              : 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4 max-w-7xl'
          }`}
        >
          {users.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              isLocal={user.id === currentUserId}
              localStream={localStream}
              remoteStream={remoteStreams.get(user.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface UserCardProps {
  user: UserProfile;
  isLocal: boolean;
  localStream: MediaStream | null;
  remoteStream?: MediaStream;
  compact?: boolean;
}

const UserCard: React.FC<UserCardProps> = ({
  user,
  isLocal,
  localStream,
  remoteStream,
  compact = false,
}) => {
  const streamToRender = isLocal ? localStream : remoteStream;
  const hasVideoTrack = streamToRender && streamToRender.getVideoTracks().some((t) => t.enabled);

  return (
    <div
      className={`relative w-full h-full min-h-[160px] bg-[#12131C]/90 backdrop-blur-xl border rounded-2xl overflow-hidden transition-all duration-300 shadow-lg flex flex-col justify-between ${
        user.isSpeaking
          ? 'border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)] ring-2 ring-emerald-400/50'
          : 'border-white/10 hover:border-purple-500/40'
      }`}
    >
      {/* Video Stream or Avatar Fallback */}
      {hasVideoTrack ? (
        <div className="w-full h-full absolute inset-0 bg-black">
          <VideoFeed stream={streamToRender!} isLocal={isLocal} />
        </div>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-b from-[#181A28] to-[#0D0E15]">
          <div
            className={`relative rounded-full flex items-center justify-center font-bold text-white shadow-xl transition-transform ${
              compact ? 'w-12 h-12 text-base' : 'w-20 h-20 text-2xl'
            } ${
              user.isSpeaking
                ? 'bg-gradient-to-tr from-emerald-500 to-cyan-400 ring-4 ring-emerald-400/40 animate-pulse'
                : 'bg-gradient-to-tr from-purple-600 via-pink-500 to-cyan-400'
            }`}
          >
            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            {user.cameraOff && (
              <div className="absolute -bottom-1 -right-1 bg-gray-900 border border-white/20 p-1 rounded-full text-rose-400 shadow-md">
                <CameraOff className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Top HUD Card Status Bar */}
      <div className="relative z-10 p-3 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-1.5">
          {user.isHost && (
            <span className="px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/40 text-[10px] font-bold text-amber-300 flex items-center gap-1 shadow-md backdrop-blur-md">
              👑 HOST
            </span>
          )}
          {user.isScreenSharing && (
            <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 border border-cyan-500/40 text-[10px] font-bold text-cyan-300 flex items-center gap-1 shadow-md backdrop-blur-md">
              <Monitor className="w-3 h-3" /> SCREEN
            </span>
          )}
        </div>

        {user.micMuted && (
          <div className="p-1.5 rounded-lg bg-rose-500/80 backdrop-blur-md border border-rose-400/40 text-white shadow-md">
            <MicOff className="w-3.5 h-3.5" />
          </div>
        )}
      </div>

      {/* Bottom Name Label Overlay */}
      <div className="relative z-10 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-center justify-between mt-auto">
        <span className="text-xs font-semibold text-white drop-shadow-md truncate">
          {user.name} {isLocal && '(Você)'}
        </span>
        {user.isSpeaking && (
          <span className="text-[10px] font-bold text-emerald-400 font-mono flex items-center gap-1 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Falando
          </span>
        )}
      </div>
    </div>
  );
};

const VideoFeed: React.FC<{ stream: MediaStream | null; isLocal: boolean; objectFit?: 'cover' | 'contain' }> = ({
  stream,
  isLocal,
  objectFit = 'cover',
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={isLocal}
      className={`w-full h-full ${isLocal ? 'scale-x-[-1]' : ''}`}
      style={{ objectFit }}
    />
  );
};
