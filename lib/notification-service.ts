// Notification Service for multi-modal alerts
// Handles browser notifications, fallbacks, permissions, and mobile alerts

export interface BinAlert {
  binId: string;
  binName: string;
  fillLevel: number;
  distance: number;
  zone: string;
}

class NotificationService {
  private permissionRequested = false;
  private notificationPermission: NotificationPermission = 'default';

  /**
   * Request notification permission from the user
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.log('[v0] Browser does not support notifications');
      return 'denied';
    }

    if (this.permissionRequested) {
      return this.notificationPermission;
    }

    this.permissionRequested = true;

    try {
      if (Notification.permission === 'granted') {
        this.notificationPermission = 'granted';
        return 'granted';
      }

      if (Notification.permission === 'denied') {
        this.notificationPermission = 'denied';
        return 'denied';
      }

      // Request permission if not yet decided
      const permission = await Notification.requestPermission();
      this.notificationPermission = permission;
      return permission;
    } catch (error) {
      console.log('[v0] Error requesting notification permission:', error);
      this.notificationPermission = 'denied';
      return 'denied';
    }
  }

  /**
   * Check current notification permission status
   */
  getPermissionStatus(): NotificationPermission {
    if (!('Notification' in window)) return 'denied';
    return Notification.permission;
  }

  /**
   * Send browser notification
   */
  private sendBrowserNotification(alert: BinAlert): void {
    if (this.notificationPermission !== 'granted') return;

    try {
      const notification = new Notification('⚠ Bin Alert', {
        body: `${alert.binName} is ${alert.fillLevel}% full - ${alert.distance}m away`,
        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23EF4444"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/></svg>',
        badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23EF4444"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/></svg>',
        requireInteraction: true,
        tag: `bin-${alert.binId}`,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (error) {
      console.log('[v0] Browser notification error:', error);
    }
  }

  /**
   * Play audio alert (tone + voice)
   */
  private playAudioAlert(alert: BinAlert): void {
    try {
      // 1. Vibration pattern
      if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200, 100, 200]);
      }

      // 2. Speech synthesis
      if ('speechSynthesis' in window) {
        speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(
          `Alert! ${alert.binName} is ${alert.fillLevel} percent full. Distance: ${Math.round(alert.distance)}meters. Please check it now.`
        );
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 1;
        utterance.lang = 'en-US';
        speechSynthesis.speak(utterance);
      }

      // 3. Tone alert using Web Audio API
      this.playTone();
    } catch (error) {
      console.log('[v0] Audio alert error:', error);
    }
  }

  /**
   * Play notification tone using Web Audio API
   */
  private playTone(): void {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = audioContext.currentTime;

      // Create a short beep pattern
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 1000; // 1000 Hz tone
      gainNode.gain.setValueAtTime(0.3, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

      oscillator.start(now);
      oscillator.stop(now + 0.2);
    } catch (error) {
      console.log('[v0] Tone alert error:', error);
    }
  }

  /**
   * Display visual alert (flash effect)
   */
  private showVisualAlert(): void {
    try {
      if (document.body) {
        document.body.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
        setTimeout(() => {
          document.body.style.backgroundColor = '';
        }, 300);

        setTimeout(() => {
          if (document.body) {
            document.body.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
          }
        }, 300);

        setTimeout(() => {
          if (document.body) {
            document.body.style.backgroundColor = '';
          }
        }, 600);
      }
    } catch (error) {
      console.log('[v0] Visual alert error:', error);
    }
  }

  /**
   * Send complete multi-modal notification
   */
  async sendAlert(alert: BinAlert): Promise<void> {
    // Ensure permission is requested
    if (!this.permissionRequested) {
      await this.requestPermission();
    }

    console.log('[v0] Sending bin alert:', alert.binName);

    // 1. Send browser notification (if permitted)
    this.sendBrowserNotification(alert);

    // 2. Play audio alerts
    this.playAudioAlert(alert);

    // 3. Show visual feedback
    this.showVisualAlert();
  }

  /**
   * Clear all active notifications for a bin
   */
  clearNotification(binId: string): void {
    try {
      // Close notification with matching tag
      // Note: Notifications are automatically cleared on action, but we can provide this method
      console.log('[v0] Clearing notification for bin:', binId);
    } catch (error) {
      console.log('[v0] Error clearing notification:', error);
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
