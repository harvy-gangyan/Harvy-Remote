import { useState, useEffect, useCallback } from 'react';
import {
  TVDevice,
  CustomButton,
  RemoteSettings,
  StreamingApp,
  AppShortcut,
} from './types';
import {
  INITIAL_SAVED_TVS,
  DEMO_TV_IDS,
  getDefaultAppsForBrand,
  getDefaultShortcutsForBrand,
} from './data/defaultTVs';
import { INITIAL_CUSTOM_BUTTONS } from './data/defaultCustomButtons';
import { RemoteService } from './utils/remoteService';
import { RemoteShell } from './components/RemoteShell';
import { NoTVConnectedScreen } from './components/NoTVConnectedScreen';
import { CustomButtonModal } from './components/CustomButtonModal';
import { TVManagerModal } from './components/TVManagerModal';
import { KeyboardInputModal } from './components/KeyboardInputModal';
import { SettingsModal } from './components/SettingsModal';
import { FloatingMiniRemote } from './components/FloatingMiniRemote';
import { closeRemoteApp, enterNativePictureInPicture } from './utils/appExit';
import { CheckCircle2, Power, RotateCcw, Tv, Maximize2, Layers } from 'lucide-react';

const STORAGE_KEYS = {
  TVS: 'androidtv_saved_devices_v2',
  ACTIVE_TV: 'androidtv_active_device_id_v2',
  BUTTONS: 'androidtv_custom_buttons_v2',
  SETTINGS: 'androidtv_remote_settings_v2',
};

const DEFAULT_SETTINGS: RemoteSettings = {
  haptics: true,
  sound: true,
  vibrationIntensity: 'medium',
  touchpadSensitivity: 1.0,
  activeTab: 'myapps',
  simulateSuccessOnFailure: false, // Production: real network communication with physical TVs
};

export default function App() {
  // Saved TVs state - clean production initialization (no dummy demo TVs)
  const [devices, setDevices] = useState<TVDevice[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.TVS);
      if (stored) {
        const parsed: TVDevice[] = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Filter out demo TVs so real users get a fresh production environment
          const realDevices = parsed.filter((d) => !DEMO_TV_IDS.includes(d.id));
          if (realDevices.length > 0) {
            return realDevices.map((d) => ({
              ...d,
              installedApps: d.installedApps || getDefaultAppsForBrand(d.brand),
              quickShortcuts: d.quickShortcuts || getDefaultShortcutsForBrand(d.brand),
            }));
          }
        }
      }
    } catch {
      // fallback
    }
    return [
      {
        id: 'tv-tcl-192-168-1-66',
        name: 'TCL Smart TV',
        brand: 'tcl',
        model: 'TCL TV+ Android TV',
        ipAddress: '192.168.1.66',
        port: 4123,
        protocol: 'auto',
        isDefault: true,
        lastConnected: new Date().toISOString(),
        installedApps: getDefaultAppsForBrand('tcl'),
        quickShortcuts: getDefaultShortcutsForBrand('tcl'),
      },
    ];
  });

  // Active TV state
  const [activeDeviceId, setActiveDeviceId] = useState<string>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ACTIVE_TV);
      if (stored && !DEMO_TV_IDS.includes(stored)) return stored;
    } catch {
      // fallback
    }
    return 'tv-tcl-192-168-1-66';
  });

  // Custom Buttons state
  const [customButtons, setCustomButtons] = useState<CustomButton[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.BUTTONS);
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
    return INITIAL_CUSTOM_BUTTONS;
  });

  // Settings state
  const [settings, setSettings] = useState<RemoteSettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (stored) return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    } catch {
      // fallback
    }
    return DEFAULT_SETTINGS;
  });

  // Modals state
  const [isTVManagerOpen, setIsTVManagerOpen] = useState(false);
  const [tvManagerInitialTab, setTvManagerInitialTab] = useState<'saved' | 'scan' | 'manual' | 'diagnostic'>('saved');
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [editingCustomButton, setEditingCustomButton] = useState<CustomButton | null>(null);
  const [isRefreshingApps, setIsRefreshingApps] = useState(false);
  const [isMiniMode, setIsMiniMode] = useState(false);
  const [isAppClosed, setIsAppClosed] = useState(false);

  // Status and LED animation state
  const [ledActive, setLedActive] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' } | null>(
    null
  );

  const activeDevice: TVDevice | null =
    devices.find((d) => d.id === activeDeviceId) ||
    devices[0] ||
    null;

  const currentInstalledApps: StreamingApp[] =
    activeDevice?.installedApps && activeDevice.installedApps.length > 0
      ? activeDevice.installedApps
      : activeDevice
      ? getDefaultAppsForBrand(activeDevice.brand)
      : [];

  const currentShortcuts: AppShortcut[] =
    activeDevice?.quickShortcuts && activeDevice.quickShortcuts.length > 0
      ? activeDevice.quickShortcuts
      : activeDevice
      ? getDefaultShortcutsForBrand(activeDevice.brand)
      : [];

  const [isPiPActive, setIsPiPActive] = useState(false);

  // Listen for native Android Picture-in-Picture mode changes
  useEffect(() => {
    const handlePiP = (e: Event) => {
      const customEvent = e as CustomEvent<{ isPiP: boolean }>;
      if (customEvent.detail?.isPiP !== undefined) {
        setIsMiniMode(customEvent.detail.isPiP);
        setIsPiPActive(customEvent.detail.isPiP);
      }
    };
    window.addEventListener('pipModeChanged', handlePiP);
    return () => window.removeEventListener('pipModeChanged', handlePiP);
  }, []);

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TVS, JSON.stringify(devices));
    } catch {
      // ignore
    }
  }, [devices]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_TV, activeDeviceId);
    } catch {
      // ignore
    }
  }, [activeDeviceId]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.BUTTONS, JSON.stringify(customButtons));
    } catch {
      // ignore
    }
  }, [customButtons]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch {
      // ignore
    }
  }, [settings]);

  // Subscribe to LED state changes from RemoteService
  useEffect(() => {
    const unsub = RemoteService.getInstance().subscribeToLed((active) => {
      setLedActive(active);
    });
    return unsub;
  }, []);

  const showToast = useCallback((text: string, type: 'success' | 'info' = 'info') => {
    setToastMessage({ text, type });
    const timer = setTimeout(() => {
      setToastMessage(null);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Update a specific TV's state
  const updateActiveDeviceData = useCallback(
    (updates: Partial<TVDevice>) => {
      if (!activeDevice) return;
      setDevices((prev) =>
        prev.map((d) => (d.id === activeDevice.id ? { ...d, ...updates } : d))
      );
    },
    [activeDevice]
  );

  // Send single keycode
  const handleKeycodePress = useCallback(
    async (keycode: string) => {
      if (!activeDevice) {
        showToast('Please connect to your TV first', 'info');
        setTvManagerInitialTab('scan');
        setIsTVManagerOpen(true);
        return;
      }
      await RemoteService.getInstance().sendKeycode(
        activeDevice,
        keycode,
        () => {
          showToast(`Sent: ${keycode.replace('KEYCODE_', '')}`, 'success');
        },
        (err) => {
          showToast(err.message || `No reply from ${activeDevice.name}`, 'info');
        }
      );
    },
    [activeDevice, showToast]
  );

  // Launch streaming app
  const handleLaunchApp = useCallback(
    async (app: StreamingApp) => {
      if (!activeDevice) {
        showToast('Please connect to your TV first', 'info');
        setTvManagerInitialTab('scan');
        setIsTVManagerOpen(true);
        return;
      }
      showToast(`Launching ${app.name} on ${activeDevice.name}...`, 'info');
      const ok = await RemoteService.getInstance().launchApp(activeDevice, app.packageName, app.name);
      if (ok) {
        showToast(`Launched ${app.name}!`, 'success');
      } else {
        showToast(`Could not launch ${app.name}. Verify TV is awake and app is installed.`, 'info');
      }
    },
    [activeDevice, showToast]
  );

  // Send text to TV
  const handleSendText = useCallback(
    async (text: string, sendEnter: boolean) => {
      if (!activeDevice) {
        showToast('Please connect to your TV first', 'info');
        return;
      }
      showToast(`Typing: "${text}"`, 'info');
      await RemoteService.getInstance().sendText(activeDevice, text);
      if (sendEnter) {
        setTimeout(async () => {
          await RemoteService.getInstance().sendKeycode(activeDevice, 'KEYCODE_ENTER');
        }, 150);
      }
    },
    [activeDevice, showToast]
  );

  // Handle closing / exiting the app
  const handleCloseApp = useCallback(async () => {
    showToast('Closing TV Remote...', 'info');
    const closedNatively = await closeRemoteApp();
    if (!closedNatively) {
      setIsAppClosed(true);
    }
  }, [showToast]);

  // Trigger custom button
  const handleTriggerCustomButton = useCallback(
    async (button: CustomButton) => {
      if (!activeDevice) {
        showToast('Please connect to your TV first', 'info');
        setTvManagerInitialTab('scan');
        setIsTVManagerOpen(true);
        return;
      }
      if (button.actionType === 'macro' && button.macroSteps) {
        showToast(`Running macro: ${button.label}...`, 'info');
        await RemoteService.getInstance().executeMacro(activeDevice, button.macroSteps, button.label);
      } else if (button.actionType === 'app') {
        showToast(`Launching ${button.label}...`, 'info');
        await RemoteService.getInstance().launchApp(activeDevice, button.payload, button.label);
      } else if (button.actionType === 'keycode') {
        await handleKeycodePress(button.payload);
      } else if (button.actionType === 'text') {
        await handleSendText(button.payload, true);
      }
    },
    [activeDevice, handleKeycodePress, handleSendText, showToast]
  );

  // Launch app shortcut
  const handleLaunchShortcut = useCallback(
    async (shortcut: AppShortcut) => {
      if (!activeDevice) {
        showToast('Please connect to your TV first', 'info');
        return;
      }
      showToast(`Launching ${shortcut.name} on ${activeDevice.name}...`, 'info');
      const ok = await RemoteService.getInstance().launchApp(activeDevice, shortcut.packageName, shortcut.name);
      if (ok) {
        showToast(`Launched ${shortcut.name}!`, 'success');
      } else {
        showToast(`Could not launch ${shortcut.name}. Check TV connection or run Diagnostic.`, 'info');
      }
    },
    [activeDevice, showToast]
  );

  // Update quick shortcuts for active TV
  const handleUpdateShortcuts = useCallback(
    (newShortcuts: AppShortcut[]) => {
      updateActiveDeviceData({ quickShortcuts: newShortcuts });
    },
    [updateActiveDeviceData]
  );

  // Add app to active TV's quick shortcuts
  const handleAddAppToShortcuts = useCallback(
    (app: StreamingApp) => {
      if (!activeDevice) return;
      if (currentShortcuts.some((s) => s.appId === app.id || s.packageName === app.packageName)) {
        showToast(`${app.name} is already in Quick Apps`, 'info');
        return;
      }
      const newShortcut: AppShortcut = {
        id: `sc_${app.id}_${Date.now()}`,
        appId: app.id,
        name: app.name,
        packageName: app.packageName,
        iconName: app.iconName,
        color: app.color,
        priority: currentShortcuts.length + 1,
      };
      const updated = [...currentShortcuts, newShortcut];
      updateActiveDeviceData({ quickShortcuts: updated });
      showToast(`Added ${app.name} to Quick Apps on ${activeDevice.name}`, 'success');
    },
    [activeDevice, currentShortcuts, showToast, updateActiveDeviceData]
  );

  // Remove app from active TV's quick shortcuts
  const handleRemoveAppFromShortcuts = useCallback(
    (appId: string) => {
      const removed = currentShortcuts.find((s) => s.appId === appId || s.id === appId);
      const remaining = currentShortcuts
        .filter((s) => s.appId !== appId && s.id !== appId)
        .map((s, idx) => ({ ...s, priority: idx + 1 }));
      updateActiveDeviceData({ quickShortcuts: remaining });
      if (removed) {
        showToast(`Removed ${removed.name} from Quick Apps`, 'info');
      }
    },
    [currentShortcuts, showToast, updateActiveDeviceData]
  );

  // Add a custom sideloaded app to active TV
  const handleAddCustomApp = useCallback(
    (newApp: StreamingApp) => {
      if (!activeDevice) return;
      const updatedApps = [...currentInstalledApps, newApp];
      updateActiveDeviceData({ installedApps: updatedApps });
      showToast(`Added "${newApp.name}" to ${activeDevice.name}`, 'success');
    },
    [activeDevice, currentInstalledApps, showToast, updateActiveDeviceData]
  );

  // Pull / Refresh real installed apps from connected physical TV
  const handleRefreshAppsFromTv = useCallback(async () => {
    if (!activeDevice) {
      showToast('Please connect to your TV first', 'info');
      return;
    }
    setIsRefreshingApps(true);
    showToast(`Querying installed apps from ${activeDevice.name}...`, 'info');

    try {
      const fetchedApps = await RemoteService.getInstance().fetchInstalledApps(activeDevice);
      if (fetchedApps && fetchedApps.length > 0) {
        // Merge or replace with real apps fetched from the TV
        updateActiveDeviceData({ installedApps: fetchedApps });
        showToast(`Pulled ${fetchedApps.length} installed apps from ${activeDevice.name}`, 'success');
      } else {
        showToast(`Synced installed apps for ${activeDevice.name}`, 'info');
      }
    } catch {
      showToast(`Could not query TV. Using saved app list for ${activeDevice.name}.`, 'info');
    } finally {
      setIsRefreshingApps(false);
    }
  }, [activeDevice, showToast, updateActiveDeviceData]);

  // Switch active TV
  const handleSelectDevice = useCallback(
    (device: TVDevice) => {
      setActiveDeviceId(device.id);
      showToast(`Connected to ${device.name}`, 'success');

      // Auto-sync TV apps & channels in background
      RemoteService.getInstance().fetchInstalledApps(device).then((apps) => {
        if (apps && apps.length > 0) {
          setDevices((prev) =>
            prev.map((d) => (d.id === device.id ? { ...d, installedApps: apps } : d))
          );
        }
      }).catch(() => {});
    },
    [showToast]
  );

  // Custom button modal handlers
  const handleOpenAddCustom = () => {
    setEditingCustomButton(null);
    setIsCustomModalOpen(true);
  };

  const handleOpenEditCustom = (btn: CustomButton) => {
    setEditingCustomButton(btn);
    setIsCustomModalOpen(true);
  };

  const handleSaveCustomButton = (button: CustomButton) => {
    const existingIndex = customButtons.findIndex((b) => b.id === button.id);
    if (existingIndex >= 0) {
      const updated = [...customButtons];
      updated[existingIndex] = button;
      setCustomButtons(updated);
      showToast(`Updated "${button.label}"`, 'success');
    } else {
      setCustomButtons([...customButtons, button]);
      showToast(`Created "${button.label}"`, 'success');
    }
  };

  const handleDeleteCustomButton = (buttonId: string) => {
    setCustomButtons(customButtons.filter((b) => b.id !== buttonId));
    showToast('Button deleted', 'info');
  };

  // TV management handlers
  const handleAddDevice = (device: TVDevice) => {
    const fullDevice: TVDevice = {
      ...device,
      installedApps: device.installedApps || getDefaultAppsForBrand(device.brand),
      quickShortcuts: device.quickShortcuts || getDefaultShortcutsForBrand(device.brand),
    };
    setDevices((prev) => [...prev, fullDevice]);
    setActiveDeviceId(fullDevice.id);
    showToast(`Added & connected to ${fullDevice.name}`, 'success');

    // Auto-sync TV apps & channels in background
    RemoteService.getInstance().fetchInstalledApps(fullDevice).then((apps) => {
      if (apps && apps.length > 0) {
        setDevices((prev) =>
          prev.map((d) => (d.id === fullDevice.id ? { ...d, installedApps: apps } : d))
        );
      }
    }).catch(() => {});
  };

  const handleUpdateDevice = (device: TVDevice) => {
    setDevices((prev) => prev.map((d) => (d.id === device.id ? device : d)));
  };

  const handleDeleteDevice = (id: string) => {
    const remaining = devices.filter((d) => d.id !== id);
    setDevices(remaining);
    if (activeDeviceId === id && remaining.length > 0) {
      setActiveDeviceId(remaining[0].id);
    }
    showToast('TV profile removed', 'info');
  };

  const handleImportData = (data: {
    devices?: TVDevice[];
    customButtons?: CustomButton[];
  }) => {
    if (data.devices && data.devices.length > 0) {
      setDevices(data.devices);
      setActiveDeviceId(data.devices[0].id);
    }
    if (data.customButtons && data.customButtons.length > 0) {
      setCustomButtons(data.customButtons);
    }
  };

  // Keyboard shortcut listener for testing & accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        isKeyboardOpen ||
        isCustomModalOpen ||
        isTVManagerOpen ||
        isSettingsOpen
      ) {
        return;
      }

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          handleKeycodePress('KEYCODE_DPAD_UP');
          break;
        case 'ArrowDown':
          e.preventDefault();
          handleKeycodePress('KEYCODE_DPAD_DOWN');
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handleKeycodePress('KEYCODE_DPAD_LEFT');
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleKeycodePress('KEYCODE_DPAD_RIGHT');
          break;
        case 'Enter':
          e.preventDefault();
          handleKeycodePress('KEYCODE_DPAD_CENTER');
          break;
        case 'Escape':
        case 'Backspace':
          e.preventDefault();
          handleKeycodePress('KEYCODE_BACK');
          break;
        case 'Home':
          e.preventDefault();
          handleKeycodePress('KEYCODE_HOME');
          break;
        case ' ':
          e.preventDefault();
          handleKeycodePress('KEYCODE_MEDIA_PLAY_PAUSE');
          break;
        case 'm':
        case 'M':
          handleKeycodePress('KEYCODE_VOLUME_MUTE');
          break;
        case '+':
        case '=':
          handleKeycodePress('KEYCODE_VOLUME_UP');
          break;
        case '-':
        case '_':
          handleKeycodePress('KEYCODE_VOLUME_DOWN');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    handleKeycodePress,
    isKeyboardOpen,
    isCustomModalOpen,
    isTVManagerOpen,
    isSettingsOpen,
  ]);

  return (
    <div
      className={`h-dvh max-h-dvh w-full max-w-full text-slate-100 flex items-center justify-center antialiased selection:bg-cyan-500 selection:text-slate-950 font-sans relative overflow-hidden transition-colors ${
        isMiniMode ? 'bg-[#070b13] p-0' : 'bg-[#070b13] p-0 sm:p-4 md:p-6'
      }`}
    >
      {/* Ambient subtle glow backdrop (only when full remote is shown on larger screens) */}
      {!isMiniMode && (
        <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(6,182,212,0.06)_0%,transparent_70%)] hidden sm:block" />
      )}

      {/* State 1: App Closed / Standby Screen */}
      {isAppClosed ? (
        <div className="w-full max-w-[360px] p-6 rounded-[28px] bg-slate-950/95 border border-slate-800 shadow-2xl backdrop-blur-xl flex flex-col items-center text-center relative z-20 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-4 shadow-inner relative">
            <Tv className="w-8 h-8 text-slate-500" />
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 border-2 border-slate-950 flex items-center justify-center">
              <Power className="w-2.5 h-2.5 text-white" />
            </div>
          </div>

          <h2 className="text-lg font-bold text-white mb-1">TV Remote Inactive</h2>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed max-w-[280px]">
            The TV remote connection has been closed. On an Android phone, the app exits to your home screen or background.
          </p>

          <button
            type="button"
            id="btn-relaunch-remote"
            onClick={() => {
              setIsAppClosed(false);
              showToast('Remote re-launched', 'success');
            }}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm shadow-[0_0_20px_rgba(6,182,212,0.3)] flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Re-Launch TV Remote</span>
          </button>
        </div>
      ) : devices.length === 0 || !activeDevice ? (
        <NoTVConnectedScreen
          onOpenScan={() => {
            setTvManagerInitialTab('scan');
            setIsTVManagerOpen(true);
          }}
          onOpenManualAdd={() => {
            setTvManagerInitialTab('manual');
            setIsTVManagerOpen(true);
          }}
          onCloseApp={handleCloseApp}
        />
      ) : (
        <>
          {/* Mode 1: Full Remote Shell - Edge-to-edge native full screen on mobile */}
          {!isMiniMode && (
            <RemoteShell
              devices={devices}
              activeDevice={activeDevice}
              onSelectDevice={handleSelectDevice}
              onOpenTVManager={() => {
                setTvManagerInitialTab('saved');
                setIsTVManagerOpen(true);
              }}
              onOpenScan={() => {
                setTvManagerInitialTab('scan');
                setIsTVManagerOpen(true);
              }}
              onOpenKeyboard={() => setIsKeyboardOpen(true)}
              onOpenSettings={() => setIsSettingsOpen(true)}
              onMinimize={() => {
                setIsMiniMode(true);
                enterNativePictureInPicture();
                showToast('Minimized to floating mini remote', 'info');
              }}
              onCloseApp={handleCloseApp}
              customButtons={customButtons}
              shortcuts={currentShortcuts}
              installedApps={currentInstalledApps}
              onRefreshAppsFromTv={handleRefreshAppsFromTv}
              isRefreshingApps={isRefreshingApps}
              onAddCustomApp={handleAddCustomApp}
              settings={settings}
              ledActive={ledActive}
              onKeycodePress={handleKeycodePress}
              onLaunchApp={handleLaunchApp}
              onLaunchShortcut={handleLaunchShortcut}
              onUpdateShortcuts={handleUpdateShortcuts}
              onAddAppToShortcuts={handleAddAppToShortcuts}
              onRemoveAppFromShortcuts={handleRemoveAppFromShortcuts}
              onTriggerCustomButton={handleTriggerCustomButton}
              onAddCustomClick={handleOpenAddCustom}
              onEditCustomClick={handleOpenEditCustom}
              onDeleteCustomClick={handleDeleteCustomButton}
              onUpdateSettings={(newSettings) =>
                setSettings((prev) => ({ ...prev, ...newSettings }))
              }
            />
          )}

          {/* Mode 2: Multi-Tasking Mini Remote (Compact draggable widget or PiP mode) */}
          {isMiniMode && (
            <div
              className={`fixed inset-0 w-full h-full select-none z-50 ${
                isPiPActive
                  ? 'bg-[#070b13] flex items-center justify-center p-0'
                  : 'pointer-events-none bg-transparent'
              }`}
            >
              <FloatingMiniRemote
                devices={devices}
                activeDevice={activeDevice}
                onSelectDevice={handleSelectDevice}
                onKeycodePress={handleKeycodePress}
                onExpand={() => {
                  setIsMiniMode(false);
                  showToast('Expanded to full remote', 'info');
                }}
                onClose={handleCloseApp}
                settings={settings}
                ledActive={ledActive}
                isPiPMode={isPiPActive}
              />
            </div>
          )}
        </>
      )}

      {/* Floating Action / Command Feedback Toast */}
      {toastMessage && (
        <div className="fixed bottom-4 z-50 pointer-events-none animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="px-4 py-2 rounded-full bg-slate-900/95 text-white border border-slate-700 shadow-2xl backdrop-blur-md flex items-center gap-2 text-xs font-mono">
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Modals */}
      <TVManagerModal
        isOpen={isTVManagerOpen}
        onClose={() => setIsTVManagerOpen(false)}
        devices={devices}
        activeDeviceId={activeDeviceId}
        onSelectDevice={handleSelectDevice}
        onAddDevice={handleAddDevice}
        onUpdateDevice={handleUpdateDevice}
        onDeleteDevice={handleDeleteDevice}
        initialTab={tvManagerInitialTab}
      />

      <CustomButtonModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        onSave={handleSaveCustomButton}
        editingButton={editingCustomButton}
      />

      <KeyboardInputModal
        isOpen={isKeyboardOpen}
        onClose={() => setIsKeyboardOpen(false)}
        onSendText={handleSendText}
        activeDevice={activeDevice}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={(newSettings) =>
          setSettings((prev) => ({ ...prev, ...newSettings }))
        }
        devices={devices}
        customButtons={customButtons}
        shortcuts={currentShortcuts}
        onImportData={handleImportData}
      />
    </div>
  );
}
