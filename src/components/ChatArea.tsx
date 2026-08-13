import React, { useState, useRef, useEffect } from 'react';
import { Send, Smile, Paperclip, FileText, Download, CheckCircle2, AlertCircle, X, Mic } from 'lucide-react';
import { ChatMessage, TransferFile } from '../types';

interface ChatAreaProps {
  channelName: string;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onSendFile: (file: File) => void;
  transferFiles: TransferFile[];
}

const POPULAR_EMOJIS = ['😀', '🔥', '👑', '⚡', '🎮', '🚀', '💜', '😎', '👍', '🎉', '💯', '🎯'];

export const ChatArea: React.FC<ChatAreaProps> = ({
  channelName,
  messages,
  onSendMessage,
  onSendFile,
  transferFiles,
}) => {
  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, transferFiles]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
    setShowEmojiPicker(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onSendFile(e.target.files[0]);
      e.target.value = '';
    }
  };

  const addEmoji = (emoji: string) => {
    setInputText((prev) => prev + emoji);
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-[#0B0C10]/60 backdrop-blur-xl overflow-hidden border-r border-white/5 relative">
      {/* Header for Chat Channel */}
      <div className="h-12 px-4 border-b border-white/10 flex items-center justify-between bg-[#12131C]/60 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-purple-400 font-mono font-bold text-lg">#</span>
          <span className="font-bold text-sm text-white capitalize">{channelName}</span>
          <span className="text-[10px] text-gray-400 ml-2 hidden sm:inline">
            Mensagens P2P diretas via RTCDataChannel
          </span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-500">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-3 text-purple-400">
              #
            </div>
            <p className="text-sm font-semibold text-gray-300">Bem-vindo ao #{channelName}!</p>
            <p className="text-xs text-gray-500 max-w-xs mt-1">
              Este é o início da conversa P2P. Envie uma mensagem ou compartilhe arquivos diretamente.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="flex items-start gap-3 group">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-md">
                {msg.senderName ? msg.senderName.charAt(0).toUpperCase() : 'U'}
              </div>

              <div className="flex-1 overflow-hidden">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-bold text-white hover:underline cursor-pointer">
                    {msg.senderName}
                  </span>
                  <span className="text-[10px] text-gray-500 font-mono">{msg.timestamp}</span>
                </div>

                <div className="text-xs text-gray-200 mt-1 leading-relaxed break-words bg-white/5 p-2.5 rounded-xl border border-white/5 inline-block max-w-full">
                  {msg.text}
                </div>
              </div>
            </div>
          ))
        )}

        {/* Live File Transfers Progress Cards */}
        {transferFiles.map((file) => (
          <div
            key={file.id}
            className="p-3 bg-[#12131C]/90 border border-purple-500/30 rounded-xl flex items-center gap-3 shadow-md max-w-md"
          >
            <div className="p-2.5 rounded-lg bg-purple-600/20 text-purple-400 shrink-0">
              <FileText className="w-5 h-5" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between text-xs font-semibold text-white">
                <span className="truncate">{file.name}</span>
                <span className="font-mono text-[10px] text-gray-400 shrink-0 ml-2">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 bg-gray-800 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 transition-all duration-300"
                  style={{ width: `${file.progress}%` }}
                />
              </div>

              <div className="flex items-center justify-between mt-1 text-[10px] text-gray-400">
                <span>De: {file.senderName}</span>
                <span>{file.progress}%</span>
              </div>
            </div>

            {file.status === 'completed' && file.url && (
              <a
                href={file.url}
                download={file.name}
                className="p-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-400 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors shrink-0"
              >
                <Download className="w-4 h-4" />
                <span className="hidden xs:inline">Baixar</span>
              </a>
            )}
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Emoji Modal Picker */}
      {showEmojiPicker && (
        <div className="absolute bottom-20 left-4 z-30 p-3 bg-[#12131C] border border-white/10 rounded-2xl shadow-2xl backdrop-blur-2xl grid grid-cols-6 gap-2 w-64">
          <div className="col-span-6 flex items-center justify-between pb-2 border-b border-white/10 text-xs font-semibold text-gray-300">
            <span>Emojis Rápidos</span>
            <button onClick={() => setShowEmojiPicker(false)} className="text-gray-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          {POPULAR_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => addEmoji(emoji)}
              className="p-2 hover:bg-white/10 rounded-lg text-lg text-center transition-transform hover:scale-110"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Message Input Controls Bar */}
      <div className="p-3 bg-[#12131C]/90 border-t border-white/10 shrink-0">
        <div className="relative flex items-center bg-white/5 border border-white/10 focus-within:border-purple-500/80 rounded-2xl px-3 py-1.5 transition-all">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Enviar uma mensagem em #${channelName}...`}
            rows={1}
            className="w-full bg-transparent text-xs text-white placeholder-gray-500 outline-none resize-none py-2 pr-20"
          />

          <div className="absolute right-2 flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-amber-400 transition-colors"
              title="Emojis 😀"
            >
              <Smile className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-purple-400 transition-colors"
              title="Anexar arquivo P2P 📎"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />

            <button
              type="button"
              onClick={handleSend}
              disabled={!inputText.trim()}
              className="p-2 bg-gradient-to-tr from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-40 text-white rounded-xl shadow-md transition-all active:scale-95 ml-1"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
