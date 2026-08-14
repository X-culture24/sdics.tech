/**
 * Progressive Web App utilities
 * Handles PWA installation, offline detection, and notifications
 */

declare global {
  interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
  }

  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

export class PWAUtils {
  private static deferredPrompt: BeforeInstallPromptEvent | null = null;
  private static installPrompt: HTMLElement | null = null;

  /**
   * Initialize PWA event listeners
   */
  static initialize(): void {
    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      PWAUtils.deferredPrompt = e as BeforeInstallPromptEvent;
      PWAUtils.showInstallPrompt();
    });

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      PWAUtils.deferredPrompt = null;
      PWAUtils.hideInstallPrompt();
    });

    // Register service worker
    PWAUtils.registerServiceWorker();

    // Listen for online/offline events
    window.addEventListener('online', () => console.log('App is online'));
    window.addEventListener('offline', () => console.log('App is offline'));
  }

  /**
   * Check if PWA is installable
   */
  static isInstallable(): boolean {
    return !!PWAUtils.deferredPrompt;
  }

  /**
   * Check if app is running as installed PWA
   */
  static isInstalledPWA(): boolean {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    );
  }

  /**
   * Check if currently online
   */
  static isOnline(): boolean {
    return navigator.onLine;
  }

  /**
   * Trigger install prompt
   */
  static async promptInstall(): Promise<void> {
    if (!PWAUtils.deferredPrompt) {
      throw new Error('Install prompt is not available');
    }

    PWAUtils.deferredPrompt.prompt();
    const result = await PWAUtils.deferredPrompt.userChoice;

    if (result.outcome === 'accepted') {
      console.log('PWA installation accepted');
    }

    PWAUtils.deferredPrompt = null;
  }

  /**
   * Request notification permission
   */
  static async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('Notifications not supported');
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission !== 'denied') {
      return Notification.requestPermission();
    }

    return 'denied';
  }

  /**
   * Show notification
   */
  static showNotification(title: string, options?: NotificationOptions): void {
    if (Notification.permission === 'granted') {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.showNotification(title, options);
        });
      } else {
        new Notification(title, options);
      }
    }
  }

  /**
   * Register service worker
   */
  private static async registerServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/service-worker.js', {
          scope: '/',
        });
        console.log('Service Worker registered:', registration);
      } catch (error) {
        console.warn('Service Worker registration failed:', error);
      }
    }
  }

  /**
   * Show install prompt UI
   */
  private static showInstallPrompt(): void {
    if (PWAUtils.installPrompt) {
      PWAUtils.installPrompt.style.display = 'block';
    }
  }

  /**
   * Hide install prompt UI
   */
  private static hideInstallPrompt(): void {
    if (PWAUtils.installPrompt) {
      PWAUtils.installPrompt.style.display = 'none';
    }
  }

  /**
   * Get device info for registration metadata
   */
  static getDeviceInfo() {
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      isOnline: navigator.onLine,
      isPWA: PWAUtils.isInstalledPWA(),
    };
  }
}

// Initialize PWA on module load
PWAUtils.initialize();
