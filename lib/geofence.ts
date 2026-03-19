// Geofencing utility for checking if a point is inside a polygon
// Uses Ray Casting algorithm for point-in-polygon detection

export interface GeofencePoint {
  latitude: number;
  longitude: number;
}

export interface GeofenceBoundary {
  points: [number, number][]; // [lat, lng] pairs
}

/**
 * Point-in-polygon test using ray casting algorithm
 * @param point - Worker location [latitude, longitude]
 * @param polygon - Event boundary polygon [[lat, lng], ...]
 * @returns true if point is inside polygon, false otherwise
 */
export const isPointInPolygon = (
  point: [number, number],
  polygon: [number, number][]
): boolean => {
  if (!polygon || polygon.length < 3) {
    return false;
  }

  const [x, y] = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0];
    const yi = polygon[i][1];
    const xj = polygon[j][0];
    const yj = polygon[j][1];

    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }

  return inside;
};

/**
 * Calculate distance between two points in meters
 */
export const calculateDistance = (
  from: [number, number],
  to: [number, number]
): number => {
  const R = 6371000; // Earth's radius in meters
  const lat1 = (from[0] * Math.PI) / 180;
  const lat2 = (to[0] * Math.PI) / 180;
  const deltaLat = ((to[0] - from[0]) * Math.PI) / 180;
  const deltaLng = ((to[1] - from[1]) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
};

/**
 * Find the closest point on the boundary to return to
 * Returns the center of the nearest boundary edge
 */
export const findClosestBoundaryPoint = (
  point: [number, number],
  polygon: [number, number][]
): [number, number] => {
  let minDistance = Infinity;
  let closestPoint: [number, number] = polygon[0];

  for (let i = 0; i < polygon.length; i++) {
    const distance = calculateDistance(point, polygon[i]);
    if (distance < minDistance) {
      minDistance = distance;
      closestPoint = polygon[i];
    }
  }

  return closestPoint;
};

/**
 * Calculate bearing (direction) from one point to another
 * Returns angle in degrees (0-360)
 */
export const calculateBearing = (
  from: [number, number],
  to: [number, number]
): number => {
  const lat1 = (from[0] * Math.PI) / 180;
  const lat2 = (to[0] * Math.PI) / 180;
  const dLon = ((to[1] - from[1]) * Math.PI) / 180;

  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  const bearing = Math.atan2(y, x) * (180 / Math.PI);

  return (bearing + 360) % 360;
};

/**
 * Get direction name from bearing
 */
export const getDirectionName = (bearing: number): string => {
  const directions = ['North', 'NE', 'East', 'SE', 'South', 'SW', 'West', 'NW'];
  const index = Math.round(bearing / 45) % 8;
  return directions[index];
};

/**
 * Check if worker is outside zone and get details
 */
export const checkGeofenceStatus = (
  workerLocation: [number, number],
  eventBoundary: [number, number][]
) => {
  const isInside = isPointInPolygon(workerLocation, eventBoundary);
  
  if (!isInside) {
    const closestPoint = findClosestBoundaryPoint(workerLocation, eventBoundary);
    const distance = calculateDistance(workerLocation, closestPoint);
    const bearing = calculateBearing(workerLocation, closestPoint);
    const direction = getDirectionName(bearing);

    return {
      isInside: false,
      distance,
      direction,
      bearing,
      returnPoint: closestPoint,
    };
  }

  return {
    isInside: true,
    distance: 0,
    direction: null,
    bearing: null,
    returnPoint: null,
  };
};
