import { AppShortcut } from '../types';

/**
 * Default shortcuts:
 * 1. YouTube
 * 2. Netflix
 * 3. Disney+ Hotstar
 * 4. Prime Video
 * 5. MX Player
 * 6. Spotify
 */
export const DEFAULT_APP_SHORTCUTS: AppShortcut[] = [
  {
    id: 'shortcut-youtube',
    appId: 'youtube',
    name: 'YouTube',
    packageName: 'com.google.android.youtube.tv',
    iconName: 'Youtube',
    color: '#FF0000',
    priority: 1,
  },
  {
    id: 'shortcut-netflix',
    appId: 'netflix',
    name: 'Netflix',
    packageName: 'com.netflix.ninja',
    iconName: 'Film',
    color: '#E50914',
    priority: 2,
  },
  {
    id: 'shortcut-hotstar',
    appId: 'hotstar',
    name: 'Disney+ Hotstar',
    packageName: 'in.startv.hotstar',
    iconName: 'Sparkles',
    color: '#01147C',
    priority: 3,
  },
  {
    id: 'shortcut-primevideo',
    appId: 'primevideo',
    name: 'Prime Video',
    packageName: 'com.amazon.amazonvideo.livingroom',
    iconName: 'Video',
    color: '#00A8E1',
    priority: 4,
  },
  {
    id: 'shortcut-mxplayer',
    appId: 'mxplayer',
    name: 'MX Player',
    packageName: 'com.mxtech.videoplayer.television',
    iconName: 'Play',
    color: '#0284C7',
    priority: 5,
  },
  {
    id: 'shortcut-spotify',
    appId: 'spotify',
    name: 'Spotify',
    packageName: 'com.spotify.tv.android',
    iconName: 'Music',
    color: '#1DB954',
    priority: 6,
  },
];
