import { useEffect, useState, useCallback } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(() => {
    if (typeof window !== 'undefined' && (window as unknown as { __pwaDeferredPrompt?: BeforeInstallPromptEvent }).__pwaDeferredPrompt) {
      return (window as unknown as { __pwaDeferredPrompt?: BeforeInstallPromptEvent }).__pwaDeferredPrompt || null;
    }
    return null;
  });

  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect standalone mode (already installed or running outside browser window)
    const checkStandalone = () => {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        window.matchMedia('(display-mode: fullscreen)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
        document.referrer.includes('android-app://');
      setIsInstalled(isStandalone);
    };

    checkStandalone();

    // Check if early capture in index.html already recorded the prompt
    if (typeof window !== 'undefined' && (window as unknown as { __pwaDeferredPrompt?: BeforeInstallPromptEvent }).__pwaDeferredPrompt) {
      setDeferredPrompt((window as unknown as { __pwaDeferredPrompt?: BeforeInstallPromptEvent }).__pwaDeferredPrompt || null);
    }

    // Detect iOS devices
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent browser's default mini-infobar on mobile
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      (window as unknown as { __pwaDeferredPrompt?: BeforeInstallPromptEvent }).__pwaDeferredPrompt = promptEvent;
      setDeferredPrompt(promptEvent);
    };

    const handlePromptReady = () => {
      const promptEvent = (window as unknown as { __pwaDeferredPrompt?: BeforeInstallPromptEvent }).__pwaDeferredPrompt;
      if (promptEvent) {
        setDeferredPrompt(promptEvent);
      }
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      (window as unknown as { __pwaDeferredPrompt?: BeforeInstallPromptEvent | null }).__pwaDeferredPrompt = null;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('pwa-prompt-ready', handlePromptReady);
    window.addEventListener('pwa-installed', handleAppInstalled);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('pwa-prompt-ready', handlePromptReady);
      window.removeEventListener('pwa-installed', handleAppInstalled);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installApp = useCallback(async () => {
    const prompt =
      deferredPrompt ||
      (typeof window !== 'undefined'
        ? (window as unknown as { __pwaDeferredPrompt?: BeforeInstallPromptEvent }).__pwaDeferredPrompt
        : null);

    if (!prompt) {
      return false;
    }

    try {
      await prompt.prompt();
      const choiceResult = await prompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
        if (typeof window !== 'undefined') {
          (window as unknown as { __pwaDeferredPrompt?: null }).__pwaDeferredPrompt = null;
        }
        return true;
      }
    } catch (err) {
      console.error('Error triggering PWA install prompt:', err);
    }
    return false;
  }, [deferredPrompt]);

  return {
    canInstall: !!deferredPrompt,
    isInstalled,
    isIOS,
    installApp,
  };
}
