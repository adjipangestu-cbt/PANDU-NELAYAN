import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import {
  Anchor,
  Waves,
  Wind,
  Thermometer,
  CloudRain,
  ShieldAlert,
  Play,
  SkipForward,
  Fish,
  CloudSun,
  Cloud,
  Flame,
  Sparkles,
  Eye,
  EyeOff,
  Calendar,
  Compass,
  Gauge,
} from 'lucide-react';
import {
  RegionKey,
  SimulationYear,
  STUDY_REGIONS,
  SimulationInput,
  SimulationOutput,
  getRegionalHourlyForecast,
  HourlyForecastItem,
  MARITIME_MONTHS,
  getDaysInMaritimeMonth,
  generateMaritimeHeatmapGrid,
  HeatmapMode,
} from '../utils/maritimeFormulas';

export type MapOverlayLayer =
  | 'Zonasi KKP'
  | 'Tinggi Gelombang'
  | 'Kecepatan Angin'
  | 'Indeks Panas WBGT'
  | 'Curah Hujan'
  | 'Estimasi CPUE';

interface WebGisForecastViewProps {
  simInput: SimulationInput;
  simOutput: SimulationOutput;
  onRegionChange: (region: RegionKey) => void;
  onMapCoordinateSelect: (lat: number, lon: number) => void;
  onSelectHourlyWeather: (forecast: HourlyForecastItem) => void;
}

export const WebGisForecastView: React.FC<WebGisForecastViewProps> = ({
  simInput,
  simOutput,
  onRegionChange,
  onMapCoordinateSelect,
  onSelectHourlyWeather,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const onMapClickRef = useRef(onMapCoordinateSelect);
  onMapClickRef.current = onMapCoordinateSelect;

  const [activeOverlay, setActiveOverlay] =
    useState<MapOverlayLayer>('Zonasi KKP');
  const [heatmapMode, setHeatmapMode] = useState<HeatmapMode>(
    'COMBINED_SAFE_SPOT'
  );
  const [showHeatmap, setShowHeatmap] = useState<boolean>(true);
  const [selectedDay, setSelectedDay] = useState<number>(9);
  const [selectedMonth, setSelectedMonth] = useState<number>(11);
  const [timelineIndex, setTimelineIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const regionInfo = STUDY_REGIONS[simInput.region];
  const maxDaysInMonth = getDaysInMaritimeMonth(selectedMonth, simInput.year);
  const safeDay = Math.min(selectedDay, maxDaysInMonth);
  const currentIsoDate = `${simInput.year}-${String(selectedMonth).padStart(2, '0')}-${String(safeDay).padStart(2, '0')}`;

  const hourlyForecasts = useMemo(
    () =>
      getRegionalHourlyForecast(
        simInput.region,
        currentIsoDate,
        simInput.year
      ),
    [simInput.region, currentIsoDate, simInput.year]
  );
  const currentSlot = hourlyForecasts[timelineIndex] || hourlyForecasts[0];

  // Generate 49-cell spatial heatmap around the active region
  const heatmapCells = useMemo(
    () => generateMaritimeHeatmapGrid(simInput, simOutput, heatmapMode),
    [simInput, simOutput, heatmapMode]
  );

  const heatmapStats = useMemo(() => {
    const avoidCount = heatmapCells.filter((c) => c.avoidArea).length;
    const optimalCells = heatmapCells.filter(
      (c) => !c.avoidArea && c.jarakKkpKm >= 5.0
    );
    const bestSpot =
      optimalCells.slice().sort((a, b) => b.localCpueKg - a.localCpueKg)[0] ||
      heatmapCells[0];
    return {
      avoidCount,
      optimalCount: optimalCells.length,
      bestSpot,
    };
  }, [heatmapCells]);

  // Auto-advance timeline when Play is active
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setTimelineIndex((prev) => {
        const next = (prev + 1) % hourlyForecasts.length;
        onSelectHourlyWeather(hourlyForecasts[next]);
        return next;
      });
    }, 2200);
    return () => clearInterval(timer);
  }, [isPlaying, hourlyForecasts, onSelectHourlyWeather]);

  // Initialize Leaflet Map once
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [simOutput.targetLat, simOutput.targetLon],
      zoom: 11,
      zoomControl: false,
    });

    L.control.zoom({ position: 'topleft' }).addTo(map);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap | PANDU-NELAYAN WebGIS',
      maxZoom: 18,
    }).addTo(map);

    map.on('click', (e: L.LeafletMouseEvent) => {
      const clickedLat = Number(e.latlng.lat.toFixed(4));
      const clickedLon = Number(e.latlng.lng.toFixed(4));
      onMapClickRef.current(clickedLat, clickedLon);
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Render all 5 Study Regions, KKP concentric zoning rings, active heatmap grid, and interactive vessel pin
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear non-tile layers
    map.eachLayer((layer) => {
      if (!(layer instanceof L.TileLayer)) {
        map.removeLayer(layer);
      }
    });

    // Pan smoothly toward the active coordinate
    map.setView([simOutput.targetLat, simOutput.targetLon], map.getZoom() || 11);

    // 1. Render 49-sector Spatial Heatmap Grid (CPUE Density / WBGT Thermal Risk / Combined Safe-Avoid)
    if (showHeatmap) {
      const halfStep = 0.0085;
      heatmapCells.forEach((cell) => {
        const bounds: L.LatLngBoundsExpression = [
          [cell.lat - halfStep, cell.lon - halfStep],
          [cell.lat + halfStep, cell.lon + halfStep],
        ];

        const fillOpacity = cell.avoidArea
          ? 0.42
          : Math.min(0.45, Math.max(0.16, cell.intensity * 0.44));

        const rect = L.rectangle(bounds, {
          color: cell.avoidArea ? '#EF4444' : cell.colorHex,
          weight: cell.avoidArea ? 1.2 : 0.6,
          dashArray: cell.avoidArea ? '3 3' : undefined,
          fillColor: cell.colorHex,
          fillOpacity,
        }).addTo(map);

        // Add radial glow circle inside high-intensity cells for intuitive thermal / CPUE hotspot visualization
        if (cell.intensity >= 0.72 || cell.avoidArea) {
          L.circle([cell.lat, cell.lon], {
            radius: 650,
            color: cell.colorHex,
            weight: 0,
            fillColor: cell.colorHex,
            fillOpacity: cell.avoidArea ? 0.35 : 0.28,
          }).addTo(map);
        }

        rect.bindTooltip(
          `<div style="font-family:'Plus Jakarta Sans',sans-serif;font-size:11px;line-height:1.4;">
            <strong style="color:${cell.colorHex};">${cell.statusLabel}</strong><br/>
            <span>Koordinat: <code>${cell.lat.toFixed(4)}, ${cell.lon.toFixed(4)}</code></span><br/>
            <span>Potensi CPUE: <strong>${cell.localCpueKg} kg/trip</strong></span><br/>
            <span>Indeks WBGT: <strong>${cell.localWbgtC} °C</strong> (${cell.zonaKkp})</span><br/>
            <span>Jarak KKP: <strong>${cell.jarakKkpKm} km</strong></span>
          </div>`,
          { sticky: true, direction: 'top' }
        );

        rect.on('click', () => {
          onMapClickRef.current(cell.lat, cell.lon);
        });
      });
    }

    // 2. Draw all 5 Study Regions KKP rings & polygons
    (Object.keys(STUDY_REGIONS) as RegionKey[]).forEach((regKey) => {
      const reg = STUDY_REGIONS[regKey];

      // Sustainable Utilization Outer Ring (>= 5.0 km, shown up to 8.5 km)
      L.circle([reg.kkp_lat, reg.kkp_lon], {
        radius: 8500,
        color: '#10B981',
        weight: 1.5,
        dashArray: '6 6',
        fillColor: '#10B981',
        fillOpacity: activeOverlay === 'Zonasi KKP' && !showHeatmap ? 0.06 : 0.01,
      })
        .addTo(map)
        .bindTooltip(`${reg.kkpName} — Zona Pemanfaatan Berkelanjutan (≥ 5 km)`);

      // Buffer Zone (2.0 - 5.0 km)
      L.circle([reg.kkp_lat, reg.kkp_lon], {
        radius: 5000,
        color: '#F59E0B',
        weight: 2,
        dashArray: '8 6',
        fillColor: '#F59E0B',
        fillOpacity: activeOverlay === 'Zonasi KKP' && !showHeatmap ? 0.14 : 0.04,
      })
        .addTo(map)
        .bindTooltip(`${reg.kkpName} — Zona Penyangga Konservasi (2–5 km)`);

      // Core No-Take Zone (< 2.0 km)
      L.circle([reg.kkp_lat, reg.kkp_lon], {
        radius: 2000,
        color: '#EF4444',
        weight: 2.5,
        dashArray: '5 5',
        fillColor: '#EF4444',
        fillOpacity: activeOverlay === 'Zonasi KKP' && !showHeatmap ? 0.28 : 0.15,
      })
        .addTo(map)
        .bindTooltip(`${reg.kkpName} — ZONA INTI LARANG TANGKAP (< 2 km)`);

      // KKP Center Beacon
      const kkpCenterIcon = L.divIcon({
        className: 'kkp-beacon-pin',
        html: `<div style="width:12px;height:12px;border-radius:9999px;background:#EF4444;border:2px solid #fff;box-shadow:0 0 10px #EF4444;"></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6],
      });
      L.marker([reg.kkp_lat, reg.kkp_lon], { icon: kkpCenterIcon })
        .addTo(map)
        .bindPopup(
          `<div><strong>Pusat Konservasi: ${reg.kkpName}</strong><br/>Koordinat: ${reg.kkp_lat.toFixed(4)}, ${reg.kkp_lon.toFixed(4)}<br/>Radius Inti Larang Tangkap: 2.0 km</div>`
        );
    });

    // Distance Vector Polyline from Vessel to KKP Center
    L.polyline(
      [
        [simOutput.targetLat, simOutput.targetLon],
        [simOutput.kkpLat, simOutput.kkpLon],
      ],
      {
        color:
          simOutput.zonaKkpColor === 'emerald'
            ? '#10B981'
            : simOutput.zonaKkpColor === 'amber'
              ? '#F59E0B'
              : '#EF4444',
        weight: 2,
        dashArray: '6 6',
      }
    ).addTo(map);

    // Target Fisherman Vessel Pin with Live Callout Popup
    const pinHex =
      simOutput.decisionColor === 'emerald'
        ? '#10B981'
        : simOutput.decisionColor === 'amber'
          ? '#F59E0B'
          : '#EF4444';

    const vesselIcon = L.divIcon({
      className: 'webgis-vessel-pin',
      html: `<div style="position:relative;width:22px;height:22px;display:flex;align-items:center;justify-content:center;">
        <div style="position:absolute;inset:0;border-radius:9999px;background:${pinHex};opacity:0.45;transform:scale(1.6);"></div>
        <div style="width:14px;height:14px;border-radius:9999px;background:#06B6D4;border:2.5px solid #F8FAFC;box-shadow:0 0 12px #06B6D4;position:relative;z-index:2;"></div>
      </div>`,
      iconSize: [22, 22],
      iconAnchor: [11, 11],
    });

    const marker = L.marker([simOutput.targetLat, simOutput.targetLon], {
      icon: vesselIcon,
    }).addTo(map);

    marker
      .bindPopup(
        `<div style="min-width:225px;font-family:'Plus Jakarta Sans',sans-serif;padding:2px;">
          <div style="font-size:10px;color:#06B6D4;font-weight:700;letter-spacing:0.04em;">TITIK TANGKAP ARMADA (&lt;5 GT)</div>
          <div style="font-size:13px;font-weight:800;margin-top:2px;color:#F8FAFC;">${regionInfo.fullName}</div>
          <div style="font-family:'JetBrains Mono',monospace;font-size:11px;color:#94A3B8;margin-bottom:6px;">
            ${simOutput.targetLat.toFixed(4)}° LS, ${simOutput.targetLon.toFixed(4)}° BT
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;font-size:11px;border-top:1px solid rgba(148,163,184,0.2);padding-top:6px;font-family:'JetBrains Mono',monospace;">
            <div>Angin: <strong>${simInput.windKnot} kt</strong></div>
            <div>Gelombang: <strong>${simInput.waveM} m</strong></div>
            <div>WBGT: <strong>${simOutput.wbgtC} °C</strong></div>
            <div>Jarak KKP: <strong>${simOutput.jarakKkpKm} km</strong></div>
          </div>
          <div style="margin-top:6px;padding:4px 8px;border-radius:6px;background:rgba(6,182,212,0.18);color:${pinHex};font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:700;text-align:center;">
            ${simOutput.shortDecisionBadge} • Skor ${simOutput.skorKelayakanAi}
          </div>
        </div>`,
        { autoPan: false }
      );

    if (window.innerWidth >= 768) {
      marker.openPopup();
    }

    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  }, [
    simInput.region,
    simInput.windKnot,
    simInput.waveM,
    simOutput.targetLat,
    simOutput.targetLon,
    simOutput.kkpLat,
    simOutput.kkpLon,
    simOutput.jarakKkpKm,
    simOutput.wbgtC,
    simOutput.zonaKkpColor,
    simOutput.decisionColor,
    simOutput.shortDecisionBadge,
    simOutput.skorKelayakanAi,
    activeOverlay,
    regionInfo.fullName,
    showHeatmap,
    heatmapCells,
  ]);

  const layerControls: {
    id: MapOverlayLayer;
    label: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: 'Zonasi KKP',
      label: 'Zonasi KKP',
      icon: <ShieldAlert className="w-3.5 h-3.5" />,
    },
    {
      id: 'Tinggi Gelombang',
      label: 'Tinggi Gelombang',
      icon: <Waves className="w-3.5 h-3.5" />,
    },
    {
      id: 'Kecepatan Angin',
      label: 'Kecepatan Angin',
      icon: <Wind className="w-3.5 h-3.5" />,
    },
    {
      id: 'Indeks Panas WBGT',
      label: 'Indeks Panas WBGT',
      icon: <Thermometer className="w-3.5 h-3.5" />,
    },
    {
      id: 'Curah Hujan',
      label: 'Curah Hujan',
      icon: <CloudRain className="w-3.5 h-3.5" />,
    },
    {
      id: 'Estimasi CPUE',
      label: 'Estimasi CPUE',
      icon: <Fish className="w-3.5 h-3.5" />,
    },
  ];

  // Quick spatial test coordinates relative to active KKP center
  const handleQuickZoneTest = (zoneType: 'core' | 'buffer' | 'sustainable') => {
    if (zoneType === 'core') {
      // ~0.9 km from KKP center (< 2.0 km)
      onMapCoordinateSelect(
        Number((regionInfo.kkp_lat + 0.006).toFixed(4)),
        Number((regionInfo.kkp_lon + 0.005).toFixed(4))
      );
    } else if (zoneType === 'buffer') {
      // ~3.4 km from KKP center (2.0 - 5.0 km)
      onMapCoordinateSelect(
        Number((regionInfo.kkp_lat + 0.022).toFixed(4)),
        Number((regionInfo.kkp_lon + 0.021).toFixed(4))
      );
    } else {
      // Default Sustainable Zone (>= 5.0 km)
      onMapCoordinateSelect(regionInfo.lat, regionInfo.lon);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header & Quick Region / Spatial Zone Test Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 sm:gap-4">
        <div>
          <h2 className="text-lg sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-[#F8FAFC]">
            WebGIS Spasial Konservasi KKP &amp; Cuaca Maritim BMKG
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-[#94A3B8]">
            Klik titik mana saja di peta laut untuk memindahkan pin kapal,
            menghitung jarak Haversine ke KKP terdekat, dan menguji respons AI.
          </p>
        </div>

        {/* Region Selector, Full Day (1-31) Selector, Month (Jan-Dec) Selector, Year Selector, Calendar Input & Quick Zone Jump Buttons */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 sm:gap-2.5">
          <select
            aria-label="Pilih Wilayah DPI pada Peta"
            value={simInput.region}
            onChange={(e) => {
              const nextRegion = e.target.value as RegionKey;
              onRegionChange(nextRegion);
              const nextSlots = getRegionalHourlyForecast(
                nextRegion,
                currentIsoDate,
                simInput.year
              );
              const slot = nextSlots[timelineIndex] || nextSlots[0];
              onSelectHourlyWeather(slot);
            }}
            className="w-full sm:w-auto text-xs font-bold bg-white dark:bg-[#1E293B] text-slate-900 dark:text-[#F8FAFC] border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 sm:py-2 focus:outline-none focus:border-[#06B6D4] cursor-pointer"
          >
            {(Object.keys(STUDY_REGIONS) as RegionKey[]).map((regKey) => (
              <option key={regKey} value={regKey}>
                {STUDY_REGIONS[regKey].fullName}
              </option>
            ))}
          </select>

          {/* Select Day (1 .. 28/29/30/31) */}
          <select
            id="webgis-date-select"
            aria-label="Pilih Tanggal Cuaca Maritim (1-31)"
            value={safeDay}
            onChange={(e) => {
              const nextDay = Number(e.target.value);
              setSelectedDay(nextDay);
              const nextIso = `${simInput.year}-${String(selectedMonth).padStart(2, '0')}-${String(nextDay).padStart(2, '0')}`;
              const nextSlots = getRegionalHourlyForecast(
                simInput.region,
                nextIso,
                simInput.year
              );
              const slot = nextSlots[timelineIndex] || nextSlots[0];
              onSelectHourlyWeather(slot);
            }}
            className="w-full sm:w-auto text-xs font-bold bg-white dark:bg-[#1E293B] text-slate-900 dark:text-[#F8FAFC] border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 sm:py-2 focus:outline-none focus:border-[#06B6D4] cursor-pointer font-mono"
          >
            {Array.from({ length: maxDaysInMonth }, (_, i) => i + 1).map(
              (dayNum) => (
                <option key={dayNum} value={dayNum}>
                  Tanggal {dayNum}
                </option>
              )
            )}
          </select>

          {/* Select Month (Januari .. Desember) */}
          <select
            id="webgis-month-select"
            aria-label="Pilih Bulan Cuaca Maritim (Januari-Desember)"
            value={selectedMonth}
            onChange={(e) => {
              const nextMonth = Number(e.target.value);
              const nextMaxDay = getDaysInMaritimeMonth(
                nextMonth,
                simInput.year
              );
              const clampedDay = Math.min(selectedDay, nextMaxDay);
              setSelectedMonth(nextMonth);
              setSelectedDay(clampedDay);
              const nextIso = `${simInput.year}-${String(nextMonth).padStart(2, '0')}-${String(clampedDay).padStart(2, '0')}`;
              const nextSlots = getRegionalHourlyForecast(
                simInput.region,
                nextIso,
                simInput.year
              );
              const slot = nextSlots[timelineIndex] || nextSlots[0];
              onSelectHourlyWeather(slot);
            }}
            className="w-full sm:w-auto text-xs font-bold bg-white dark:bg-[#1E293B] text-slate-900 dark:text-[#F8FAFC] border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 sm:py-2 focus:outline-none focus:border-[#06B6D4] cursor-pointer"
          >
            {MARITIME_MONTHS.map((m) => (
              <option key={m.month} value={m.month}>
                {m.name} ({m.seasonShort})
              </option>
            ))}
          </select>

          {/* Select Year (2023 .. 2026) */}
          <select
            id="webgis-year-select"
            aria-label="Pilih Tahun Cuaca Maritim"
            value={simInput.year}
            onChange={(e) => {
              const nextYear = Number(e.target.value) as SimulationYear;
              const nextMaxDay = getDaysInMaritimeMonth(
                selectedMonth,
                nextYear
              );
              const clampedDay = Math.min(selectedDay, nextMaxDay);
              setSelectedDay(clampedDay);
              const nextIso = `${nextYear}-${String(selectedMonth).padStart(2, '0')}-${String(clampedDay).padStart(2, '0')}`;
              const nextSlots = getRegionalHourlyForecast(
                simInput.region,
                nextIso,
                nextYear
              );
              const slot = nextSlots[timelineIndex] || nextSlots[0];
              onSelectHourlyWeather(slot);
            }}
            className="w-full sm:w-auto text-xs font-bold bg-white dark:bg-[#1E293B] text-slate-900 dark:text-[#F8FAFC] border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 sm:py-2 focus:outline-none focus:border-[#06B6D4] cursor-pointer font-mono"
          >
            {([2023, 2024, 2025, 2026] as SimulationYear[]).map((yr) => (
              <option key={yr} value={yr}>
                Tahun {yr}
              </option>
            ))}
          </select>

          {/* Direct Full-Calendar Date Input (2023-01-01 to 2026-12-31) */}
          <input
            id="webgis-calendar-picker"
            type="date"
            aria-label="Pilih Tanggal Kalender Langsung"
            min="2023-01-01"
            max="2026-12-31"
            value={currentIsoDate}
            onChange={(e) => {
              const val = e.target.value;
              const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(val);
              if (!match) return;
              const yr = Number(match[1]) as SimulationYear;
              const validYr: SimulationYear =
                yr === 2023 || yr === 2024 || yr === 2025 || yr === 2026
                  ? yr
                  : simInput.year;
              const mo = Number(match[2]);
              const dy = Number(match[3]);
              setSelectedMonth(mo);
              setSelectedDay(dy);
              const nextIso = `${validYr}-${String(mo).padStart(2, '0')}-${String(dy).padStart(2, '0')}`;
              const nextSlots = getRegionalHourlyForecast(
                simInput.region,
                nextIso,
                validYr
              );
              const slot = nextSlots[timelineIndex] || nextSlots[0];
              onSelectHourlyWeather(slot);
            }}
            className="w-full sm:w-auto text-xs font-mono font-bold bg-white dark:bg-[#1E293B] text-slate-900 dark:text-[#F8FAFC] border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 sm:py-1.5 focus:outline-none focus:border-[#06B6D4] cursor-pointer"
          />

          <div className="grid grid-cols-3 sm:flex items-center gap-1.5 sm:gap-2.5">
            <button
              type="button"
              onClick={() => handleQuickZoneTest('sustainable')}
              className="px-2 sm:px-3 py-2 rounded-xl text-[11px] sm:text-xs font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 text-[#10B981] border border-emerald-500/30 transition-colors cursor-pointer text-center whitespace-nowrap shrink-0"
            >
              <span className="hidden sm:inline">Uji Zona Lestari (≥5 km)</span>
              <span className="sm:hidden">Lestari ≥5km</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickZoneTest('buffer')}
              className="px-2 sm:px-3 py-2 rounded-xl text-[11px] sm:text-xs font-semibold bg-amber-500/15 hover:bg-amber-500/25 text-[#F59E0B] border border-amber-500/30 transition-colors cursor-pointer text-center whitespace-nowrap shrink-0"
            >
              <span className="hidden sm:inline">
                Uji Zona Penyangga (2–5 km)
              </span>
              <span className="sm:hidden">Penyangga 2–5km</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickZoneTest('core')}
              className="px-2 sm:px-3 py-2 rounded-xl text-[11px] sm:text-xs font-semibold bg-red-500/15 hover:bg-red-500/25 text-[#EF4444] border border-red-500/30 transition-colors cursor-pointer text-center whitespace-nowrap shrink-0"
            >
              <span className="hidden sm:inline">
                Uji Zona Inti KKP (&lt;2 km)
              </span>
              <span className="sm:hidden">Zona Inti &lt;2km</span>
            </button>
          </div>
        </div>
      </div>

      {/* Temporal Weather & Oceanographic Telemetry Strip for Selected Date, Year & Region */}
      <div
        data-testid="webgis-temporal-weather-panel"
        className="rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700/80 p-3.5 sm:p-4 space-y-3"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#06B6D4] shrink-0" />
            <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-[#F8FAFC]">
              Telemetri Cuaca &amp; Oseanografi Saat Waktu Terpilih:{' '}
              <span className="text-[#06B6D4] font-mono">
                {currentSlot.fullDateLabel} • {currentSlot.timeWib}
              </span>
            </span>
          </div>
          <span className="text-[11px] font-mono font-semibold text-slate-500 dark:text-[#94A3B8]">
            Siklus Monsun: <strong className="text-slate-900 dark:text-white">{currentSlot.season}</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2.5 sm:gap-3">
          {/* 1. Tinggi Gelombang */}
          <button
            type="button"
            onClick={() => setActiveOverlay('Tinggi Gelombang')}
            className={`text-left p-3 rounded-xl border transition-all cursor-pointer ${
              activeOverlay === 'Tinggi Gelombang'
                ? 'bg-cyan-500/15 border-[#06B6D4] shadow-md'
                : 'bg-slate-50 dark:bg-[#0F172A]/80 border-slate-200 dark:border-slate-800 hover:border-cyan-500/40'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-[#94A3B8] mb-1">
              <span>Tinggi Gelombang</span>
              <Waves className="w-3.5 h-3.5 text-[#06B6D4] animate-radar-ping" />
            </div>
            <p className="text-sm sm:text-base font-mono font-extrabold text-slate-900 dark:text-[#F8FAFC]">
              {currentSlot.waveM} m
            </p>
            <span
              className={`text-[10px] font-mono font-bold ${
                currentSlot.waveCategory === 'Tenang'
                  ? 'text-[#06B6D4]'
                  : currentSlot.waveCategory === 'Rendah'
                    ? 'text-[#10B981]'
                    : currentSlot.waveCategory === 'Sedang'
                      ? 'text-[#F59E0B]'
                      : 'text-[#EF4444]'
              }`}
            >
              Status: {currentSlot.waveCategory}
            </span>
          </button>

          {/* 2. Kecepatan & Arah Angin */}
          <button
            type="button"
            onClick={() => setActiveOverlay('Kecepatan Angin')}
            className={`text-left p-3 rounded-xl border transition-all cursor-pointer ${
              activeOverlay === 'Kecepatan Angin'
                ? 'bg-cyan-500/15 border-[#06B6D4] shadow-md'
                : 'bg-slate-50 dark:bg-[#0F172A]/80 border-slate-200 dark:border-slate-800 hover:border-cyan-500/40'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-[#94A3B8] mb-1">
              <span>Kecepatan Angin</span>
              <Wind className="w-3.5 h-3.5 text-[#06B6D4] animate-radar-ping" />
            </div>
            <p className="text-sm sm:text-base font-mono font-extrabold text-slate-900 dark:text-[#F8FAFC]">
              {currentSlot.windKnot} kt
            </p>
            <span className="text-[10px] font-mono text-slate-600 dark:text-slate-300">
              Arah: {currentSlot.windDirection}
            </span>
          </button>

          {/* 3. Indeks Panas WBGT */}
          <button
            type="button"
            onClick={() => {
              setActiveOverlay('Indeks Panas WBGT');
              setShowHeatmap(true);
              setHeatmapMode('WBGT_RISK');
            }}
            className={`text-left p-3 rounded-xl border transition-all cursor-pointer ${
              activeOverlay === 'Indeks Panas WBGT'
                ? 'bg-amber-500/15 border-[#F59E0B] shadow-md'
                : 'bg-slate-50 dark:bg-[#0F172A]/80 border-slate-200 dark:border-slate-800 hover:border-amber-500/40'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-[#94A3B8] mb-1">
              <span>Indeks Panas WBGT</span>
              <Thermometer className="w-3.5 h-3.5 text-[#F59E0B] animate-radar-ping" />
            </div>
            <p className="text-sm sm:text-base font-mono font-extrabold text-[#F59E0B]">
              {currentSlot.wbgtC} °C
            </p>
            <span className="text-[10px] font-mono text-slate-600 dark:text-slate-300">
              Suhu {currentSlot.tempC}°C • RH {currentSlot.rhPercent}%
            </span>
          </button>

          {/* 4. Curah Hujan & Kondisi Cuaca */}
          <button
            type="button"
            onClick={() => setActiveOverlay('Curah Hujan')}
            className={`text-left p-3 rounded-xl border transition-all cursor-pointer ${
              activeOverlay === 'Curah Hujan'
                ? 'bg-blue-500/15 border-[#3B82F6] shadow-md'
                : 'bg-slate-50 dark:bg-[#0F172A]/80 border-slate-200 dark:border-slate-800 hover:border-blue-500/40'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-[#94A3B8] mb-1">
              <span>Curah Hujan</span>
              <CloudRain className="w-3.5 h-3.5 text-[#3B82F6] animate-radar-ping" />
            </div>
            <p className="text-sm sm:text-base font-mono font-extrabold text-slate-900 dark:text-[#F8FAFC]">
              {currentSlot.rainfallMm} mm
            </p>
            <span className="text-[10px] font-mono text-[#3B82F6] font-semibold">
              {currentSlot.condition}
            </span>
          </button>

          {/* 5. Arus Laut, Pasang & Suhu Permukaan Laut (SPL) */}
          <div className="text-left p-3 rounded-xl bg-slate-50 dark:bg-[#0F172A]/80 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-[#94A3B8] mb-1">
              <span>Arus, Pasang &amp; SPL</span>
              <Compass className="w-3.5 h-3.5 text-[#10B981] animate-radar-ping" />
            </div>
            <p className="text-sm sm:text-base font-mono font-extrabold text-slate-900 dark:text-[#F8FAFC]">
              {currentSlot.currentKnot} kt ({currentSlot.currentDirection})
            </p>
            <span className="text-[10px] font-mono text-slate-600 dark:text-slate-300">
              Pasang {currentSlot.tideM}m • SPL {currentSlot.sstC}°C
            </span>
          </div>

          {/* 6. Jarak Pandang, Tekanan Udara & Estimasi CPUE */}
          <button
            type="button"
            onClick={() => {
              setActiveOverlay('Estimasi CPUE');
              setShowHeatmap(true);
              setHeatmapMode('CPUE_DENSITY');
            }}
            className={`text-left p-3 rounded-xl border transition-all cursor-pointer ${
              activeOverlay === 'Estimasi CPUE'
                ? 'bg-emerald-500/15 border-[#10B981] shadow-md'
                : 'bg-slate-50 dark:bg-[#0F172A]/80 border-slate-200 dark:border-slate-800 hover:border-emerald-500/40'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-[#94A3B8] mb-1">
              <span>Visibilitas &amp; CPUE</span>
              <Gauge className="w-3.5 h-3.5 text-[#10B981] animate-radar-ping" />
            </div>
            <p className="text-sm sm:text-base font-mono font-extrabold text-[#10B981]">
              {currentSlot.estimatedCpueKg} kg/trip
            </p>
            <span className="text-[10px] font-mono text-slate-600 dark:text-slate-300">
              Pandang {currentSlot.visibilityKm}km • {currentSlot.pressureHpa} hPa
            </span>
          </button>
        </div>
      </div>

      {/* Interactive Heatmap Control Bar & Hotspot Finder */}
      <div className="rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700/80 p-3.5 sm:p-4 flex flex-col xl:flex-row xl:items-center justify-between gap-3.5 sm:gap-4">
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2.5 sm:gap-3">
          <div className="flex items-center justify-between sm:justify-start gap-2">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-[#F59E0B] shrink-0 animate-radar-ping" />
              <span className="text-xs font-bold text-slate-900 dark:text-[#F8FAFC]">
                Layer Peta Panas (Spatial Heatmap 49 Sektor):
              </span>
            </div>

            <button
              type="button"
              onClick={() => setShowHeatmap((s) => !s)}
              aria-label={
                showHeatmap
                  ? 'Sembunyikan Layer Heatmap'
                  : 'Tampilkan Layer Heatmap'
              }
              className="sm:hidden px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-600 dark:text-slate-300 flex items-center gap-1 cursor-pointer"
            >
              {showHeatmap ? (
                <>
                  <Eye className="w-3.5 h-3.5 text-[#06B6D4]" />
                  <span>ON</span>
                </>
              ) : (
                <>
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>OFF</span>
                </>
              )}
            </button>
          </div>

          {/* 3 Heatmap Mode Buttons */}
          <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-stretch sm:items-center gap-1.5 bg-slate-100 dark:bg-[#0F172A] p-1.5 sm:p-1 rounded-xl border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                setShowHeatmap(true);
                setHeatmapMode('COMBINED_SAFE_SPOT');
              }}
              className={`px-3 py-2 sm:py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 text-center ${
                showHeatmap && heatmapMode === 'COMBINED_SAFE_SPOT'
                  ? 'bg-[#10B981] text-slate-950 font-bold shadow'
                  : 'text-slate-600 dark:text-slate-300 hover:text-white'
              }`}
            >
              Zona Aman &amp; Hindari (Terpadu)
            </button>

            <button
              type="button"
              onClick={() => {
                setShowHeatmap(true);
                setHeatmapMode('CPUE_DENSITY');
                setActiveOverlay('Estimasi CPUE');
              }}
              className={`px-3 py-2 sm:py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 text-center ${
                showHeatmap && heatmapMode === 'CPUE_DENSITY'
                  ? 'bg-[#06B6D4] text-slate-950 font-bold shadow'
                  : 'text-slate-600 dark:text-slate-300 hover:text-white'
              }`}
            >
              Heatmap Kepadatan CPUE
            </button>

            <button
              type="button"
              onClick={() => {
                setShowHeatmap(true);
                setHeatmapMode('WBGT_RISK');
                setActiveOverlay('Indeks Panas WBGT');
              }}
              className={`px-3 py-2 sm:py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 text-center ${
                showHeatmap && heatmapMode === 'WBGT_RISK'
                  ? 'bg-[#F59E0B] text-slate-950 font-bold shadow'
                  : 'text-slate-600 dark:text-slate-300 hover:text-white'
              }`}
            >
              Heatmap Risiko Stres Panas WBGT
            </button>

            <button
              type="button"
              onClick={() => setShowHeatmap((s) => !s)}
              aria-label={
                showHeatmap
                  ? 'Sembunyikan Layer Heatmap'
                  : 'Tampilkan Layer Heatmap'
              }
              className="hidden sm:flex px-2.5 py-1.5 rounded-lg text-xs font-mono text-slate-500 dark:text-slate-400 hover:text-cyan-300 items-center gap-1 cursor-pointer"
            >
              {showHeatmap ? (
                <>
                  <Eye className="w-3.5 h-3.5 text-[#06B6D4]" />
                  <span>ON</span>
                </>
              ) : (
                <>
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>OFF</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Summary Counters & One-Click Optimal Hotspot Jump */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center justify-between gap-2.5 sm:gap-3 text-xs pt-2 xl:pt-0 border-t xl:border-t-0 border-slate-200 dark:border-slate-800">
          <div className="font-mono text-slate-600 dark:text-slate-300 text-center sm:text-left">
            <span className="text-[#EF4444] font-bold">
              {heatmapStats.avoidCount} Sektor Hindari
            </span>
            <span className="mx-1.5">·</span>
            <span className="text-[#10B981] font-bold">
              {heatmapStats.optimalCount} Sektor Optimal
            </span>
          </div>

          <button
            type="button"
            onClick={() =>
              onMapCoordinateSelect(
                heatmapStats.bestSpot.lat,
                heatmapStats.bestSpot.lon
              )
            }
            className="w-full sm:w-auto px-3.5 py-2.5 sm:py-2 rounded-xl bg-[#06B6D4] hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>
              Arahkan ke Hotspot Terbaik ({heatmapStats.bestSpot.localCpueKg}{' '}
              kg/trip)
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Horizontal Layer Selector Strip (md:hidden) */}
      <div className="md:hidden flex items-center gap-2 overflow-x-auto pb-1">
        {layerControls.map((layer) => {
          const isActive = activeOverlay === layer.id;
          return (
            <button
              key={layer.id}
              type="button"
              onClick={() => {
                setActiveOverlay(layer.id);
                if (layer.id === 'Indeks Panas WBGT') {
                  setShowHeatmap(true);
                  setHeatmapMode('WBGT_RISK');
                } else if (layer.id === 'Estimasi CPUE') {
                  setShowHeatmap(true);
                  setHeatmapMode('CPUE_DENSITY');
                } else if (layer.id === 'Zonasi KKP') {
                  setShowHeatmap(true);
                  setHeatmapMode('COMBINED_SAFE_SPOT');
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                isActive
                  ? 'bg-[#06B6D4] text-slate-950 font-bold shadow'
                  : 'bg-slate-900 text-slate-200 border border-slate-700'
              }`}
            >
              {layer.icon}
              <span>{layer.label}</span>
            </button>
          );
        })}
      </div>

      {/* 1. Main Interactive Leaflet Map */}
      <div className="h-[430px] sm:h-[520px] rounded-2xl relative overflow-hidden border border-slate-300 dark:border-slate-700 shadow-2xl">
        <div
          ref={mapContainerRef}
          data-testid="webgis-main-map"
          className="w-full h-full z-0"
        />

        {/* Top-Left Live Coordinate & Haversine Status Pill */}
        <div className="absolute top-2.5 sm:top-4 left-12 sm:left-14 right-2.5 md:right-auto z-[500] bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-xs text-slate-100 shadow-lg flex items-center justify-between sm:justify-start gap-2.5 sm:gap-4">
          <div>
            <span className="text-[9px] sm:text-[10px] text-[#94A3B8] block">
              JARAK HAVERSINE KKP
            </span>
            <span className="font-mono font-bold text-xs sm:text-sm text-[#06B6D4]">
              {simOutput.jarakKkpKm} km
            </span>
          </div>
          <div className="border-l border-slate-700 pl-2.5 sm:pl-4 min-w-0">
            <span className="text-[9px] sm:text-[10px] text-[#94A3B8] block">
              STATUS ZONASI RUANG LAUT
            </span>
            <span
              className={`font-bold text-[11px] sm:text-xs truncate block ${
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
          <div className="border-l border-slate-700 pl-4 hidden lg:block">
            <span className="text-[10px] text-[#94A3B8] block">
              MODE HEATMAP SPASIAL
            </span>
            <span className="font-mono font-semibold text-xs text-cyan-300">
              {showHeatmap
                ? heatmapMode === 'CPUE_DENSITY'
                  ? 'Kepadatan CPUE'
                  : heatmapMode === 'WBGT_RISK'
                    ? 'Risiko Panas WBGT'
                    : 'Zona Aman & Hindari'
                : activeOverlay}
            </span>
          </div>
        </div>

        {/* Right Floating Layer Menu (Desktop md:flex) */}
        <div
          role="group"
          aria-label="Kontrol Lapisan Peta WebGIS"
          className="hidden md:flex absolute top-4 right-4 z-[500] flex-col gap-2"
        >
          {layerControls.map((layer) => {
            const isActive = activeOverlay === layer.id;
            return (
              <button
                key={layer.id}
                type="button"
                onClick={() => {
                  setActiveOverlay(layer.id);
                  if (layer.id === 'Indeks Panas WBGT') {
                    setShowHeatmap(true);
                    setHeatmapMode('WBGT_RISK');
                  } else if (layer.id === 'Estimasi CPUE') {
                    setShowHeatmap(true);
                    setHeatmapMode('CPUE_DENSITY');
                  } else if (layer.id === 'Zonasi KKP') {
                    setShowHeatmap(true);
                    setHeatmapMode('COMBINED_SAFE_SPOT');
                  }
                }}
                className={`flex items-center justify-end gap-2.5 pl-3.5 pr-2 py-1.5 rounded-full text-xs font-semibold transition-all shadow-md cursor-pointer whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-[#06B6D4] text-slate-950 font-bold'
                    : 'bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 backdrop-blur-md'
                }`}
              >
                <span>{layer.label}</span>
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    isActive
                      ? 'bg-slate-950 text-[#06B6D4]'
                      : 'bg-slate-800 text-cyan-400'
                  }`}
                >
                  {layer.icon}
                </span>
              </button>
            );
          })}
        </div>

        {/* Bottom-Left Floating Legend Box (Desktop md:block) */}
        <div className="hidden md:block absolute bottom-4 left-4 z-[500] bg-slate-900/92 backdrop-blur-md border border-slate-700/80 rounded-xl p-3.5 text-[11px] text-slate-200 shadow-lg max-w-xs space-y-2.5">
          <div>
            <p className="font-bold text-xs text-white mb-1.5">
              Klasifikasi Tinggi Gelombang (BMKG)
            </p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#06B6D4] inline-block" />
                Tenang (0.1–0.5m)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#10B981] inline-block" />
                Rendah (0.5–1.25m)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#F59E0B] inline-block" />
                Sedang (1.25–2.5m)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#EF4444] inline-block" />
                Tinggi (&gt;2.5m)
              </span>
            </div>
          </div>

          <div className="border-t border-slate-700/80 pt-2">
            <p className="font-bold text-xs text-white mb-1">
              Radius Zonasi Konservasi KKP
            </p>
            <div className="space-y-1 text-[10px] font-mono">
              <div className="text-[#EF4444]">
                ▪ &lt; 2.0 km : Zona Inti Larang Tangkap (Skor AI = 0)
              </div>
              <div className="text-[#F59E0B]">
                ▪ 2.0–5.0 km : Zona Penyangga Konservasi
              </div>
              <div className="text-[#10B981]">
                ▪ ≥ 5.0 km : Zona Pemanfaatan Berkelanjutan
              </div>
            </div>
          </div>
        </div>

        {/* Bottom-Center Timeline Bar */}
        <div className="absolute bottom-3 sm:bottom-4 inset-x-3 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-[500] bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 flex items-center justify-between sm:justify-center gap-2 sm:gap-3 shadow-xl text-[11px] sm:text-xs text-slate-100">
          <button
            type="button"
            onClick={() => setIsPlaying((p) => !p)}
            aria-label={
              isPlaying ? 'Jeda Animasi Cuaca' : 'Putar Animasi Prakiraan Cuaca'
            }
            className="w-7 h-7 rounded-full bg-[#06B6D4] text-slate-950 flex items-center justify-center hover:bg-cyan-300 transition-colors cursor-pointer shrink-0"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
          </button>

          <div className="px-1 sm:px-2 text-center truncate">
            <span className="font-semibold text-white">
              {currentSlot.dateLabel} • {currentSlot.timeWib}
            </span>
            <span className="text-[10px] sm:text-[11px] text-[#06B6D4] font-mono ml-1.5">
              ({currentSlot.relativeLabel})
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              const next = (timelineIndex + 1) % hourlyForecasts.length;
              setTimelineIndex(next);
              onSelectHourlyWeather(hourlyForecasts[next]);
            }}
            aria-label="Langkah Jam Berikutnya"
            className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Compact Legend Box Below Map on Mobile (md:hidden) */}
      <div className="md:hidden rounded-2xl bg-slate-900 border border-slate-800 p-3.5 text-[11px] text-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <p className="font-bold text-xs text-white mb-1.5">
            Klasifikasi Gelombang BMKG
          </p>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#06B6D4] inline-block" />
              Tenang (0.1–0.5m)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#10B981] inline-block" />
              Rendah (0.5–1.25m)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#F59E0B] inline-block" />
              Sedang (1.25–2.5m)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#EF4444] inline-block" />
              Tinggi (&gt;2.5m)
            </span>
          </div>
        </div>
        <div className="border-t sm:border-t-0 sm:border-l border-slate-800 pt-2.5 sm:pt-0 sm:pl-3 font-mono text-[10px] space-y-1">
          <p className="font-sans font-bold text-xs text-white mb-1">
            Radius Konservasi KKP
          </p>
          <div className="text-[#EF4444]">
            ▪ &lt; 2.0 km : Zona Inti Larang Tangkap (AI = 0)
          </div>
          <div className="text-[#F59E0B]">
            ▪ 2.0–5.0 km : Zona Penyangga Konservasi
          </div>
          <div className="text-[#10B981]">
            ▪ ≥ 5.0 km : Zona Pemanfaatan Lestari
          </div>
        </div>
      </div>

      {/* 2. Horizontal Scrollable Hourly Maritime Forecast Carousel (Below the Map) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Left Fixed Summary Card */}
        <div className="lg:col-span-3 rounded-2xl bg-slate-900 text-[#F8FAFC] border border-slate-700 p-5 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-[#06B6D4] shrink-0">
                <Anchor className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold leading-snug text-white">
                  {regionInfo.fullName}
                </h3>
                <p className="text-[11px] text-[#94A3B8]">
                  Prakiraan Cuaca &amp; Keselamatan Pelayaran
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Klik salah satu kartu jam prakiraan untuk memuat parameter angin,
              gelombang, dan suhu ke dalam kalkulator AI secara langsung.
            </p>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-800 text-xs space-y-1 font-mono">
            <span className="text-[10px] text-[#94A3B8] font-sans block">
              Periode Prakiraan &amp; Observasi BMKG
            </span>
            <p className="text-cyan-300 font-semibold">
              {currentSlot.fullDateLabel}
            </p>
            <p className="text-[11px] text-slate-400">
              {currentSlot.season} • {regionInfo.wppCode}
            </p>
          </div>
        </div>

        {/* 4 Scrollable Hourly Forecast Cards (15.00 WIB, 18.00 WIB, 21.00 WIB, 00.00 WIB) */}
        <div className="lg:col-span-9 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {hourlyForecasts.map((slot, idx) => {
            const isSelected = idx === timelineIndex;
            const topBarClass =
              slot.safetyColor === 'cyan'
                ? 'border-t-4 border-t-[#06B6D4]'
                : slot.safetyColor === 'emerald'
                  ? 'border-t-4 border-t-[#10B981]'
                  : slot.safetyColor === 'amber'
                    ? 'border-t-4 border-t-[#F59E0B]'
                    : 'border-t-4 border-t-[#EF4444]';

            return (
              <button
                key={slot.timeWib}
                type="button"
                onClick={() => {
                  setTimelineIndex(idx);
                  onSelectHourlyWeather(slot);
                }}
                className={`text-left rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700/80 ${topBarClass} p-4 flex flex-col justify-between gap-4 transition-all cursor-pointer hover:border-[#06B6D4] ${
                  isSelected ? 'ring-2 ring-[#06B6D4]' : ''
                }`}
              >
                {/* Header & Weather Condition */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-3">
                    <span className="font-mono font-bold text-slate-900 dark:text-[#F8FAFC]">
                      {slot.dateLabel} • {slot.timeWib}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500 dark:text-[#94A3B8]">
                      {slot.relativeLabel}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 py-2 px-3 rounded-xl bg-slate-50 dark:bg-[#0F172A]/60">
                    {slot.condition === 'Cerah Berawan' ? (
                      <CloudSun className="w-6 h-6 text-[#06B6D4] shrink-0" />
                    ) : slot.condition === 'Hujan Ringan' ? (
                      <CloudRain className="w-6 h-6 text-[#3B82F6] shrink-0" />
                    ) : (
                      <Cloud className="w-6 h-6 text-slate-400 shrink-0" />
                    )}
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-[#F8FAFC] block">
                        {slot.condition}
                      </span>
                      <span className="text-[11px] font-mono text-[#06B6D4]">
                        WBGT {slot.wbgtC} °C
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2-Column Grid inside each card */}
                <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                  <div>
                    <span className="text-[11px] text-slate-500 dark:text-[#94A3B8] block">
                      Angin
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block mt-0.5">
                      {slot.windDirection}
                    </span>
                    <span className="font-mono font-bold text-slate-900 dark:text-[#F8FAFC]">
                      {slot.windKnot} Knot
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-500 dark:text-[#94A3B8] block">
                      Gelombang
                    </span>
                    <span
                      className={`font-bold block mt-0.5 ${
                        slot.waveCategory === 'Tenang'
                          ? 'text-[#06B6D4]'
                          : slot.waveCategory === 'Rendah'
                            ? 'text-[#10B981]'
                            : slot.waveCategory === 'Sedang'
                              ? 'text-[#F59E0B]'
                              : 'text-[#EF4444]'
                      }`}
                    >
                      {slot.waveCategory}
                    </span>
                    <span className="font-mono font-bold text-slate-900 dark:text-[#F8FAFC]">
                      {slot.waveM} m
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-500 dark:text-[#94A3B8] block">
                      Arus &amp; Pasang
                    </span>
                    <span className="font-mono text-slate-800 dark:text-slate-200 block mt-0.5">
                      {slot.currentKnot} kt ({slot.currentDirection})
                    </span>
                    <span className="font-mono text-[11px] text-slate-500 dark:text-[#94A3B8]">
                      Pasang: {slot.tideM} m
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-500 dark:text-[#94A3B8] block">
                      Hujan &amp; Termal
                    </span>
                    <span className="font-mono text-slate-800 dark:text-slate-200 block mt-0.5">
                      {slot.rainfallMm} mm • {slot.tempC}°C
                    </span>
                    <span className="font-mono font-bold text-[#F59E0B] text-[11px]">
                      WBGT {slot.wbgtC}°C • Vis {slot.visibilityKm}km
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
