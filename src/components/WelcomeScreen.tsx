import React, { useState, useEffect } from 'react';
import { Shield, Plus, LogIn, Cpu, Lock, Sparkles, User, Play, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

interface WelcomeScreenProps {
  onCreateRoom: (userName: string) => void;
  onJoinRoom: (roomId: string, userName: string) => void;
  initialRoomId?: string;
  demoMode: boolean;
  onToggleDemoMode: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onCreateRoom,
  onJoinRoom,
  initialRoomId = '',
  demoMode,
  onToggleDemoMode,
}) => {
  const [roomCode, setRoomCode] = useState(initialRoomId);
  const [userName, setUserName] = useState('');
  const [step, setStep] = useState<'action' | 'nickname'>('action');
  const [actionType, setActionType] = useState<'create' | 'join'>('create');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (initialRoomId) {
      setRoomCode(initialRoomId);
      setActionType('join');
    }
  }, [initialRoomId]);

  const handleStartCreate = () => {
    setActionType('create');
    setStep('nickname');
  };

  const handleStartJoin = () => {
    if (!roomCode.trim()) {
      setErrorMsg('Por favor, informe o código da sala ou link de convite.');
      return;
    }
    setErrorMsg('');
    setActionType('join');
    setStep('nickname');
  };

  const handleConfirmName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim()) {
      setErrorMsg('Por favor, digite seu nome de usuário.');
      return;
    }
    setErrorMsg('');
    if (actionType === 'create') {
      onCreateRoom(userName.trim());
    } else {
      // Extract code if user pasted a full URL
      let cleanCode = roomCode.trim();
      if (cleanCode.includes('room=')) {
        cleanCode = cleanCode.split('room=')[1].split('&')[0];
      }
      onJoinRoom(cleanCode.toUpperCase(), userName.trim());
    }
  };

  return (
    <div className="relative w-full h-[calc(100vh-3.5rem)] bg-[#0B0C10] flex items-center justify-center p-4 overflow-hidden">
      {/* Background Fortnite & Win11 Neon Lighting Gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-10 right-10 w-[400px] h-[400px] bg-pink-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Glassmorphic Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-xl bg-[#12131C]/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-10"
      >
        {/* Logo Banner */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 via-pink-500 to-cyan-400 p-0.5 shadow-[0_0_30px_rgba(168,85,247,0.4)] mb-4">
            <div className="w-full h-full bg-[#0B0C10] rounded-[14px] flex items-center justify-center">
              <Shield className="w-9 h-9 text-purple-400" />
            </div>
          </div>

          <h1 className="font-['Orbitron',sans-serif] font-black text-3xl sm:text-4xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-300 to-cyan-300">
            PALORNI NEXUS
          </h1>
          <p className="text-sm font-semibold text-purple-300/80 tracking-widest mt-1 uppercase">
            Connect. Share. Directly.
          </p>
        </div>

        {/* Action Form Step */}
        {step === 'action' ? (
          <div className="space-y-6">
            {/* Create Room Button */}
            <button
              onClick={handleStartCreate}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-500 hover:via-pink-500 hover:to-purple-500 text-white font-['Orbitron',sans-serif] font-bold tracking-wider text-base shadow-[0_0_25px_rgba(168,85,247,0.35)] transition-all transform active:scale-98 flex items-center justify-center gap-3 group"
            >
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
              <span>CRIAR SALA</span>
            </button>

            {/* Divider */}
            <div className="relative flex items-center justify-center">
              <div className="w-full border-t border-white/10" />
              <span className="absolute bg-[#12131C] px-3 text-xs text-gray-500 uppercase font-semibold">
                ou entrar em uma sala existente
              </span>
            </div>

            {/* Join Room Box */}
            <div className="space-y-3">
              <div className="relative">
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => {
                    setRoomCode(e.target.value);
                    setErrorMsg('');
                  }}
                  placeholder="Código da sala ou link de convite (ex: NX-7F92K)"
                  className="w-full bg-white/5 border border-white/10 focus:border-purple-500/80 rounded-xl px-4 py-3.5 text-sm text-white placeholder-gray-500 outline-none transition-all uppercase tracking-wider font-mono"
                />
              </div>

              <button
                onClick={handleStartJoin}
                className="w-full py-3.5 px-6 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-semibold text-sm transition-all active:scale-98 flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4 text-cyan-400" />
                <span>ENTRAR EM SALA</span>
              </button>
            </div>

            {errorMsg && (
              <p className="text-xs text-rose-400 font-medium text-center bg-rose-500/10 py-2 px-3 rounded-lg border border-rose-500/20">
                {errorMsg}
              </p>
            )}

            {/* P2P Feature Highlights */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10 text-center">
              <div className="p-2 bg-white/5 rounded-xl border border-white/5 flex flex-col items-center">
                <Cpu className="w-4 h-4 text-purple-400 mb-1" />
                <span className="text-[11px] font-semibold text-gray-300">Comunicação P2P</span>
              </div>
              <div className="p-2 bg-white/5 rounded-xl border border-white/5 flex flex-col items-center">
                <Lock className="w-4 h-4 text-pink-400 mb-1" />
                <span className="text-[11px] font-semibold text-gray-300">Sem Servidor Mídia</span>
              </div>
              <div className="p-2 bg-white/5 rounded-xl border border-white/5 flex flex-col items-center">
                <Sparkles className="w-4 h-4 text-cyan-400 mb-1" />
                <span className="text-[11px] font-semibold text-gray-300">Conexão Direta</span>
              </div>
            </div>

            {/* Demo Mode Selector */}
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10 text-xs">
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4 text-amber-400" />
                <div>
                  <div className="font-semibold text-gray-200">Modo Demonstração (Demo)</div>
                  <div className="text-[10px] text-gray-400">Navegue na interface sem precisar de signaling ativo</div>
                </div>
              </div>
              <button
                onClick={onToggleDemoMode}
                className={`relative w-11 h-6 rounded-full transition-colors p-0.5 ${
                  demoMode ? 'bg-amber-500' : 'bg-gray-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    demoMode ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        ) : (
          /* Nickname Step */
          <form onSubmit={handleConfirmName} className="space-y-6">
            <div className="text-center space-y-1">
              <h2 className="text-lg font-bold text-white">Como devemos chamar você?</h2>
              <p className="text-xs text-gray-400">
                {actionType === 'create'
                  ? 'Você será o 👑 HOST da nova sala.'
                  : `Entrando na sala ${roomCode.toUpperCase()}`}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-purple-400" />
                <span>Seu Nome de Usuário</span>
              </label>
              <input
                type="text"
                autoFocus
                value={userName}
                onChange={(e) => {
                  setUserName(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="Ex: Paulo Gamer"
                className="w-full bg-white/5 border border-white/10 focus:border-purple-500 rounded-xl px-4 py-3.5 text-sm text-white placeholder-gray-500 outline-none"
              />
            </div>

            {errorMsg && (
              <p className="text-xs text-rose-400 font-medium text-center bg-rose-500/10 py-2 px-3 rounded-lg border border-rose-500/20">
                {errorMsg}
              </p>
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStep('action')}
                className="w-1/3 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-xs font-semibold"
              >
                VOLTAR
              </button>
              <button
                type="submit"
                className="w-2/3 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-sm shadow-lg shadow-purple-900/40 flex items-center justify-center gap-2"
              >
                <span>ENTRAR</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
};
