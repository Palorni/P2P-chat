# PALORNI NEXUS 🛡️
> **Connect. Share. Directly.**

Palorni Nexus é um aplicativo de comunicação P2P (Peer-to-Peer) moderno, instalável como PWA (Progressive Web App). Sua estética original une a organização funcional do Discord (canais, salas e sidebar), a sensação competitiva HUD do Fortnite (badges, iluminação neon, lobby gamer e contadores) e o design elegante do Windows 11 (efeitos mica/glassmorphism, cantos arredondados e notificações fluidas).

---

## 🚀 Principais Funcionalidades

- **Comunicação P2P Nativa (WebRTC)**: Transmissão direta de áudio, vídeo, compartilhamento de tela e chat entre pares sem intermediação de servidores de mídia.
- **PWA Instalável**: Funciona em modo *standalone* no desktop e mobile, com carregamento offline da interface via Service Worker (`sw.js`).
- **Transferência P2P de Arquivos**: Envio fracionado em chunks via `RTCDataChannel` com barra de progresso e estimadores em tempo real.
- **Gerenciamento de Salas & HOST**: Sistema automático de eleição de 👑 HOST, migração de host na desconexão, bloqueio de sala, expulsão e links diretos de convite (`?room=NX-XXXXX`).
- **HUD Gamer & Notificações Windows 11**: Indicadores ao vivo de PING, P2P Connected, usuários na sala, detector de voz ativa e toasts estilo Windows 11.
- **Modo Demonstração (Demo Mode)**: Teste completo de menus, chamadas e chats simulados sem dependência obrigatória de servidor.

---

## 🛠️ Arquitetura de Arquivos

```
/
├── server.ts               # Servidor Express + WebSocket (Signaling Server) + Middleware Vite
├── index.html              # Shell HTML com suporte PWA, fontes Orbitron & Plus Jakarta
├── manifest.json           # Manifesto PWA completo (standalone, tema, ícones)
├── sw.js                   # Service Worker para cache offline e atualizações
├── package.json            # Scripts de dev, build e dependências
├── .env.example            # Variáveis de ambiente de referência
├── .gitignore              # Ignora arquivos locais e temporários
├── README.md               # Documentação técnica completa
└── src/
    ├── main.tsx            # Ponto de entrada React
    ├── App.tsx             # Orquestrador de estado global, mídia e salas
    ├── types.ts            # Interfaces TypeScript (UserProfile, RoomInfo, ChatMessage, TransferFile)
    ├── index.css           # Tailwind CSS 4 + customizações glassmorphic
    ├── lib/
    │   ├── pwa.ts          # Suporte a Service Worker e hook beforeinstallprompt
    │   ├── signaling.ts    # Provedor de sinalização via WebSocket
    │   └── webrtc.ts       # WebRTCManager (PeerConnection, DataChannel, Mídia, Chunking)
    └── components/
        ├── Header.tsx      # Barra superior HUD com status P2P, Ping, PWA e Settings
        ├── WelcomeScreen.tsx# Tela inicial / Lobby para criar ou entrar em salas
        ├── Sidebar.tsx     # Sidebar estilo Discord com salas recentes e canais
        ├── MediaGrid.tsx   # Visualização em grade de vídeo, áudio e tela cheia
        ├── ChatArea.tsx    # Chat P2P em tempo real com upload de arquivos e emojis
        ├── ParticipantsPanel.tsx # Lista de usuários com controles de HOST (kick/transfer)
        ├── ControlBar.tsx  # Dock inferior flutuante (Mic, Cam, Screen, File, Sair)
        ├── SettingsModal.tsx # Modal com abas (Áudio, Vídeo, Interface, WebRTC)
        ├── InstallPromptModal.tsx # Modal de instalação PWA estilo Windows 11
        └── ToastNotifications.tsx # Notificações ao vivo estilo Action Center Win11
```

---

## 💻 Como Executar Localmente

1. **Instalar dependências**:
   ```bash
   npm install
   ```

2. **Iniciar servidor de desenvolvimento (Signaling + Vite)**:
   ```bash
   npm run dev
   ```
   O aplicativo estará disponível em `http://localhost:3000`.

3. **Compilação e Execução de Produção**:
   ```bash
   npm run build
   npm start
   ```

---

## 📱 Instalação como PWA

O aplicativo suporta o evento `beforeinstallprompt`. Ao abrir no navegador (Chrome, Edge, Safari, Android ou iOS):
1. Clique no botão **"Instalar Nexus"** no cabeçalho ou modal de boas-vindas.
2. O aplicativo será instalado na sua área de trabalho / tela de início.
3. Quando aberto, funcionará no modo `standalone` sem barras do navegador.

---

## 🌐 Publicação no GitHub Pages

O frontend do Palorni Nexus é 100% estático e compatível com **GitHub Pages**:

1. Faça o build do projeto:
   ```bash
   npm run build
   ```
2. A pasta `dist/` gerada contém todos os arquivos estáticos (`index.html`, `manifest.json`, `sw.js`, assets).
3. Publique o conteúdo da pasta `dist/` na branch `gh-pages` ou no GitHub Actions.

---

## 📡 Configuração de Signaling, STUN e TURN

### Signaling (Servidor de Sinalização)
O WebRTC necessita de um servidor leve de sinalização apenas para trocar metadados iniciais (SDP Offers, Answers e ICE Candidates). O arquivo `server.ts` já inclui um servidor WebSocket integrado na rota `/ws`.
Caso deseje utilizar um servidor externo de sinalização, configure a URL na aba **Configurações > Conexão WebRTC** ou na variável de ambiente `SIGNALING_URL`.

### Servidores STUN & TURN
- **STUN (Gratuito / Padrão)**: O projeto utiliza por padrão os servidores STUN públicos da Google (`stun:stun.l.google.com:19302`). O STUN descobre os IPs públicos dos participantes em redes NAT comuns.
- **TURN (Relay)**: Em redes corporativas rígidas ou firewalls simétricos, o P2P direto pode ser bloqueado. Nesses casos, adicione suas credenciais de servidor TURN (ex: Coturn, Twilio, Cloudflare Calls) nas **Configurações > Conexão WebRTC**.

---

## 🔒 Segurança & Boas Práticas

1. **Sem Execução de HTML em Mensagens**: As mensagens do chat são escapadas e sanitizadas antes de serem renderizadas na interface, prevenindo ataques XSS.
2. **Gerenciamento de Memória**: Ao sair da sala ou fechar a aba, todas as instâncias de `RTCPeerConnection`, `RTCDataChannel` e faixas de áudio/vídeo (`MediaStreamTrack.stop()`) são devidamente encerradas para liberar a câmera e microfone.
3. **Segredos no Frontend**: Nunca coloque API keys privadas ou credenciais no código frontend.
