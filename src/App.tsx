import React, { useState, useEffect, useRef } from 'react';
import { AppSettings, ChannelType, ChatMessage, RoomInfo, ToastNotification, TransferFile, UserProfile } from './types';
import { registerServiceWorker, subscribeInstallState, promptPWAInstall } from './lib/pwa';
import { SignalingProvider } from './lib/signaling';
import { WebRTCManager } from './lib/webrtc';
import { Header } from './components/Header';
import { WelcomeScreen } from './components/WelcomeScreen';
import { Sidebar } from './components/Sidebar';
import { MediaGrid } from './components/MediaGrid';
import { ChatArea } from './components/ChatArea';
import { ParticipantsPanel } from './components/ParticipantsPanel';
import { ControlBar } from './components/ControlBar';
import { SettingsModal } from './components/SettingsModal';
import { InstallPromptModal } from './components/InstallPromptModal';
import { ToastNotifications } from './components/ToastNotifications';

export default function App() {
  // PWA Install State
  const [canInstallPWA, setCanInstallPWA] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);

  // User & Room State
  const [peerId] = useState(() => `peer-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 4)}`);
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const savedName = localStorage.getItem('palorni_user_name') || '';
    return {
      id: peerId,
      name: savedName,
      avatar: '👑',
      isHost: false,
      micMuted: false,
      cameraOff: true,
      isScreenSharing: false,
      isSpeaking: false,
      volume: 100,
    };
  });

  const [currentRoom, setCurrentRoom] = useState<RoomInfo | null>(null);
  const [activeChannel, setActiveChannel] = useState<ChannelType>('geral');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [recentRooms, setRecentRooms] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('palorni_recent_rooms') || '[]');
    } catch {
      return [];
    }
  });

  // Settings State
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('palorni_app_settings');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      selectedMic: '',
      selectedCam: '',
      camResolution: '720p',
      volume: 100,
      theme: 'dark',
      glassTransparency: 90,
      animationsEnabled: true,
      stunServers: ['stun:stun.l.google.com:19302'],
      turnServers: [],
      signalingServerUrl: '',
      demoMode: false,
    };
  });
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Chat & Files State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [transferFiles, setTransferFiles] = useState<TransferFile[]>([]);

  // UI Drawer State for Mobile
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [mobileParticipantsOpen, setMobileParticipantsOpen] = useState(false);

  // Notifications
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [pingMs, setPingMs] = useState(32);
  const [isP2PConnected, setIsP2PConnected] = useState(false);

  // Save settings when changed
  useEffect(() => {
    localStorage.setItem('palorni_app_settings', JSON.stringify(settings));
  }, [settings]);


  // WebRTC & Signaling Instances
  const signalingRef = useRef<SignalingProvider | null>(null);
  const webrtcRef = useRef<WebRTCManager | null>(null);

  // Local Streams State
  const [localAudioStream, setLocalAudioStream] = useState<MediaStream | null>(null);
  const [localVideoStream, setLocalVideoStream] = useState<MediaStream | null>(null);
  const [localScreenStream, setLocalScreenStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());

  // Check URL room param on mount & Register SW
  const [urlRoomId, setUrlRoomId] = useState('');

  useEffect(() => {
    registerServiceWorker();
    subscribeInstallState((canInstall) => setCanInstallPWA(canInstall));

    const params = new URLSearchParams(window.location.search);
    const roomFromUrl = params.get('room');
    if (roomFromUrl) {
      setUrlRoomId(roomFromUrl.toUpperCase());
    }
  }, []);

  // Save recent rooms
  const addRecentRoom = (roomId: string) => {
    setRecentRooms((prev) => {
      const updated = [roomId, ...prev.filter((r) => r !== roomId)].slice(0, 5);
      localStorage.setItem('palorni_recent_rooms', JSON.stringify(updated));
      return updated;
    });
  };

  const addNotification = (title: string, message: string, type: 'info' | 'success' | 'warning' | 'alert' = 'info') => {
    const newNotif: ToastNotification = {
      id: `notif-${Date.now()}-${Math.random()}`,
      title,
      message,
      type,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setNotifications((prev) => [newNotif, ...prev].slice(0, 4));
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== newNotif.id));
    }, 5000);
  };

  // --- JOIN / CREATE ROOM ---
  const handleJoinOrCreateRoom = async (roomId: string, userName: string, isCreate: boolean = false) => {
    localStorage.setItem('palorni_user_name', userName);
    setCurrentUser((prev) => ({ ...prev, name: userName }));

    // Initialize WebRTC Manager
    const webrtc = new WebRTCManager(peerId, {
      onRemoteStream: (remotePeerId, stream) => {
        setRemoteStreams((prev) => new Map(prev).set(remotePeerId, stream));
      },
      onRemoteStreamRemoved: (remotePeerId) => {
        setRemoteStreams((prev) => {
          const updated = new Map(prev);
          updated.delete(remotePeerId);
          return updated;
        });
      },
      onChatMessage: (remotePeerId, msgData) => {
        setMessages((prev) => [...prev, msgData]);
      },
      onFileChunkProgress: (fileMeta) => {
        setTransferFiles((prev) => {
          const idx = prev.findIndex((f) => f.id === fileMeta.id);
          if (idx >= 0) {
            const updated = [...prev];
            updated[idx] = fileMeta;
            return updated;
          }
          return [...prev, fileMeta];
        });
      },
      onFileReceived: (fileMeta) => {
        addNotification('Arquivo Recebido! 📎', `${fileMeta.name} (${(fileMeta.size / 1024 / 1024).toFixed(2)} MB)`, 'success');
      },
      onSpeakingStateChange: (speakingPeerId, isSpeaking) => {
        setUsers((prev) =>
          prev.map((u) => (u.id === speakingPeerId ? { ...u, isSpeaking } : u))
        );
      },
    });

    webrtcRef.current = webrtc;

    // Initialize Signaling
    const signaling = new SignalingProvider(settings.signalingServerUrl);
    signalingRef.current = signaling;

    // Attach signaling callbacks
    signaling.on('joined', (data) => {
      const { roomId: rId, isHost, hostPeerId, clients } = data;
      const room: RoomInfo = {
        id: rId,
        name: `Sala ${rId}`,
        hostPeerId,
        locked: false,
        createdTime: Date.now(),
        activeChannel: 'geral',
      };

      setCurrentRoom(room);
      addRecentRoom(rId);
      setIsP2PConnected(true);

      setCurrentUser((prev) => ({ ...prev, isHost }));

      // Map users
      const formattedUsers: UserProfile[] = (clients || []).map((c: any) => ({
        id: c.peerId,
        name: c.userName,
        avatar: c.avatar || '👑',
        isHost: c.isHost,
        micMuted: false,
        cameraOff: true,
        isScreenSharing: false,
        isSpeaking: false,
        volume: 100,
      }));

      setUsers(formattedUsers.length ? formattedUsers : [{ ...currentUser, name: userName, isHost }]);

      addNotification(
        isCreate ? 'Sala Criada! 👑' : 'Entrou na Sala! 🚀',
        `Código da sala: ${rId}`,
        'success'
      );
    });

    signaling.on('user_joined', (data) => {
      const { peerId: newPeerId, userName: newName, isHost: newIsHost, clients } = data;
      addNotification('Novo Participante', `${newName} entrou na sala.`, 'info');

      if (clients) {
        setUsers(
          clients.map((c: any) => ({
            id: c.peerId,
            name: c.userName,
            avatar: c.avatar || '👑',
            isHost: c.isHost,
            micMuted: false,
            cameraOff: true,
            isScreenSharing: false,
            isSpeaking: false,
            volume: 100,
          }))
        );
      }

      // WebRTC Offer Negotiation
      if (webrtcRef.current) {
        const pc = webrtcRef.current.createPeerConnection(newPeerId, (candidate) => {
          signaling.sendIceCandidate(roomId, peerId, newPeerId, candidate);
        });
        const dc = webrtcRef.current.createDataChannel(newPeerId, pc);

        pc.createOffer().then((offer) => {
          pc.setLocalDescription(offer);
          signaling.sendOffer(roomId, peerId, newPeerId, offer);
        });
      }
    });

    signaling.on('signal', async (data) => {
      const { senderPeerId, signal } = data;
      if (!webrtcRef.current) return;

      const pc = webrtcRef.current.createPeerConnection(senderPeerId, (candidate) => {
        signaling.sendIceCandidate(roomId, peerId, senderPeerId, candidate);
      });

      if (signal.type === 'offer') {
        pc.ondatachannel = (e) => {
          webrtcRef.current?.setupDataChannel(senderPeerId, e.channel);
        };
        await pc.setRemoteDescription(new RTCSessionDescription(signal.offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        signaling.sendAnswer(roomId, peerId, senderPeerId, answer);
      } else if (signal.type === 'answer') {
        await pc.setRemoteDescription(new RTCSessionDescription(signal.answer));
      } else if (signal.type === 'candidate') {
        await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
      }
    });

    signaling.on('user_left', (data) => {
      const { peerId: leftPeerId, clients, newHostPeerId } = data;
      addNotification('Participante Saiu', 'Um usuário desconectou da sala.', 'warning');

      if (webrtcRef.current) {
        webrtcRef.current.closePeerConnection(leftPeerId);
      }

      if (clients) {
        setUsers(
          clients.map((c: any) => ({
            id: c.peerId,
            name: c.userName,
            avatar: c.avatar || '👑',
            isHost: c.isHost,
            micMuted: false,
            cameraOff: true,
            isScreenSharing: false,
            isSpeaking: false,
            volume: 100,
          }))
        );
      }

      if (newHostPeerId === peerId) {
        setCurrentUser((prev) => ({ ...prev, isHost: true }));
        addNotification('👑 Novo Host!', 'Você agora é o HOST da sala.', 'success');
      }
    });

    signaling.on('kicked', () => {
      handleLeaveRoom();
      addNotification('Removido', 'Você foi removido pelo HOST da sala.', 'alert');
    });

    signaling.on('host_transferred', (data) => {
      const { newHostPeerId, clients } = data;
      const isMeNewHost = newHostPeerId === peerId;
      setCurrentUser((prev) => ({ ...prev, isHost: isMeNewHost }));
      addNotification('Host Transferido', isMeNewHost ? 'Você agora é o HOST da sala 👑' : 'O HOST da sala mudou.', 'info');

      if (clients) {
        setUsers(
          clients.map((c: any) => ({
            id: c.peerId,
            name: c.userName,
            avatar: c.avatar || '👑',
            isHost: c.isHost,
            micMuted: false,
            cameraOff: true,
            isScreenSharing: false,
            isSpeaking: false,
            volume: 100,
          }))
        );
      }
    });

    signaling.on('room_locked', (data) => {
      setCurrentRoom((prev) => (prev ? { ...prev, locked: data.locked } : null));
      addNotification('Status da Sala', data.locked ? 'A sala foi bloqueada.' : 'A sala foi desbloqueada.', 'warning');
    });

    // Connect signaling
    await signaling.connect(roomId, peerId, userName, currentUser.avatar, settings.demoMode);
  };

  const handleCreateRoom = (userName: string) => {
    const randomCode = `NX-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    handleJoinOrCreateRoom(randomCode, userName, true);
  };

  const handleJoinRoom = (code: string, userName: string) => {
    handleJoinOrCreateRoom(code, userName, false);
  };

  const handleLeaveRoom = () => {
    if (signalingRef.current) {
      signalingRef.current.disconnect();
      signalingRef.current = null;
    }
    if (webrtcRef.current) {
      webrtcRef.current.destroy();
      webrtcRef.current = null;
    }
    setCurrentRoom(null);
    setUsers([]);
    setMessages([]);
    setTransferFiles([]);
    setIsP2PConnected(false);
    setLocalAudioStream(null);
    setLocalVideoStream(null);
    setLocalScreenStream(null);
  };

  // --- MEDIA CONTROLS ---
  const handleToggleMic = async () => {
    if (!webrtcRef.current) return;
    if (currentUser.micMuted) {
      const stream = await webrtcRef.current.enableMicrophone(settings.selectedMic);
      setLocalAudioStream(stream);
      setCurrentUser((prev) => ({ ...prev, micMuted: false }));
    } else {
      webrtcRef.current.disableMicrophone();
      setCurrentUser((prev) => ({ ...prev, micMuted: true }));
    }
  };

  const handleToggleCam = async () => {
    if (!webrtcRef.current) return;
    if (currentUser.cameraOff) {
      const stream = await webrtcRef.current.enableCamera(settings.selectedCam, settings.camResolution);
      setLocalVideoStream(stream);
      setCurrentUser((prev) => ({ ...prev, cameraOff: false }));
    } else {
      webrtcRef.current.disableCamera();
      setLocalVideoStream(null);
      setCurrentUser((prev) => ({ ...prev, cameraOff: true }));
    }
  };

  const handleToggleScreenShare = async () => {
    if (!webrtcRef.current) return;
    if (!currentUser.isScreenSharing) {
      const stream = await webrtcRef.current.startScreenShare();
      setLocalScreenStream(stream);
      setCurrentUser((prev) => ({ ...prev, isScreenSharing: true }));
      addNotification('Compartilhamento de Tela', 'Iniciado com sucesso! 🖥', 'success');
    } else {
      webrtcRef.current.stopScreenShare();
      setLocalScreenStream(null);
      setCurrentUser((prev) => ({ ...prev, isScreenSharing: false }));
    }
  };

  const handleSendMessage = (text: string) => {
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: peerId,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, newMsg]);

    if (webrtcRef.current) {
      webrtcRef.current.sendChatMessage(newMsg);
    }
  };

  const handleSendFile = async (file: File) => {
    if (!webrtcRef.current) return;
    addNotification('Enviando Arquivo P2P 📎', `${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`, 'info');

    const fileMeta: TransferFile = {
      id: `file-${Date.now()}`,
      name: file.name,
      size: file.size,
      type: file.type,
      progress: 0,
      status: 'downloading',
      senderName: currentUser.name,
    };

    setTransferFiles((prev) => [...prev, fileMeta]);

    await webrtcRef.current.sendFile(file, currentUser.name, (progress) => {
      setTransferFiles((prev) => {
        const idx = prev.findIndex((f) => f.id === fileMeta.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx].progress = progress;
          if (progress >= 100) {
            updated[idx].status = 'completed';
          }
          return updated;
        }
        return prev;
      });
    });
  };

  // --- HOST CONTROLS ---
  const handleLockRoom = (locked: boolean) => {
    if (signalingRef.current && currentRoom) {
      signalingRef.current.lockRoom(currentRoom.id, peerId, locked);
    }
  };

  const handleKickUser = (targetPeerId: string) => {
    if (signalingRef.current && currentRoom) {
      signalingRef.current.kickUser(currentRoom.id, peerId, targetPeerId);
    }
  };

  const handleTransferHost = (targetPeerId: string) => {
    if (signalingRef.current && currentRoom) {
      signalingRef.current.transferHost(currentRoom.id, peerId, targetPeerId);
    }
  };

  const handleCopyRoomCode = () => {
    if (!currentRoom) return;
    navigator.clipboard.writeText(currentRoom.id);
    setCopiedCode(true);
    addNotification('Código Copiado! 📋', `Código da sala (${currentRoom.id}) copiado para a área de transferência.`, 'success');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyInvite = () => {
    if (!currentRoom) return;
    const inviteUrl = `${window.location.origin}/?room=${currentRoom.id}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedInvite(true);
    addNotification('Link Copiado! 🔗', `Link da sala (${currentRoom.id}) copiado.`, 'success');
    setTimeout(() => setCopiedInvite(false), 2000);
  };

  const activeScreenSharer = users.find((u) => u.isScreenSharing);

  return (
    <div className={`theme-${settings.theme} w-screen h-screen flex flex-col bg-[#0B0C10] text-gray-100 overflow-hidden font-['Plus_Jakarta_Sans',sans-serif] transition-colors duration-300`}>
      {/* Header */}
      <Header
        roomInfo={currentRoom}
        userCount={users.length}
        pingMs={pingMs}
        isP2PConnected={isP2PConnected}
        canInstallPWA={canInstallPWA}
        onInstallPWA={() => setShowInstallModal(true)}
        onOpenSettings={() => setShowSettingsModal(true)}
        onCopyRoomCode={handleCopyRoomCode}
        copiedCode={copiedCode}
        onCopyInvite={handleCopyInvite}
        copiedInvite={copiedInvite}
        settings={settings}
        onToggleDemoMode={() => setSettings((s) => ({ ...s, demoMode: !s.demoMode }))}
        onOpenDiagnostics={() => setShowDiagnosticModal(true)}
      />

      {/* Main Body */}
      {!currentRoom ? (
        <WelcomeScreen
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          initialRoomId={urlRoomId}
          demoMode={settings.demoMode}
          onToggleDemoMode={() => setSettings((s) => ({ ...s, demoMode: !s.demoMode }))}
        />
      ) : (
        <div className="flex-1 flex overflow-hidden relative">
          {/* Left Discord/Gamer Sidebar */}
          <Sidebar
            currentRoom={currentRoom}
            activeChannel={activeChannel}
            onSelectChannel={setActiveChannel}
            recentRooms={recentRooms}
            onSelectRoom={(rId) => handleJoinOrCreateRoom(rId, currentUser.name)}
            onCreateNewRoom={() => handleCreateRoom(currentUser.name)}
            currentUser={currentUser}
            onToggleMic={handleToggleMic}
            onToggleCam={handleToggleCam}
            isMobileOpen={mobileSidebarOpen}
            onCloseMobile={() => setMobileSidebarOpen(false)}
            onCopyRoomCode={handleCopyRoomCode}
            onCopyInvite={handleCopyInvite}
            copiedCode={copiedCode}
            copiedInvite={copiedInvite}
          />

          {/* Middle Stage: Media Grid or Chat Area depending on active channel */}
          <main className="flex-1 h-full flex flex-col bg-[#0D0E15] overflow-hidden relative">
            {activeChannel === 'geral' ? (
              <MediaGrid
                users={users}
                localStream={localVideoStream}
                localScreenStream={localScreenStream}
                remoteStreams={remoteStreams}
                activeScreenSharer={activeScreenSharer}
                currentUserId={peerId}
              />
            ) : (
              <ChatArea
                channelName={activeChannel}
                messages={messages}
                onSendMessage={handleSendMessage}
                onSendFile={handleSendFile}
                transferFiles={transferFiles}
              />
            )}
          </main>

          {/* Right Participants Panel */}
          <ParticipantsPanel
            users={users}
            currentUserId={peerId}
            isHost={currentUser.isHost}
            isRoomLocked={!!currentRoom?.locked}
            onLockRoom={handleLockRoom}
            onKickUser={handleKickUser}
            onTransferHost={handleTransferHost}
            isMobileOpen={mobileParticipantsOpen}
            onCloseMobile={() => setMobileParticipantsOpen(false)}
          />
        </div>
      )}

      {/* Floating Bottom Control Bar if in room */}
      {currentRoom && (
        <ControlBar
          currentUser={currentUser}
          onToggleMic={handleToggleMic}
          onToggleCam={handleToggleCam}
          onToggleScreenShare={handleToggleScreenShare}
          onAttachFile={() => {
            setActiveChannel('chat');
            addNotification('Aviso', 'Utilize o botão de anexo no chat para enviar arquivos.', 'info');
          }}
          onOpenSettings={() => setShowSettingsModal(true)}
          onLeaveRoom={handleLeaveRoom}
          onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          onToggleMobileParticipants={() => setMobileParticipantsOpen(!mobileParticipantsOpen)}
        />
      )}

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        settings={settings}
        onUpdateSettings={(newS) => setSettings((s) => ({ ...s, ...newS }))}
        pingMs={pingMs}
      />

      {/* PWA Install Modal */}
      <InstallPromptModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
        onConfirmInstall={async () => {
          const installed = await promptPWAInstall();
          if (installed) {
            addNotification('Sucesso!', 'Palorni Nexus foi instalado!', 'success');
          }
          setShowInstallModal(false);
        }}
      />

      {/* Windows 11 Toast Notifications */}
      <ToastNotifications
        notifications={notifications}
        onDismiss={(id) => setNotifications((prev) => prev.filter((n) => n.id !== id))}
      />
    </div>
  );
}
