import React from 'react';
import { Download, Shield, X, CheckCircle2 } from 'lucide-react';

interface InstallPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmInstall: () => void;
}

export const InstallPromptModal: React.FC<InstallPromptModalProps> = ({
  isOpen,
  onClose,
  onConfirmInstall,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#12131C] border border-purple-500/30 rounded-3xl p-6 shadow-[0_0_50px_rgba(139,92,246,0.3)] relative text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-purple-600 via-pink-500 to-cyan-400 p-0.5 shadow-xl mb-4">
          <div className="w-full h-full bg-[#0B0C10] rounded-[14px] flex items-center justify-center">
            <Shield className="w-8 h-8 text-purple-400" />
          </div>
        </div>

        <h2 className="font-['Orbitron',sans-serif] font-black text-xl text-white mb-2">
          Instalar Palorni Nexus
        </h2>
        <p className="text-xs text-gray-400 leading-relaxed mb-6">
          Instale o aplicativo no seu dispositivo para abrir em modo standalone com alta performance, suporte offline e inicialização direta da área de trabalho.
        </p>

        <div className="space-y-2 mb-6 text-left bg-white/5 p-4 rounded-2xl border border-white/5 text-xs text-gray-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Execução standalone sem barra de navegação</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Acesso offline à interface e salas recentes</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Atalhos rápidos de áudio e vídeo</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="w-1/3 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-semibold text-xs border border-white/10"
          >
            AGORA NÃO
          </button>
          <button
            onClick={onConfirmInstall}
            className="w-2/3 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs shadow-lg shadow-purple-900/40 flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>INSTALAR AGORA</span>
          </button>
        </div>
      </div>
    </div>
  );
};
