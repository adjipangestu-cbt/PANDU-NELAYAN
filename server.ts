import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import {
  runPanduNelayanSimulation,
  generatePippReferenceDataset,
  CSV_WILAYAH_TO_REGION_KEY,
  CSV_SPESIES_TO_SPECIES_KEY,
  CSV_MUSIM_TO_SEASON_TYPE,
  TARGET_SPECIES,
  STUDY_REGIONS,
  YEARLY_MULTIPLIERS,
} from './src/utils/maritimeFormulas.ts';
import type {
  SimulationInput,
  PippReferenceRow,
  RegionKey,
  SpeciesKey,
  SimulationYear,
  SeasonType,
} from './src/utils/maritimeFormulas.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://127.0.0.1:8000';

/**
 * Try to proxy a request to the Python FastAPI backend.
 * Returns the JSON response if successful, or null if the backend is offline.
 */
async function proxyToFastAPI(
  method: 'GET' | 'POST',
  apiPath: string,
  body?: unknown,
  queryString?: string
): Promise<unknown | null> {
  try {
    const url = `${PYTHON_API_URL}${apiPath}${queryString ? '?' + queryString : ''}`;
    const opts: RequestInit = {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(5000),
    };
    const resp = await fetch(url, opts);
    if (resp.ok) {
      return await resp.json();
    }
    return null;
  } catch {
    // Python backend is offline — fall back to local
    return null;
  }
}

/**
 * Parse the real CSV file into PippReferenceRow[] for the /api/trips fallback.
 */
function parseCSVToPippRows(csvPath: string): PippReferenceRow[] {
  try {
    const raw = fs.readFileSync(csvPath, 'utf-8');
    const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) return [];

    // Parse header
    const headers = lines[0]!.split(',').map((h) => h.trim());
    const colIdx = (name: string) => headers.indexOf(name);

    const rows: PippReferenceRow[] = [];
    const decisionMap: Record<string, PippReferenceRow['decisionBadge']> = {
      'Layak Melaut (Hijau)': 'LAYAK MELAUT',
      'Pertimbangkan Ulang (Kuning)': 'WASPADA & NEGO HARGA',
      'Tidak Layak / Bahaya (Merah)': 'TUNDA MELAUT',
    };

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i]!.split(',');
      if (cols.length < 10) continue;

      const csvWilayah = cols[colIdx('wilayah_dpi')]?.trim() ?? '';
      const csvSpecies = cols[colIdx('spesies_target')]?.trim() ?? '';
      const csvSeason = cols[colIdx('musim_tangkap')]?.trim() ?? '';
      const labelKeputusan = Number(cols[colIdx('label_keputusan')]) || 0;

      const regionKey = (CSV_WILAYAH_TO_REGION_KEY[csvWilayah] ?? csvWilayah) as RegionKey;
      const speciesKey = (CSV_SPESIES_TO_SPECIES_KEY[csvSpecies] ?? csvSpecies) as SpeciesKey;
      const seasonMapped = (CSV_MUSIM_TO_SEASON_TYPE[csvSeason] ?? csvSeason) as SeasonType;
      const badge: PippReferenceRow['decisionBadge'] =
        labelKeputusan === 2 ? 'LAYAK MELAUT' :
        labelKeputusan === 0 ? 'TUNDA MELAUT' : 'WASPADA & NEGO HARGA';

      // Extract Latin name
      let latinName = '';
      const parenMatch = /\(([^)]+)\)/.exec(csvSpecies);
      if (parenMatch) {
        latinName = parenMatch[1] ?? '';
      } else if (TARGET_SPECIES[speciesKey]) {
        latinName = TARGET_SPECIES[speciesKey]?.latinName ?? '';
      }

      // Derive columns not directly in CSV
      const lmCm = TARGET_SPECIES[speciesKey]?.lm_cm ?? 19.5;
      const rasioLm = Number(cols[colIdx('rasio_ukuran_lm')]) || 0;
      const caughtLengthCm = rasioLm > 0 ? Math.round(rasioLm * lmCm * 10) / 10 : 0;
      const yr = (Number(cols[colIdx('tahun')]) || 2026) as SimulationYear;
      const durasi = Number(cols[colIdx('durasi_melaut_jam')]) || 0;
      const upahAlt = YEARLY_MULTIPLIERS[yr]?.upah_alt ?? 15000;
      const implicitCost = Math.round(durasi * upahAlt);
      const explicitCost = Number(cols[colIdx('total_modal_operasional_rp')]) || 0;
      const hargaJual = Number(cols[colIdx('harga_jual_aktual_rp')]) || 0;
      const potongan = Number(cols[colIdx('potongan_tengkulak_persen')]) || 0;
      const tengkulakPrice = potongan > 5 ? Math.round(hargaJual * (1 - potongan / 100)) : Math.round(hargaJual);
      const marginBersih = Number(cols[colIdx('margin_bersih_rp')]) || 0;

      rows.push({
        id: `TRIP-${yr}-${String(i).padStart(4, '0')}`,
        region: regionKey,
        year: yr,
        season: seasonMapped,
        species: speciesKey,
        latinName,
        lmCm,
        caughtLengthCm,
        lmRatio: rasioLm,
        cpueKg: Number(cols[colIdx('cpue_estimasi_kg')]) || 0,
        fuelLiters: Number(cols[colIdx('konsumsi_bbm_liter')]) || 0,
        explicitCostRp: explicitCost,
        implicitCostRp: implicitCost,
        tpiPriceRp: Math.round(hargaJual),
        tengkulakPriceRp: tengkulakPrice,
        fairEffortPriceRp: Number(cols[colIdx('harga_layak_effort_rp')]) || 0,
        accountingProfitRp: marginBersih,
        economicProfitRp: Math.round(marginBersih - implicitCost),
        wbgtC: Number(cols[colIdx('wbgt_index_c')]) || 0,
        kkpDistanceKm: Number(cols[colIdx('jarak_kkp_km')]) || 0,
        aiScore: Number(cols[colIdx('skor_kelayakan')]) || 0,
        decisionBadge: badge,
      });
    }
    return rows;
  } catch {
    return [];
  }
}

/**
 * Find the CSV file for local fallback.
 */
function findCSVPath(): string | null {
  const candidates = [
    path.resolve(__dirname, 'data', 'dataset_kelayakan_melaut.csv'),
    path.resolve(__dirname, 'dataset_kelayakan_melaut.csv'),
    path.resolve(__dirname, 'public', 'assets', 'aistudio', 'dataset_kelayakan_melaut_53a4c9bd.csv'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

// Cache parsed CSV rows for performance
let _cachedCsvRows: PippReferenceRow[] | null = null;
function getCsvRows(): PippReferenceRow[] {
  if (_cachedCsvRows) return _cachedCsvRows;
  const csvPath = findCSVPath();
  if (csvPath) {
    _cachedCsvRows = parseCSVToPippRows(csvPath);
    console.log(`  📄 CSV fallback loaded: ${_cachedCsvRows.length} rows from ${csvPath}`);
  } else {
    _cachedCsvRows = generatePippReferenceDataset();
    console.log(`  📄 CSV not found — using generated dataset (${_cachedCsvRows.length} rows)`);
  }
  return _cachedCsvRows;
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // ==========================================================================
  // API ENDPOINT 1: GET /api/health
  // ==========================================================================
  app.get('/api/health', async (_req, res) => {
    const pyResult = await proxyToFastAPI('GET', '/api/health');
    if (pyResult) {
      return res.json(pyResult);
    }
    // Local fallback
    const csvRows = getCsvRows();
    return res.json({
      ok: true,
      engine: 'TypeScript Algorithmic Engine (Local Fallback)',
      total_rows: csvRows.length,
      accuracy: 0,
      r2_price: 0,
      mae_price: 0,
    });
  });

  // ==========================================================================
  // API ENDPOINT 2: POST /api/predict
  // ==========================================================================
  app.post('/api/predict', async (req, res) => {
    const input = req.body as SimulationInput;

    // Try Python FastAPI first
    const pyResult = await proxyToFastAPI('POST', '/api/predict', input);
    if (pyResult && typeof pyResult === 'object' && (pyResult as Record<string, unknown>).ok) {
      return res.json(pyResult);
    }

    // Fallback to local TypeScript engine
    try {
      const result = runPanduNelayanSimulation(input);
      return res.json({
        ok: true,
        data: {
          ...result,
          aiEngineSource: 'TypeScript Algorithmic Engine (Local Fallback)',
          classProbabilities: [],
        },
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Gagal menjalankan simulasi PANDU-NELAYAN.';
      return res.status(400).json({ ok: false, error: msg });
    }
  });

  // ==========================================================================
  // API ENDPOINT 3: GET /api/trips
  // ==========================================================================
  app.get('/api/trips', async (req, res) => {
    const qs = new URLSearchParams(req.query as Record<string, string>).toString();
    const pyResult = await proxyToFastAPI('GET', '/api/trips', undefined, qs);
    if (pyResult && typeof pyResult === 'object' && (pyResult as Record<string, unknown>).ok) {
      return res.json(pyResult);
    }

    // Fallback: parse CSV or use generated data
    let allRows = getCsvRows();
    const { region, year, season, species, search, limit: limitStr, offset: offsetStr } = req.query;
    const limitNum = Math.min(6000, Math.max(1, Number(limitStr) || 250));
    const offsetNum = Math.max(0, Number(offsetStr) || 0);

    if (region && typeof region === 'string') {
      allRows = allRows.filter((r) => r.region === region);
    }
    if (year && typeof year === 'string') {
      allRows = allRows.filter((r) => String(r.year) === year);
    }
    if (season && typeof season === 'string') {
      allRows = allRows.filter((r) => r.season === season);
    }
    if (species && typeof species === 'string') {
      allRows = allRows.filter((r) => r.species === species);
    }
    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      allRows = allRows.filter(
        (r) =>
          r.region.toLowerCase().includes(q) ||
          r.species.toLowerCase().includes(q) ||
          r.latinName.toLowerCase().includes(q) ||
          r.id.toLowerCase().includes(q)
      );
    }

    const total = allRows.length;
    const page = allRows.slice(offsetNum, offsetNum + limitNum);
    return res.json({ ok: true, rows: page, total, limit: limitNum, offset: offsetNum });
  });

  // ==========================================================================
  // API ENDPOINT 4: GET /api/analytics/summary
  // ==========================================================================
  app.get('/api/analytics/summary', async (_req, res) => {
    const pyResult = await proxyToFastAPI('GET', '/api/analytics/summary');
    if (pyResult && typeof pyResult === 'object' && (pyResult as Record<string, unknown>).ok) {
      return res.json(pyResult);
    }

    // Fallback: compute from local data
    const allRows = getCsvRows();
    const years = [2023, 2024, 2025, 2026] as const;
    const yearlyTrends = years.map((yr) => {
      const yRows = allRows.filter((r) => r.year === yr);
      const count = yRows.length || 1;
      return {
        year: yr,
        avgCpueKg: Number((yRows.reduce((s, r) => s + r.cpueKg, 0) / count).toFixed(2)),
        avgDistanceKm: Number((YEARLY_MULTIPLIERS[yr].faktor_jarak * 18.0).toFixed(2)),
        avgFairPriceRp: Math.round(yRows.reduce((s, r) => s + r.fairEffortPriceRp, 0) / count),
        avgWbgtC: Number((yRows.reduce((s, r) => s + r.wbgtC, 0) / count).toFixed(2)),
        avgTotalModalRp: Math.round(yRows.reduce((s, r) => s + r.explicitCostRp, 0) / count),
        tripCount: yRows.length,
      };
    });

    const regions = Object.keys(STUDY_REGIONS) as RegionKey[];
    const regionalCosts = regions.map((rk) => {
      const rRows = allRows.filter((r) => r.region === rk);
      const count = rRows.length || 1;
      return {
        region: rk,
        fullName: STUDY_REGIONS[rk].fullName,
        avgExplicitCostRp: Math.round(rRows.reduce((s, r) => s + r.explicitCostRp, 0) / count),
        avgImplicitCostRp: Math.round(rRows.reduce((s, r) => s + r.implicitCostRp, 0) / count),
        avgCpueKg: Number((rRows.reduce((s, r) => s + r.cpueKg, 0) / count).toFixed(2)),
        avgFairPriceRp: Math.round(rRows.reduce((s, r) => s + r.fairEffortPriceRp, 0) / count),
      };
    });

    return res.json({
      ok: true,
      yearlyTrends,
      regionalCosts,
      seasonalMatrix: [],
      featureImportances: {},
    });
  });

  // ==========================================================================
  // Vite Dev Server / Production Static Serving
  // ==========================================================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n  🚀 PANDU-NELAYAN Hybrid Gateway on http://localhost:${PORT}`);
    console.log(`  🐍 Python FastAPI proxy target: ${PYTHON_API_URL}`);
    console.log(`  📡 If FastAPI is offline, all endpoints fall back to local TS engine.\n`);
  });
}

startServer();
