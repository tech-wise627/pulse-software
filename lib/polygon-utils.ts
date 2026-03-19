/**
 * Polygon Utility Functions for Event Boundary Checking
 */

export type Point = [number, number]; // [lat, lng]
export type Polygon = Point[];

/**
 * Determine if a point is inside a polygon using the Ray Casting Algorithm
 * Handles both geographic coordinates and Cartesian coordinates
 */
export function isPointInsidePolygon(point: Point, polygon: Polygon): boolean {
  const [lat, lng] = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [lat1, lng1] = polygon[i];
    const [lat2, lng2] = polygon[j];

    // Ray casting algorithm
    const intersect =
      lng1 > lng !== lng2 > lng &&
      lat < ((lat2 - lat1) * (lng - lng1)) / (lng2 - lng1) + lat1;

    if (intersect) inside = !inside;
  }

  return inside;
}

/**
 * Calculate distance between two points using Haversine formula
 * Returns distance in meters
 */
export function calculateDistance(point1: Point, point2: Point): number {
  const [lat1, lng1] = point1;
  const [lat2, lng2] = point2;

  const R = 6371000; // Earth's radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in meters
}

/**
 * Find the nearest point on the polygon boundary to a given point
 */
export function snapPointToPolygon(point: Point, polygon: Polygon): Point {
  let nearest = polygon[0];
  let minDistance = calculateDistance(point, polygon[0]);

  for (let i = 1; i < polygon.length; i++) {
    const distance = calculateDistance(point, polygon[i]);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = polygon[i];
    }
  }

  return nearest;
}

/**
 * Get the centroid (center point) of a polygon
 */
export function getPolygonCentroid(polygon: Polygon): Point {
  let lat = 0;
  let lng = 0;

  for (const [pLat, pLng] of polygon) {
    lat += pLat;
    lng += pLng;
  }

  return [lat / polygon.length, lng / polygon.length];
}

/**
 * Calculate bounding box for a polygon
 */
export function getPolygonBounds(
  polygon: Polygon
): {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
} {
  let minLat = polygon[0][0];
  let maxLat = polygon[0][0];
  let minLng = polygon[0][1];
  let maxLng = polygon[0][1];

  for (const [lat, lng] of polygon) {
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);
  }

  return { minLat, maxLat, minLng, maxLng };
}

/**
 * Validate a polygon has at least 3 points
 */
export function isValidPolygon(polygon: Polygon): boolean {
  return polygon && polygon.length >= 3;
}

/**
 * Helper function to convert degrees to radians
 */
function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Alias for isPointInsidePolygon for backward compatibility
 */
export const pointInPolygon = isPointInsidePolygon;
