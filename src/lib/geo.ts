import type { Position } from "../types";

/** Distance en km entre deux points (Haversine). */
export function distanceKm(a: Position, b: Position): number {
  const R = 6371; // rayon Terre en km
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Géocode une ville via api-adresse.data.gouv.fr (gratuit, sans clé). */
export async function geocodeCity(query: string): Promise<Position | null> {
  if (!query.trim()) return null;
  const url = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(
    query
  )}&type=municipality&limit=1`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const feature = data?.features?.[0];
    if (!feature) return null;
    const [lng, lat] = feature.geometry.coordinates;
    return { lat, lng };
  } catch {
    return null;
  }
}

/** Ouvre un itinéraire vers la station dans Google Maps (universel). */
export function openDirections(dest: Position, origin?: Position): void {
  const destStr = `${dest.lat},${dest.lng}`;
  const originStr = origin ? `${origin.lat},${origin.lng}` : "";
  const url = `https://www.google.com/maps/dir/?api=1&destination=${destStr}${
    originStr ? `&origin=${originStr}` : ""
  }&travelmode=driving`;
  window.open(url, "_blank", "noopener,noreferrer");
}
