export function triggerHaptic(type: 'light' | 'medium' | 'heavy' | 'double' = 'light') {
  if (typeof window === 'undefined' || !navigator.vibrate) return;

  try {
    switch (type) {
      case 'light':
        navigator.vibrate(10);
        break;
      case 'medium':
        navigator.vibrate(22);
        break;
      case 'heavy':
        navigator.vibrate(45);
        break;
      case 'double':
        navigator.vibrate([15, 40, 18]);
        break;
    }
  } catch {
    // Graceful fallback for browsers where vibration is blocked or unsupported
  }
}
