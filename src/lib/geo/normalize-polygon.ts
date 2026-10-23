/**
 * Validates and normalizes delivery zone polygon coordinates for Leaflet rendering.
 * Leaflet strictly expects array of [latitude, longitude] pairs:
 * [
 *   [33.6000, -7.6300],
 *   [33.6000, -7.5900],
 *   [33.5750, -7.5900]
 * ]
 */

export type LatLngTuple = [number, number];

export function normalizePolygon(raw: unknown): LatLngTuple[] | null {
  if (!raw) return null;

  let data = raw;
  if (typeof raw === "string") {
    try {
      data = JSON.parse(raw);
    } catch {
      return null;
    }
  }

  // Case 1: Standard requested format -> Array of [lat, lng] pairs: [[lat, lng], ...]
  if (Array.isArray(data)) {
    // If it's a nested array like [[[lat, lng], ...]]
    if (Array.isArray(data[0]) && Array.isArray(data[0][0])) {
      data = data[0];
    }

    const points: LatLngTuple[] = [];
    for (const item of data as unknown[]) {
      if (Array.isArray(item) && item.length >= 2) {
        const val0 = Number(item[0]);
        const val1 = Number(item[1]);

        if (!isNaN(val0) && !isNaN(val1)) {
          // Detect if it was accidentally saved as [lng, lat] (lng between -180 & 180, lat between -90 & 90)
          // For Morocco/North Africa: Lat ~ 30-36, Lng ~ -10 to -2
          let lat = val0;
          let lng = val1;

          if (Math.abs(val0) < 20 && Math.abs(val1) >= 20 && Math.abs(val1) <= 90) {
            // Flipped: [lng, lat] -> convert to [lat, lng]
            lat = val1;
            lng = val0;
          }

          if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
            points.push([lat, lng]);
          }
        }
      }
    }

    if (points.length >= 3) {
      return points;
    }
    return null;
  }

  // Case 2: GeoJSON Polygon object: { type: "Polygon", coordinates: [[[lng, lat], ...]] }
  if (typeof data === "object" && data !== null) {
    const geo = data as { type?: string; coordinates?: unknown };
    if (geo.coordinates && Array.isArray(geo.coordinates)) {
      const ring = Array.isArray(geo.coordinates[0]) ? geo.coordinates[0] : geo.coordinates;
      const points: LatLngTuple[] = [];

      for (const item of ring as unknown[]) {
        if (Array.isArray(item) && item.length >= 2) {
          const lng = Number(item[0]);
          const lat = Number(item[1]);
          if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
            points.push([lat, lng]);
          }
        }
      }

      if (points.length >= 3) {
        return points;
      }
    }
  }

  return null;
}

/**
 * Calculates bounding box / center of a polygon to automatically center the map.
 */
export function getPolygonCenter(polygon: LatLngTuple[]): LatLngTuple {
  if (!polygon || polygon.length === 0) {
    return [33.5731, -7.5898]; // Default Casablanca / central coordinate
  }

  let totalLat = 0;
  let totalLng = 0;
  for (const [lat, lng] of polygon) {
    totalLat += lat;
    totalLng += lng;
  }

  return [totalLat / polygon.length, totalLng / polygon.length];
}
