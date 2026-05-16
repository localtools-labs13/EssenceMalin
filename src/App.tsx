import { useState } from "react";
import { MapContainer, TileLayer, CircleMarker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import StationsApp from "./StationsApp";
import Comparator from "./components/Comparator";

// Grandes villes françaises — marqueurs décoratifs sur la carte du Hero
const HERO_CITIES = [
  { name: "Paris", lat: 48.8566, lng: 2.3522 },
  { name: "Lyon", lat: 45.7578, lng: 4.832 },
  { name: "Marseille", lat: 43.2965, lng: 5.3698 },
  { name: "Toulouse", lat: 43.6047, lng: 1.4442 },
  { name: "Nice", lat: 43.7102, lng: 7.262 },
  { name: "Nantes", lat: 47.2184, lng: -1.5536 },
  { name: "Strasbourg", lat: 48.5734, lng: 7.7521 },
  { name: "Bordeaux", lat: 44.8378, lng: -0.5792 },
  { name: "Lille", lat: 50.6292, lng: 3.0573 },
  { name: "Rennes", lat: 48.1173, lng: -1.6778 },
  { name: "Reims", lat: 49.2583, lng: 4.0317 },
  { name: "Le Havre", lat: 49.4944, lng: 0.1079 },
  { name: "Saint-Étienne", lat: 45.4397, lng: 4.3872 },
  { name: "Toulon", lat: 43.1242, lng: 5.928 },
  { name: "Grenoble", lat: 45.1885, lng: 5.7245 },
  { name: "Dijon", lat: 47.322, lng: 5.0415 },
  { name: "Angers", lat: 47.4784, lng: -0.5632 },
  { name: "Nîmes", lat: 43.8367, lng: 4.3601 },
  { name: "Clermont-Ferrand", lat: 45.7772, lng: 3.087 },
  { name: "Le Mans", lat: 48.0061, lng: 0.1996 },
  { name: "Aix-en-Provence", lat: 43.5297, lng: 5.4474 },
  { name: "Brest", lat: 48.3904, lng: -4.4861 },
  { name: "Tours", lat: 47.3941, lng: 0.6848 },
  { name: "Amiens", lat: 49.8941, lng: 2.2958 },
  { name: "Limoges", lat: 45.8336, lng: 1.2611 },
  { name: "Perpignan", lat: 42.6887, lng: 2.8948 },
  { name: "Metz", lat: 49.1193, lng: 6.1757 },
  { name: "Besançon", lat: 47.2378, lng: 6.0241 },
  { name: "Orléans", lat: 47.9029, lng: 1.9039 },
  { name: "Caen", lat: 49.1829, lng: -0.3707 },
];

// Prix moyens nationaux simulés (proches de la réalité) — affichés dans la landing
const NATIONAL_PRICES = [
  { name: "Gazole", price: 1.847, change: -1.2, unit: "€/L" },
  { name: "SP95", price: 1.879, change: -0.8, unit: "€/L" },
  { name: "SP98", price: 1.942, change: -0.6, unit: "€/L" },
  { name: "E10", price: 1.832, change: -1.1, unit: "€/L" },
  { name: "GPL", price: 0.987, change: 0.4, unit: "€/L" },
  { name: "E85", price: 0.789, change: -0.3, unit: "€/L" },
];



export default function App() {
  const [view, setView] = useState<"landing" | "app">("landing");
  const [initialCity, setInitialCity] = useState("");

  if (view === "app") {
    return (
      <StationsApp
        initialCity={initialCity}
        onBack={() => setView("landing")}
      />
    );
  }

  return (
    <Landing
      onStart={(city) => {
        setInitialCity(city);
        setView("app");
      }}
    />
  );
}

function Landing({ onStart }: { onStart: (city: string) => void }) {
  const [searchInput, setSearchInput] = useState("");
  const [activeTab, setActiveTab] = useState<"carte" | "comparateur">("carte");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onStart(searchInput.trim());
  };

  return (
    <div className="bg-[#0a0a0b] text-white min-h-screen grain relative overflow-x-hidden">
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0b]/70 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
          <a href="#" className="flex items-center gap-2 group">
            <div className="relative w-8 h-8 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border border-[#00E676]/40 group-hover:border-[#00E676] transition-colors" />
              <span className="font-display text-[#00E676] text-2xl leading-none">o</span>
            </div>
            <span className="font-display text-xl tracking-tight">O</span>
          </a>

          {/* Tabs Carte / Comparateur */}
          <div className="flex items-center gap-1 bg-white/[0.03] border border-white/10 rounded-full p-1">
            <button
              onClick={() => {
                setActiveTab("carte");
                document.getElementById("content-section")?.scrollIntoView({ behavior: "smooth" });
              }}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                activeTab === "carte"
                  ? "bg-[#00E676] text-black"
                  : "text-white/60 hover:text-white"
              }`}
            >
              Carte
            </button>
            <button
              onClick={() => {
                setActiveTab("comparateur");
                document.getElementById("content-section")?.scrollIntoView({ behavior: "smooth" });
              }}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                activeTab === "comparateur"
                  ? "bg-[#00E676] text-black"
                  : "text-white/60 hover:text-white"
              }`}
            >
              Comparateur
            </button>
          </div>

          <button
            onClick={() => onStart("")}
            className="group relative inline-flex items-center gap-2 bg-[#00E676] text-black px-5 py-2 rounded-full text-sm font-medium hover:bg-white transition-colors hidden md:inline-flex"
          >
            App complète
            <span className="transition-transform group-hover:translate-x-0.5">→</span>
          </button>
        </div>
      </nav>

      {/* HERO - Minimalist splash */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-16 overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 w-[600px] h-[600px] rounded-full bg-[#00E676]/5 blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none animate-breathe" />

        {/* Content */}
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <h1 className="font-display text-[clamp(3rem,12vw,9rem)] leading-[0.95] tracking-tight mb-6 animate-fade-up">
            L'essence la moins chère,
            <br />
            <span className="text-[#00E676]">proche de vous.</span>
          </h1>
          <p className="text-white/60 text-lg md:text-xl max-w-xl mx-auto mb-12 font-light animate-fade-up delay-100">
            Trouvez en 3 secondes la station la moins chère autour de vous.
            <br className="hidden md:block" />
            Données officielles, mises à jour toutes les 10 minutes.
          </p>
          <button
            onClick={() => onStart('')}
            className="group inline-flex items-center gap-3 bg-[#00E676] text-black px-8 py-4 rounded-full text-base font-medium hover:bg-white transition-colors animate-fade-up delay-200"
          >
            Lancer la carte
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </button>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/30 animate-float">
          <span className="text-[10px] uppercase tracking-[0.3em]">Scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-white/40 to-transparent" />
        </div>
      </section>

      {/* CONTENT SECTION — Carte ou Comparateur */}
      <section id="content-section" className="relative py-24 md:py-32 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <p className="text-[11px] uppercase tracking-[0.3em] text-[#00E676] mb-4">
              {activeTab === "carte" ? "Carte en temps réel" : "Comparez et économisez"}
            </p>
            <h2 className="font-display text-4xl md:text-6xl leading-[0.95] tracking-tight">
              {activeTab === "carte"
                ? "Trouvez votre station."
                : "Calculez vos économies."}
            </h2>
          </div>

          {activeTab === "carte" ? (
            <>

          {/* Search */}
          <form onSubmit={handleSearch} className="mb-8">
            <div className="relative max-w-2xl mx-auto group">
              <div className="absolute -inset-[1px] bg-gradient-to-r from-transparent via-[#00E676]/30 to-transparent rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity blur-sm" />
              <div className="relative flex items-center gap-3 bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-full pl-6 pr-2 py-2 group-focus-within:border-[#00E676]/50 transition-colors">
                <svg className="w-5 h-5 text-white/40 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3-3" strokeLinecap="round" />
                </svg>
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Votre ville ou code postal…"
                  className="flex-1 bg-transparent outline-none text-white placeholder-white/30 text-base py-2"
                />
                <button type="submit" className="shrink-0 bg-[#00E676] text-black px-5 py-2.5 rounded-full text-sm font-medium hover:bg-white transition-colors">
                  Chercher
                </button>
              </div>
            </div>
          </form>

          {/* Price widget */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 mb-8">
            {NATIONAL_PRICES.map((fuel) => (
              <div key={fuel.name} className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-4 text-left hover:border-[#00E676]/30 transition-all">
                <div className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-2">{fuel.name}</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl md:text-3xl font-light text-white tabular-nums">{fuel.price.toFixed(2)}</span>
                  <span className="text-xs text-white/40">{fuel.unit}</span>
                </div>
                <div className={`text-[11px] mt-1 tabular-nums ${fuel.change < 0 ? "text-[#00E676]" : "text-red-400"}`}>
                  {fuel.change < 0 ? "↓" : "↑"} {Math.abs(fuel.change).toFixed(1)} cts
                </div>
              </div>
            ))}
          </div>

          {/* Map */}
          <div className="relative rounded-3xl overflow-hidden border border-white/10 h-[500px] md:h-[600px]">
            <MapContainer
              center={[46.6, 2.3]}
              zoom={6}
              zoomControl={true}
              scrollWheelZoom={true}
              attributionControl={false}
              className="w-full h-full"
            >
              <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
              {HERO_CITIES.map((city) => (
                <CircleMarker
                  key={city.name}
                  center={[city.lat, city.lng]}
                  radius={3}
                  pathOptions={{
                    color: "#00E676",
                    fillColor: "#00E676",
                    fillOpacity: 0.9,
                    weight: 0,
                  }}
                />
              ))}
            </MapContainer>
            <div className="absolute bottom-4 left-4 bg-[#0a0a0b]/80 backdrop-blur-xl border border-white/10 rounded-full px-4 py-2 text-xs text-white/60">
              <span className="inline-flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#00E676] animate-pulse-dot" />
                9 847 stations actives
              </span>
            </div>
          </div>
            </>
          ) : (
            <Comparator />
          )}
        </div>
      </section>









      {/* FOOTER MINIMAL */}
      <footer className="border-t border-white/5 px-6 py-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="relative w-6 h-6 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border border-[#00E676]/40" />
              <span className="font-display text-[#00E676] text-lg leading-none">o</span>
            </div>
            <span className="font-display text-base">O</span>
            <span className="text-xs text-white/30 ml-2">
              © 2026 · Conçu en France
            </span>
          </div>
          <div className="flex items-center gap-6 text-xs text-white/30">
            <a
              href="https://www.prix-carburants.gouv.fr"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              Données officielles ↗
            </a>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00E676] animate-pulse-dot" />
              Live
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
