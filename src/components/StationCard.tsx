import { openDirections } from "../lib/geo";
import type { Station, FuelType, Position } from "../types";

interface Props {
  station: Station;
  origin?: Position;
  distanceKm?: number;
  fuelFilter: FuelType | "all";
  selected: boolean;
  onClick: () => void;
}

export default function StationCard({
  station,
  origin,
  distanceKm,
  fuelFilter,
  selected,
  onClick,
}: Props) {
  const relevantFuel =
    fuelFilter === "all"
      ? [...station.fuels].sort((a, b) => a.price - b.price)[0]
      : station.fuels.find((f) => f.type === fuelFilter);
  const relevantPrice = relevantFuel?.price;
  const relevantDate = relevantFuel?.updatedAt;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 bg-white rounded-lg border transition hover:border-emerald-400 hover:shadow-sm ${
        selected
          ? "border-emerald-500 ring-2 ring-emerald-100"
          : "border-slate-200"
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-slate-900 text-sm truncate">
            {station.address}
          </div>
          <div className="text-xs text-slate-500 truncate">
            {station.postalCode} {station.city}
          </div>
        </div>
        <div className="text-right shrink-0">
          {relevantPrice !== undefined ? (
            <>
              <div className="font-bold text-emerald-700 text-base leading-none">
                {relevantPrice.toFixed(3)}€
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {fuelFilter === "all" ? relevantFuel?.type : "/L"}
              </div>
            </>
          ) : (
            <div className="text-xs text-slate-400 italic">N/A</div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-1 mb-2">
        {station.fuels.map((f) => {
          const isActive = fuelFilter === "all" || f.type === fuelFilter;
          return (
            <span
              key={f.type}
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] rounded ${
                isActive
                  ? "bg-emerald-50 text-emerald-800"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              <span className="font-medium">{f.type}</span>
              <span>{f.price.toFixed(2)}€</span>
            </span>
          );
        })}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <div className="text-xs text-slate-500 flex flex-col">
          <span>
            {distanceKm !== undefined ? `📍 ${distanceKm.toFixed(1)} km` : ""}
          </span>
          {relevantDate && (
            <span className="text-[10px] text-slate-400">
              MàJ {relevantDate}
            </span>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            openDirections({ lat: station.lat, lng: station.lng }, origin);
          }}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700"
        >
          🧭 Itinéraire
        </button>
      </div>
    </button>
  );
}
