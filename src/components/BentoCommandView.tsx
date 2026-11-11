import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import {
  MapPin,
  ArrowUpRight,
  Navigation,
  ShieldCheck,
  AlertTriangle,
  Thermometer,
  Fuel,
  Snowflake,
  Sliders,
} from 'lucide-react';
import {
  RegionKey,
  STUDY_REGIONS,
  TARGET_SPECIES,
  SimulationInput,
  SimulationOutput,
} from '../utils/maritimeFormulas';
import { NavTab } from './HeroLandingView';

interface BentoCommandViewProps {
  simInput: SimulationInput;
  simOutput: SimulationOutput;
  onRegionChange: (region: RegionKey) => void;
  onToggleCapitalSource: () => void;
  onNavigateTab: (tab: NavTab) => void;
}

export const BentoCommandView: React.FC<BentoCommandViewProps> = ({
  simInput,
  simOutput,
  onRegionChange,
  onToggleCapitalSource,
  onNavigateTab,
}) => {
  const miniMapContainerRef = useRef<HTMLDivElement | null>(null);
  const miniMapInstanceRef = useRef<L.Map | null>(null);

  const regionInfo = STUDY_REGIONS[simInput.region];
  const speciesInfo = TARGET_SPECIES[simInput.species];

  // Initialize and update Leaflet Mini-Map inside Card B
  useEffect(() => {
    if (!miniMapContainerRef.current) return;

    if (!miniMapInstanceRef.current) {
      const map = L.map(miniMapContainerRef.current, {
        center: [simOutput.targetLat, simOutput.targetLon],
        zoom: 11,
        zoomControl: false,
        attributionControl: false,
      });

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
      }).addTo(map);

      miniMapInstanceRef.current = map;
    }

    const map = miniMapInstanceRef.current;
    map.setView([simOutput.targetLat, simOutput.targetLon], 11);

    // Clear existing non-tile layers
    map.eachLayer((layer) => {
      if (!(layer instanceof L.TileLayer)) {
        map.removeLayer(layer);
      }
    });

    // Core No-Take Zone (< 2.0 km)
    L.circle([simOutput.kkpLat, simOutput.kkpLon], {
      radius: 2000,
      color: '#EF4444',
      weight: 1.5,
      dashArray: '4 4',
      fillColor: '#EF4444',
      fillOpacity: 0.2,
    }).addTo(map);

    // Buffer Zone (2.0 - 5.0 km)
    L.circle([simOutput.kkpLat, simOutput.kkpLon], {
      radius: 5000,
      color: '#F59E0B',
      weight: 1.5,
      dashArray: '6 4',
      fillColor: '#F59E0B',
      fillOpacity: 0.08,
    }).addTo(map);

    // Vessel Marker Pin
    const vesselIcon = L.divIcon({
      className: 'custom-vessel-pin',
      html: `<div style="width:16px;height:16px;border-radius:9999px;background:#06B6D4;border:2px solid #F8FAFC;box-shadow:0 0 12px #06B6D4;"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });

    L.marker([simOutput.targetLat, simOutput.targetLon], {
      icon: vesselIcon,
    })
      .addTo(map)
      .bindPopup(
        `<div style="font-size:11px;line-height:1.4">
          <strong>Kapal Nelayan &lt; 5 GT</strong><br/>
          Jarak KKP: ${simOutput.jarakKkpKm} km<br/>
          WBGT: ${simOutput.wbgtC} °C
        </div>`
      );

    // Line connecting vessel to KKP center
    L.polyline(
      [
        [simOutput.targetLat, simOutput.targetLon],
        [simOutput.kkpLat, simOutput.kkpLon],
      ],
      {
        color: '#06B6D4',
        weight: 1.5,
        dashArray: '3 5',
      }
    ).addTo(map);

    setTimeout(() => {
      map.invalidateSize();
    }, 120);
  }, [
    simOutput.targetLat,
    simOutput.targetLon,
    simOutput.kkpLat,
    simOutput.kkpLon,
    simOutput.jarakKkpKm,
    simOutput.wbgtC,
  ]);

  useEffect(() => {
    return () => {
      if (miniMapInstanceRef.current) {
        miniMapInstanceRef.current.remove();
        miniMapInstanceRef.current = null;
      }
    };
  }, []);

  // 12-bar vertical sparkline data comparing hourly fishing net wage vs land alternative wage
  const sparklineHours = [
    0.72, 0.85, 0.94, 1.08, 1.15, 0.98, 1.22, 1.05, 0.88, 1.12, 1.18, 1.0,
  ];

  // Semi-circle gauge SVG math
  const gaugeRadius = 72;
  const gaugeCircumference = Math.PI * gaugeRadius;
  const strokeDashoffset =
    gaugeCircumference * (1 - simOutput.skorKelayakanAi / 100);

  const decisionHex =
    simOutput.decisionColor === 'emerald'
      ? '#10B981'
      : simOutput.decisionColor === 'amber'
        ? '#F59E0B'
        : '#EF4444';

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 2. Dashboard Top Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 sm:pb-5 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1.5 min-w-0">
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            <label htmlFor="bento-region-select" className="sr-only">
              Pilih Wilayah DPI
            </label>
            <select
              id="bento-region-select"
              aria-label="Pilih Wilayah DPI"
              value={simInput.region}
              onChange={(e) => onRegionChange(e.target.value as RegionKey)}
              className="w-full sm:w-auto max-w-full text-sm sm:text-xl lg:text-2xl font-extrabold tracking-tight bg-white dark:bg-[#1E293B] text-slate-900 dark:text-[#F8FAFC] border border-slate-300 dark:border-slate-700 rounded-xl px-3 sm:px-3.5 py-2 sm:py-1.5 focus:outline-none focus:border-[#06B6D4] cursor-pointer truncate"
            >
              {(Object.keys(STUDY_REGIONS) as RegionKey[]).map((regKey) => (
                <option key={regKey} value={regKey}>
                  {STUDY_REGIONS[regKey].fullName}
                </option>
              ))}
            </select>

            <span className="text-[11px] sm:text-xs font-mono font-semibold text-[#10B981] bg-emerald-500/15 border border-emerald-500/30 rounded-md px-2.5 py-1">
              DUAL-ENGINE AI ONLINE
            </span>
          </div>

          <p className="text-[11px] sm:text-sm text-slate-600 dark:text-[#94A3B8] font-mono flex items-start sm:items-center gap-1.5 sm:gap-2 leading-relaxed">
            <MapPin className="w-3.5 h-3.5 text-[#06B6D4] shrink-0 mt-0.5 sm:mt-0" />
            <span>
              {simOutput.targetLat.toFixed(4)}° LS,{' '}
              {simOutput.targetLon.toFixed(4)}° BT • Armada Kapal &lt; 5 GT •{' '}
              {regionInfo.wppCode}
            </span>
          </p>
        </div>

        {/* Right Quick Summary Metrics */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-stretch sm:items-center gap-2.5 sm:gap-3.5 text-xs font-mono text-slate-700 dark:text-slate-300">
          <div className="px-3 py-2 rounded-xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800">
            <span className="text-slate-500 dark:text-[#94A3B8] block text-[10px] sm:text-[11px] font-sans">
              Akurasi Classifier RF
            </span>
            <span className="font-bold text-[#06B6D4] text-xs sm:text-sm">
              92.58%
            </span>
          </div>
          <div className="px-3 py-2 rounded-xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800">
            <span className="text-slate-500 dark:text-[#94A3B8] block text-[10px] sm:text-[11px] font-sans">
              Regressor Harga Layak R²
            </span>
            <span className="font-bold text-[#10B981] text-xs sm:text-sm">
              0.9900 | MAE Rp848/kg
            </span>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('simulator')}
            className="col-span-2 sm:col-span-1 px-4 py-2.5 rounded-xl bg-[#06B6D4] hover:bg-cyan-400 text-slate-950 font-sans font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Ubah Parameter Simulasi</span>
          </button>
        </div>
      </div>

      {/* 3. Top Bento Row (2 Asymmetric Cards - 8 Cols + 4 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
        {/* Card A: Wide Vessel & Biological Telemetry Card (8 Cols) */}
        <div className="lg:col-span-8 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-400/12 p-4 sm:p-6 flex flex-col justify-between gap-4 sm:gap-6">
          <div className="flex flex-wrap items-start sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-[#F8FAFC]">
                Telemetri Armada &amp; Selektivitas Biologi Perikanan
              </h2>
              <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
                Perahu Motor Tempel Tradisional (&lt; 5 GT) •{' '}
                {speciesInfo.dominantGear}
              </p>
            </div>
            <span className="font-mono text-xs font-semibold text-[#06B6D4] bg-cyan-500/10 px-2.5 py-1 rounded-lg">
              CPUE: {simOutput.cpueKg} kg/trip
            </span>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-6 items-center">
            {/* Left Side: Detailed Vector/SVG Side-Profile Diagram of Indonesian Artisanal Wooden Motor Boat */}
            <div className="xl:col-span-7 relative rounded-xl bg-slate-900/95 border border-slate-800 p-3 sm:p-4 overflow-hidden">
              <svg
                viewBox="0 0 520 210"
                className="w-full h-36 sm:h-44 animate-radar-ping"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Animated Radar Pulse Rings */}
                <circle
                  cx="250"
                  cy="70"
                  r="42"
                  className="animate-radar-ring"
                  stroke="#06B6D4"
                  strokeOpacity="0.45"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
                <circle
                  cx="250"
                  cy="70"
                  r="75"
                  className="animate-radar-ring"
                  stroke="#06B6D4"
                  strokeOpacity="0.28"
                  strokeWidth="1"
                />

                {/* Sea Surface Line */}
                <path
                  d="M10 158 Q 130 150, 260 158 T 510 156"
                  stroke="#06B6D4"
                  strokeWidth="2"
                  strokeOpacity="0.6"
                />
                <path
                  d="M25 172 Q 160 165, 310 172 T 495 170"
                  stroke="#3B82F6"
                  strokeWidth="1.2"
                  strokeOpacity="0.35"
                />

                {/* Boat Side-Profile (< 5 GT Wooden Artisanal Hull) */}
                <path
                  d="M65 130 L108 160 L392 160 L440 118 L402 122 L362 134 L138 134 L94 116 Z"
                  fill="#1E293B"
                  stroke="#38BDF8"
                  strokeWidth="2"
                />
                {/* Hull Planking Line */}
                <path
                  d="M86 140 L405 140"
                  stroke="#06B6D4"
                  strokeWidth="3"
                />
                {/* Bow & Stern Stems */}
                <path
                  d="M65 130 L48 92 L58 90 L84 124 Z"
                  fill="#334155"
                  stroke="#38BDF8"
                  strokeWidth="1.5"
                />
                <path
                  d="M425 122 L448 92 L438 89 L412 122 Z"
                  fill="#334155"
                  stroke="#38BDF8"
                  strokeWidth="1.5"
                />
                {/* Long-tail Outboard Engine (Mesin Katinting / Tempel Solar) */}
                <line
                  x1="428"
                  y1="128"
                  x2="488"
                  y2="168"
                  stroke="#94A3B8"
                  strokeWidth="2.5"
                />
                <circle cx="490" cy="170" r="5" fill="#F59E0B" />

                {/* Deck Cabin & Coolbox */}
                <rect
                  x="185"
                  y="90"
                  width="115"
                  height="44"
                  rx="4"
                  fill="#0F172A"
                  stroke="#94A3B8"
                  strokeWidth="1.5"
                />
                <path
                  d="M172 90 L314 90 L304 80 L182 80 Z"
                  fill="#06B6D4"
                />
                <rect
                  x="198"
                  y="98"
                  width="26"
                  height="16"
                  rx="2"
                  fill="#38BDF8"
                  fillOpacity="0.4"
                />
                <rect
                  x="232"
                  y="98"
                  width="26"
                  height="16"
                  rx="2"
                  fill="#38BDF8"
                  fillOpacity="0.4"
                />
                {/* Insulated Fish Hold (Palka Es) */}
                <rect
                  x="128"
                  y="112"
                  width="46"
                  height="22"
                  rx="3"
                  fill="#0284C7"
                  stroke="#7DD3FC"
                  strokeWidth="1.2"
                />

                {/* Radar Mast */}
                <line
                  x1="250"
                  y1="80"
                  x2="250"
                  y2="28"
                  stroke="#E2E8F0"
                  strokeWidth="2"
                />
                <circle cx="250" cy="26" r="5" fill="#06B6D4" />

                {/* Telemetry Callouts inside SVG */}
                <g transform="translate(14, 14)">
                  <rect
                    width="136"
                    height="36"
                    rx="6"
                    fill="#0F172A"
                    stroke="#334155"
                  />
                  <text
                    x="8"
                    y="14"
                    fill="#94A3B8"
                    fontSize="9"
                    fontFamily="Plus Jakarta Sans"
                  >
                    BEBAN TERMAL DEK (WBGT)
                  </text>
                  <text
                    x="8"
                    y="29"
                    fill="#F59E0B"
                    fontSize="12"
                    fontWeight="700"
                    fontFamily="JetBrains Mono"
                  >
                    {simOutput.wbgtC} °C • {simInput.tempC}°C
                  </text>
                </g>

                <g transform="translate(362, 14)">
                  <rect
                    width="144"
                    height="36"
                    rx="6"
                    fill="#0F172A"
                    stroke="#334155"
                  />
                  <text
                    x="8"
                    y="14"
                    fill="#94A3B8"
                    fontSize="9"
                    fontFamily="Plus Jakarta Sans"
                  >
                    GELOMBANG &amp; ANGIN
                  </text>
                  <text
                    x="8"
                    y="29"
                    fill="#06B6D4"
                    fontSize="12"
                    fontWeight="700"
                    fontFamily="JetBrains Mono"
                  >
                    {simInput.waveM} m • {simInput.windKnot} kt
                  </text>
                </g>
              </svg>
            </div>

            {/* Right Side: 2x2 Specification Grid */}
            <div className="xl:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0F172A]/70 border border-slate-200 dark:border-slate-800">
                <span className="text-xs text-slate-500 dark:text-[#94A3B8] block">
                  Spesies Target
                </span>
                <p className="text-sm font-bold text-slate-900 dark:text-[#F8FAFC] mt-1">
                  {speciesInfo.id}
                </p>
                <p className="text-xs italic text-[#06B6D4]">
                  {speciesInfo.latinName}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0F172A]/70 border border-slate-200 dark:border-slate-800">
                <span className="text-xs text-slate-500 dark:text-[#94A3B8] block">
                  Batas Layak Tangkap (Lm)
                </span>
                <p className="text-sm font-mono font-bold text-slate-900 dark:text-[#F8FAFC] mt-1">
                  {simOutput.lmAcuanCm} cm
                </p>
                <p
                  className={`text-xs font-mono mt-0.5 ${
                    simOutput.isBiologicallyCompliant
                      ? 'text-[#10B981]'
                      : 'text-[#F59E0B]'
                  }`}
                >
                  Rasio: {simOutput.rasioLm} (
                  {simOutput.isBiologicallyCompliant ? 'Layak' : 'Muda'})
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0F172A]/70 border border-slate-200 dark:border-slate-800">
                <span className="text-xs text-slate-500 dark:text-[#94A3B8] block">
                  Musim Tangkap
                </span>
                <p className="text-sm font-bold text-slate-900 dark:text-[#F8FAFC] mt-1">
                  {simInput.season.replace(/\s*\(.*\)/, '')}
                </p>
                <p className="text-xs text-slate-500 dark:text-[#94A3B8] font-mono">
                  Tahun Observasi {simInput.year}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0F172A]/70 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 dark:text-[#94A3B8]">
                    Sumber Modal
                  </span>
                  <button
                    type="button"
                    onClick={onToggleCapitalSource}
                    className="text-[11px] font-semibold text-[#06B6D4] hover:underline cursor-pointer"
                  >
                    Ubah
                  </button>
                </div>
                <p className="text-sm font-bold text-slate-900 dark:text-[#F8FAFC] mt-1">
                  {simInput.capitalSource}
                </p>
                <p
                  className={`text-xs font-mono ${
                    simInput.capitalSource === 'Pinjaman Tengkulak'
                      ? 'text-[#EF4444]'
                      : 'text-[#10B981]'
                  }`}
                >
                  Potongan {simOutput.potonganModalPersen.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Card B: Live Spatial KKP Mini-Map Card (4 Cols) */}
        <div className="lg:col-span-4 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-400/12 p-6 flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-[#F8FAFC]">
                Live Spatial Zoning
              </h2>
              <p className="text-xs text-slate-500 dark:text-[#94A3B8] truncate max-w-[230px]">
                {regionInfo.kkpName}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('webgis')}
              aria-label="Buka Peta WebGIS Penuh"
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-cyan-500/20 text-slate-700 dark:text-[#06B6D4] transition-colors cursor-pointer"
            >
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>

          {/* Interactive Leaflet Mini-Map */}
          <div
            ref={miniMapContainerRef}
            data-testid="bento-mini-map"
            className="w-full h-40 rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700 z-0"
          />

          {/* Bottom Spatial Info Box */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0F172A]/80 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 text-xs">
            <div>
              <span className="text-slate-500 dark:text-[#94A3B8] block">
                Jarak ke KKP
              </span>
              <span className="font-mono font-bold text-sm text-slate-900 dark:text-[#F8FAFC]">
                {simOutput.jarakKkpKm} km
              </span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 dark:text-[#94A3B8] block">
                Status Zonasi
              </span>
              <span
                className={`font-semibold ${
                  simOutput.zonaKkpColor === 'emerald'
                    ? 'text-[#10B981]'
                    : simOutput.zonaKkpColor === 'amber'
                      ? 'text-[#F59E0B]'
                      : 'text-[#EF4444]'
                }`}
              >
                {simOutput.zonaKkp}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Bottom Bento Row (4 Equal Telemetry Cards - 3 Cols Each) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-5">
        {/* Bento Card 1: Beban Operasional & Opportunity Cost (Financial Telemetry - 3 Cols) */}
        <div className="xl:col-span-3 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-400/12 p-6 flex flex-col justify-between gap-5">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-[#94A3B8] mb-2">
              <span className="font-semibold">
                Beban Operasional &amp; Opportunity Cost
              </span>
              <Fuel className="w-4 h-4 text-[#06B6D4]" />
            </div>
            <p className="text-2xl sm:text-3xl font-mono font-bold text-slate-900 dark:text-[#F8FAFC]">
              Rp {simOutput.totalEconomicCostRp.toLocaleString('id-ID')}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-[#94A3B8] mt-0.5">
              Total Biaya Ekonomi Penuh (Eksplisit + Implisit)
            </p>
          </div>

          {/* 3 Sub-rows with colored square bullets */}
          <div className="space-y-2.5 text-xs border-y border-slate-200 dark:border-slate-800 py-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-300 flex items-center gap-2">
                <span className="w-2 h-2 bg-[#06B6D4] inline-block" />
                Biaya BBM Solar ({simOutput.konsumsiBbmLiter} L)
              </span>
              <span className="font-mono font-semibold text-slate-900 dark:text-[#F8FAFC]">
                Rp {simOutput.biayaBbmRp.toLocaleString('id-ID')}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-300 flex items-center gap-2">
                <span className="w-2 h-2 bg-[#3B82F6] inline-block" />
                Es Balok &amp; Perbekalan
              </span>
              <span className="font-mono font-semibold text-slate-900 dark:text-[#F8FAFC]">
                Rp {simOutput.biayaEsPerbekalanRp.toLocaleString('id-ID')}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-300 flex items-center gap-2">
                <span className="w-2 h-2 bg-[#F59E0B] inline-block" />
                Implicit Opportunity ({simInput.durationHours} Jam)
              </span>
              <span className="font-mono font-semibold text-amber-600 dark:text-[#F59E0B]">
                Rp {simOutput.totalImplicitCostRp.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          {/* Bottom Visual: 12-bar vertical sparkline comparing hourly fishing wage vs land wage */}
          <div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-[#94A3B8] mb-2">
              <span>Upah Melaut/Jam vs Darat</span>
              <span className="font-mono text-[#06B6D4]">
                Rp {simOutput.upahMelautPerJamRp.toLocaleString('id-ID')} vs Rp{' '}
                {simOutput.upahAltPerJamRp.toLocaleString('id-ID')}
              </span>
            </div>
            <div className="h-14 flex items-end justify-between gap-1.5 pt-2">
              {sparklineHours.map((mult, idx) => {
                const ratio = Math.min(
                  100,
                  Math.max(
                    18,
                    Math.round(
                      ((simOutput.upahMelautPerJamRp * mult) /
                        Math.max(1, simOutput.upahAltPerJamRp * 1.6)) *
                        100
                    )
                  )
                );
                const isAboveAlt =
                  simOutput.upahMelautPerJamRp * mult >=
                  simOutput.upahAltPerJamRp;
                return (
                  <div
                    key={idx}
                    className="flex-1 bg-slate-100 dark:bg-slate-800/80 rounded-t h-full flex items-end overflow-hidden"
                  >
                    <div
                      style={{ height: `${ratio}%` }}
                      className={`w-full rounded-t transition-all ${
                        isAboveAlt ? 'bg-[#3B82F6]' : 'bg-[#F59E0B]'
                      }`}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bento Card 2: Rantai Dingin & Kepatuhan Biologi-Konservasi (Stacked Card - 3 Cols) */}
        <div className="xl:col-span-3 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-400/12 p-6 flex flex-col justify-between gap-5">
          {/* Top Half: Indeks Kesegaran Ikan */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-[#94A3B8]">
              <span className="font-semibold">
                Indeks Kesegaran Ikan (Rantai Dingin)
              </span>
              <Snowflake className="w-4 h-4 text-[#06B6D4]" />
            </div>

            <div className="flex items-baseline justify-between">
              <p className="text-3xl font-mono font-bold text-slate-900 dark:text-[#F8FAFC]">
                {simOutput.indeksKesegaranPersen}%
              </p>
              <span className="text-xs font-mono text-[#10B981]">
                Es: {simInput.iceKg} kg
              </span>
            </div>

            {/* Horizontal scale bar (0 - 50 - 100) */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-mono text-slate-400">
                <span>0</span>
                <span>50</span>
                <span>100</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  style={{ width: `${simOutput.indeksKesegaranPersen}%` }}
                  className="h-full rounded-full bg-gradient-to-r from-[#06B6D4] to-[#10B981]"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-2.5">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-[#94A3B8]">
              <span className="font-semibold">
                Status Kepatuhan Ruang &amp; Biologi
              </span>
              <ShieldCheck className="w-4 h-4 text-[#10B981]" />
            </div>

            <p
              className={`text-xl font-extrabold tracking-tight ${
                simOutput.zonaKkpColor === 'emerald' &&
                simOutput.isBiologicallyCompliant
                  ? 'text-[#10B981]'
                  : simOutput.zonaKkpColor === 'crimson'
                    ? 'text-[#EF4444]'
                    : 'text-[#F59E0B]'
              }`}
            >
              {simOutput.zonaKkpColor === 'emerald' &&
              simOutput.isBiologicallyCompliant
                ? 'AMAN & LESTARI'
                : simOutput.zonaKkpColor === 'crimson'
                  ? 'PELANGGARAN ZONA INTI'
                  : 'PERLU MITIGASI SELEKTIF'}
            </p>

            <div className="text-xs text-slate-600 dark:text-[#94A3B8] flex flex-wrap items-center gap-1.5">
              <span>{simOutput.zonaKkp}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">
                Rasio Lm {simOutput.rasioLm}{' '}
                {simOutput.isBiologicallyCompliant ? '≥ 1.0' : '< 1.0'}
              </span>
            </div>
          </div>
        </div>

        {/* Bento Card 3: Aktivitas Cuaca & Stres Panas WBGT (Meteorology Telemetry - 3 Cols) */}
        <div className="xl:col-span-3 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-400/12 p-6 flex flex-col justify-between gap-5">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-[#94A3B8] mb-2">
              <span className="font-semibold">
                Aktivitas Cuaca &amp; Stres Panas WBGT
              </span>
              <Thermometer className="w-4 h-4 text-[#F59E0B]" />
            </div>
            <p className="text-3xl font-mono font-bold text-slate-900 dark:text-[#F8FAFC]">
              {simOutput.wbgtC} °C
            </p>
            <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-1">
              Beban Termal Kerja Dek Kapal (Tekanan Uap {simOutput.vaporPressureHpa} hPa)
            </p>
          </div>

          <div className="space-y-3 text-xs border-t border-slate-200 dark:border-slate-800 pt-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-300 flex items-center gap-2">
                <span className="w-2 h-2 bg-[#10B981] inline-block" />
                Tinggi Gelombang
              </span>
              <span className="font-mono font-semibold text-slate-900 dark:text-[#F8FAFC]">
                {simInput.waveM} m ({simOutput.waveCategory})
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-300 flex items-center gap-2">
                <span className="w-2 h-2 bg-[#06B6D4] inline-block" />
                Kecepatan Angin
              </span>
              <span className="font-mono font-semibold text-slate-900 dark:text-[#F8FAFC]">
                {simInput.windKnot} knot
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-300 flex items-center gap-2">
                <span className="w-2 h-2 bg-[#3B82F6] inline-block" />
                Hidrasi Wajib Nelayan
              </span>
              <span className="font-mono font-semibold text-[#06B6D4]">
                {simOutput.hydrationLitersPerHour} Liter / Jam
              </span>
            </div>
          </div>
        </div>

        {/* Bento Card 4: Keputusan Dual-Engine AI & Struk Harga Keringat (Semi-Circle Gauge Card - 3 Cols) */}
        <div className="xl:col-span-3 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-400/12 p-6 flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-[#94A3B8]">
            <span className="font-semibold">Skor Kelayakan Melaut AI</span>
            <span className="font-mono text-[#06B6D4]">Minimum Supply-Price</span>
          </div>

          {/* Semi-Circular Arc Gauge (0-100) */}
          <div className="flex flex-col items-center justify-center">
            <svg viewBox="0 0 180 105" className="w-44 h-26">
              <path
                d="M 18 90 A 72 72 0 0 1 162 90"
                fill="none"
                stroke="rgba(148, 163, 184, 0.2)"
                strokeWidth="12"
                strokeLinecap="round"
              />
              <path
                d="M 18 90 A 72 72 0 0 1 162 90"
                fill="none"
                stroke={decisionHex}
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={gaugeCircumference}
                strokeDashoffset={strokeDashoffset}
              />
              <text
                x="90"
                y="72"
                textAnchor="middle"
                fill="currentColor"
                className="text-slate-900 dark:text-[#F8FAFC] font-mono font-bold text-xl"
              >
                {simOutput.skorKelayakanAi.toFixed(1)}
              </text>
              <text
                x="90"
                y="90"
                textAnchor="middle"
                fill="#94A3B8"
                fontSize="10"
                fontFamily="JetBrains Mono"
              >
                / 100 SKOR AI
              </text>
            </svg>

            {/* Giant Semantic Decision Banner */}
            <div
              className={`w-full text-center py-1.5 px-3 rounded-lg font-mono font-bold text-xs tracking-wide border ${
                simOutput.decisionColor === 'emerald'
                  ? 'bg-emerald-500/15 text-[#10B981] border-emerald-500/30'
                  : simOutput.decisionColor === 'amber'
                    ? 'bg-amber-500/15 text-[#F59E0B] border-amber-500/30'
                    : 'bg-red-500/15 text-[#EF4444] border-red-500/30'
              }`}
            >
              {simOutput.shortDecisionBadge}
            </div>
          </div>

          {/* Highlighted Harga Layak Effort vs Harga Aktual */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-500 dark:text-[#94A3B8] block text-[11px]">
                Harga Layak Effort
              </span>
              <span className="font-mono font-bold text-sm text-[#06B6D4]">
                Rp {simOutput.hargaLayakEffortRp.toLocaleString('id-ID')}/kg
              </span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 dark:text-[#94A3B8] block text-[11px]">
                Harga Aktual Pasar
              </span>
              <span className="font-mono font-bold text-sm text-slate-900 dark:text-[#F8FAFC]">
                Rp {simOutput.hargaAktualTengkulakRp.toLocaleString('id-ID')}/kg
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Accounting Profit Illusion Quick Alert Strip if Active */}
      {simOutput.isAccountingProfitIllusion && (
        <div className="rounded-2xl bg-amber-500/15 border border-amber-500/40 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-[#F59E0B] shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm">
              <p className="font-bold text-amber-600 dark:text-[#F59E0B]">
                Terdeteksi Ilusi Laba Akuntansi (Accounting Profit Illusion)!
              </p>
              <p className="text-slate-700 dark:text-slate-200 mt-0.5">
                Laba tunai terlihat positif (
                <span className="font-mono font-semibold">
                  +Rp {simOutput.labaAkuntansiRp.toLocaleString('id-ID')}
                </span>
                ), namun Laba Ekonomi Riil negatif (
                <span className="font-mono font-semibold text-[#EF4444]">
                  Rp {simOutput.labaEkonomiRiilRp.toLocaleString('id-ID')}
                </span>
                ) karena upah per jam melaut di bawah upah kerja darat + risiko
                iklim.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('simulator')}
            className="px-4 py-2 rounded-xl bg-[#F59E0B] text-slate-950 font-bold text-xs whitespace-nowrap shrink-0 cursor-pointer"
          >
            Buka Struk Negosiasi Harga
          </button>
        </div>
      )}
    </div>
  );
};
