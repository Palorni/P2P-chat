let deferredPrompt: any = null;
let installListeners: Array<(canInstall: boolean) => void> = [];

export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      const swUrl = import.meta.env.BASE_URL ? `${import.meta.env.BASE_URL}sw.js` : './sw.js';
      navigator.serviceWorker
        .register(swUrl)
        .then((reg) => {
          console.log('[Palorni Nexus] ServiceWorker registered with scope:', reg.scope);
          reg.onupdatefound = () => {
            const installingWorker = reg.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('[Palorni Nexus] New update available! Reloading recommended.');
                }
              };
            }
          };
        })
        .catch((err) => {
          console.warn('[Palorni Nexus] ServiceWorker registration failed:', err);
        });
    });
  }

  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    deferredPrompt = e;
    notifyListeners(true);
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    notifyListeners(false);
    console.log('[Palorni Nexus] App successfully installed!');
  });
}

export function canInstallPWA(): boolean {
  return !!deferredPrompt;
}

export async function promptPWAInstall(): Promise<boolean> {
  if (!deferredPrompt) return false;
  try {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    notifyListeners(false);
    return outcome === 'accepted';
  } catch (err) {
    console.error('[Palorni Nexus] Install prompt error:', err);
    return false;
  }
}

export function subscribeInstallState(callback: (canInstall: boolean) => void) {
  installListeners.push(callback);
  callback(canInstallPWA());
  return () => {
    installListeners = installListeners.filter((cb) => cb !== callback);
  };
}

function notifyListeners(state: boolean) {
  installListeners.forEach((cb) => cb(state));
}
