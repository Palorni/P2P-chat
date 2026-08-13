import React, { useState } from 'react';
import { X, Copy, Check, ArrowRight, ShieldCheck, QrCode, RefreshCw } from 'lucide-react';

interface ManualP2PModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerateOffer: () => Promise<string>;
  onProcessOffer: (offerCode: string) => Promise<string>;
  onApplyAnswer: (answerCode: string) => Promise<boolean>;
  onAddIceCandidate?: (candidateCode: string) => void;
}

export const ManualP2PModal: React.FC<ManualP2PModalProps> = ({
  isOpen,
  onClose,
  onGenerateOffer,
  onProcessOffer,
  onApplyAnswer,
}) => {
  const [step, setStep] = useState<'choose' | 'offer' | 'answer'>('choose');
  const [generatedOffer, setGeneratedOffer] = useState('');
  const [inputOffer, setInputOffer] = useState('');
  const [generatedAnswer, setGeneratedAnswer] = useState('');
  const [inputAnswer, setInputAnswer] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'info' | 'success' | 'error' } | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleStartOffer = async () => {
    setLoading(true);
    try {
      const code = await onGenerateOffer();
      setGeneratedOffer(code);
      setStep('offer');
      setStatusMsg({ text: 'Código de Oferta P2P gerado com sucesso!', type: 'info' });
    } catch (e: any) {
      setStatusMsg({ text: 'Erro ao gerar oferta: ' + e.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAnswer = async () => {
    if (!inputOffer.trim()) {
      setStatusMsg({ text: 'Cole o Código de Oferta recebido do outro dispositivo.', type: 'error' });
      return;
    }
    setLoading(true);
    try {
      const answerCode = await onProcessOffer(inputOffer.trim());
      setGeneratedAnswer(answerCode);
      setStatusMsg({ text: 'Resposta gerada! Copie e envie de volta para o primeiro dispositivo.', type: 'success' });
    } catch (e: any) {
      setStatusMsg({ text: 'Código de oferta inválido ou corrompido.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleFinalizeAnswer = async () => {
    if (!inputAnswer.trim()) {
      setStatusMsg({ text: 'Cole o Código de Resposta gerado pelo segundo dispositivo.', type: 'error' });
      return;
    }
    setLoading(true);
    try {
      const ok = await onApplyAnswer(inputAnswer.trim());
      if (ok) {
        setStatusMsg({ text: '🎉 Conexão P2P estabelecida com sucesso!', type: 'success' });
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setStatusMsg({ text: 'Não foi possível conectar. Tente gerar uma nova oferta.', type: 'error' });
      }
    } catch (e: any) {
      setStatusMsg({ text: 'Erro ao aplicar resposta: ' + e.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-[#12131C] border border-purple-500/30 rounded-3xl p-6 max-w-xl w-full shadow-2xl relative text-white flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-tr from-purple-600 to-pink-500 rounded-xl text-white">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Modo Conexão P2P Manual</h3>
              <p className="text-xs text-purple-300/80">
                Conecte dois dispositivos via WebRTC sem depender de nenhum servidor externo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Alert */}
        {statusMsg && (
          <div
            className={`p-3 rounded-2xl text-xs font-semibold flex items-center gap-2 border ${
              statusMsg.type === 'success'
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                : statusMsg.type === 'error'
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                : 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
            }`}
          >
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* STEP 1: Choose Role */}
        {step === 'choose' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-2">
            <button
              onClick={handleStartOffer}
              disabled={loading}
              className="p-5 rounded-2xl bg-gradient-to-br from-purple-900/40 to-pink-900/40 border border-purple-500/40 hover:border-purple-400 text-left transition-all active:scale-95 group flex flex-col justify-between h-40"
            >
              <div>
                <span className="text-xs font-bold text-purple-400 uppercase tracking-wider block mb-1">
                  Dispositivo A (Criador)
                </span>
                <h4 className="font-bold text-base text-white group-hover:text-purple-300 transition-colors">
                  Gerar Código de Conexão
                </h4>
                <p className="text-xs text-gray-400 mt-1">
                  Cria uma oferta P2P criptografada para enviar ao outro dispositivo.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-purple-300 mt-3">
                <span>Criar Oferta</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            <button
              onClick={() => setStep('answer')}
              className="p-5 rounded-2xl bg-gradient-to-br from-cyan-900/40 to-teal-900/40 border border-cyan-500/40 hover:border-cyan-400 text-left transition-all active:scale-95 group flex flex-col justify-between h-40"
            >
              <div>
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider block mb-1">
                  Dispositivo B (Participante)
                </span>
                <h4 className="font-bold text-base text-white group-hover:text-cyan-300 transition-colors">
                  Inserir Código do Amigo
                </h4>
                <p className="text-xs text-gray-400 mt-1">
                  Cole o código gerado pelo Dispositivo A para aceitar a chamada.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300 mt-3">
                <span>Cole & Conecte</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </div>
        )}

        {/* STEP 2: Device A Offer Flow */}
        {step === 'offer' && (
          <div className="flex flex-col gap-4">
            <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
              <label className="text-xs font-bold text-purple-300 uppercase tracking-wider block mb-2">
                1. Seu Código de Oferta (Copie e envie ao parceiro):
              </label>
              <div className="relative">
                <textarea
                  readOnly
                  value={generatedOffer}
                  rows={3}
                  className="w-full bg-black/50 text-[11px] font-mono text-purple-200 p-3 rounded-xl border border-white/10 outline-none resize-none pr-10"
                />
                <button
                  onClick={() => handleCopy(generatedOffer, 'offer')}
                  className="absolute top-2 right-2 p-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  {copied === 'offer' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied === 'offer' ? 'Copiado!' : 'Copiar'}</span>
                </button>
              </div>
            </div>

            <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
              <label className="text-xs font-bold text-cyan-300 uppercase tracking-wider block mb-2">
                2. Cole o Código de Resposta (Recebido do parceiro):
              </label>
              <textarea
                value={inputAnswer}
                onChange={(e) => setInputAnswer(e.target.value)}
                placeholder="Cole aqui o código de resposta do segundo dispositivo..."
                rows={3}
                className="w-full bg-black/50 text-[11px] font-mono text-cyan-200 p-3 rounded-xl border border-white/10 outline-none resize-none focus:border-cyan-400 transition-colors"
              />
              <button
                onClick={handleFinalizeAnswer}
                disabled={loading || !inputAnswer.trim()}
                className="mt-3 w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                <span>Finalizar Conexão P2P</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Device B Answer Flow */}
        {step === 'answer' && (
          <div className="flex flex-col gap-4">
            <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
              <label className="text-xs font-bold text-cyan-300 uppercase tracking-wider block mb-2">
                1. Cole o Código de Oferta recebido do Dispositivo A:
              </label>
              <textarea
                value={inputOffer}
                onChange={(e) => setInputOffer(e.target.value)}
                placeholder="Cole aqui o código de oferta gerado pelo Dispositivo A..."
                rows={3}
                className="w-full bg-black/50 text-[11px] font-mono text-cyan-200 p-3 rounded-xl border border-white/10 outline-none resize-none focus:border-cyan-400 transition-colors"
              />
              <button
                onClick={handleCreateAnswer}
                disabled={loading || !inputOffer.trim()}
                className="mt-3 w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl text-xs font-bold shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                <span>Gerar Resposta P2P</span>
              </button>
            </div>

            {generatedAnswer && (
              <div className="bg-white/5 p-4 rounded-2xl border border-emerald-500/40">
                <label className="text-xs font-bold text-emerald-300 uppercase tracking-wider block mb-2">
                  2. Seu Código de Resposta (Copie e envie ao Dispositivo A):
                </label>
                <div className="relative">
                  <textarea
                    readOnly
                    value={generatedAnswer}
                    rows={3}
                    className="w-full bg-black/50 text-[11px] font-mono text-emerald-200 p-3 rounded-xl border border-white/10 outline-none resize-none pr-10"
                  />
                  <button
                    onClick={() => handleCopy(generatedAnswer, 'answer')}
                    className="absolute top-2 right-2 p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    {copied === 'answer' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied === 'answer' ? 'Copiado!' : 'Copiar'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer info */}
        <div className="flex items-center justify-between text-[11px] text-gray-400 pt-2 border-t border-white/5">
          {step !== 'choose' && (
            <button
              onClick={() => setStep('choose')}
              className="hover:text-white underline font-semibold"
            >
              ← Voltar ao Início
            </button>
          )}
          <span>WebRTC P2P Seguro Direto no Navegador</span>
        </div>
      </div>
    </div>
  );
};
