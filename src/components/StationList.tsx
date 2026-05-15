import StationCard from "./StationCard";
import type { Station, FuelType, Position } from "../types";

interface Props {
  stations: (Station & { distanceKm?: number })[];
  totalFound: number;
  listLimit: number;
  origin?: Position;
  fuelFilter: FuelType | "all";
  selectedId: string | null;
  onSelect: (id: string) => void;
  loading: boolean;
}

export default function StationList({
  stations,
  totalFound,
  listLimit,
  origin,
  fuelFilter,
  selectedId,
  onSelect,
  loading,
}: Props) {
  if (loading && stations.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-slate-500 flex flex-col items-center gap-2">
        <span className="inline-block w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        Chargement des prix officiels…
      </div>
    );
  }

  if (stations.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-slate-500">
        <div className="text-3xl mb-2">⛽</div>
        Aucune station trouvée dans la zone.
        <div className="mt-2 text-xs">
          Essayez d'augmenter le rayon ou de changer de carburant.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 pt-3 pb-1 text-xs text-slate-500 flex items-center justify-between">
        <span>
          <b className="text-slate-700">{stations.length}</b>
          {totalFound > listLimit && (
            <span className="text-slate-400"> / {totalFound}</span>
          )}{" "}
          station{stations.length > 1 ? "s" : ""}
        </span>
        {totalFound > listLimit && (
          <span className="text-[10px] text-slate-400 italic">
            les plus proches
          </span>
        )}
      </div>
      <div className="flex flex-col gap-2 px-3 pb-3 nice-scroll overflow-y-auto flex-1">
        {stations.map((s) => (
          <StationCard
            key={s.id}
            station={s}
            origin={origin}
            distanceKm={s.distanceKm}
            fuelFilter={fuelFilter}
            selected={selectedId === s.id}
            onClick={() => onSelect(s.id)}
          />
        ))}
      </div>
    </div>
  );
}
