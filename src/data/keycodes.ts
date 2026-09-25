import { AndroidKeycode } from '../types';

export const ANDROID_KEYCODES: AndroidKeycode[] = [
  // Navigation
  { name: 'KEYCODE_DPAD_UP', code: 19, label: 'D-Pad Up', category: 'navigation' },
  { name: 'KEYCODE_DPAD_DOWN', code: 20, label: 'D-Pad Down', category: 'navigation' },
  { name: 'KEYCODE_DPAD_LEFT', code: 21, label: 'D-Pad Left', category: 'navigation' },
  { name: 'KEYCODE_DPAD_RIGHT', code: 22, label: 'D-Pad Right', category: 'navigation' },
  { name: 'KEYCODE_DPAD_CENTER', code: 23, label: 'Select / OK', category: 'navigation' },
  { name: 'KEYCODE_BACK', code: 4, label: 'Back', category: 'navigation' },
  { name: 'KEYCODE_HOME', code: 3, label: 'Home (Launcher)', category: 'navigation' },
  { name: 'KEYCODE_APP_SWITCH', code: 187, label: 'Recent Apps', category: 'navigation', description: 'Switch or close running apps' },

  // System
  { name: 'KEYCODE_POWER', code: 26, label: 'Power Toggle', category: 'system' },
  { name: 'KEYCODE_SLEEP', code: 223, label: 'Sleep Display', category: 'system' },
  { name: 'KEYCODE_WAKEUP', code: 224, label: 'Wake Up TV', category: 'system' },
  { name: 'KEYCODE_SETTINGS', code: 176, label: 'TV Settings', category: 'system' },
  { name: 'KEYCODE_MENU', code: 82, label: 'Options / Menu', category: 'system' },
  { name: 'KEYCODE_VOICE_ASSIST', code: 231, label: 'Google Assistant', category: 'system' },
  { name: 'KEYCODE_NOTIFICATION', code: 83, label: 'Notifications', category: 'system' },

  // Volume
  { name: 'KEYCODE_VOLUME_UP', code: 24, label: 'Volume Up', category: 'volume' },
  { name: 'KEYCODE_VOLUME_DOWN', code: 25, label: 'Volume Down', category: 'volume' },
  { name: 'KEYCODE_VOLUME_MUTE', code: 164, label: 'Mute Audio', category: 'volume' },

  // Media
  { name: 'KEYCODE_MEDIA_PLAY_PAUSE', code: 85, label: 'Play / Pause', category: 'media' },
  { name: 'KEYCODE_MEDIA_REWIND', code: 89, label: 'Rewind 10s', category: 'media' },
  { name: 'KEYCODE_MEDIA_FAST_FORWARD', code: 90, label: 'Fast Forward 10s', category: 'media' },
  { name: 'KEYCODE_MEDIA_STOP', code: 86, label: 'Stop Media', category: 'media' },
  { name: 'KEYCODE_CAPTIONS', code: 175, label: 'Subtitles (CC)', category: 'media' },

  // TV & Inputs
  { name: 'KEYCODE_TV_INPUT', code: 178, label: 'Input Source', category: 'tv' },
  { name: 'KEYCODE_TV_INPUT_HDMI_1', code: 243, label: 'HDMI 1', category: 'tv' },
  { name: 'KEYCODE_TV_INPUT_HDMI_2', code: 244, label: 'HDMI 2', category: 'tv' },
  { name: 'KEYCODE_TV_INPUT_HDMI_3', code: 245, label: 'HDMI 3', category: 'tv' },
  { name: 'KEYCODE_CHANNEL_UP', code: 166, label: 'Channel Up', category: 'tv' },
  { name: 'KEYCODE_CHANNEL_DOWN', code: 167, label: 'Channel Down', category: 'tv' },
  { name: 'KEYCODE_LAST_CHANNEL', code: 229, label: 'Previous Channel', category: 'tv' },
  { name: 'KEYCODE_GUIDE', code: 172, label: 'TV Guide (EPG)', category: 'tv' },
  { name: 'KEYCODE_INFO', code: 165, label: 'Info Display', category: 'tv' },
  { name: 'KEYCODE_PROG_RED', code: 183, label: 'Red Button', category: 'tv' },
  { name: 'KEYCODE_PROG_GREEN', code: 184, label: 'Green Button', category: 'tv' },
  { name: 'KEYCODE_PROG_YELLOW', code: 185, label: 'Yellow Button', category: 'tv' },
  { name: 'KEYCODE_PROG_BLUE', code: 186, label: 'Blue Button', category: 'tv' },

  // Numeric
  { name: 'KEYCODE_0', code: 7, label: 'Digit 0', category: 'numeric' },
  { name: 'KEYCODE_1', code: 8, label: 'Digit 1', category: 'numeric' },
  { name: 'KEYCODE_2', code: 9, label: 'Digit 2', category: 'numeric' },
  { name: 'KEYCODE_3', code: 10, label: 'Digit 3', category: 'numeric' },
  { name: 'KEYCODE_4', code: 11, label: 'Digit 4', category: 'numeric' },
  { name: 'KEYCODE_5', code: 12, label: 'Digit 5', category: 'numeric' },
  { name: 'KEYCODE_6', code: 13, label: 'Digit 6', category: 'numeric' },
  { name: 'KEYCODE_7', code: 14, label: 'Digit 7', category: 'numeric' },
  { name: 'KEYCODE_8', code: 15, label: 'Digit 8', category: 'numeric' },
  { name: 'KEYCODE_9', code: 16, label: 'Digit 9', category: 'numeric' },
];

export const KEYCODE_MAP = new Map<string, AndroidKeycode>(
  ANDROID_KEYCODES.map((k) => [k.name, k])
);
