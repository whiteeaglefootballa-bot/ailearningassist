export type NotificationPermission = 'granted' | 'denied' | 'default';

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return 'denied';
  }
  
  if (Notification.permission === 'granted') {
    return 'granted';
  }
  
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission;
  }
  
  return Notification.permission;
}

export function getNotificationPermission(): NotificationPermission {
  if (!('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}

export function showNotification(title: string, options?: NotificationOptions): Notification | null {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return null;
  }
  
  if (Notification.permission !== 'granted') {
    console.warn('Notification permission not granted');
    return null;
  }
  
  return new Notification(title, {
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    ...options,
  });
}

export function scheduleNotification(
  title: string,
  options: NotificationOptions,
  delayMs: number
): NodeJS.Timeout {
  return setTimeout(() => {
    showNotification(title, options);
  }, delayMs);
}
