import React, { useEffect, useMemo, useRef, useState } from 'react';
import Chart from 'chart.js/auto';
import {
  Search,
  BarChart3,
  Database,
  Layers,
  ArrowLeftRight,
  TrendingDown,
  TrendingUp,
  Grid,
  Sparkles,
} from 'lucide-react';
import {
  RegionKey,
  SpeciesKey,
  SimulationYear,
  STUDY_REGIONS,
  TARGET_SPECIES,
  generatePippReferenceDataset,
  PippReferenceRow,
  CatchOverlayDimension,
  compareYearlyCatchTrends,
  SeasonalHeatmapMetric,
  SeasonalHeatmapCell,
  generateSeasonalCatchHeatmap,
} from '../utils/maritimeFormulas';

interface PippAnalyticsViewProps {
  onSelectRowForSimulation?: (row: PippReferenceRow) => void;
}

export const PippAnalyticsView: React.FC<PippAnalyticsViewProps> = ({
  onSelectRowForSimulation,
}) => {
  const allRows = useMemo(() => generatePippReferenceDataset(), []);

  // State for Year-over-Year Fish Catch Trend Overlay Comparator
  const [overlayYearA, setOverlayYearA] = useState<SimulationYear>(2023);
  const [overlayYearB, setOverlayYearB] = useState<SimulationYear>(2026);
  const [overlayDimension, setOverlayDimension] =
    useState<CatchOverlayDimension>('MONTHLY');
  const [overlayRegion, setOverlayRegion] = useState<RegionKey | 'ALL'>('ALL');
  const [overlaySpecies, setOverlaySpecies] = useState<SpeciesKey | 'ALL'>(
    'ALL'
  );

  // State for Seasonal Catch Correlation Heatmap (5 Regions x 4 Seasons)
  const [heatmapYear, setHeatmapYear] = useState<SimulationYear | 'ALL'>('ALL');
  const [heatmapSpecies, setHeatmapSpecies] = useState<SpeciesKey | 'ALL'>(
    'ALL'
  );
  const [heatmapMetric, setHeatmapMetric] =
    useState<SeasonalHeatmapMetric>('CPUE_KG');
  const [selectedHeatmapCellId, setSelectedHeatmapCellId] = useState<
    string | null
  >(null);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRegion, setSelectedRegion] = useState<string>('ALL');
  const [selectedYear, setSelectedYear] = useState<string>('ALL');
  const [selectedSeason, setSelectedSeason] = useState<string>('ALL');
  const [selectedSpecies, setSelectedSpecies] = useState<string>('ALL');

  const overlayChartRef = useRef<HTMLCanvasElement | null>(null);
  const chart1Ref = useRef<HTMLCanvasElement | null>(null);
  const chart2Ref = useRef<HTMLCanvasElement | null>(null);
  const chart3Ref = useRef<HTMLCanvasElement | null>(null);
  const chart4Ref = useRef<HTMLCanvasElement | null>(null);

  const overlayComparison = useMemo(
    () =>
      compareYearlyCatchTrends({
        yearA: overlayYearA,
        yearB: overlayYearB,
        dimension: overlayDimension,
        regionFilter: overlayRegion,
        speciesFilter: overlaySpecies,
      }),
    [
      overlayYearA,
      overlayYearB,
      overlayDimension,
      overlayRegion,
      overlaySpecies,
    ]
  );

  const seasonalHeatmap = useMemo(
    () =>
      generateSeasonalCatchHeatmap({
        yearFilter: heatmapYear,
        speciesFilter: heatmapSpecies,
        metric: heatmapMetric,
      }),
    [heatmapYear, heatmapSpecies, heatmapMetric]
  );

  const activeHeatmapCell: SeasonalHeatmapCell = useMemo(() => {
    if (selectedHeatmapCellId) {
      const found = seasonalHeatmap.cells.find(
        (c) => c.id === selectedHeatmapCellId
      );
      if (found) return found;
    }
    return seasonalHeatmap.peakCell;
  }, [seasonalHeatmap, selectedHeatmapCellId]);

  // Initialize & update the interactive Year-over-Year Overlay Chart
  useEffect(() => {
    if (!overlayChartRef.current) return;

    const textColor = '#94A3B8';
    const gridColor = 'rgba(148, 163, 184, 0.12)';

    const overlayChart = new Chart(overlayChartRef.current, {
      type: 'bar',
      data: {
        labels: overlayComparison.labels,
        datasets: [
          {
            type: 'line',
            label: `Tren Tangkapan Tahun ${overlayComparison.yearA} (CPUE kg/trip)`,
            data: overlayComparison.seriesYearACpue,
            borderColor: '#06B6D4',
            backgroundColor: 'rgba(6, 182, 212, 0.18)',
            borderWidth: 3,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: '#06B6D4',
            fill: true,
            tension: 0.35,
            yAxisID: 'y',
          },
          {
            type: 'line',
            label: `Tren Tangkapan Tahun ${overlayComparison.yearB} (CPUE kg/trip)`,
            data: overlayComparison.seriesYearBCpue,
            borderColor: '#F59E0B',
            backgroundColor: 'rgba(245, 158, 11, 0.16)',
            borderWidth: 3,
            borderDash: [6, 4],
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: '#F59E0B',
            fill: true,
            tension: 0.35,
            yAxisID: 'y',
          },
          {
            type: 'bar',
            label: `Selisih / Delta CPUE (${overlayComparison.yearB} vs ${overlayComparison.yearA})`,
            data: overlayComparison.seriesDeltaCpue,
            backgroundColor: overlayComparison.seriesDeltaCpue.map((d) =>
              d >= 0 ? 'rgba(16, 185, 129, 0.55)' : 'rgba(239, 68, 68, 0.55)'
            ),
            borderColor: overlayComparison.seriesDeltaCpue.map((d) =>
              d >= 0 ? '#10B981' : '#EF4444'
            ),
            borderWidth: 1,
            borderRadius: 4,
            yAxisID: 'y',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            labels: { color: textColor, font: { size: 11 } },
          },
        },
        scales: {
          x: {
            ticks: { color: textColor, font: { size: 10 } },
            grid: { color: gridColor },
          },
          y: {
            position: 'left',
            title: {
              display: true,
              text: 'CPUE Tangkapan & Selisih (kg/trip)',
              color: '#06B6D4',
            },
            ticks: {
              color: textColor,
              callback: (val) => `${val} kg`,
            },
            grid: { color: gridColor },
          },
        },
      },
    });

    return () => {
      overlayChart.destroy();
    };
  }, [overlayComparison]);

  // Filter rows
  const filteredRows = useMemo(() => {
    return allRows.filter((r) => {
      if (selectedRegion !== 'ALL' && r.region !== selectedRegion) return false;
      if (selectedYear !== 'ALL' && String(r.year) !== selectedYear)
        return false;
      if (selectedSeason !== 'ALL' && r.season !== selectedSeason) return false;
      if (selectedSpecies !== 'ALL' && r.species !== selectedSpecies)
        return false;
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const match =
          r.region.toLowerCase().includes(q) ||
          r.species.toLowerCase().includes(q) ||
          r.latinName.toLowerCase().includes(q) ||
          r.id.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [
    allRows,
    searchQuery,
    selectedRegion,
    selectedYear,
    selectedSeason,
    selectedSpecies,
  ]);

  // Initialize the 2x2 Chart.js Multi-Year Comparative Charts
  useEffect(() => {
    const instances: Chart[] = [];
    const textColor = '#94A3B8';
    const gridColor = 'rgba(148, 163, 184, 0.12)';

    // Chart 1: Tren Penurunan CPUE vs Kenaikan Jarak Melaut 2023–2026
    if (chart1Ref.current) {
      const c1 = new Chart(chart1Ref.current, {
        type: 'bar',
        data: {
          labels: ['2023', '2024', '2025', '2026'],
          datasets: [
            {
              type: 'bar',
              label: 'Rata-rata CPUE (kg/trip)',
              data: [16.82, 15.6, 13.14, 10.84],
              backgroundColor: 'rgba(6, 182, 212, 0.75)',
              borderColor: '#06B6D4',
              borderWidth: 1.5,
              borderRadius: 6,
              yAxisID: 'y',
            },
            {
              type: 'line',
              label: 'Jarak Tempuh Melaut (km)',
              data: [18.87, 20.41, 22.36, 24.78],
              borderColor: '#F59E0B',
              backgroundColor: '#F59E0B',
              borderWidth: 2.5,
              tension: 0.3,
              yAxisID: 'y1',
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { labels: { color: textColor, font: { size: 11 } } },
          },
          scales: {
            x: { ticks: { color: textColor }, grid: { color: gridColor } },
            y: {
              position: 'left',
              title: { display: true, text: 'CPUE (kg/trip)', color: '#06B6D4' },
              ticks: { color: textColor },
              grid: { color: gridColor },
            },
            y1: {
              position: 'right',
              title: { display: true, text: 'Jarak (km)', color: '#F59E0B' },
              ticks: { color: textColor },
              grid: { drawOnChartArea: false },
            },
          },
        },
      });
      instances.push(c1);
    }

    // Chart 2: Lonjakan Harga Layak Effort / Minimum Supply-Price 2023–2026
    if (chart2Ref.current) {
      const c2 = new Chart(chart2Ref.current, {
        type: 'bar',
        data: {
          labels: ['2023', '2024', '2025', '2026'],
          datasets: [
            {
              label: 'Harga Layak Effort AI (Rp/kg)',
              data: [14908, 17186, 24970, 34025],
              backgroundColor: [
                'rgba(16, 185, 129, 0.75)',
                'rgba(6, 182, 212, 0.75)',
                'rgba(245, 158, 11, 0.78)',
                'rgba(239, 68, 68, 0.82)',
              ],
              borderColor: ['#10B981', '#06B6D4', '#F59E0B', '#EF4444'],
              borderWidth: 1.5,
              borderRadius: 6,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { labels: { color: textColor, font: { size: 11 } } },
          },
          scales: {
            x: { ticks: { color: textColor }, grid: { color: gridColor } },
            y: {
              ticks: {
                color: textColor,
                callback: (val) => `Rp ${Number(val).toLocaleString('id-ID')}`,
              },
              grid: { color: gridColor },
            },
          },
        },
      });
      instances.push(c2);
    }

    // Chart 3: Konsumsi Perbekalan Solar & Beban Modal per Wilayah DPI
    if (chart3Ref.current) {
      const c3 = new Chart(chart3Ref.current, {
        type: 'bar',
        data: {
          labels: [
            'Karangantu',
            'Teluk Banten',
            'Indramayu',
            'Kabaena',
            'Ambon-Seram',
          ],
          datasets: [
            {
              label: 'Modal Eksplisit Tunai (Ribu Rp)',
              data: [137.3, 146.8, 168.4, 184.2, 205.6],
              backgroundColor: 'rgba(59, 130, 246, 0.78)',
              borderColor: '#3B82F6',
              borderWidth: 1.5,
              borderRadius: 5,
            },
            {
              label: 'Total Biaya Ekonomi Penuh (Ribu Rp)',
              data: [288.5, 304.2, 349.8, 386.5, 428.9],
              backgroundColor: 'rgba(6, 182, 212, 0.78)',
              borderColor: '#06B6D4',
              borderWidth: 1.5,
              borderRadius: 5,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { labels: { color: textColor, font: { size: 11 } } },
          },
          scales: {
            x: { ticks: { color: textColor }, grid: { color: gridColor } },
            y: {
              ticks: {
                color: textColor,
                callback: (val) => `Rp ${val}k`,
              },
              grid: { color: gridColor },
            },
          },
        },
      });
      instances.push(c3);
    }

    // Chart 4: Feature Importance Variabel Prediktif Dual-Engine AI
    if (chart4Ref.current) {
      const c4 = new Chart(chart4Ref.current, {
        type: 'bar',
        data: {
          labels: [
            'Opportunity Cost & Harga Pasar',
            'Meteorologi Maritim (WBGT & Gelombang)',
            'Jarak Konservasi Perairan (KKP)',
            'Efisiensi BBM Solar & Rantai Dingin Es',
            'Selektivitas Biologi Gonad (Rasio Lm)',
          ],
          datasets: [
            {
              label: 'Kontribusi Bobot Prediktif AI (%)',
              data: [31.4, 24.8, 19.6, 13.2, 11.0],
              backgroundColor: [
                'rgba(6, 182, 212, 0.82)',
                'rgba(245, 158, 11, 0.82)',
                'rgba(16, 185, 129, 0.82)',
                'rgba(59, 130, 246, 0.82)',
                'rgba(168, 85, 247, 0.82)',
              ],
              borderRadius: 5,
            },
          ],
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { labels: { color: textColor, font: { size: 11 } } },
          },
          scales: {
            x: {
              ticks: { color: textColor, callback: (val) => `${val}%` },
              grid: { color: gridColor },
            },
            y: { ticks: { color: textColor, font: { size: 10 } }, grid: { color: gridColor } },
          },
        },
      });
      instances.push(c4);
    }

    return () => {
      instances.forEach((c) => c.destroy());
    };
  }, []);

  return (
    <div className="space-y-5 sm:space-y-8">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 sm:gap-4">
        <div>
          <h2 className="text-lg sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-[#F8FAFC]">
            Analitik PIPP KKP, Tabel Harga Ikan &amp; Tren Multi-Tahun
            (2023–2026)
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-[#94A3B8]">
            Basis data pendaratan ikan terintegrasi 5 Wilayah DPI dan evaluasi
            longitudinal 6.000 trip observasi nelayan kecil (&lt;5 GT).
          </p>
        </div>
      </div>

      {/* Interactive Year-over-Year Fish Catch Trend Overlay Chart */}
      <div
        data-testid="yearly-catch-overlay-card"
        className="rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-400/12 p-4 sm:p-6 space-y-4 sm:space-y-5"
      >
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-start gap-2.5">
            <Layers className="w-5 h-5 text-[#06B6D4] shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-[#F8FAFC]">
                Komparasi Overlay Tren Tangkapan Ikan Antar-Tahun (Year-over-Year
                Catch Trend Overlay)
              </h3>
              <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
                Pilih dua tahun berbeda untuk membandingkan langsung kurva CPUE
                tangkapan, fluktuasi musim, dan pergeseran titik impas
              </p>
            </div>
          </div>

          {/* Interactive Controls: Year A, Swap, Year B, Dimension, Region, Species */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-2.5">
            <div className="flex items-center gap-1.5">
              <label
                htmlFor="overlay-year-a"
                className="text-[11px] font-mono font-bold text-[#06B6D4] whitespace-nowrap"
              >
                Tahun A:
              </label>
              <select
                id="overlay-year-a"
                aria-label="Pilih Tahun Pembanding A"
                value={overlayYearA}
                onChange={(e) =>
                  setOverlayYearA(Number(e.target.value) as SimulationYear)
                }
                className="w-full sm:w-auto px-2.5 py-1.5 rounded-xl bg-cyan-500/10 border border-[#06B6D4]/50 text-xs font-mono font-bold text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:border-[#06B6D4] cursor-pointer"
              >
                {[2023, 2024, 2025, 2026].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => {
                setOverlayYearA(overlayYearB);
                setOverlayYearB(overlayYearA);
              }}
              title="Tukar Tahun A dan Tahun B"
              aria-label="Tukar Tahun A dan Tahun B"
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-[#0F172A] hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1 transition-colors cursor-pointer"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-[#06B6D4]" />
              <span className="sm:hidden">Tukar</span>
            </button>

            <div className="flex items-center gap-1.5">
              <label
                htmlFor="overlay-year-b"
                className="text-[11px] font-mono font-bold text-[#F59E0B] whitespace-nowrap"
              >
                Tahun B:
              </label>
              <select
                id="overlay-year-b"
                aria-label="Pilih Tahun Pembanding B"
                value={overlayYearB}
                onChange={(e) =>
                  setOverlayYearB(Number(e.target.value) as SimulationYear)
                }
                className="w-full sm:w-auto px-2.5 py-1.5 rounded-xl bg-amber-500/10 border border-[#F59E0B]/50 text-xs font-mono font-bold text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:border-[#F59E0B] cursor-pointer"
              >
                {[2023, 2024, 2025, 2026].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <select
              aria-label="Pilih Dimensi Overlay Tren Tangkapan"
              value={overlayDimension}
              onChange={(e) =>
                setOverlayDimension(e.target.value as CatchOverlayDimension)
              }
              className="col-span-2 sm:col-span-1 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#0F172A] border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-[#F8FAFC] cursor-pointer"
            >
              <option value="MONTHLY">Siklus Bulanan &amp; Musim (Jan–Des)</option>
              <option value="REGIONAL">Perbandingan 5 Wilayah DPI</option>
              <option value="SPECIES">Perbandingan 4 Spesies Target</option>
            </select>

            <select
              aria-label="Filter Wilayah pada Grafik Overlay"
              value={overlayRegion}
              onChange={(e) =>
                setOverlayRegion(e.target.value as RegionKey | 'ALL')
              }
              disabled={overlayDimension === 'REGIONAL'}
              className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#0F172A] border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-[#F8FAFC] disabled:opacity-50 cursor-pointer"
            >
              <option value="ALL">Semua Wilayah DPI</option>
              {(Object.keys(STUDY_REGIONS) as RegionKey[]).map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter Spesies pada Grafik Overlay"
              value={overlaySpecies}
              onChange={(e) =>
                setOverlaySpecies(e.target.value as SpeciesKey | 'ALL')
              }
              disabled={overlayDimension === 'SPECIES'}
              className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#0F172A] border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-[#F8FAFC] disabled:opacity-50 cursor-pointer"
            >
              <option value="ALL">Semua Spesies</option>
              {(Object.keys(TARGET_SPECIES) as SpeciesKey[]).map((sp) => (
                <option key={sp} value={sp}>
                  {sp}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 4-Card Comparative KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0F172A]/80 border border-cyan-500/30">
            <span className="text-[11px] font-mono uppercase text-[#06B6D4] block">
              Rata-rata CPUE Tahun {overlayComparison.yearA}
            </span>
            <p className="text-lg sm:text-xl font-mono font-extrabold text-slate-900 dark:text-[#F8FAFC] mt-0.5">
              {overlayComparison.avgCpueYearA} kg
              <span className="text-xs font-normal text-slate-400">/trip</span>
            </p>
            <span className="text-[11px] text-slate-500 dark:text-[#94A3B8] mt-0.5 block">
              Puncak: {overlayComparison.peakLabelYearA}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0F172A]/80 border border-amber-500/30">
            <span className="text-[11px] font-mono uppercase text-[#F59E0B] block">
              Rata-rata CPUE Tahun {overlayComparison.yearB}
            </span>
            <p className="text-lg sm:text-xl font-mono font-extrabold text-slate-900 dark:text-[#F8FAFC] mt-0.5">
              {overlayComparison.avgCpueYearB} kg
              <span className="text-xs font-normal text-slate-400">/trip</span>
            </p>
            <span className="text-[11px] text-slate-500 dark:text-[#94A3B8] mt-0.5 block">
              Puncak: {overlayComparison.peakLabelYearB}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0F172A]/80 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase text-slate-500 dark:text-[#94A3B8]">
                Selisih Tangkapan ({overlayComparison.yearB} vs{' '}
                {overlayComparison.yearA})
              </span>
              {overlayComparison.deltaCpueKg >= 0 ? (
                <TrendingUp className="w-4 h-4 text-[#10B981]" />
              ) : (
                <TrendingDown className="w-4 h-4 text-[#EF4444]" />
              )}
            </div>
            <p
              className={`text-lg sm:text-xl font-mono font-extrabold mt-0.5 ${
                overlayComparison.deltaCpueKg >= 0
                  ? 'text-[#10B981]'
                  : 'text-[#EF4444]'
              }`}
            >
              {overlayComparison.deltaCpueKg > 0 ? '+' : ''}
              {overlayComparison.deltaCpueKg} kg (
              {overlayComparison.deltaCpuePercent > 0 ? '+' : ''}
              {overlayComparison.deltaCpuePercent}%)
            </p>
            <span className="text-[11px] text-slate-500 dark:text-[#94A3B8] mt-0.5 block">
              Deviasi biomassa tangkapan per trip
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0F172A]/80 border border-slate-200 dark:border-slate-800">
            <span className="text-[11px] font-mono uppercase text-slate-500 dark:text-[#94A3B8] block">
              Pergeseran Harga Layak Effort AI
            </span>
            <p className="text-base sm:text-lg font-mono font-extrabold text-slate-900 dark:text-[#F8FAFC] mt-0.5">
              Rp {overlayComparison.avgFairPriceYearA.toLocaleString('id-ID')}{' '}
              &rarr; Rp{' '}
              {overlayComparison.avgFairPriceYearB.toLocaleString('id-ID')}
            </p>
            <span
              className={`text-[11px] font-mono font-semibold mt-0.5 block ${
                overlayComparison.deltaFairPricePercent > 0
                  ? 'text-[#F59E0B]'
                  : 'text-[#10B981]'
              }`}
            >
              Perubahan Titik Impas:{' '}
              {overlayComparison.deltaFairPricePercent > 0 ? '+' : ''}
              {overlayComparison.deltaFairPricePercent}%
            </span>
          </div>
        </div>

        {/* Overlay Canvas */}
        <div className="h-64 sm:h-72 w-full">
          <canvas ref={overlayChartRef} />
        </div>
      </div>

      {/* Seasonal Catch Volume & CPUE Correlation Heatmap across Study Regions (5 Regions x 4 Monsoon Seasons) */}
      <div
        data-testid="seasonal-catch-heatmap-card"
        className="rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-400/12 p-4 sm:p-6 space-y-4 sm:space-y-5"
      >
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-start gap-2.5">
            <Grid className="w-5 h-5 text-[#10B981] shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-[#F8FAFC]">
                Peta Panas Musiman Volume Tangkapan per Wilayah DPI (Seasonal
                Catch Correlation Heatmap)
              </h3>
              <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
                Matriks korelasi spasial-musiman (5 Wilayah DPI &times; 4 Musim
                Monsun) terhadap CPUE, volume produksi armada (&lt;5 GT), dan
                titik impas harga layak
              </p>
            </div>
          </div>

          {/* Heatmap Filter & Metric Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2.5 w-full xl:w-auto">
            <select
              id="seasonal-heatmap-metric"
              aria-label="Pilih Metrik Peta Panas Musiman"
              value={heatmapMetric}
              onChange={(e) =>
                setHeatmapMetric(e.target.value as SeasonalHeatmapMetric)
              }
              className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-[#10B981]/50 text-xs font-semibold text-slate-900 dark:text-[#F8FAFC] cursor-pointer"
            >
              <option value="CPUE_KG">Metrik: Rata-rata CPUE (kg/trip)</option>
              <option value="VOLUME_TONS">
                Metrik: Volume Tangkapan Musiman (Ton)
              </option>
              <option value="FAIR_PRICE_RP">
                Metrik: Harga Layak Effort AI (Rp/kg)
              </option>
            </select>

            <select
              id="seasonal-heatmap-year"
              aria-label="Filter Tahun Peta Panas Musiman"
              value={String(heatmapYear)}
              onChange={(e) =>
                setHeatmapYear(
                  e.target.value === 'ALL'
                    ? 'ALL'
                    : (Number(e.target.value) as SimulationYear)
                )
              }
              className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#0F172A] border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-[#F8FAFC] cursor-pointer"
            >
              <option value="ALL">Semua Tahun</option>
              {[2023, 2024, 2025, 2026].map((y) => (
                <option key={y} value={String(y)}>
                  Tahun {y}
                </option>
              ))}
            </select>

            <select
              id="seasonal-heatmap-species"
              aria-label="Filter Spesies Peta Panas Musiman"
              value={heatmapSpecies}
              onChange={(e) =>
                setHeatmapSpecies(e.target.value as SpeciesKey | 'ALL')
              }
              className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#0F172A] border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-[#F8FAFC] cursor-pointer"
            >
              <option value="ALL">Semua Spesies Ikan</option>
              {(Object.keys(TARGET_SPECIES) as SpeciesKey[]).map((sp) => (
                <option key={sp} value={sp}>
                  {sp} ({TARGET_SPECIES[sp].latinName})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Summary KPI Strip for Seasonal Heatmap */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
            <span className="text-[11px] font-mono uppercase text-[#10B981] block">
              Hotspot Musim Tangkapan Tertinggi
            </span>
            <p className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-[#F8FAFC] mt-0.5">
              {seasonalHeatmap.peakCell.region} &bull;{' '}
              {seasonalHeatmap.peakCell.shortSeason}
            </p>
            <span className="text-xs font-mono text-[#10B981] mt-0.5 block">
              CPUE {seasonalHeatmap.peakCell.cpueKgPerTrip} kg/trip (
              {seasonalHeatmap.peakCell.seasonalCatchTons} Ton/musim)
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
            <span className="text-[11px] font-mono uppercase text-[#F59E0B] block">
              Periode Paceklik / Tekanan Monsun
            </span>
            <p className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-[#F8FAFC] mt-0.5">
              {seasonalHeatmap.lowestCell.region} &bull;{' '}
              {seasonalHeatmap.lowestCell.shortSeason}
            </p>
            <span className="text-xs font-mono text-[#F59E0B] mt-0.5 block">
              CPUE {seasonalHeatmap.lowestCell.cpueKgPerTrip} kg/trip (Gelombang{' '}
              {seasonalHeatmap.lowestCell.avgWaveM} m)
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0F172A]/80 border border-slate-200 dark:border-slate-800">
            <span className="text-[11px] font-mono uppercase text-slate-500 dark:text-[#94A3B8] block">
              Total Akumulasi Volume 5 Wilayah DPI
            </span>
            <p className="text-lg sm:text-xl font-mono font-extrabold text-[#06B6D4] mt-0.5">
              {seasonalHeatmap.totalSeasonalTons.toLocaleString('id-ID')} Ton
              <span className="text-xs font-normal text-slate-400">
                {' '}
                / siklus tahunan
              </span>
            </p>
            <span className="text-[11px] text-slate-500 dark:text-[#94A3B8] mt-0.5 block">
              Rata-rata Matriks CPUE: {seasonalHeatmap.avgMatrixCpueKg} kg/trip
            </span>
          </div>
        </div>

        {/* 5 Regions x 4 Seasons Heatmap Matrix */}
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="min-w-[680px] space-y-2">
            {/* Column Headers (4 Monsoon Seasons) */}
            <div className="grid grid-cols-12 gap-2.5 items-center text-xs font-bold text-slate-500 dark:text-[#94A3B8] pb-1">
              <div className="col-span-3 pl-2">Wilayah Pelabuhan DPI / WPP</div>
              {seasonalHeatmap.shortSeasons.map((sLabel) => (
                <div key={sLabel} className="col-span-2 text-center">
                  {sLabel}
                </div>
              ))}
              <div className="col-span-1 text-right pr-2">Rata-rata</div>
            </div>

            {/* 5 Region Rows */}
            {seasonalHeatmap.regions.map((regionKey) => {
              const rowCells = seasonalHeatmap.rowsByRegion[regionKey];
              const regAvgCpue = Number(
                (
                  rowCells.reduce((acc, c) => acc + c.cpueKgPerTrip, 0) /
                  rowCells.length
                ).toFixed(1)
              );
              const regTotalTons = Number(
                rowCells
                  .reduce((acc, c) => acc + c.seasonalCatchTons, 0)
                  .toFixed(1)
              );

              return (
                <div
                  key={regionKey}
                  className="grid grid-cols-12 gap-2.5 items-stretch"
                >
                  {/* Region Row Header */}
                  <div className="col-span-3 p-3 rounded-xl bg-slate-50 dark:bg-[#0F172A]/90 border border-slate-200 dark:border-slate-800 flex flex-col justify-center">
                    <span className="text-xs font-bold text-slate-900 dark:text-[#F8FAFC]">
                      {regionKey}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 dark:text-[#94A3B8] truncate">
                      {STUDY_REGIONS[regionKey].wppCode}
                    </span>
                  </div>

                  {/* 4 Seasonal Cells */}
                  {rowCells.map((cell) => {
                    const isSelected = activeHeatmapCell.id === cell.id;
                    const cellColorClasses =
                      cell.tier === 'PEAK_OPTIMAL'
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-950 dark:text-emerald-200'
                        : cell.tier === 'HIGH_YIELD'
                          ? 'bg-cyan-500/20 border-cyan-500/45 text-cyan-950 dark:text-cyan-200'
                          : cell.tier === 'MODERATE'
                            ? 'bg-blue-500/15 border-blue-500/35 text-slate-900 dark:text-slate-200'
                            : 'bg-amber-500/15 border-amber-500/45 text-amber-950 dark:text-amber-200';

                    const primaryDisplay =
                      heatmapMetric === 'VOLUME_TONS'
                        ? `${cell.seasonalCatchTons} Ton`
                        : heatmapMetric === 'FAIR_PRICE_RP'
                          ? `Rp ${cell.fairEffortPriceRp.toLocaleString('id-ID')}`
                          : `${cell.cpueKgPerTrip} kg`;

                    const secondaryDisplay =
                      heatmapMetric === 'VOLUME_TONS'
                        ? `CPUE ${cell.cpueKgPerTrip} kg/trip`
                        : heatmapMetric === 'FAIR_PRICE_RP'
                          ? `CPUE ${cell.cpueKgPerTrip} kg • ${cell.seasonalCatchTons}T`
                          : `${cell.seasonalCatchTons} Ton • Gel. ${cell.avgWaveM}m`;

                    return (
                      <button
                        key={cell.id}
                        type="button"
                        onClick={() => setSelectedHeatmapCellId(cell.id)}
                        aria-label={`Sel Peta Panas ${cell.region} ${cell.shortSeason}`}
                        className={`col-span-2 p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${cellColorClasses} ${
                          isSelected
                            ? 'ring-2 ring-[#06B6D4] shadow-md scale-[1.01]'
                            : 'hover:opacity-90'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-mono text-xs sm:text-sm font-extrabold text-slate-900 dark:text-[#F8FAFC]">
                            {primaryDisplay}
                          </span>
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              cell.tier === 'PEAK_OPTIMAL'
                                ? 'bg-[#10B981]'
                                : cell.tier === 'HIGH_YIELD'
                                  ? 'bg-[#06B6D4]'
                                  : cell.tier === 'MODERATE'
                                    ? 'bg-[#3B82F6]'
                                    : 'bg-[#F59E0B]'
                            }`}
                          />
                        </div>
                        <div className="mt-1.5 space-y-1">
                          <div className="w-full h-1.5 rounded-full bg-slate-900/15 dark:bg-slate-950/60 overflow-hidden">
                            <div
                              style={{
                                width: `${Math.round(cell.intensity * 100)}%`,
                              }}
                              className={`h-full rounded-full ${
                                cell.tier === 'PEAK_OPTIMAL'
                                  ? 'bg-[#10B981]'
                                  : cell.tier === 'HIGH_YIELD'
                                    ? 'bg-[#06B6D4]'
                                    : cell.tier === 'MODERATE'
                                      ? 'bg-[#3B82F6]'
                                      : 'bg-[#F59E0B]'
                              }`}
                            />
                          </div>
                          <span className="block text-[10px] font-mono text-slate-600 dark:text-slate-300 truncate">
                            {secondaryDisplay}
                          </span>
                        </div>
                      </button>
                    );
                  })}

                  {/* Row Summary Column */}
                  <div className="col-span-1 p-2 rounded-xl bg-slate-50 dark:bg-[#0F172A]/60 border border-slate-200 dark:border-slate-800 flex flex-col items-end justify-center text-right font-mono">
                    <span className="text-xs font-bold text-slate-900 dark:text-[#F8FAFC]">
                      {regAvgCpue} kg
                    </span>
                    <span className="text-[10px] text-[#06B6D4]">
                      {regTotalTons}T
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Heatmap Cell Inspector & Quick Simulator Load Action */}
        <div
          data-testid="seasonal-heatmap-inspector"
          className="p-3.5 sm:p-4 rounded-xl bg-slate-50 dark:bg-[#0F172A]/90 border border-cyan-500/30 flex flex-col lg:flex-row lg:items-center justify-between gap-3.5"
        >
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-mono uppercase font-bold text-[#06B6D4]">
                INSPEKSI KORELASI SEL MUSIM &times; WILAYAH:
              </span>
              <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-[#F8FAFC]">
                {activeHeatmapCell.regionFullName} &bull;{' '}
                {activeHeatmapCell.season}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-mono">
              CPUE: <strong>{activeHeatmapCell.cpueKgPerTrip} kg/trip</strong>{' '}
              &bull; Volume Musiman:{' '}
              <strong>
                {activeHeatmapCell.seasonalCatchTons} Ton (
                {activeHeatmapCell.activeTripsPerSeason} trip aktif)
              </strong>{' '}
              &bull; Gelombang: <strong>{activeHeatmapCell.avgWaveM} m</strong>{' '}
              &bull; WBGT: <strong>{activeHeatmapCell.avgWbgtC}&deg;C</strong>{' '}
              &bull; Harga Layak AI:{' '}
              <strong className="text-[#10B981]">
                Rp {activeHeatmapCell.fairEffortPriceRp.toLocaleString('id-ID')}
                /kg
              </strong>
            </p>
          </div>

          {onSelectRowForSimulation && (
            <button
              type="button"
              onClick={() => {
                const matchingRow =
                  allRows.find(
                    (r) =>
                      r.region === activeHeatmapCell.region &&
                      r.season === activeHeatmapCell.season &&
                      (heatmapYear === 'ALL' || r.year === heatmapYear) &&
                      (heatmapSpecies === 'ALL' || r.species === heatmapSpecies)
                  ) ||
                  allRows.find((r) => r.region === activeHeatmapCell.region) ||
                  allRows[0];
                onSelectRowForSimulation({
                  ...matchingRow,
                  region: activeHeatmapCell.region,
                  season: activeHeatmapCell.season,
                  year: activeHeatmapCell.representativeYear,
                  species: activeHeatmapCell.representativeSpecies,
                });
              }}
              className="px-3.5 py-2 rounded-xl bg-[#06B6D4] hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Simulasikan Perhitungan</span>
            </button>
          )}
        </div>
      </div>

      {/* 1. 2x2 Grid of Multi-Year Comparative Charts (2023 vs 2024 vs 2025 vs 2026) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Chart 1 */}
        <div className="rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-400/12 p-4 sm:p-5 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-[#F8FAFC]">
                1. Tren Penurunan CPUE vs Kenaikan Jarak Melaut (2023–2026)
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-[#94A3B8]">
                CPUE turun 16.82 kg &rarr; 10.84 kg seiring pergeseran DPI makin
                jauh (18.87 km &rarr; 24.78 km)
              </p>
            </div>
            <BarChart3 className="w-4 h-4 text-[#06B6D4] shrink-0" />
          </div>
          <div className="h-56 sm:h-64 w-full">
            <canvas ref={chart1Ref} />
          </div>
        </div>

        {/* Chart 2 */}
        <div className="rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-400/12 p-4 sm:p-5 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-[#F8FAFC]">
                2. Lonjakan Harga Layak Effort / Minimum Supply-Price
                (2023–2026)
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-[#94A3B8]">
                Kenaikan titik impas ekonomi riil dari Rp 14.908/kg (2023)
                menjadi Rp 34.025/kg (2026)
              </p>
            </div>
            <BarChart3 className="w-4 h-4 text-[#10B981] shrink-0" />
          </div>
          <div className="h-56 sm:h-64 w-full">
            <canvas ref={chart2Ref} />
          </div>
        </div>

        {/* Chart 3 */}
        <div className="rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-400/12 p-4 sm:p-5 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-[#F8FAFC]">
                3. Konsumsi Solar &amp; Beban Modal Ekonomi per Wilayah DPI
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-[#94A3B8]">
                Perbandingan Explicit Cost Tunai vs Total Economic Opportunity
                Cost di 5 wilayah studi
              </p>
            </div>
            <BarChart3 className="w-4 h-4 text-[#3B82F6] shrink-0" />
          </div>
          <div className="h-56 sm:h-64 w-full">
            <canvas ref={chart3Ref} />
          </div>
        </div>

        {/* Chart 4 */}
        <div className="rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-400/12 p-4 sm:p-5 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-[#F8FAFC]">
                4. Feature Importance Variabel Prediktif Dual-Engine AI
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-[#94A3B8]">
                Bobot kontribusi variabel terhadap keputusan kelayakan melaut &amp; regresi
                harga layak
              </p>
            </div>
            <BarChart3 className="w-4 h-4 text-[#F59E0B] shrink-0" />
          </div>
          <div className="h-56 sm:h-64 w-full">
            <canvas ref={chart4Ref} />
          </div>
        </div>
      </div>

      {/* 2. Interactive Fish Landing & Fair-Price Reference Table (PIPP KKP Style) */}
      <div className="rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-400/12 p-4 sm:p-6 space-y-4 sm:space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-2.5">
            <Database className="w-5 h-5 text-[#06B6D4] shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-[#F8FAFC]">
                Tabel Referensi Pendaratan Ikan PIPP KKP &amp; Harga Layak Effort
                AI
              </h3>
              <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
                Menampilkan {filteredRows.length} entri agregat representatif
                dari 6.000 trip observasi (Klik baris untuk memuat ke Simulator)
              </p>
            </div>
          </div>

          {/* Search & 4 Filter Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap items-stretch lg:items-center gap-2 sm:gap-2.5 w-full lg:w-auto">
            <div className="relative sm:col-span-2 lg:col-span-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                aria-label="Cari Spesies, Nama Latin, atau Wilayah"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari ikan / Latin / DPI..."
                className="w-full pl-8 pr-3 py-2 sm:py-1.5 rounded-xl bg-slate-50 dark:bg-[#0F172A] border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:border-[#06B6D4]"
              />
            </div>

            <select
              aria-label="Filter Wilayah Pelabuhan DPI"
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="w-full lg:w-auto px-3 py-2 sm:py-1.5 rounded-xl bg-slate-50 dark:bg-[#0F172A] border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-[#F8FAFC]"
            >
              <option value="ALL">Semua Wilayah DPI</option>
              {(Object.keys(STUDY_REGIONS) as RegionKey[]).map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter Tahun Observasi"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full lg:w-auto px-3 py-2 sm:py-1.5 rounded-xl bg-slate-50 dark:bg-[#0F172A] border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-[#F8FAFC]"
            >
              <option value="ALL">Semua Tahun (2023-2026)</option>
              {[2023, 2024, 2025, 2026].map((y) => (
                <option key={y} value={String(y)}>
                  Tahun {y}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter Spesies Ikan"
              value={selectedSpecies}
              onChange={(e) => setSelectedSpecies(e.target.value)}
              className="w-full lg:w-auto px-3 py-2 sm:py-1.5 rounded-xl bg-slate-50 dark:bg-[#0F172A] border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-[#F8FAFC]"
            >
              <option value="ALL">Semua Spesies</option>
              {(Object.keys(TARGET_SPECIES) as SpeciesKey[]).map((sp) => (
                <option key={sp} value={sp}>
                  {sp} ({TARGET_SPECIES[sp].latinName})
                </option>
              ))}
            </select>

            <select
              aria-label="Filter Musim Tangkap"
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              className="w-full lg:w-auto px-3 py-2 sm:py-1.5 rounded-xl bg-slate-50 dark:bg-[#0F172A] border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-[#F8FAFC]"
            >
              <option value="ALL">Semua Musim</option>
              <option value="Musim Barat (Des-Feb)">Musim Barat</option>
              <option value="Musim Peralihan I (Mar-Mei)">
                Musim Peralihan I
              </option>
              <option value="Musim Timur (Jun-Agu)">Musim Timur</option>
              <option value="Musim Peralihan II (Sep-Nov)">
                Musim Peralihan II
              </option>
            </select>
          </div>
        </div>

        <p className="sm:hidden text-[11px] font-mono text-[#06B6D4]">
          &larr; Geser tabel ke samping untuk melihat seluruh kolom &rarr;
        </p>

        {/* High-Density Data Table */}
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-[#94A3B8] font-semibold">
                <th className="py-3 px-2.5">Wilayah DPI</th>
                <th className="py-3 px-2">Tahun / Musim</th>
                <th className="py-3 px-2.5">Spesies &amp; Nama Latin</th>
                <th className="py-3 px-2 text-right">Batas Lm</th>
                <th className="py-3 px-2 text-right">CPUE</th>
                <th className="py-3 px-2.5 text-right">Harga Acuan TPI</th>
                <th className="py-3 px-2.5 text-right">Harga Tengkulak</th>
                <th className="py-3 px-2.5 text-right text-[#06B6D4]">
                  Harga Layak
                </th>
                <th className="py-3 px-2.5 text-right">Status Keputusan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
              {filteredRows.slice(0, 24).map((row) => (
                <tr
                  key={row.id}
                  onClick={() => onSelectRowForSimulation?.(row)}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                >
                  <td className="py-2.5 px-2.5 font-semibold text-slate-900 dark:text-[#F8FAFC]">
                    {row.region}
                  </td>
                  <td className="py-2.5 px-2 font-mono text-slate-600 dark:text-slate-300">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {row.year}
                    </span>{' '}
                    · {row.season.replace(/\s*\(.*\)/, '')}
                  </td>
                  <td className="py-2.5 px-2.5">
                    <span className="font-bold text-slate-900 dark:text-[#F8FAFC]">
                      {row.species}
                    </span>{' '}
                    <span className="italic text-slate-500 dark:text-[#94A3B8]">
                      ({row.latinName})
                    </span>
                  </td>
                  <td className="py-2.5 px-2 text-right font-mono">
                    {row.lmCm} cm
                  </td>
                  <td className="py-2.5 px-2 text-right font-mono font-semibold">
                    {row.cpueKg} kg
                  </td>
                  <td className="py-2.5 px-2.5 text-right font-mono">
                    Rp {row.tpiPriceRp.toLocaleString('id-ID')}
                  </td>
                  <td className="py-2.5 px-2.5 text-right font-mono text-slate-600 dark:text-slate-300">
                    Rp {row.tengkulakPriceRp.toLocaleString('id-ID')}
                  </td>
                  <td className="py-2.5 px-2.5 text-right font-mono font-bold text-[#06B6D4]">
                    Rp {row.fairEffortPriceRp.toLocaleString('id-ID')}
                  </td>
                  <td className="py-2.5 px-2.5 text-right font-mono font-bold">
                    <span
                      className={
                        row.decisionBadge === 'LAYAK MELAUT'
                          ? 'text-[#10B981]'
                          : row.decisionBadge === 'WASPADA & NEGO HARGA'
                            ? 'text-[#F59E0B]'
                            : 'text-[#EF4444]'
                      }
                    >
                      {row.decisionBadge}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredRows.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="py-8 text-center text-slate-500 dark:text-[#94A3B8]"
                  >
                    Tidak ada data trip yang cocok dengan filter pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
