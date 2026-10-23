import { normalizePolygon, LatLngTuple } from "./normalize-polygon";
import { DatabaseDeliveryZone } from "../types/database";

export interface EligibilityResult {
  isEligible: boolean;
  matchingZone: DatabaseDeliveryZone | null;
  deliveryFee: number;
  reason?: string;
}

/**
 * Checks if a point (lat, lng) lies exactly on a line segment between p1 and p2 within an epsilon tolerance.
 * Boundary Rule: Any point on an edge or vertex is considered INSIDE the polygon.
 */
function isPointOnSegment(
  lat: number,
  lng: number,
  p1: LatLngTuple,
  p2: LatLngTuple,
  epsilon = 1e-7
): boolean {
  const [lat1, lng1] = p1;
  const [lat2, lng2] = p2;

  // Check bounding box of segment first
  const minLat = Math.min(lat1, lat2) - epsilon;
  const maxLat = Math.max(lat1, lat2) + epsilon;
  const minLng = Math.min(lng1, lng2) - epsilon;
  const maxLng = Math.max(lng1, lng2) + epsilon;

  if (lat < minLat || lat > maxLat || lng < minLng || lng > maxLng) {
    return false;
  }

  // Cross product to test collinearity: (lat - lat1) * (lng2 - lng1) - (lng - lng1) * (lat2 - lat1)
  const crossProduct = Math.abs(
    (lat - lat1) * (lng2 - lng1) - (lng - lng1) * (lat2 - lat1)
  );

  return crossProduct <= epsilon;
}

/**
 * Ray-Casting Point-in-Polygon Algorithm.
 * 
 * Boundary Rule:
 * - A point exactly on a polygon vertex or boundary edge is treated as INSIDE.
 * 
 * Algorithm:
 * - Projects a horizontal ray from (lat, lng) extending infinitely to the right along the longitude axis.
 * - Counts the number of times the ray intersects the polygon's edges.
 * - Odd number of intersections => INSIDE.
 * - Even number of intersections => OUTSIDE.
 */
export function isPointInPolygon(
  lat: number,
  lng: number,
  polygon: LatLngTuple[]
): boolean {
  if (!polygon || polygon.length < 3) {
    return false;
  }

  // Verify coordinates are finite numbers within valid geographic ranges
  if (
    typeof lat !== "number" ||
    typeof lng !== "number" ||
    isNaN(lat) ||
    isNaN(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    return false;
  }

  let inside = false;
  const n = polygon.length;

  for (let i = 0, j = n - 1; i < n; j = i++) {
    const p1 = polygon[i];
    const p2 = polygon[j];

    // 1. Boundary check: If point is on the edge or vertex, return true immediately
    if (isPointOnSegment(lat, lng, p1, p2)) {
      return true;
    }

    const [lat1, lng1] = p1;
    const [lat2, lng2] = p2;

    // 2. Ray-casting intersection check
    const intersect =
      lat1 > lat !== lat2 > lat &&
      lng < ((lng2 - lng1) * (lat - lat1)) / (lat2 - lat1) + lng1;

    if (intersect) {
      inside = !inside;
    }
  }

  return inside;
}

/**
 * Authoritative Server-Side Delivery Eligibility Validator.
 * 
 * Checks customer coordinates against ACTIVE delivery zones only.
 * If zones overlap, selects the first matching active zone deterministically (sorted by ID).
 */
export function validateDeliveryEligibility(
  lat: number,
  lng: number,
  activeZones: DatabaseDeliveryZone[]
): EligibilityResult {
  // 1. Input coordinate bounds check
  if (
    typeof lat !== "number" ||
    typeof lng !== "number" ||
    isNaN(lat) ||
    isNaN(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    return {
      isEligible: false,
      matchingZone: null,
      deliveryFee: 0,
      reason: "Invalid coordinates: latitude must be between -90 and 90, longitude between -180 and 180.",
    };
  }

  // 2. Filter strictly for active delivery zones
  const eligibleZones = activeZones
    .filter((zone) => zone.active === true)
    .sort((a, b) => a.id.localeCompare(b.id)); // Deterministic order

  if (eligibleZones.length === 0) {
    return {
      isEligible: false,
      matchingZone: null,
      deliveryFee: 0,
      reason: "No active delivery zones configured in the system.",
    };
  }

  // 3. Test each active zone
  for (const zone of eligibleZones) {
    const normalizedCoords = normalizePolygon(zone.polygon);
    if (!normalizedCoords || normalizedCoords.length < 3) {
      continue; // Skip malformed polygons safely
    }

    if (isPointInPolygon(lat, lng, normalizedCoords)) {
      return {
        isEligible: true,
        matchingZone: zone,
        deliveryFee: zone.delivery_fee,
      };
    }
  }

  return {
    isEligible: false,
    matchingZone: null,
    deliveryFee: 0,
    reason: "Customer coordinates fall outside all active delivery zones.",
  };
}
