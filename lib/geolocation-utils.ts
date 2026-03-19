/**
 * Geolocation Utilities for Manager Bin Placement
 */

export interface GeolocationCoords {
  latitude: number;
  longitude: number;
  accuracy: number;
}

/**
 * Get current device geolocation using navigator.geolocation API
 * Returns promise that resolves with current position or rejects with error
 */
export async function getCurrentLocation(): Promise<GeolocationCoords> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        resolve({ latitude, longitude, accuracy });
      },
      (error) => {
        reject(new Error(`Geolocation error: ${error.message}`));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
}

/**
 * Start watching user location for continuous updates
 * Useful for real-time route tracking
 */
export function watchLocation(
  onSuccess: (coords: GeolocationCoords) => void,
  onError: (error: Error) => void
): number | null {
  if (!navigator.geolocation) {
    onError(new Error('Geolocation is not supported'));
    return null;
  }

  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      const { latitude, longitude, accuracy } = position.coords;
      onSuccess({ latitude, longitude, accuracy });
    },
    (error) => {
      onError(new Error(`Geolocation error: ${error.message}`));
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 1000,
    }
  );

  return watchId;
}

/**
 * Stop watching location
 */
export function clearLocationWatch(watchId: number): void {
  if (navigator.geolocation && watchId) {
    navigator.geolocation.clearWatch(watchId);
  }
}

/**
 * Format coordinates for display
 */
export function formatCoordinates(
  latitude: number,
  longitude: number,
  precision: number = 6
): string {
  return `${latitude.toFixed(precision)}, ${longitude.toFixed(precision)}`;
}

/**
 * Check if location has reasonable accuracy (within 50 meters)
 */
export function isAccurateLocation(accuracy: number, threshold: number = 50): boolean {
  return accuracy <= threshold;
}
