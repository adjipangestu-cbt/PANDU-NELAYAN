import React from 'react';
import {
  Sliders,
  AlertOctagon,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Scale,
  RotateCcw,
  Briefcase,
  Compass,
} from 'lucide-react';
import {
  RegionKey,
  SpeciesKey,
  SimulationYear,
  STUDY_REGIONS,
  TARGET_SPECIES,
  SimulationInput,
  SimulationOutput,
} from '../utils/maritimeFormulas';

interface PreTripSimulatorViewProps {
  simInput: SimulationInput;
  simOutput: SimulationOutput;
  onUpdateInput: (partial: Partial<SimulationInput>) => void;
  onResetDefault: () => void;
}

export const PreTripSimulatorView: React.FC<PreTripSimulatorViewProps> = ({
  simInput,
  simOutput,
  onUpdateInput,
  onResetDefault,
}) => {
  const speciesInfo = TARGET_SPECIES[simInput.species];

  // Preset scenarios to quickly demonstrate the 3 decision classes & Accounting Profit Illusion
  const applyScenarioPreset = (
    preset: 'optimal' | 'illusion' | 'kkp_violation'
  ) => {
    if (preset === 'optimal') {
      onUpdateInput({
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
        targetLat: STUDY_REGIONS['Karangantu Serang'].lat,
        targetLon: STUDY_REGIONS['Karangantu Serang'].lon,
      });
    } else if (preset === 'illusion') {
      onUpdateInput({
        region: 'Pesisir Indramayu',
        year: 2026,
        species: 'Lemuru',
        fishLengthCm: 15.2,
        distanceKm: 26.0,
        durationHours: 10.5,
        fuelPriceRp: 7500,
        iceKg: 16,
        capitalSource: 'Pinjaman Tengkulak',
        middlemanCutPercent: 24.0,
        tempC: 34.2,
        rhPercent: 74.0,
        windKnot: 13.5,
        waveM: 1.05,
        season: 'Musim Peralihan I (Mar-Mei)',
        targetLat: STUDY_REGIONS['Pesisir Indramayu'].lat,
        targetLon: STUDY_REGIONS['Pesisir Indramayu'].lon,
      });
    } else {
      // KKP Core Violation (< 2.0 km)
      const reg = STUDY_REGIONS[simInput.region];
      onUpdateInput({
        targetLat: Number((reg.kkp_lat + 0.005).toFixed(4)),
        targetLon: Number((reg.kkp_lon + 0.005).toFixed(4)),
        waveM: 1.85,
        windKnot: 17.5,
      });
    }
  };

  const fuelOptions = [
    { label: 'Rp 6.800 (Subsidi)', value: 6800 },
    { label: 'Rp 7.500 (SPDN)', value: 7500 },
    { label: 'Rp 9.000 (Kios)', value: 9000 },
    { label: 'Rp 10.000 (Eceran)', value: 10000 },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header & Quick Scenario Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 sm:gap-4">
        <div>
          <h2 className="text-lg sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-[#F8FAFC]">
            Simulator Pra-Melaut AI &amp; Struk Harga Keringat Nelayan
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-[#94A3B8]">
            Kalkulasi langsung <em>Explicit Cost</em>, <em>Implicit Opportunity Cost</em>,{' '}
            dan <em>Minimum Supply-Price</em> untuk membongkar Ilusi Laba Akuntansi.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => applyScenarioPreset('optimal')}
            className="px-3 sm:px-3.5 py-2 rounded-xl text-[11px] sm:text-xs font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 text-[#10B981] border border-emerald-500/30 transition-colors cursor-pointer text-center whitespace-nowrap shrink-0"
          >
            Skenario 1: Layak &amp; Mandiri
          </button>
          <button
            type="button"
            onClick={() => applyScenarioPreset('illusion')}
            className="px-3 sm:px-3.5 py-2 rounded-xl text-[11px] sm:text-xs font-semibold bg-amber-500/15 hover:bg-amber-500/25 text-[#F59E0B] border border-amber-500/30 transition-colors cursor-pointer text-center whitespace-nowrap shrink-0"
          >
            Skenario 2: Ilusi Laba
          </button>
          <button
            type="button"
            onClick={() => applyScenarioPreset('kkp_violation')}
            className="px-3 sm:px-3.5 py-2 rounded-xl text-[11px] sm:text-xs font-semibold bg-red-500/15 hover:bg-red-500/25 text-[#EF4444] border border-red-500/30 transition-colors cursor-pointer text-center whitespace-nowrap shrink-0"
          >
            Skenario 3: Tunda / KKP
          </button>
          <button
            type="button"
            onClick={onResetDefault}
            aria-label="Reset Parameter Simulasi"
            className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer flex items-center justify-center gap-1.5 text-[11px] sm:text-xs font-semibold"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="sm:hidden">Reset</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Simulator Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
        {/* 1. LEFT COLUMN: Input Controls Panel (5 Cols) */}
        <div className="lg:col-span-5 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-400/12 p-4 sm:p-6 space-y-4 sm:space-y-5">
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#06B6D4] shrink-0" />
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-[#F8FAFC]">
                Parameter Operasional, Biologi &amp; Cuaca
              </h3>
            </div>
            <span className="font-mono text-[11px] sm:text-xs text-[#06B6D4] shrink-0">
              Real-Time Input
            </span>
          </div>

          {/* Wilayah DPI & Tahun Simulasi */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label
                htmlFor="sim-region"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >
                Pilih Wilayah DPI
              </label>
              <select
                id="sim-region"
                value={simInput.region}
                onChange={(e) => {
                  const newReg = e.target.value as RegionKey;
                  const regData = STUDY_REGIONS[newReg];
                  onUpdateInput({
                    region: newReg,
                    targetLat: regData.lat,
                    targetLon: regData.lon,
                    distanceKm: regData.defaultDistanceKm,
                    durationHours: regData.defaultDurationHours,
                    tempC: regData.defaultTempC,
                    rhPercent: regData.defaultRhPercent,
                    windKnot: regData.defaultWindKnot,
                    waveM: regData.defaultWaveM,
                  });
                }}
                className="w-full rounded-xl bg-slate-50 dark:bg-[#0F172A] border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs font-semibold text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:border-[#06B6D4]"
              >
                {(Object.keys(STUDY_REGIONS) as RegionKey[]).map((r) => (
                  <option key={r} value={r}>
                    {STUDY_REGIONS[r].fullName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="sim-year"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >
                Tahun Simulasi
              </label>
              <select
                id="sim-year"
                value={simInput.year}
                onChange={(e) =>
                  onUpdateInput({
                    year: Number(e.target.value) as SimulationYear,
                  })
                }
                className="w-full rounded-xl bg-slate-50 dark:bg-[#0F172A] border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:border-[#06B6D4]"
              >
                {[2023, 2024, 2025, 2026].map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Pilih Spesies Target & Panjang Ikan Slider */}
          <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Pilih Spesies Target (Batas Matang Gonad Lm)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(Object.keys(TARGET_SPECIES) as SpeciesKey[]).map((sp) => {
                  const info = TARGET_SPECIES[sp];
                  const active = simInput.species === sp;
                  return (
                    <button
                      key={sp}
                      type="button"
                      onClick={() =>
                        onUpdateInput({
                          species: sp,
                          fishLengthCm: info.defaultLengthCm,
                        })
                      }
                      className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                        active
                          ? 'bg-cyan-500/15 border-[#06B6D4] text-slate-900 dark:text-white'
                          : 'bg-slate-50 dark:bg-[#0F172A] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <span className="text-xs font-bold block">{sp}</span>
                      <span className="text-[10px] font-mono text-[#06B6D4]">
                        Lm {info.lm_cm} cm
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between gap-2 text-xs mb-1.5">
                <label
                  htmlFor="fish-length-slider"
                  className="font-semibold text-slate-700 dark:text-slate-300"
                >
                  Rata-rata Panjang Ikan{' '}
                  <span className="font-mono text-[11px] text-[#06B6D4]">
                    (Rasio Lm: {simOutput.rasioLm})
                  </span>
                </label>
                <div className="flex items-center gap-1.5 shrink-0">
                  <input
                    id="fish-length-input"
                    type="number"
                    min={0}
                    step="any"
                    aria-label="Input Manual Rata-rata Panjang Ikan (cm)"
                    value={simInput.fishLengthCm}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      onUpdateInput({
                        fishLengthCm: Number.isNaN(val) ? 0 : Math.max(0, val),
                      });
                    }}
                    className="w-24 rounded-lg bg-slate-50 dark:bg-[#0F172A] border border-slate-300 dark:border-slate-700 px-2.5 py-1 text-right font-mono font-bold text-xs text-[#06B6D4] focus:outline-none focus:border-[#06B6D4]"
                  />
                  <span className="font-mono font-bold text-[#06B6D4]">
                    cm
                  </span>
                </div>
              </div>
              <input
                id="fish-length-slider"
                type="range"
                min={0}
                max={Math.max(150, Math.ceil(simInput.fishLengthCm * 1.5))}
                step={0.5}
                value={simInput.fishLengthCm}
                onChange={(e) =>
                  onUpdateInput({ fishLengthCm: Number(e.target.value) })
                }
                className="w-full accent-[#06B6D4] cursor-pointer"
              />
            </div>
          </div>

          {/* Jarak Tempuh PP & Durasi Kerja Melaut */}
          <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs mb-1.5">
                <label
                  htmlFor="distance-slider"
                  className="font-semibold text-slate-700 dark:text-slate-300"
                >
                  Jarak Tempuh Pulang-Pergi (km)
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    id="distance-input"
                    type="number"
                    min={0}
                    step="any"
                    aria-label="Input Manual Jarak Tempuh Pulang-Pergi (km)"
                    value={simInput.distanceKm}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      onUpdateInput({
                        distanceKm: Number.isNaN(val) ? 0 : Math.max(0, val),
                      });
                    }}
                    className="w-24 rounded-lg bg-slate-50 dark:bg-[#0F172A] border border-slate-300 dark:border-slate-700 px-2.5 py-1 text-right font-mono font-bold text-xs text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:border-[#06B6D4]"
                  />
                  <span className="font-mono font-bold text-slate-900 dark:text-[#F8FAFC]">
                    km
                  </span>
                </div>
              </div>
              <input
                id="distance-slider"
                type="range"
                min={0}
                max={Math.max(200, Math.ceil(simInput.distanceKm * 1.5))}
                step={0.5}
                value={simInput.distanceKm}
                onChange={(e) =>
                  onUpdateInput({ distanceKm: Number(e.target.value) })
                }
                className="w-full accent-[#06B6D4] cursor-pointer"
              />
            </div>

            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs mb-1.5">
                <label
                  htmlFor="duration-slider"
                  className="font-semibold text-slate-700 dark:text-slate-300"
                >
                  Durasi Kerja Melaut (Jam)
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    id="duration-input"
                    type="number"
                    min={0}
                    step="any"
                    aria-label="Input Manual Durasi Kerja Melaut (Jam)"
                    value={simInput.durationHours}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      onUpdateInput({
                        durationHours: Number.isNaN(val) ? 0 : Math.max(0, val),
                      });
                    }}
                    className="w-24 rounded-lg bg-slate-50 dark:bg-[#0F172A] border border-slate-300 dark:border-slate-700 px-2.5 py-1 text-right font-mono font-bold text-xs text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:border-[#06B6D4]"
                  />
                  <span className="font-mono font-bold text-slate-900 dark:text-[#F8FAFC]">
                    Jam
                  </span>
                </div>
              </div>
              <input
                id="duration-slider"
                type="range"
                min={0}
                max={Math.max(72, Math.ceil(simInput.durationHours * 1.5))}
                step={0.2}
                value={simInput.durationHours}
                onChange={(e) =>
                  onUpdateInput({ durationHours: Number(e.target.value) })
                }
                className="w-full accent-[#06B6D4] cursor-pointer"
              />
            </div>
          </div>

          {/* Harga Beli Solar per Liter & Es Balok Dibawa */}
          <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Harga Beli Solar per Liter
              </label>
              <div className="grid grid-cols-2 gap-2">
                {fuelOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onUpdateInput({ fuelPriceRp: opt.value })}
                    className={`px-3 py-2 rounded-xl text-xs font-mono font-semibold border transition-all cursor-pointer ${
                      simInput.fuelPriceRp === opt.value
                        ? 'bg-[#06B6D4] text-slate-950 border-[#06B6D4] font-bold'
                        : 'bg-slate-50 dark:bg-[#0F172A] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs mb-1.5">
                <label
                  htmlFor="ice-slider"
                  className="font-semibold text-slate-700 dark:text-slate-300"
                >
                  Es Balok Dibawa (Rantai Dingin)
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    id="ice-input"
                    type="number"
                    min={0}
                    step="any"
                    aria-label="Input Manual Es Balok Dibawa (kg)"
                    value={simInput.iceKg}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      onUpdateInput({
                        iceKg: Number.isNaN(val) ? 0 : Math.max(0, val),
                      });
                    }}
                    className="w-24 rounded-lg bg-slate-50 dark:bg-[#0F172A] border border-slate-300 dark:border-slate-700 px-2.5 py-1 text-right font-mono font-bold text-xs text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:border-[#06B6D4]"
                  />
                  <span className="font-mono font-bold text-slate-900 dark:text-[#F8FAFC]">
                    kg
                  </span>
                </div>
              </div>
              <input
                id="ice-slider"
                type="range"
                min={0}
                max={Math.max(200, Math.ceil(simInput.iceKg * 1.5))}
                step={1}
                value={simInput.iceKg}
                onChange={(e) =>
                  onUpdateInput({ iceKg: Number(e.target.value) })
                }
                className="w-full accent-[#06B6D4] cursor-pointer"
              />
            </div>
          </div>

          {/* Sumber Modal Melaut Toggle Switch */}
          <div className="space-y-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Sumber Modal Melaut (Struktur Pasar Pendaratan)
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() =>
                  onUpdateInput({
                    capitalSource: 'Mandiri / Koperasi',
                    middlemanCutPercent: 0.0,
                  })
                }
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  simInput.capitalSource === 'Mandiri / Koperasi'
                    ? 'bg-[#10B981] text-slate-950 shadow'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Mandiri / Koperasi (0–4%)
              </button>
              <button
                type="button"
                onClick={() =>
                  onUpdateInput({
                    capitalSource: 'Pinjaman Tengkulak',
                    middlemanCutPercent: 20.8,
                  })
                }
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  simInput.capitalSource === 'Pinjaman Tengkulak'
                    ? 'bg-[#EF4444] text-white shadow'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Pinjaman Tengkulak (15–28%)
              </button>
            </div>
          </div>

          {/* Kondisi Cuaca Lapangan Sliders */}
          <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <span className="block text-xs font-bold text-slate-800 dark:text-slate-200">
              Kondisi Cuaca Lapangan &amp; Termal Dek
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <label htmlFor="temp-slider">Suhu Udara (°C)</label>
                  <span className="font-mono font-bold">{simInput.tempC}°C</span>
                </div>
                <input
                  id="temp-slider"
                  type="range"
                  min={27}
                  max={38}
                  step={0.1}
                  value={simInput.tempC}
                  onChange={(e) =>
                    onUpdateInput({ tempC: Number(e.target.value) })
                  }
                  className="w-full accent-[#F59E0B] cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <label htmlFor="rh-slider">Kelembapan (%)</label>
                  <span className="font-mono font-bold">
                    {simInput.rhPercent}%
                  </span>
                </div>
                <input
                  id="rh-slider"
                  type="range"
                  min={55}
                  max={95}
                  step={0.5}
                  value={simInput.rhPercent}
                  onChange={(e) =>
                    onUpdateInput({ rhPercent: Number(e.target.value) })
                  }
                  className="w-full accent-[#06B6D4] cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <label htmlFor="wind-slider">Kecepatan Angin (knot)</label>
                  <span className="font-mono font-bold">
                    {simInput.windKnot} kt
                  </span>
                </div>
                <input
                  id="wind-slider"
                  type="range"
                  min={3}
                  max={28}
                  step={0.2}
                  value={simInput.windKnot}
                  onChange={(e) =>
                    onUpdateInput({ windKnot: Number(e.target.value) })
                  }
                  className="w-full accent-[#06B6D4] cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <label htmlFor="wave-slider">Tinggi Gelombang (m)</label>
                  <span className="font-mono font-bold">{simInput.waveM} m</span>
                </div>
                <input
                  id="wave-slider"
                  type="range"
                  min={0.1}
                  max={3.2}
                  step={0.05}
                  value={simInput.waveM}
                  onChange={(e) =>
                    onUpdateInput({ waveM: Number(e.target.value) })
                  }
                  className="w-full accent-[#3B82F6] cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 2. RIGHT COLUMN: Real-Time Dual-Engine AI Output & Fair-Price Receipt (7 Cols) */}
        <div className="lg:col-span-7 space-y-4 sm:space-y-5">
          {/* Giant Semantic Decision Banner */}
          <div
            data-testid="ai-decision-banner"
            className={`rounded-2xl p-4 sm:p-6 border transition-all ${
              simOutput.decisionColor === 'emerald'
                ? 'bg-emerald-500/15 border-[#10B981]'
                : simOutput.decisionColor === 'amber'
                  ? 'bg-amber-500/15 border-[#F59E0B]'
                  : 'bg-red-500/15 border-[#EF4444]'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4">
              <div className="flex items-start gap-3">
                {simOutput.decisionColor === 'emerald' ? (
                  <CheckCircle2 className="w-7 h-7 sm:w-8 sm:h-8 text-[#10B981] shrink-0 mt-0.5" />
                ) : simOutput.decisionColor === 'amber' ? (
                  <AlertTriangle className="w-7 h-7 sm:w-8 sm:h-8 text-[#F59E0B] shrink-0 mt-0.5" />
                ) : (
                  <AlertOctagon className="w-7 h-7 sm:w-8 sm:h-8 text-[#EF4444] shrink-0 mt-0.5" />
                )}
                <div>
                  <span className="font-mono text-[10px] sm:text-xs uppercase tracking-wider text-slate-600 dark:text-slate-300 block">
                    KEPUTUSAN DUAL-ENGINE RANDOM FOREST AI • KELAS{' '}
                    {simOutput.decisionClass}
                  </span>
                  <h3
                    className={`text-base sm:text-xl font-extrabold tracking-tight mt-0.5 leading-snug ${
                      simOutput.decisionColor === 'emerald'
                        ? 'text-[#10B981]'
                        : simOutput.decisionColor === 'amber'
                          ? 'text-[#F59E0B]'
                          : 'text-[#EF4444]'
                    }`}
                  >
                    {simOutput.decisionLabel}
                  </h3>
                </div>
              </div>

              <div className="flex sm:block items-baseline justify-between border-t sm:border-t-0 border-slate-400/20 pt-2.5 sm:pt-0 sm:text-right font-mono shrink-0">
                <span className="text-xs text-slate-600 dark:text-slate-300 block">
                  Skor Kelayakan
                </span>
                <span className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-[#F8FAFC]">
                  {simOutput.skorKelayakanAi.toFixed(1)}{' '}
                  <span className="text-xs font-normal text-slate-400">
                    / 100
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Kartu Struk Negosiasi Harga ("Minimum Supply-Price Receipt") */}
          <div className="rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-400/12 p-4 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-[#06B6D4] shrink-0" />
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-[#F8FAFC]">
                  Kartu Struk Negosiasi Harga (&ldquo;Minimum Supply-Price
                  Receipt&rdquo;)
                </h3>
              </div>
              <span className="font-mono text-[11px] sm:text-xs text-slate-500 dark:text-[#94A3B8]">
                Target CPUE: {simOutput.cpueKg} kg/trip
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              {/* 1. Harga Impas Modal Tunai */}
              <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 dark:bg-[#0F172A]/80 border border-slate-200 dark:border-slate-800">
                <span className="text-xs text-slate-500 dark:text-[#94A3B8] block">
                  1. Harga Impas Modal Tunai
                </span>
                <p className="text-lg sm:text-xl font-mono font-bold text-slate-900 dark:text-[#F8FAFC] mt-1">
                  Rp {simOutput.hargaImpasMinimalRp.toLocaleString('id-ID')}
                  <span className="text-xs font-normal text-slate-400">
                    /kg
                  </span>
                </p>
                <span className="text-[11px] text-slate-500 dark:text-[#94A3B8] mt-1 block">
                  Hanya menutup BBM Solar &amp; Es
                </span>
              </div>

              {/* 2. Harga Layak Effort AI (Highlighted in glowing Cyan/Emerald) */}
              <div className="p-3.5 sm:p-4 rounded-xl bg-cyan-500/10 border-2 border-[#06B6D4] shadow-lg shadow-cyan-500/10">
                <span className="text-xs font-bold text-[#06B6D4] block">
                  2. Harga Layak Effort AI
                </span>
                <p className="text-lg sm:text-xl font-mono font-extrabold text-slate-900 dark:text-[#F8FAFC] mt-1">
                  Rp {simOutput.hargaLayakEffortRp.toLocaleString('id-ID')}
                  <span className="text-xs font-normal text-slate-400">
                    /kg
                  </span>
                </p>
                <span className="text-[11px] text-[#10B981] font-medium mt-1 block">
                  Minimum Supply-Price Adil
                </span>
              </div>

              {/* 3. Harga Beli Aktual Tengkulak/Pasar */}
              <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 dark:bg-[#0F172A]/80 border border-slate-200 dark:border-slate-800">
                <span className="text-xs text-slate-500 dark:text-[#94A3B8] block">
                  3. Harga Aktual Pasar/Tengkulak
                </span>
                <p className="text-lg sm:text-xl font-mono font-bold text-slate-900 dark:text-[#F8FAFC] mt-1">
                  Rp {simOutput.hargaAktualTengkulakRp.toLocaleString('id-ID')}
                  <span className="text-xs font-normal text-slate-400">
                    /kg
                  </span>
                </p>
                <span
                  className={`text-[11px] font-mono font-semibold mt-1 block ${
                    simOutput.rasioKelayakanHargaPersen >= 100
                      ? 'text-[#10B981]'
                      : 'text-[#EF4444]'
                  }`}
                >
                  Rasio Kelayakan: {simOutput.rasioKelayakanHargaPersen}%
                </span>
              </div>
            </div>
          </div>

          {/* Accounting Profit vs Economic Profit Breakdown Table (Core Economic Theory) */}
          <div className="rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-400/12 p-4 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-[#06B6D4] shrink-0" />
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-[#F8FAFC]">
                  Bedah Laba Akuntansi vs Laba Ekonomi Riil (Opportunity Cost)
                </h3>
              </div>
              {simOutput.isAccountingProfitIllusion && (
                <span className="text-[11px] sm:text-xs font-mono font-bold text-[#F59E0B]">
                  ILUSI LABA AKUNTANSI TERDETEKSI
                </span>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-[11px] sm:text-xs text-left border-collapse">
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  <tr>
                    <td className="py-2.5 pr-2 font-semibold text-slate-800 dark:text-slate-200">
                      Pendapatan Kotor Penjualan Ikan ({simOutput.cpueKg} kg × Rp{' '}
                      {simOutput.hargaAktualTengkulakRp.toLocaleString('id-ID')})
                    </td>
                    <td className="py-2.5 text-right font-mono font-bold text-slate-900 dark:text-[#F8FAFC] whitespace-nowrap">
                      Rp {simOutput.pendapatanKotorRp.toLocaleString('id-ID')}
                    </td>
                  </tr>

                  <tr className="text-slate-600 dark:text-[#94A3B8]">
                    <td className="py-2.5 pr-2">
                      (−) Explicit Cost: Modal Tunai Solar ({simOutput.konsumsiBbmLiter}{' '}
                      L) + Es Balok ({simInput.iceKg} kg) + Perbekalan
                    </td>
                    <td className="py-2.5 text-right font-mono whitespace-nowrap">
                      − Rp{' '}
                      {simOutput.totalModalOperasionalRp.toLocaleString('id-ID')}
                    </td>
                  </tr>

                  <tr className="bg-slate-50 dark:bg-slate-800/50">
                    <td className="py-2.5 px-2 font-bold text-slate-900 dark:text-[#F8FAFC]">
                      = Laba Akuntansi Semu (Accounting Profit / Sisa Uang Tunai)
                    </td>
                    <td
                      className={`py-2.5 text-right font-mono font-extrabold pr-2 whitespace-nowrap ${
                        simOutput.labaAkuntansiRp > 0
                          ? 'text-[#10B981]'
                          : 'text-[#EF4444]'
                      }`}
                    >
                      Rp {simOutput.labaAkuntansiRp.toLocaleString('id-ID')}
                    </td>
                  </tr>

                  <tr className="text-slate-600 dark:text-[#94A3B8]">
                    <td className="py-2.5 pr-2">
                      (−) Implicit Opportunity Cost Kerja Darat ({simInput.durationHours}{' '}
                      jam × Rp {simOutput.upahAltPerJamRp.toLocaleString('id-ID')}
                      /jam)
                    </td>
                    <td className="py-2.5 text-right font-mono whitespace-nowrap">
                      − Rp {simOutput.upahKerjaWajarRp.toLocaleString('id-ID')}
                    </td>
                  </tr>

                  <tr className="text-slate-600 dark:text-[#94A3B8]">
                    <td className="py-2.5 pr-2">
                      (−) Premi Risiko Iklim Maritim (Gelombang {simInput.waveM}m
                      &amp; Stres Panas WBGT {simOutput.wbgtC}°C)
                    </td>
                    <td className="py-2.5 text-right font-mono whitespace-nowrap">
                      − Rp {simOutput.kompensasiRisikoRp.toLocaleString('id-ID')}
                    </td>
                  </tr>

                  <tr className="bg-cyan-500/10 border-t-2 border-[#06B6D4]">
                    <td className="py-3 px-2 font-extrabold text-slate-900 dark:text-[#F8FAFC]">
                      = Laba Ekonomi Riil (Economic Profit / Loss Sesudah
                      Opportunity Cost)
                    </td>
                    <td
                      className={`py-3 text-right font-mono text-xs sm:text-sm font-extrabold pr-2 whitespace-nowrap ${
                        simOutput.labaEkonomiRiilRp >= 0
                          ? 'text-[#10B981]'
                          : 'text-[#EF4444]'
                      }`}
                    >
                      Rp {simOutput.labaEkonomiRiilRp.toLocaleString('id-ID')}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Post-Landing Action & Land Trade-off Recommendation */}
          <div className="rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-400/12 p-4 sm:p-6 space-y-4">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-[#F8FAFC] flex items-center gap-2">
              <Compass className="w-4 h-4 text-[#06B6D4] shrink-0" />
              <span>
                Rekomendasi Taktis Pasca-Pendaratan &amp; Trade-Off Ekonomi Darat
              </span>
            </h3>

            <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-200">
              {simOutput.recommendations.map((rec, i) => (
                <li
                  key={i}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-[#0F172A]/80 border border-slate-200 dark:border-slate-800 leading-relaxed"
                >
                  {rec}
                </li>
              ))}
            </ul>

            {simOutput.decisionClass !== 2 && (
              <div className="pt-2 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-[#F59E0B]">
                  <Briefcase className="w-4 h-4 shrink-0" />
                  <span>
                    Opsi Substitusi Ekonomi Darat (Opportunity Cost Trade-Off Saat{' '}
                    {simOutput.shortDecisionBadge}):
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {simOutput.landTradeoffActivities.map((act) => (
                    <div
                      key={act.title}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-[#0F172A]/70 border border-slate-200 dark:border-slate-800 text-xs"
                    >
                      <p className="font-bold text-slate-900 dark:text-[#F8FAFC]">
                        {act.title}
                      </p>
                      <p className="font-mono font-bold text-[#10B981] mt-1">
                        Estimasi Rp{' '}
                        {act.estDailyIncomeRp.toLocaleString('id-ID')} / hari
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-[#94A3B8] mt-1 leading-snug">
                        {act.detail}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
