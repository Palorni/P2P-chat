import React, { useState, useEffect } from 'react';
import { X, Volume2, Video, Sliders, ShieldCheck, Cpu, RefreshCw, Check } from 'lucide-react';
import { AppSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  pingMs: number;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  pingMs,
}) => {
  const [activeTab, setActiveTab] = useState<'audio' | 'video' | 'interface' | 'connection'>('audio');
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);

  useEffect(() => {
    if (isOpen && navigator.mediaDevices?.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices().then((devices) => {
        setAudioDevices(devices.filter((d) => d.kind === 'audioinput'));
        setVideoDevices(devices.filter((d) => d.kind === 'videoinput'));
      }).catch(console.warn);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-[#12131C] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row h-[500px]">
        {/* Left Tab Navigation */}
        <div className="w-full md:w-52 bg-[#0B0C10] p-4 border-b md:border-b-0 md:border-r border-white/10 flex flex-row md:flex-col gap-2 shrink-0 overflow-x-auto">
          <div className="hidden md:block pb-2 px-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            CONFIGURAÇÕES
          </div>

          <button
            onClick={() => setActiveTab('audio')}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'audio' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Volume2 className="w-4 h-4 text-purple-300" />
            <span>Áudio</span>
          </button>

          <button
            onClick={() => setActiveTab('video')}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'video' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Video className="w-4 h-4 text-cyan-300" />
            <span>Vídeo</span>
          </button>

          <button
            onClick={() => setActiveTab('interface')}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'interface' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Sliders className="w-4 h-4 text-pink-300" />
            <span>Interface</span>
          </button>

          <button
            onClick={() => setActiveTab('connection')}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'connection' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-300" />
            <span>Conexão WebRTC</span>
          </button>
        </div>

        {/* Right Tab Content */}
        <div className="flex-1 p-6 flex flex-col justify-between overflow-y-auto relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="space-y-6">
            {/* Audio Settings */}
            {activeTab === 'audio' && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Volume2 className="w-5 h-5 text-purple-400" /> Dispositivos de Áudio
                </h3>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-300">Microfone de Entrada</label>
                  <select
                    value={settings.selectedMic}
                    onChange={(e) => onUpdateSettings({ selectedMic: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-purple-500"
                  >
                    <option value="">Microfone Padrão do Sistema</option>
                    {audioDevices.map((d, i) => (
                      <option key={d.deviceId || i} value={d.deviceId} className="bg-gray-900 text-white">
                        {d.label || `Microfone ${i + 1}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold text-gray-300">
                    <span>Volume Geral ({settings.volume}%)</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.volume}
                    onChange={(e) => onUpdateSettings({ volume: Number(e.target.value) })}
                    className="w-full accent-purple-500"
                  />
                </div>
              </div>
            )}

            {/* Video Settings */}
            {activeTab === 'video' && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Video className="w-5 h-5 text-cyan-400" /> Dispositivos de Vídeo
                </h3>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-300">Câmera de Entrada</label>
                  <select
                    value={settings.selectedCam}
                    onChange={(e) => onUpdateSettings({ selectedCam: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-cyan-500"
                  >
                    <option value="">Câmera Padrão do Sistema</option>
                    {videoDevices.map((d, i) => (
                      <option key={d.deviceId || i} value={d.deviceId} className="bg-gray-900 text-white">
                        {d.label || `Câmera ${i + 1}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-300">Resolução do Vídeo</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['480p', '720p', '1080p'] as const).map((res) => (
                      <button
                        key={res}
                        type="button"
                        onClick={() => onUpdateSettings({ camResolution: res })}
                        className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                          settings.camResolution === res
                            ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                            : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                        }`}
                      >
                        {res}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Interface Settings */}
            {activeTab === 'interface' && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-pink-400" /> Customização de Interface
                </h3>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-300">Tema Visual</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'dark', label: 'Dark Nexus' },
                      { id: 'synthwave', label: 'Fortnite Neon' },
                      { id: 'cyanide', label: 'Win11 Acrylic' },
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => onUpdateSettings({ theme: t.id as any })}
                        className={`py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all ${
                          settings.theme === t.id
                            ? 'bg-purple-600 border-purple-400 text-white'
                            : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold text-gray-300">
                    <span>Opacidade dos Painéis Glass ({settings.glassTransparency}%)</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="100"
                    value={settings.glassTransparency}
                    onChange={(e) => onUpdateSettings({ glassTransparency: Number(e.target.value) })}
                    className="w-full accent-pink-500"
                  />
                </div>
              </div>
            )}

            {/* Connection WebRTC Settings */}
            {activeTab === 'connection' && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" /> Servidores STUN / TURN
                </h3>

                <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-1 font-mono text-xs">
                  <div className="text-gray-400 text-[10px]">Servidores STUN Ativos:</div>
                  <div className="text-emerald-300 text-[11px]">stun:stun.l.google.com:19302</div>
                  <div className="text-emerald-300 text-[11px]">stun:stun1.l.google.com:19302</div>
                </div>

                <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl text-xs">
                  <div>
                    <div className="font-bold text-white">Status WebRTC / Ping</div>
                    <div className="text-[10px] text-gray-400">Latência estimada P2P</div>
                  </div>
                  <span className="font-mono font-bold text-cyan-300 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/30">
                    {pingMs} ms
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-white/10 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-900/30"
            >
              SALVAR E FECHAR
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
