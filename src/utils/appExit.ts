import { App as CapacitorApp } from '@capacitor/app';

declare global {
  interface Window {
    AndroidNativeRemote?: {
      enterPictureInPicture?: () => void;
      closeApp?: () => void;
    };
  }
}

/**
 * Cleanly exits the TV Remote application.
 * On native Android, it closes the app and removes it from the task stack.
 * In a web browser / preview, it triggers window.close() or returns false to show an exit screen.
 */
export async function closeRemoteApp(): Promise<boolean> {
  // 1. Check custom Android native bridge
  if (typeof window !== 'undefined' && window.AndroidNativeRemote?.closeApp) {
    try {
      window.AndroidNativeRemote.closeApp();
      return true;
    } catch {
      // fallback
    }
  }

  // 2. Check official Capacitor App plugin
  try {
    await CapacitorApp.exitApp();
    return true;
  } catch {
    // Not running in native Capacitor runtime
  }

  // 3. Fallback for browser
  try {
    window.close();
  } catch {
    // Ignored by browser security if not opened via window.open
  }

  return false;
}

/**
 * Triggers native Android Picture-in-Picture (PiP) mode
 * so the remote floats on top of WhatsApp, Gmail, YouTube, etc.
 */
export function enterNativePictureInPicture(): boolean {
  if (typeof window !== 'undefined' && window.AndroidNativeRemote?.enterPictureInPicture) {
    try {
      window.AndroidNativeRemote.enterPictureInPicture();
      return true;
    } catch {
      return false;
    }
  }
  return false;
}
