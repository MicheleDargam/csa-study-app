/**
 * Format seconds into MM:SS display string
 */
export function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Play notification sound when a cycle ends
 */
export function playNotificationSound(): void {
  try {
    const audio = new Audio('/notification.mp3');
    audio.volume = 0.7;
    audio.play().catch(() => {
      // Browser may block autoplay — fallback to Web Audio API beep
      playBeep();
    });
  } catch {
    playBeep();
  }
}

/**
 * Fallback beep using Web Audio API
 */
function playBeep(): void {
  try {
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    gainNode.gain.value = 0.3;

    oscillator.start();

    // Fade out
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    oscillator.stop(ctx.currentTime + 0.8);

    // Second beep after short pause
    setTimeout(() => {
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.frequency.value = 1000;
      osc2.type = 'sine';
      gain2.gain.value = 0.3;
      osc2.start();
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      osc2.stop(ctx.currentTime + 0.8);
    }, 300);
  } catch {
    // Audio not available
  }
}

/**
 * Request browser notification permission
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;

  const result = await Notification.requestPermission();
  return result === 'granted';
}

/**
 * Current notification permission, or 'unsupported' if the browser has no
 * Notification API at all (rare, but guards against a ReferenceError).
 */
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

/**
 * Send a browser notification. `tag` defaults to the timer's own tag for
 * backwards compatibility — pass a distinct tag (e.g. per lembrete id) so
 * unrelated notifications don't collapse into each other.
 */
export function sendNotification(title: string, body: string, tag: string = 'csa-timer'): void {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  try {
    // Some mobile browsers (notably Android Chrome, once a service worker
    // is registered — which this PWA always has) throw on the plain
    // Notification() constructor and require
    // ServiceWorkerRegistration.showNotification() instead. This call runs
    // inside a setInterval/setState tick with no error boundary around it,
    // so an uncaught throw here used to crash the whole app to a blank
    // (black, given the dark theme) screen right as a study cycle ended.
    new Notification(title, {
      body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      tag,
    });
  } catch {
    // Notification failed to display — not worth crashing the app over.
  }
}

/**
 * Get start of today (midnight) as Date
 */
export function getStartOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/**
 * Format duration in seconds to human readable string
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (secs === 0) return `${mins}min`;
  return `${mins}min ${secs}s`;
}

/**
 * Format a Date to HH:MM string
 */
export function formatHourMinute(date: Date): string {
  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}
