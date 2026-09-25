import { TVDevice, TVBrand, StreamingApp, AppShortcut } from '../types';
import { INDIAN_STREAMING_APPS } from './streamingApps';

export interface BrandInfo {
  id: TVBrand;
  name: string;
  defaultPort: number;
  protocolDescription: string;
  setupGuide: string[];
  popularInIndia: boolean;
  notes?: string;
  appStoreName: string;
  appStorePackage: string;
}

export const BRAND_CONFIGS: Record<TVBrand, BrandInfo> = {
  tcl: {
    id: 'tcl',
    name: 'TCL Android / Google TV',
    defaultPort: 4123,
    protocolDescription: 'Universal Auto-Fallback (TCL T-Cast 4123 / Roku ECP 8060 / Google TV)',
    popularInIndia: true,
    appStoreName: 'Google Play Store',
    appStorePackage: 'com.android.vending',
    setupGuide: [
      'Ensure TV is connected to the same Wi-Fi network as this phone',
      'For Android TV: TV+ OS MagiConnect is built-in and enabled by default',
      'For Developer ADB: TV Settings → System → About → Tap "Build" 7 times → Developer options → USB Debugging',
      'Find IP under Settings → Network & Internet → Wi-Fi Details',
    ],
    notes: 'Works with all TCL C-Series, P-Series, TV+ OS BeyondTV, Roku OS, and Google TV editions.',
  },
  xiaomi: {
    id: 'xiaomi',
    name: 'Xiaomi / Redmi / Mi TV',
    defaultPort: 5555,
    protocolDescription: 'ADB over Wi-Fi / PatchWall Bridge',
    popularInIndia: true,
    appStoreName: 'Google Play Store',
    appStorePackage: 'com.android.vending',
    setupGuide: [
      'Go to TV Settings → Device Preferences → About',
      'Scroll to "Build" and tap OK button 7 times',
      'Return to Device Preferences → Developer options',
      'Enable "USB debugging"',
      'Check TV IP in Settings → Network & Internet',
    ],
    notes: 'Supports PatchWall, Mi TV 4A/4X/5X/Horizon, and Redmi Smart TVs.',
  },
  oneplus: {
    id: 'oneplus',
    name: 'OnePlus TV (Y / U / Q Series)',
    defaultPort: 5555,
    protocolDescription: 'ADB over Wi-Fi / OxygenPlay',
    popularInIndia: true,
    appStoreName: 'Google Play Store',
    appStorePackage: 'com.android.vending',
    setupGuide: [
      'Settings → Device Preferences → About → Tap "Build" 7 times',
      'Go to Developer Options → Turn ON USB Debugging',
      'TV will show "Allow USB debugging?" pop-up on first connection — check "Always allow" and click OK',
    ],
    notes: 'Works on OnePlus Y1, Y1S, U1S, and Q1 Series.',
  },
  sony: {
    id: 'sony',
    name: 'Sony Bravia (Android / Google TV)',
    defaultPort: 80,
    protocolDescription: 'Sony Simple IP Control (REST) or ADB (5555)',
    popularInIndia: true,
    appStoreName: 'Google Play Store',
    appStorePackage: 'com.android.vending',
    setupGuide: [
      'Settings → Network & Internet → Home network setup → IP control',
      'Turn ON "Simple IP control"',
      'Optional: Set Pre-Shared Key (PSK) to "0000" or enable Developer Options for full ADB control',
    ],
    notes: 'Native Simple IP control allows instant response without needing pairing PINs.',
  },
  realme: {
    id: 'realme',
    name: 'Realme Smart TV',
    defaultPort: 5555,
    protocolDescription: 'ADB over Wi-Fi (Port 5555)',
    popularInIndia: true,
    appStoreName: 'Google Play Store',
    appStorePackage: 'com.android.vending',
    setupGuide: [
      'Settings → Device Preferences → About → Build (tap 7 times)',
      'Developer options → Enable USB debugging',
      'Allow connection prompt when connecting for the first time',
    ],
  },
  vu: {
    id: 'vu',
    name: 'Vu Smart TV (GloLED / Masterpiece)',
    defaultPort: 5555,
    protocolDescription: 'ADB over Wi-Fi (Port 5555)',
    popularInIndia: true,
    appStoreName: 'Google Play Store',
    appStorePackage: 'com.android.vending',
    setupGuide: [
      'Settings → Device Preferences → About → Click Build 7 times',
      'Open Developer Options and toggle USB debugging ON',
    ],
  },
  samsung: {
    id: 'samsung',
    name: 'Samsung Smart TV (Tizen OS / Crystal UHD / QLED)',
    defaultPort: 8002,
    protocolDescription: 'Tizen WebSocket Remote API (Port 8001 / 8002)',
    popularInIndia: true,
    appStoreName: 'Samsung TV Apps',
    appStorePackage: 'org.tizen.browser',
    setupGuide: [
      'Ensure Samsung TV is connected to the same Wi-Fi network',
      'Go to TV Settings → General → External Device Manager → Device Connect Manager',
      'Set "Access Notification" to "First Time Only"',
      'When prompted on your TV screen ("Allow Harvy\'s Remote to connect?"), select "Allow"',
    ],
    notes: 'Supports all 2016-2026 Samsung Tizen TVs (Crystal UHD, Neo QLED, The Frame).',
  },
  lg: {
    id: 'lg',
    name: 'LG Smart TV (webOS / OLED / Nanocell)',
    defaultPort: 3000,
    protocolDescription: 'LG webOS WebSocket Control (Port 3000 / 3001)',
    popularInIndia: true,
    appStoreName: 'LG Content Store',
    appStorePackage: 'com.webos.app.discovery',
    setupGuide: [
      'Settings → Connection / Network → Device Connector or Mobile TV On',
      'Turn ON "Turn on via Wi-Fi" and "LG Connect Apps"',
      'Accept pairing prompt on TV screen when connecting for the first time',
    ],
    notes: 'Supports LG webOS 3.0 through webOS 24+.',
  },
  hisense: {
    id: 'hisense',
    name: 'Hisense Smart TV (Google TV / VIDAA)',
    defaultPort: 5555,
    protocolDescription: 'ADB Wi-Fi / Google TV Remote v2',
    popularInIndia: true,
    appStoreName: 'Google Play Store',
    appStorePackage: 'com.android.vending',
    setupGuide: [
      'Settings → System → About → Tap "Android TV OS build" 7 times',
      'Developer options → Turn ON "USB debugging"',
    ],
  },
  panasonic: {
    id: 'panasonic',
    name: 'Panasonic Smart TV (Google TV / Viera)',
    defaultPort: 5555,
    protocolDescription: 'ADB Wi-Fi / Google TV Remote',
    popularInIndia: true,
    appStoreName: 'Google Play Store',
    appStorePackage: 'com.android.vending',
    setupGuide: [
      'Settings → Device Preferences → About → Build (tap 7 times)',
      'Developer Options → Turn ON USB Debugging',
    ],
  },
  motorola: {
    id: 'motorola',
    name: 'Motorola Smart TV (Revou / Envision)',
    defaultPort: 5555,
    protocolDescription: 'ADB over Wi-Fi (Port 5555)',
    popularInIndia: true,
    appStoreName: 'Google Play Store',
    appStorePackage: 'com.android.vending',
    setupGuide: [
      'Settings → Device Preferences → About → Build (tap 7 times)',
      'Developer Options → Turn ON USB Debugging',
    ],
  },
  chromecast: {
    id: 'chromecast',
    name: 'Chromecast with Google TV',
    defaultPort: 5555,
    protocolDescription: 'Google TV Remote v2 / ADB (Port 5555)',
    popularInIndia: true,
    appStoreName: 'Google Play Store',
    appStorePackage: 'com.android.vending',
    setupGuide: [
      'Settings → System → About → Click "Android TV OS build" 7 times',
      'Go to System → Developer options → Enable "USB debugging"',
      'Allow connection prompt on screen',
    ],
  },
  generic: {
    id: 'generic',
    name: 'Generic Android TV / Set-Top Box',
    defaultPort: 5555,
    protocolDescription: 'ADB / Google TV Remote v2 (Airtel Xstream, Tata Play, Jio)',
    popularInIndia: true,
    appStoreName: 'Google Play Store',
    appStorePackage: 'com.android.vending',
    setupGuide: [
      'Works on Airtel Xstream Box, Tata Play Binge+, Jio STB, Nokia TV, Thomson TV, Kodak TV, and Android dongles',
      'Settings → Device Preferences → About → Build (tap 7 times) → Developer Options → Enable USB Debugging',
    ],
  },
};

/**
 * Returns default installed apps for a TV brand
 */
export const getDefaultAppsForBrand = (brand: TVBrand): StreamingApp[] => {
  if (brand === 'samsung') {
    return [
      { id: 'youtube', name: 'YouTube', packageName: 'org.tizen.youtube', iconName: 'Youtube', color: '#FF0000', popularInIndia: true, category: 'ott' },
      { id: 'netflix', name: 'Netflix', packageName: 'org.tizen.netflix-box', iconName: 'Film', color: '#E50914', popularInIndia: true, category: 'ott' },
      { id: 'primevideo', name: 'Prime Video', packageName: 'org.tizen.amazon-video', iconName: 'Video', color: '#00A8E1', popularInIndia: true, category: 'ott' },
      { id: 'hotstar', name: 'Disney+ Hotstar', packageName: 'org.tizen.hotstar', iconName: 'Sparkles', color: '#01147C', popularInIndia: true, category: 'ott' },
      { id: 'spotify', name: 'Spotify', packageName: 'org.tizen.spotify', iconName: 'Music', color: '#1DB954', popularInIndia: true, category: 'music' },
      { id: 'appletv', name: 'Apple TV', packageName: 'org.tizen.appletv', iconName: 'Tv', color: '#333333', popularInIndia: false, category: 'ott' },
      { id: 'jiocinema', name: 'JioCinema', packageName: 'org.tizen.jiocinema', iconName: 'Tv', color: '#D81B60', popularInIndia: true, category: 'ott' },
      { id: 'zee5', name: 'ZEE5', packageName: 'org.tizen.zee5', iconName: 'PlayCircle', color: '#9C27B0', popularInIndia: true, category: 'ott' },
    ];
  }

  if (brand === 'lg') {
    return [
      { id: 'youtube', name: 'YouTube', packageName: 'youtube.leanback', iconName: 'Youtube', color: '#FF0000', popularInIndia: true, category: 'ott' },
      { id: 'netflix', name: 'Netflix', packageName: 'netflix', iconName: 'Film', color: '#E50914', popularInIndia: true, category: 'ott' },
      { id: 'primevideo', name: 'Prime Video', packageName: 'amazon', iconName: 'Video', color: '#00A8E1', popularInIndia: true, category: 'ott' },
      { id: 'hotstar', name: 'Disney+ Hotstar', packageName: 'hotstar', iconName: 'Sparkles', color: '#01147C', popularInIndia: true, category: 'ott' },
      { id: 'spotify', name: 'Spotify', packageName: 'spotify-beehive', iconName: 'Music', color: '#1DB954', popularInIndia: true, category: 'music' },
      { id: 'appletv', name: 'Apple TV', packageName: 'com.apple.appletv', iconName: 'Tv', color: '#333333', popularInIndia: false, category: 'ott' },
      { id: 'jiocinema', name: 'JioCinema', packageName: 'jiocinema', iconName: 'Tv', color: '#D81B60', popularInIndia: true, category: 'ott' },
    ];
  }

  // Default Android TV app list
  return [...INDIAN_STREAMING_APPS];
};

/**
 * Returns default quick shortcuts for a TV brand
 */
export const getDefaultShortcutsForBrand = (brand: TVBrand): AppShortcut[] => {
  const apps = getDefaultAppsForBrand(brand);
  const priorityAppIds = ['youtube', 'netflix', 'hotstar', 'primevideo', 'mxplayer', 'spotify', 'jiocinema'];
  const shortcuts: AppShortcut[] = [];

  let prio = 1;
  for (const appId of priorityAppIds) {
    const app = apps.find((a) => a.id === appId);
    if (app) {
      shortcuts.push({
        id: `sc_${app.id}_${prio}`,
        appId: app.id,
        name: app.name,
        packageName: app.packageName,
        iconName: app.iconName,
        color: app.color,
        priority: prio++,
      });
    }
  }

  return shortcuts;
};

export const DEMO_TV_IDS = [
  'tv-tcl-home',
  'tv-samsung-drawing',
  'tv-mi-bedroom',
  'tv-oneplus-hotel',
  'tv-sony-parents',
];

// Production: No demo TVs out-of-the-box. The user connects their real TV!
export const INITIAL_SAVED_TVS: TVDevice[] = [];

