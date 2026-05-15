import { useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Circle,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Station, FuelType, Position } from "../types";

interface Props {
  center: Position;
  stations: (Station & { distanceKm?: number })[];
  selectedId: string | null;
  origin?: Position;
  fuelFilter: FuelType | "all";
  radiusKm: number;
  onSelect: (id: string) => void;
}

/** Recadre la carte sur le centre + rayon quand ils changent. */
function FlyTo({ center, radiusKm }: { center: Position; radiusKm: number }) {
  const map = useMap();
  useEffect(() => {
    // Choix de zoom adapté au rayon
    const zoom =
      radiusKm <= 2 ? 14 : radiusKm <= 5 ? 13 : radiusKm <= 10 ? 12 : radiusKm <= 20 ? 11 : 10;
    map.flyTo([center.lat, center.lng], zoom, { duration: 0.6 });
  }, [center.lat, center.lng, radiusKm, map]);
  return null;
}

export default function Map({
  center,
  stations,
  selectedId,
  origin,
  fuelFilter,
  radiusKm,
  onSelect,
}: Props) {
  const markerRefs = useRef<Record<string, L.CircleMarker>>({});

  useEffect(() => {
    if (selectedId && markerRefs.current[selectedId]) {
      markerRefs.current[selectedId].openPopup();
    }
  }, [selectedId]);

  const getRelevantPrice = (s: Station) =>
    fuelFilter === "all"
      ? Math.min(...s.fuels.map((f) => f.price))
      : s.fuels.find((f) => f.type === fuelFilter)?.price;

  // Trouver la station la moins chère (pour la mettre en valeur)
  let minPrice = Infinity;
  let cheapestId: string | null = null;
  for (const s of stations) {
    const p = getRelevantPrice(s);
    if (p !== undefined && p < minPrice) {
      minPrice = p;
      cheapestId = s.id;
    }
  }

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={12}
      scrollWheelZoom={true}
      className="w-full h-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FlyTo center={center} radiusKm={radiusKm} />

      {/* Cercle de rayon de recherche */}
      <Circle
        center={[center.lat, center.lng]}
        radius={radiusKm * 1000}
        pathOptions={{
          color: "#10b981",
          fillColor: "#10b981",
          fillOpacity: 0.05,
          weight: 1.5,
          dashArray: "5, 5",
        }}
      />

      {/* Position utilisateur */}
      {origin && (
        <CircleMarker
          center={[origin.lat, origin.lng]}
          radius={8}
          pathOptions={{
            color: "#2563eb",
            fillColor: "#60a5fa",
            fillOpacity: 0.9,
            weight: 2,
          }}
        >
          <Popup>📍 Vous êtes ici</Popup>
        </CircleMarker>
      )}

      {stations.map((s) => {
        const price = getRelevantPrice(s);
        if (price === undefined) return null;
        const isSelected = s.id === selectedId;
        const isCheapest = s.id === cheapestId;

        return (
          <CircleMarker
            key={s.id}
            center={[s.lat, s.lng]}
            radius={isSelected ? 11 : isCheapest ? 10 : 7}
            pathOptions={{
              color: isSelected
                ? "#059669"
                : isCheapest
                ? "#15803d"
                : "#0f172a",
              fillColor: isSelected
                ? "#10b981"
                : isCheapest
                ? "#22c55e"
                : "#f59e0b",
              fillOpacity: 0.95,
              weight: isSelected ? 3 : 2,
            }}
            ref={(r) => {
              if (r) markerRefs.current[s.id] = r;
            }}
            eventHandlers={{
              click: () => onSelect(s.id),
            }}
          >
            <Popup>
              <div>
                <div className="font-semibold">
                  {s.address}
                  {isCheapest && <span className="ml-1">🏆</span>}
                </div>
                <div className="text-slate-600">
                  {s.postalCode} {s.city}
                </div>
                {fuelFilter !== "all" ? (
                  <div className="mt-1">
                    <b>{fuelFilter}</b> : {price.toFixed(3)} €/L
                  </div>
                ) : (
                  <div className="mt-1">
                    dès <b>{price.toFixed(3)} €/L</b>
                  </div>
                )}
                {s.distanceKm !== undefined && (
                  <div className="text-slate-500">
                    📍 {s.distanceKm.toFixed(1)} km
                  </div>
                )}
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
