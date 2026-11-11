/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Compass,
  LayoutGrid,
  Map,
  Calculator,
  BarChart3,
  Sun,
  Moon,
  Home,
} from 'lucide-react';
import {
  RegionKey,
  STUDY_REGIONS,
  SimulationInput,
  SimulationOutput,
  runPanduNelayanSimulation,
  HourlyForecastItem,
  PippReferenceRow,
  evaluateMaritimeToastAlerts,
} from './utils/maritimeFormulas';
import { HeroLandingView, NavTab } from './components/HeroLandingView';
import { BentoCommandView } from './components/BentoCommandView';
import { WebGisForecastView } from './components/WebGisForecastView';
import { PreTripSimulatorView } from './components/PreTripSimulatorView';
import { PippAnalyticsView } from './components/PippAnalyticsView';
import { MaritimeToastStack } from './components/MaritimeToastStack';

const DEFAULT_SIMULATION_INPUT: SimulationInput = {
  region: 'Karangantu Serang',
  year: 2026,
  species: 'Kembung',
  fishLengthCm: 20.9,
  distanceKm: 18.0,
  durationHours: 8.4,
  fuelPriceRp: 6800,
  iceKg: 20,
  capitalSource: 'Mandiri / Koperasi',
  middlemanCutPercent: 0.0,
  tempC: 33.5,
  rhPercent: 70.2,
  windKnot: 10.23,
  waveM: 0.27,
  season: 'Musim Peralihan II (Sep-Nov)',
  targetLat: -5.98,
  targetLon: 106.16,
};

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') return 'bento';
    return 'hero';
  });

  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [simInput, setSimInput] = useState<SimulationInput>(
    DEFAULT_SIMULATION_INPUT
  );
  const [dismissedToastIds, setDismissedToastIds] = useState<string[]>([]);
  const [toastSoundEnabled, setToastSoundEnabled] = useState<boolean>(false);

  // Sync dark mode class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Real-time scientific & microeconomic calculation (instant local TS engine)
  const localSimOutput = useMemo(
    () => runPanduNelayanSimulation(simInput),
    [simInput]
  );

  // PKL override state: holds fields from the Python RandomForest backend
  const [pklOverrides, setPklOverrides] = useState<Partial<SimulationOutput> | null>(null);

  // Merged output: local TS engine + PKL overrides when available
  const simOutput: SimulationOutput = useMemo(() => {
    if (!pklOverrides) return localSimOutput;
    return { ...localSimOutput, ...pklOverrides };
  }, [localSimOutput, pklOverrides]);

  // Debounced async effect: POST /api/predict to Python FastAPI backend (120ms debounce)
  const pklTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    setPklOverrides(null); // Clear stale PKL data immediately on input change
    if (pklTimerRef.current) clearTimeout(pklTimerRef.current);
    pklTimerRef.current = setTimeout(async () => {
      try {
        const resp = await fetch('/api/predict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(simInput),
        });
        if (!resp.ok) return;
        const json = (await resp.json()) as { ok?: boolean; data?: Record<string, unknown> };
        if (json.ok && json.data) {
          const d = json.data;
          setPklOverrides({
            hargaLayakEffortRp: typeof d.hargaLayakEffortRp === 'number' ? d.hargaLayakEffortRp : undefined,
            decisionClass: typeof d.decisionClass === 'number' ? (d.decisionClass as SimulationOutput['decisionClass']) : undefined,
            decisionLabel: typeof d.decisionLabel === 'string' ? (d.decisionLabel as SimulationOutput['decisionLabel']) : undefined,
            shortDecisionBadge: typeof d.shortDecisionBadge === 'string' ? (d.shortDecisionBadge as SimulationOutput['shortDecisionBadge']) : undefined,
            decisionColor: typeof d.decisionColor === 'string' ? (d.decisionColor as SimulationOutput['decisionColor']) : undefined,
            skorKelayakanAi: typeof d.skorKelayakanAi === 'number' ? d.skorKelayakanAi : undefined,
            labaEkonomiRiilRp: typeof d.labaEkonomiRiilRp === 'number' ? d.labaEkonomiRiilRp : undefined,
            isAccountingProfitIllusion: typeof d.isAccountingProfitIllusion === 'boolean' ? d.isAccountingProfitIllusion : undefined,
          });
        }
      } catch {
        // Python backend offline — local TS engine remains active
      }
    }, 120);
    return () => { if (pklTimerRef.current) clearTimeout(pklTimerRef.current); };
  }, [simInput]);

  // Evaluate active toast notifications for TUNDA MELAUT or high wave risk
  const activeToastAlerts = useMemo(
    () => evaluateMaritimeToastAlerts(simInput, simOutput),
    [simInput, simOutput]
  );

  // Reset dismissed toast IDs whenever the user changes simulation input parameters
  const handleUpdateInput = (partial: Partial<SimulationInput>) => {
    setDismissedToastIds([]);
    setSimInput((prev) => ({ ...prev, ...partial }));
  };

  const handleRegionChange = (region: RegionKey) => {
    const regInfo = STUDY_REGIONS[region];
    setDismissedToastIds([]);
    setSimInput((prev) => ({
      ...prev,
      region,
      targetLat: regInfo.lat,
      targetLon: regInfo.lon,
      distanceKm: regInfo.defaultDistanceKm,
      durationHours: regInfo.defaultDurationHours,
      tempC: regInfo.defaultTempC,
      rhPercent: regInfo.defaultRhPercent,
      windKnot: regInfo.defaultWindKnot,
      waveM: regInfo.defaultWaveM,
    }));
  };

  const handleToggleCapitalSource = () => {
    setDismissedToastIds([]);
    setSimInput((prev) => {
      const nextSource =
        prev.capitalSource === 'Mandiri / Koperasi'
          ? 'Pinjaman Tengkulak'
          : 'Mandiri / Koperasi';
      return {
        ...prev,
        capitalSource: nextSource,
        middlemanCutPercent: nextSource === 'Pinjaman Tengkulak' ? 20.8 : 0.0,
      };
    });
  };

  const handleMapCoordinateSelect = (lat: number, lon: number) => {
    setDismissedToastIds([]);
    setSimInput((prev) => ({
      ...prev,
      targetLat: lat,
      targetLon: lon,
    }));
  };

  const handleSelectHourlyWeather = (slot: HourlyForecastItem) => {
    setDismissedToastIds([]);
    setSimInput((prev) => ({
      ...prev,
      year: slot.year || prev.year,
      season: slot.season || prev.season,
      tempC: slot.tempC,
      rhPercent: slot.rhPercent,
      windKnot: slot.windKnot,
      waveM: slot.waveM,
    }));
  };

  const handleLoadRowToSimulator = (row: PippReferenceRow) => {
    const regInfo = STUDY_REGIONS[row.region];
    setDismissedToastIds([]);
    setSimInput((prev) => ({
      ...prev,
      region: row.region,
      year: row.year,
      season: row.season,
      species: row.species,
      fishLengthCm: row.caughtLengthCm,
      targetLat: regInfo.lat,
      targetLon: regInfo.lon,
    }));
    setActiveTab('simulator');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0F172A] dark:text-[#F8FAFC] transition-colors">
      {/* VIEW 1: CINEMATIC HERO LANDING PAGE */}
      {activeTab === 'hero' ? (
        <HeroLandingView
          activeTab={activeTab}
          onSelectTab={(tab) => setActiveTab(tab)}
        />
      ) : (
        /* COMMAND CENTER SHELL WITH STICKY LEFT SIDEBAR ON DESKTOP & BOTTOM NAV ON MOBILE */
        <div className="flex min-h-screen flex-col md:flex-row">
          {/* 1. Left Slim Vertical Icon Sidebar (Desktop/Tablet md:flex) */}
          <aside
            aria-label="Navigasi Command Center"
            className="hidden md:flex w-16 bg-slate-900 border-r border-slate-800 flex-col items-center justify-between py-4 shrink-0 sticky top-0 h-screen z-40"
          >
            {/* Top Brand Icon -> Back to Hero */}
            <div className="flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={() => setActiveTab('hero')}
                title="Kembali ke Beranda Sinematik"
                aria-label="Kembali ke Beranda Sinematik"
                className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-400/40 text-[#06B6D4] flex items-center justify-center hover:bg-cyan-500/25 transition-all cursor-pointer"
              >
                <Compass className="w-5 h-5" />
              </button>

              <div className="w-8 h-px bg-slate-800 my-1" />

              {/* 5 Main View Icon Buttons */}
              <button
                type="button"
                onClick={() => setActiveTab('bento')}
                title="Bento Telemetry Dashboard"
                aria-label="Bento Dashboard"
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                  activeTab === 'bento'
                    ? 'bg-[#06B6D4] text-slate-950 shadow-lg shadow-cyan-500/30'
                    : 'text-[#94A3B8] hover:bg-slate-800 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('webgis')}
                title="WebGIS & Prakiraan BMKG"
                aria-label="WebGIS & Prakiraan BMKG"
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                  activeTab === 'webgis'
                    ? 'bg-[#06B6D4] text-slate-950 shadow-lg shadow-cyan-500/30'
                    : 'text-[#94A3B8] hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Map className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('simulator')}
                title="Kalkulator Opportunity Cost & AI"
                aria-label="Kalkulator Opportunity Cost & AI"
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                  activeTab === 'simulator'
                    ? 'bg-[#06B6D4] text-slate-950 shadow-lg shadow-cyan-500/30'
                    : 'text-[#94A3B8] hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Calculator className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('analytics')}
                title="Analitik PIPP & Tren 2023-2026"
                aria-label="Analitik PIPP & Tren 2023-2026"
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                  activeTab === 'analytics'
                    ? 'bg-[#06B6D4] text-slate-950 shadow-lg shadow-cyan-500/30'
                    : 'text-[#94A3B8] hover:bg-slate-800 hover:text-white'
                }`}
              >
                <BarChart3 className="w-5 h-5" />
              </button>
            </div>

            {/* Bottom Utility Controls: Light/Dark Contrast Toggle */}
            <div className="flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={() => setIsDarkMode((d) => !d)}
                title="Light/Dark Contrast Toggle"
                aria-label="Light/Dark Contrast Toggle"
                className="w-10 h-10 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-amber-400 flex items-center justify-center transition-all cursor-pointer"
              >
                {isDarkMode ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </button>
            </div>
          </aside>

          {/* Main Command Viewport */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Top Contextual Navigation Bar */}
            <header className="w-full px-3.5 sm:px-6 py-3 sm:py-3.5 bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 sm:gap-6 sticky top-0 z-30">
              {/* Zone 1: Single-line Brand Title */}
              <button
                type="button"
                onClick={() => setActiveTab('hero')}
                className="text-sm sm:text-base font-extrabold tracking-tight text-slate-900 dark:text-[#F8FAFC] whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-2"
              >
                <Home className="w-4 h-4 text-[#06B6D4] shrink-0" />
                <span>PANDU-NELAYAN</span>
              </button>

              {/* Zone 2: 5 Single-Line Navigation Links (Desktop) */}
              <nav
                aria-label="Sub-Navigasi Command Center"
                className="hidden lg:flex items-center gap-5 xl:gap-6 text-xs font-semibold text-slate-600 dark:text-[#94A3B8]"
              >
                <button
                  type="button"
                  onClick={() => setActiveTab('bento')}
                  className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    activeTab === 'bento'
                      ? 'text-[#06B6D4] underline underline-offset-8'
                      : 'hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Command Bento
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('webgis')}
                  className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    activeTab === 'webgis'
                      ? 'text-[#06B6D4] underline underline-offset-8'
                      : 'hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  WebGIS &amp; Cuaca
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('simulator')}
                  className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    activeTab === 'simulator'
                      ? 'text-[#06B6D4] underline underline-offset-8'
                      : 'hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Simulasi AI &amp; Harga Layak
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('analytics')}
                  className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    activeTab === 'analytics'
                      ? 'text-[#06B6D4] underline underline-offset-8'
                      : 'hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Analitik PIPP (2023-2026)
                </button>
              </nav>

              {/* Zone 3: Mobile Utility Controls */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsDarkMode((d) => !d)}
                  aria-label="Ubah Tema Terang atau Gelap"
                  className="md:hidden p-2 rounded-xl bg-slate-100 dark:bg-[#1E293B] text-amber-500 dark:text-amber-400 border border-slate-300 dark:border-slate-700 cursor-pointer"
                >
                  {isDarkMode ? (
                    <Sun className="w-4 h-4" />
                  ) : (
                    <Moon className="w-4 h-4" />
                  )}
                </button>
              </div>
            </header>

            {/* Active View Body (extra bottom padding on mobile for sticky bottom nav) */}
            <main className="flex-1 w-full max-w-[1400px] mx-auto px-3.5 sm:px-6 pt-4 sm:pt-6 pb-24 md:pb-8 overflow-x-hidden">
              {activeTab === 'bento' && (
                <BentoCommandView
                  simInput={simInput}
                  simOutput={simOutput}
                  onRegionChange={handleRegionChange}
                  onToggleCapitalSource={handleToggleCapitalSource}
                  onNavigateTab={(t) => setActiveTab(t)}
                />
              )}

              {activeTab === 'webgis' && (
                <WebGisForecastView
                  simInput={simInput}
                  simOutput={simOutput}
                  onRegionChange={handleRegionChange}
                  onMapCoordinateSelect={handleMapCoordinateSelect}
                  onSelectHourlyWeather={handleSelectHourlyWeather}
                />
              )}

              {activeTab === 'simulator' && (
                <PreTripSimulatorView
                  simInput={simInput}
                  simOutput={simOutput}
                  onUpdateInput={handleUpdateInput}
                  onResetDefault={() => {
                    setDismissedToastIds([]);
                    setSimInput(DEFAULT_SIMULATION_INPUT);
                  }}
                />
              )}

              {activeTab === 'analytics' && (
                <PippAnalyticsView
                  onSelectRowForSimulation={handleLoadRowToSimulator}
                />
              )}
            </main>
          </div>

          {/* Mobile Sticky Bottom Navigation Bar (md:hidden) */}
          <nav
            aria-label="Navigasi Bawah Handphone"
            className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-1.5 py-1.5 grid grid-cols-4 gap-1"
          >
            <button
              type="button"
              onClick={() => setActiveTab('bento')}
              className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-[10px] font-semibold transition-all cursor-pointer ${
                activeTab === 'bento'
                  ? 'bg-[#06B6D4] text-slate-950 font-bold shadow'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              <LayoutGrid className="w-4 h-4 mb-0.5" />
              <span className="truncate max-w-full">Bento</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('webgis')}
              className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-[10px] font-semibold transition-all cursor-pointer ${
                activeTab === 'webgis'
                  ? 'bg-[#06B6D4] text-slate-950 font-bold shadow'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              <Map className="w-4 h-4 mb-0.5" />
              <span className="truncate max-w-full">WebGIS</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('simulator')}
              className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-[10px] font-semibold transition-all cursor-pointer ${
                activeTab === 'simulator'
                  ? 'bg-[#06B6D4] text-slate-950 font-bold shadow'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              <Calculator className="w-4 h-4 mb-0.5" />
              <span className="truncate max-w-full">Simulasi AI</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('analytics')}
              className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-[10px] font-semibold transition-all cursor-pointer ${
                activeTab === 'analytics'
                  ? 'bg-[#06B6D4] text-slate-950 font-bold shadow'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              <BarChart3 className="w-4 h-4 mb-0.5" />
              <span className="truncate max-w-full">Analitik</span>
            </button>
          </nav>
        </div>
      )}

      {/* Real-Time Maritime Early Warning Toast Stack (TUNDA MELAUT & Gelombang Tinggi) */}
      <MaritimeToastStack
        alerts={activeToastAlerts}
        dismissedIds={dismissedToastIds}
        soundEnabled={toastSoundEnabled}
        onDismiss={(id) =>
          setDismissedToastIds((prev) =>
            prev.includes(id) ? prev : [...prev, id]
          )
        }
        onDismissAll={() =>
          setDismissedToastIds(activeToastAlerts.map((a) => a.id))
        }
        onToggleSound={() => setToastSoundEnabled((s) => !s)}
        onActionNavigate={() => setActiveTab('simulator')}
      />
    </div>
  );
}
