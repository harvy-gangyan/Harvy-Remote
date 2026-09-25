export type TVBrand =
  | 'tcl'
  | 'samsung'
  | 'lg'
  | 'sony'
  | 'xiaomi'
  | 'oneplus'
  | 'realme'
  | 'vu'
  | 'hisense'
  | 'panasonic'
  | 'motorola'
  | 'chromecast'
  | 'generic';

export type ConnectionProtocol =
  | 'auto' // Universal Auto-Detect & Multi-Protocol Fallback
  | 'tcl_tcast' // TCL TV+ / MagiConnect / T-Cast protocol (Port 4123/8080)
  | 'androidtv_v2' // Google TV / Android TV Remote v2 (Port 6466/6467)
  | 'adb' // Android Debug Bridge over Wi-Fi (Port 5555)
  | 'samsung_tizen' // Samsung Smart TV Tizen WebSocket Control (Port 8001/8002)
  | 'lg_webos' // LG Smart TV webOS WebSocket Control (Port 3000/3001)
  | 'sony_rest' // Sony Bravia Simple IP Control / REST API
  | 'tcl_roku_ecp' // Roku OS / TCL Roku TV ECP API (Port 8060)
  | 'browser_relay'; // Browser fetch / WebSocket bridge

export interface TVDevice {
  id: string;
  name: string;
  brand: TVBrand;
  model?: string;
  ipAddress: string;
  port: number;
  protocol: ConnectionProtocol;
  macAddress?: string;
  isDefault: boolean;
  lastConnected?: string;
  location?: string; // e.g. "Living Room", "Bedroom", "Hotel", "Parents' House"
  installedApps?: StreamingApp[];
  quickShortcuts?: AppShortcut[];
}

export type ActionType =
  | 'keycode'
  | 'app'
  | 'macro'
  | 'text'
  | 'shell';

export interface MacroStep {
  id: string;
  actionType: 'keycode' | 'delay' | 'text';
  payload: string;
  delayMs?: number;
}

export interface CustomButton {
  id: string;
  label: string;
  iconName: string;
  color: 'amber' | 'cyan' | 'emerald' | 'rose' | 'purple' | 'indigo' | 'orange' | 'slate';
  actionType: ActionType;
  payload: string; // keycode name, package name, or text
  macroSteps?: MacroStep[];
  description?: string;
}

export interface StreamingApp {
  id: string;
  name: string;
  packageName: string;
  iconName: string;
  color: string;
  badge?: string;
  popularInIndia: boolean;
  category: 'ott' | 'music' | 'utility' | 'tv';
}

export interface AndroidKeycode {
  name: string;
  code: number;
  label: string;
  category: 'navigation' | 'media' | 'system' | 'volume' | 'tv' | 'numeric';
  description?: string;
}

export interface AppShortcut {
  id: string; // unique ID
  appId: string; // references StreamingApp.id or custom package
  name: string;
  packageName: string;
  iconName: string;
  color: string;
  priority: number; // 1-indexed priority order: 1, 2, 3, etc.
}

export interface RemoteSettings {
  haptics: boolean;
  sound: boolean;
  vibrationIntensity: 'light' | 'medium' | 'strong';
  touchpadSensitivity: number; // 0.5 to 2.0
  activeTab: 'myapps' | 'dpad' | 'touchpad' | 'apps' | 'numpad';
  simulateSuccessOnFailure: boolean; // Useful when testing in browser without direct LAN access
}

export interface CommandLogItem {
  id: string;
  timestamp: Date;
  command: string;
  targetTv: string;
  status: 'sent' | 'success' | 'failed' | 'simulated';
  details?: string;
}
