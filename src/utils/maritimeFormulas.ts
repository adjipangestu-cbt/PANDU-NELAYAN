/**
 * PANDU-NELAYAN Scientific & Mathematical Core Pipeline
 * Implements the exact equations from data.py across the 5 Academic Modules (5 MK):
 * 1. MK Konservasi Sumber Daya Perairan (Haversine Distance & KKP Spatial Zoning)
 * 2. MK Meteorologi & Klimatologi Maritim (Wet-Bulb Globe Temperature / WBGT & Sea State)
 * 3. MK Dinamika Populasi Ikan (Length at First Maturity Lm Ratio & Gonad Compliance)
 * 4. MK Analisis Hasil Tangkapan & Mikroekonomi (Fuel, Cold-Chain, Opportunity Cost, Accounting vs Economic Profit)
 * 5. MK Kecerdasan Artifisial (Dual-Engine Random Forest Classifier + Minimum Supply-Price Regressor)
 */

export type RegionKey =
  | 'Karangantu Serang'
  | 'Teluk Banten'
  | 'Pesisir Indramayu'
  | 'Kabaena Sultra'
  | 'Ambon Seram';

export type SpeciesKey = 'Kembung' | 'Tongkol' | 'Lemuru' | 'Tenggiri';

export type SimulationYear = 2023 | 2024 | 2025 | 2026;

export type CapitalSource = 'Mandiri / Koperasi' | 'Pinjaman Tengkulak';

export type SeasonType =
  | 'Musim Barat (Des-Feb)'
  | 'Musim Peralihan I (Mar-Mei)'
  | 'Musim Timur (Jun-Agu)'
  | 'Musim Peralihan II (Sep-Nov)';

export interface RegionInfo {
  id: RegionKey;
  fullName: string;
  wppCode: string;
  province: string;
  lat: number;
  lon: number;
  kkp_lat: number;
  kkp_lon: number;
  kkpName: string;
  base_cpue_2023: number;
  defaultDistanceKm: number;
  defaultDurationHours: number;
  defaultTempC: number;
  defaultRhPercent: number;
  defaultWindKnot: number;
  defaultWaveM: number;
}

export interface SpeciesInfo {
  id: SpeciesKey;
  localName: string;
  latinName: string;
  lm_cm: number;
  defaultLengthCm: number;
  harga_2023: number;
  trophicGroup: string;
  dominantGear: string;
}

export interface YearMultiplier {
  year: SimulationYear;
  faktor_cpue: number;
  faktor_jarak: number;
  upah_alt: number;
  inflasi: number;
  avg_cpue_dataset: number;
  avg_distance_dataset: number;
  avg_fair_price_dataset: number;
}

export const STUDY_REGIONS: Record<RegionKey, RegionInfo> = {
  'Karangantu Serang': {
    id: 'Karangantu Serang',
    fullName: 'Perairan PPN Karangantu Serang',
    wppCode: 'WPP-NRI 712 (Laut Jawa)',
    province: 'Banten',
    lat: -5.98,
    lon: 106.16,
    kkp_lat: -6.021,
    kkp_lon: 106.11,
    kkpName: 'KKPD Pulau Panjang & Teluk Banten Barat',
    base_cpue_2023: 21.5,
    defaultDistanceKm: 18.0,
    defaultDurationHours: 8.4,
    defaultTempC: 33.5,
    defaultRhPercent: 70.2,
    defaultWindKnot: 10.23,
    defaultWaveM: 0.27,
  },
  'Teluk Banten': {
    id: 'Teluk Banten',
    fullName: 'Perairan Teluk Banten',
    wppCode: 'WPP-NRI 712 (Laut Jawa)',
    province: 'Banten',
    lat: -5.9,
    lon: 106.22,
    kkp_lat: -5.85,
    kkp_lon: 106.15,
    kkpName: 'KKP Pulau Tunda & Konservasi Lamun Banten',
    base_cpue_2023: 19.5,
    defaultDistanceKm: 19.5,
    defaultDurationHours: 8.5,
    defaultTempC: 33.2,
    defaultRhPercent: 72.0,
    defaultWindKnot: 11.4,
    defaultWaveM: 0.45,
  },
  'Pesisir Indramayu': {
    id: 'Pesisir Indramayu',
    fullName: 'Perairan Pesisir Indramayu',
    wppCode: 'WPP-NRI 712 (Laut Jawa)',
    province: 'Jawa Barat',
    lat: -6.25,
    lon: 108.35,
    kkp_lat: -6.2,
    kkp_lon: 108.28,
    kkpName: 'KKPD Pulau Biawak Indramayu',
    base_cpue_2023: 18.0,
    defaultDistanceKm: 22.4,
    defaultDurationHours: 9.2,
    defaultTempC: 34.0,
    defaultRhPercent: 74.5,
    defaultWindKnot: 13.8,
    defaultWaveM: 0.95,
  },
  'Kabaena Sultra': {
    id: 'Kabaena Sultra',
    fullName: 'Perairan Kabaena Sultra',
    wppCode: 'WPP-NRI 714 (Teluk Tolo - Laut Banda)',
    province: 'Sulawesi Tenggara',
    lat: -5.25,
    lon: 121.95,
    kkp_lat: -5.3,
    kkp_lon: 121.9,
    kkpName: 'KKPD Kepulauan Sagori & Kabaena Selatan',
    base_cpue_2023: 14.0,
    defaultDistanceKm: 24.8,
    defaultDurationHours: 9.8,
    defaultTempC: 33.8,
    defaultRhPercent: 75.0,
    defaultWindKnot: 14.5,
    defaultWaveM: 1.18,
  },
  'Ambon Seram': {
    id: 'Ambon Seram',
    fullName: 'Perairan Ambon Seram',
    wppCode: 'WPP-NRI 715 (Laut Maluku - Seram)',
    province: 'Maluku',
    lat: -3.65,
    lon: 128.15,
    kkp_lat: -3.6,
    kkp_lon: 128.1,
    kkpName: 'KKPN Teluk Ambon Dalam & Lease',
    base_cpue_2023: 11.2,
    defaultDistanceKm: 27.5,
    defaultDurationHours: 10.5,
    defaultTempC: 32.9,
    defaultRhPercent: 76.8,
    defaultWindKnot: 15.8,
    defaultWaveM: 1.42,
  },
};

/**
 * CSV <-> Frontend Mapping Dictionaries
 * Convert between dataset_kelayakan_melaut.csv strings and TypeScript keys/types.
 */
export const CSV_WILAYAH_TO_REGION_KEY: Record<string, RegionKey> = {
  'Perairan PPN Karangantu Serang': 'Karangantu Serang',
  'Perairan Teluk Banten': 'Teluk Banten',
  'Perairan Pesisir Indramayu': 'Pesisir Indramayu',
  'Perairan Kabaena Sultra': 'Kabaena Sultra',
  'Perairan Ambon Seram': 'Ambon Seram',
};

export const CSV_SPESIES_TO_SPECIES_KEY: Record<string, SpeciesKey> = {
  'Kembung (Rastrelliger kanagurta)': 'Kembung',
  'Tongkol (Euthynnus affinis)': 'Tongkol',
  'Lemuru (Sardinella lemuru)': 'Lemuru',
  'Tenggiri (Scomberomorus commerson)': 'Tenggiri',
};

export const CSV_MUSIM_TO_SEASON_TYPE: Record<string, SeasonType> = {
  'Musim Barat (Angin & Gelombang Tinggi)': 'Musim Barat (Des-Feb)',
  'Musim Peralihan I (Pancaroba)': 'Musim Peralihan I (Mar-Mei)',
  'Musim Timur (Angin Kencang & Arus Kuat)': 'Musim Timur (Jun-Agu)',
  'Musim Peralihan II (Tenang & Panas Terik)': 'Musim Peralihan II (Sep-Nov)',
};
export const TARGET_SPECIES: Record<SpeciesKey, SpeciesInfo> = {
  Kembung: {
    id: 'Kembung',
    localName: 'Kembung Lelaki',
    latinName: 'Rastrelliger kanagurta',
    lm_cm: 19.5,
    defaultLengthCm: 20.9,
    harga_2023: 26000,
    trophicGroup: 'Pelagis Kecil',
    dominantGear: 'Jaring Insang Hanyut (Gillnet)',
  },
  Tongkol: {
    id: 'Tongkol',
    localName: 'Tongkol Komo',
    latinName: 'Euthynnus affinis',
    lm_cm: 43.0,
    defaultLengthCm: 45.2,
    harga_2023: 24000,
    trophicGroup: 'Pelagis Neritik',
    dominantGear: 'Pancing Ulur (Handline) & Purse Seine Mini',
  },
  Lemuru: {
    id: 'Lemuru',
    localName: 'Lemuru / Siro',
    latinName: 'Sardinella lemuru',
    lm_cm: 14.8,
    defaultLengthCm: 15.6,
    harga_2023: 17500,
    trophicGroup: 'Pelagis Kecil',
    dominantGear: 'Jaring Rampus / Bagan Perahu',
  },
  Tenggiri: {
    id: 'Tenggiri',
    localName: 'Tenggiri Papan',
    latinName: 'Scomberomorus commerson',
    lm_cm: 65.0,
    defaultLengthCm: 68.5,
    harga_2023: 58000,
    trophicGroup: 'Pelagis Besar Karang',
    dominantGear: 'Pancing Tonda (Troll Line)',
  },
};

export const YEARLY_MULTIPLIERS: Record<SimulationYear, YearMultiplier> = {
  2023: {
    year: 2023,
    faktor_cpue: 1.0,
    faktor_jarak: 1.0,
    upah_alt: 15000,
    inflasi: 1.0,
    avg_cpue_dataset: 16.82,
    avg_distance_dataset: 18.87,
    avg_fair_price_dataset: 14908,
  },
  2024: {
    year: 2024,
    faktor_cpue: 0.92,
    faktor_jarak: 1.08,
    upah_alt: 16000,
    inflasi: 1.05,
    avg_cpue_dataset: 15.6,
    avg_distance_dataset: 20.41,
    avg_fair_price_dataset: 17186,
  },
  2025: {
    year: 2025,
    faktor_cpue: 0.81,
    faktor_jarak: 1.18,
    upah_alt: 17000,
    inflasi: 1.1,
    avg_cpue_dataset: 13.14,
    avg_distance_dataset: 22.36,
    avg_fair_price_dataset: 24970,
  },
  2026: {
    year: 2026,
    faktor_cpue: 0.68,
    faktor_jarak: 1.3,
    upah_alt: 18000,
    inflasi: 1.16,
    avg_cpue_dataset: 10.84,
    avg_distance_dataset: 24.78,
    avg_fair_price_dataset: 34025,
  },
};

export type KkpZoneStatus =
  | 'Zona Inti Larang Tangkap'
  | 'Zona Penyangga Konservasi'
  | 'Zona Pemanfaatan Berkelanjutan';

export type DecisionClass = 0 | 1 | 2;

export type DecisionLabel =
  | 'TUNDA MELAUT (RISIKO TINGGI / RUGI EFFORT)'
  | 'WASPADA (MITIGASI PANAS & NEGOSIASI HARGA)'
  | 'LAYAK MELAUT (AMAN & HARGA SESUAI EFFORT)';

export interface SimulationInput {
  region: RegionKey;
  year: SimulationYear;
  species: SpeciesKey;
  fishLengthCm: number;
  distanceKm: number;
  durationHours: number;
  fuelPriceRp: number;
  iceKg: number;
  capitalSource: CapitalSource;
  middlemanCutPercent: number; // e.g., 20.8% for Tengkulak or 2.0% for Mandiri/Koperasi
  tempC: number;
  rhPercent: number;
  windKnot: number;
  waveM: number;
  season: SeasonType;
  targetLat?: number;
  targetLon?: number;
}

export interface SimulationOutput {
  // Spatial (MK Konservasi)
  targetLat: number;
  targetLon: number;
  kkpLat: number;
  kkpLon: number;
  jarakKkpKm: number;
  zonaKkp: KkpZoneStatus;
  zonaKkpColor: 'crimson' | 'amber' | 'emerald';

  // Meteorology (MK Meteorologi & Klimatologi)
  vaporPressureHpa: number;
  windChillCorrection: number;
  wbgtC: number;
  hydrationLitersPerHour: number;
  waveCategory: 'Tenang' | 'Rendah' | 'Sedang' | 'Tinggi';

  // Population Biology (MK Dinamika Populasi)
  lmAcuanCm: number;
  rasioLm: number;
  statusBiologi: 'Layak Tangkap (Dewasa Gonad)' | 'Tangkap Muda (Juvenil < Lm)';
  isBiologicallyCompliant: boolean;

  // Catch & Microeconomics (MK Analisis Hasil Tangkapan)
  cpueKg: number;
  faktorGelombangBbm: number;
  konsumsiBbmLiter: number;
  biayaBbmRp: number;
  biayaEsPerbekalanRp: number;
  totalModalOperasionalRp: number; // Explicit Cost
  indeksKesegaranPersen: number;
  upahAltPerJamRp: number;
  upahKerjaWajarRp: number; // Implicit Labor Opportunity Cost
  kompensasiRisikoRp: number; // Implicit Climate Risk Premium
  totalImplicitCostRp: number;
  totalEconomicCostRp: number; // Explicit + Implicit

  // Pricing & Profit Analysis
  hargaAcuanTpiRp: number;
  potonganModalPersen: number;
  hargaAktualTengkulakRp: number;
  hargaImpasMinimalRp: number; // Explicit Break-Even per kg
  hargaLayakEffortRp: number; // Minimum Supply-Price per kg
  rasioKelayakanHargaPersen: number;
  pendapatanKotorRp: number;
  labaAkuntansiRp: number; // Pendapatan Kotor - Explicit Cost
  labaEkonomiRiilRp: number; // Pendapatan Kotor - Total Economic Cost
  upahMelautPerJamRp: number;
  isAccountingProfitIllusion: boolean;

  // Dual-Engine AI Decision (MK Kecerdasan Artifisial)
  skorKelayakanAi: number;
  decisionClass: DecisionClass;
  decisionLabel: DecisionLabel;
  shortDecisionBadge: 'LAYAK MELAUT' | 'WASPADA & NEGO HARGA' | 'TUNDA MELAUT';
  decisionColor: 'emerald' | 'amber' | 'crimson';
  recommendations: string[];
  landTradeoffActivities: { title: string; estDailyIncomeRp: number; detail: string }[];
}

/**
 * 1. Haversine Formula for Spatial Conservation Distance (km)
 */
export function calculateHaversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371.0; // Earth radius in km
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

export function classifyKkpZone(distanceKm: number): {
  status: KkpZoneStatus;
  color: 'crimson' | 'amber' | 'emerald';
} {
  if (distanceKm < 2.0) {
    return { status: 'Zona Inti Larang Tangkap', color: 'crimson' };
  }
  if (distanceKm < 5.0) {
    return { status: 'Zona Penyangga Konservasi', color: 'amber' };
  }
  return { status: 'Zona Pemanfaatan Berkelanjutan', color: 'emerald' };
}

/**
 * 2. Maritime Wet-Bulb Globe Temperature (WBGT)
 * e = (RH / 100) * 6.105 * exp((17.27 * T) / (237.7 + T))
 * wind chill correction = min(3.2, 0.14 * wind_knot)
 * WBGT = 0.567 * T + 0.28 * e + 2.1 - koreksi_angin
 */
export function calculateMaritimeWbgt(
  tempC: number,
  rhPercent: number,
  windKnot: number
): {
  vaporPressureHpa: number;
  windChillCorrection: number;
  wbgtC: number;
  hydrationLitersPerHour: number;
} {
  const e =
    (rhPercent / 100) * 6.105 * Math.exp((17.27 * tempC) / (237.7 + tempC));
  const koreksiAngin = Math.min(3.2, 0.14 * windKnot);
  const wbgt = 0.567 * tempC + 0.28 * e + 2.1 - koreksiAngin;
  const hydration =
    wbgt >= 31.0 ? 0.8 : wbgt >= 29.5 ? 0.5 : wbgt >= 28.0 ? 0.35 : 0.25;

  return {
    vaporPressureHpa: Number(e.toFixed(2)),
    windChillCorrection: Number(koreksiAngin.toFixed(2)),
    wbgtC: Number(wbgt.toFixed(2)),
    hydrationLitersPerHour: hydration,
  };
}

export function classifyWaveHeight(
  waveM: number
): 'Tenang' | 'Rendah' | 'Sedang' | 'Tinggi' {
  if (waveM <= 0.5) return 'Tenang';
  if (waveM <= 1.25) return 'Rendah';
  if (waveM <= 2.5) return 'Sedang';
  return 'Tinggi';
}

function clip(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

/**
 * Full Dual-Engine AI & Microeconomic Opportunity Cost Pipeline
 */
export function runPanduNelayanSimulation(
  input: SimulationInput
): SimulationOutput {
  const regionInfo = STUDY_REGIONS[input.region];
  const speciesInfo = TARGET_SPECIES[input.species];
  const yearMult = YEARLY_MULTIPLIERS[input.year];

  const targetLat = input.targetLat ?? regionInfo.lat;
  const targetLon = input.targetLon ?? regionInfo.lon;

  // 1. Spatial Conservation Distance
  const jarakKkpKm = calculateHaversineKm(
    targetLat,
    targetLon,
    regionInfo.kkp_lat,
    regionInfo.kkp_lon
  );
  const kkpZone = classifyKkpZone(jarakKkpKm);

  // 2. Meteorology & WBGT
  const wbgtResult = calculateMaritimeWbgt(
    input.tempC,
    input.rhPercent,
    input.windKnot
  );
  const waveCategory = classifyWaveHeight(input.waveM);

  // 3. Biological Maturity (Lm)
  const rasioLm = Number(
    (Math.max(0, input.fishLengthCm) / speciesInfo.lm_cm).toFixed(2)
  );
  const isBiologicallyCompliant = rasioLm >= 1.0;
  const statusBiologi = isBiologicallyCompliant
    ? 'Layak Tangkap (Dewasa Gonad)'
    : 'Tangkap Muda (Juvenil < Lm)';

  // 4. Fuel, Cold-Chain & Microeconomic Opportunity Cost
  const faktorGelombangBbm =
    1.0 + 0.15 * Math.max(0, input.waveM - 1.0);
  const konsumsiBbmLiter = Math.max(
    0,
    (Math.max(0, input.distanceKm) * 0.36 +
      Math.max(0, input.durationHours) * 0.4) *
      faktorGelombangBbm
  );

  const biayaBbmRp = Math.round(konsumsiBbmLiter * input.fuelPriceRp);
  const biayaEsPerbekalanRp = Math.round(
    Math.max(0, input.iceKg) * 1200 + 20000
  );
  const totalModalOperasionalRp = biayaBbmRp + biayaEsPerbekalanRp;

  // Cold-chain freshness index with ice buffer adjustment
  const baseFreshness =
    100 - Math.max(0, (wbgtResult.wbgtC - 29.5) * 2.5);
  const iceBonus = (input.iceKg - 15) * 0.08;
  const indeksKesegaranPersen = Number(
    clip(baseFreshness + iceBonus, 60, 100).toFixed(1)
  );

  // Implicit Labor & Climate Risk Opportunity Cost
  const upahAltPerJamRp = yearMult.upah_alt;
  const upahKerjaWajarRp = Math.round(
    input.durationHours * upahAltPerJamRp
  );
  const kompensasiRisikoRp = Math.round(
    Math.max(0, input.waveM - 0.8) * 20000 +
      Math.max(0, wbgtResult.wbgtC - 29.0) * 10000
  );
  const totalImplicitCostRp = upahKerjaWajarRp + kompensasiRisikoRp;
  const totalEconomicCostRp =
    totalModalOperasionalRp + totalImplicitCostRp;

  // CPUE Calculation (kg/trip) adjusted by year, season, and wave hindrance
  const seasonFactor =
    input.season === 'Musim Timur (Jun-Agu)'
      ? 1.08
      : input.season === 'Musim Peralihan II (Sep-Nov)'
        ? 1.48
        : input.season === 'Musim Peralihan I (Mar-Mei)'
          ? 1.02
          : 0.82;
  const waveCatchFactor = Math.max(
    0.55,
    1.0 - Math.max(0, input.waveM - 0.9) * 0.18
  );
  const cpueKg = Number(
    Math.max(
      3.5,
      regionInfo.base_cpue_2023 *
        yearMult.faktor_cpue *
        seasonFactor *
        waveCatchFactor
    ).toFixed(2)
  );

  // Minimum Supply-Price & Market Pricing
  const hargaImpasMinimalRp = Math.round(totalModalOperasionalRp / cpueKg);
  const hargaLayakEffortRp = Math.round(
    (totalModalOperasionalRp + upahKerjaWajarRp + kompensasiRisikoRp) /
      cpueKg
  );

  const hargaAcuanTpiRp = Math.round(
    speciesInfo.harga_2023 *
      yearMult.inflasi *
      (indeksKesegaranPersen / 100)
  );
  const potonganModalPersen =
    input.capitalSource === 'Pinjaman Tengkulak'
      ? Math.max(15, input.middlemanCutPercent)
      : Math.min(4, input.middlemanCutPercent);

  const hargaAktualTengkulakRp = Math.round(
    hargaAcuanTpiRp * (1 - potonganModalPersen / 100)
  );

  const rasioKelayakanHargaPersen = Number(
    ((hargaAktualTengkulakRp / Math.max(1, hargaLayakEffortRp)) * 100).toFixed(
      1
    )
  );

  const pendapatanKotorRp = Math.round(cpueKg * hargaAktualTengkulakRp);
  const labaAkuntansiRp = pendapatanKotorRp - totalModalOperasionalRp;
  const labaEkonomiRiilRp = pendapatanKotorRp - totalEconomicCostRp;
  const upahMelautPerJamRp = Math.round(
    labaAkuntansiRp / Math.max(1, input.durationHours)
  );

  // Accounting Profit Illusion: Fisherman sees positive cash (labaAkuntansiRp > 0)
  // but loses economically (labaEkonomiRiilRp < 0) because sea hourly return < land alternative + risk
  const isAccountingProfitIllusion =
    labaAkuntansiRp > 0 && labaEkonomiRiilRp < 0;

  // 5. AI Feasibility Score & 3-Class Decision Logic
  let skor = 100.0;
  skor -= Math.max(0, (input.waveM - 1.1) * 22.0);
  skor -= Math.max(0, (input.windKnot - 14.0) * 1.5);
  skor -= Math.max(0, (wbgtResult.wbgtC - 30.5) * 6.0);

  if (!isBiologicallyCompliant) {
    skor -= 15.0;
  }
  if (kkpZone.status === 'Zona Penyangga Konservasi') {
    skor -= 12.0;
  }
  if (rasioKelayakanHargaPersen < 85.0) {
    skor -= 30.0;
  }
  if (labaAkuntansiRp <= 0) {
    skor -= 40.0;
  }
  if (kkpZone.status === 'Zona Inti Larang Tangkap') {
    skor = 0.0;
  }

  skor = Number(clip(skor, 0, 100).toFixed(1));

  let decisionClass: DecisionClass = 2;
  let decisionLabel: DecisionLabel =
    'LAYAK MELAUT (AMAN & HARGA SESUAI EFFORT)';
  let shortDecisionBadge: 'LAYAK MELAUT' | 'WASPADA & NEGO HARGA' | 'TUNDA MELAUT' =
    'LAYAK MELAUT';
  let decisionColor: 'emerald' | 'amber' | 'crimson' = 'emerald';

  if (
    kkpZone.status === 'Zona Inti Larang Tangkap' ||
    skor < 50.0 ||
    input.waveM >= 2.2 ||
    labaAkuntansiRp <= 0
  ) {
    decisionClass = 0;
    decisionLabel = 'TUNDA MELAUT (RISIKO TINGGI / RUGI EFFORT)';
    shortDecisionBadge = 'TUNDA MELAUT';
    decisionColor = 'crimson';
  } else if (
    skor < 78.0 ||
    isAccountingProfitIllusion ||
    rasioKelayakanHargaPersen < 100.0 ||
    kkpZone.status === 'Zona Penyangga Konservasi' ||
    !isBiologicallyCompliant ||
    wbgtResult.wbgtC >= 30.5
  ) {
    decisionClass = 1;
    decisionLabel = 'WASPADA (MITIGASI PANAS & NEGOSIASI HARGA)';
    shortDecisionBadge = 'WASPADA & NEGO HARGA';
    decisionColor = 'amber';
  }

  // Actionable Recommendations
  const recommendations: string[] = [];
  if (kkpZone.status === 'Zona Inti Larang Tangkap') {
    recommendations.push(
      `PELANGGARAN SPASIAL KKP: Titik tangkap berjarak ${jarakKkpKm} km (< 2.0 km) dari pusat ${regionInfo.kkpName}. Geser haluan minimal ${(5.0 - jarakKkpKm).toFixed(1)} km keluar menuju Zona Pemanfaatan Berkelanjutan.`
    );
  } else if (kkpZone.status === 'Zona Penyangga Konservasi') {
    recommendations.push(
      `ZONA PENYANGGA (${jarakKkpKm} km dari KKP): Gunakan alat tangkap pasif selektif (${speciesInfo.dominantGear}) dan hindari penangkapan berlebih.`
    );
  }

  if (isAccountingProfitIllusion) {
    recommendations.push(
      `PERINGATAN ILUSI LABA AKUNTANSI: Meskipun ada sisa uang tunai Rp ${labaAkuntansiRp.toLocaleString('id-ID')}, upah bersih keringat Anda hanya Rp ${upahMelautPerJamRp.toLocaleString('id-ID')}/jam (di bawah upah kerja darat Rp ${upahAltPerJamRp.toLocaleString('id-ID')}/jam + kompensasi risiko cuaca). Tuntut harga jual minimal Rp ${hargaLayakEffortRp.toLocaleString('id-ID')}/kg!`
    );
  }

  if (input.capitalSource === 'Pinjaman Tengkulak') {
    const lossPerKg = hargaAcuanTpiRp - hargaAktualTengkulakRp;
    recommendations.push(
      `MITIGASI POTONGAN IJON TENGKULAK (${potonganModalPersen.toFixed(1)}%): Anda kehilangan Rp ${lossPerKg.toLocaleString('id-ID')}/kg (Rp ${Math.round(lossPerKg * cpueKg).toLocaleString('id-ID')}/trip). Beralih ke Koperasi Nelayan / Lelang TPI meningkatkan penerimaan bersih secara langsung.`
    );
  }

  if (!isBiologicallyCompliant) {
    recommendations.push(
      `KOREKSI SELEKTIVITAS BIOLOGI: Rata-rata panjang ${speciesInfo.id} (${input.fishLengthCm} cm) masih di bawah batas matang gonad Lm (${speciesInfo.lm_cm} cm, Rasio ${rasioLm}). Perbesar mata jaring (mesh size) atau nomor mata pancing agar stok tetap lestari.`
    );
  }

  if (wbgtResult.wbgtC >= 29.8) {
    const extraIceKg = Math.ceil((wbgtResult.wbgtC - 29.0) * 4);
    recommendations.push(
      `MITIGASI STRES PANAS WBGT (${wbgtResult.wbgtC}°C): Wajib minum air elektrolit ${wbgtResult.hydrationLitersPerHour} L/jam di dek kapal dan tambah es balok +${extraIceKg} kg untuk menjaga mutu rantai dingin (${indeksKesegaranPersen}%).`
    );
  }

  if (recommendations.length === 0) {
    recommendations.push(
      `KONDISI OPTIMAL: Cuaca maritim aman, posisi di Zona Pemanfaatan Berkelanjutan (${jarakKkpKm} km dari KKP), ukuran ikan matang gonad (Rasio Lm ${rasioLm}), dan harga aktual Rp ${hargaAktualTengkulakRp.toLocaleString('id-ID')}/kg melampaui Harga Layak Effort AI (Rp ${hargaLayakEffortRp.toLocaleString('id-ID')}/kg).`
    );
  }

  const landTradeoffActivities = [
    {
      title: 'Perbaikan Alat Tangkap & Jaring Koperasi',
      estDailyIncomeRp: Math.round(upahAltPerJamRp * 8),
      detail:
        'Upah harian pasti di bengkel jaring kampung nelayan tanpa risiko kehilangan modal solar & es.',
    },
    {
      title: 'Pengolahan Ikan Asin / Pemindangan Higienis',
      estDailyIncomeRp: Math.round(upahAltPerJamRp * 8.5),
      detail:
        'Mengolah stok tangkapan hari sebelumnya untuk meningkatkan nilai tambah jual hingga +35%.',
    },
    {
      title: 'Logistik Rantai Dingin & Sortir Lelang TPI',
      estDailyIncomeRp: Math.round(upahAltPerJamRp * 7.5),
      detail:
        'Kerja paruh waktu harian di Tempat Pelelangan Ikan (TPI) setempat sembari menunggu gelombang reda.',
    },
  ];

  return {
    targetLat,
    targetLon,
    kkpLat: regionInfo.kkp_lat,
    kkpLon: regionInfo.kkp_lon,
    jarakKkpKm,
    zonaKkp: kkpZone.status,
    zonaKkpColor: kkpZone.color,
    vaporPressureHpa: wbgtResult.vaporPressureHpa,
    windChillCorrection: wbgtResult.windChillCorrection,
    wbgtC: wbgtResult.wbgtC,
    hydrationLitersPerHour: wbgtResult.hydrationLitersPerHour,
    waveCategory,
    lmAcuanCm: speciesInfo.lm_cm,
    rasioLm,
    statusBiologi,
    isBiologicallyCompliant,
    cpueKg,
    faktorGelombangBbm: Number(faktorGelombangBbm.toFixed(3)),
    konsumsiBbmLiter: Number(konsumsiBbmLiter.toFixed(1)),
    biayaBbmRp,
    biayaEsPerbekalanRp,
    totalModalOperasionalRp,
    indeksKesegaranPersen,
    upahAltPerJamRp,
    upahKerjaWajarRp,
    kompensasiRisikoRp,
    totalImplicitCostRp,
    totalEconomicCostRp,
    hargaAcuanTpiRp,
    potonganModalPersen,
    hargaAktualTengkulakRp,
    hargaImpasMinimalRp,
    hargaLayakEffortRp,
    rasioKelayakanHargaPersen,
    pendapatanKotorRp,
    labaAkuntansiRp,
    labaEkonomiRiilRp,
    upahMelautPerJamRp,
    isAccountingProfitIllusion,
    skorKelayakanAi: skor,
    decisionClass,
    decisionLabel,
    shortDecisionBadge,
    decisionColor,
    recommendations,
    landTradeoffActivities,
  };
}

/**
 * Full-Calendar Month & Day Definitions for WebGIS BMKG Maritime Forecast (All 365/366 Days, 2023–2026)
 */
export interface MaritimeMonthInfo {
  month: number; // 1..12
  name: string;
  shortName: string;
  season: SeasonType;
  seasonShort: string;
  tempDelta: number;
  rhDelta: number;
  windDelta: number;
  waveDelta: number;
  rainBaseMm: number;
  visibilityBaseKm: number;
  pressureBaseHpa: number;
  sstDelta: number;
  cpueMultiplier: number;
}

export const MARITIME_MONTHS: MaritimeMonthInfo[] = [
  {
    month: 1,
    name: 'Januari',
    shortName: 'Jan',
    season: 'Musim Barat (Des-Feb)',
    seasonShort: 'Musim Barat',
    tempDelta: -1.4,
    rhDelta: 9.5,
    windDelta: 5.8,
    waveDelta: 0.72,
    rainBaseMm: 18.4,
    visibilityBaseKm: 4.8,
    pressureBaseHpa: 1007.2,
    sstDelta: -0.9,
    cpueMultiplier: 0.76,
  },
  {
    month: 2,
    name: 'Februari',
    shortName: 'Feb',
    season: 'Musim Barat (Des-Feb)',
    seasonShort: 'Musim Barat',
    tempDelta: -1.1,
    rhDelta: 8.0,
    windDelta: 4.9,
    waveDelta: 0.58,
    rainBaseMm: 14.6,
    visibilityBaseKm: 5.5,
    pressureBaseHpa: 1008.0,
    sstDelta: -0.7,
    cpueMultiplier: 0.81,
  },
  {
    month: 3,
    name: 'Maret',
    shortName: 'Mar',
    season: 'Musim Peralihan I (Mar-Mei)',
    seasonShort: 'Peralihan I',
    tempDelta: 0.4,
    rhDelta: 3.2,
    windDelta: 1.2,
    waveDelta: 0.14,
    rainBaseMm: 7.2,
    visibilityBaseKm: 8.2,
    pressureBaseHpa: 1009.6,
    sstDelta: 0.3,
    cpueMultiplier: 0.96,
  },
  {
    month: 4,
    name: 'April',
    shortName: 'Apr',
    season: 'Musim Peralihan I (Mar-Mei)',
    seasonShort: 'Peralihan I',
    tempDelta: 0.9,
    rhDelta: 1.8,
    windDelta: -0.6,
    waveDelta: -0.04,
    rainBaseMm: 4.5,
    visibilityBaseKm: 9.4,
    pressureBaseHpa: 1010.2,
    sstDelta: 0.6,
    cpueMultiplier: 1.04,
  },
  {
    month: 5,
    name: 'Mei',
    shortName: 'Mei',
    season: 'Musim Peralihan I (Mar-Mei)',
    seasonShort: 'Peralihan I',
    tempDelta: 0.7,
    rhDelta: 0.5,
    windDelta: 0.4,
    waveDelta: 0.05,
    rainBaseMm: 3.6,
    visibilityBaseKm: 9.8,
    pressureBaseHpa: 1010.6,
    sstDelta: 0.5,
    cpueMultiplier: 1.06,
  },
  {
    month: 6,
    name: 'Juni',
    shortName: 'Jun',
    season: 'Musim Timur (Jun-Agu)',
    seasonShort: 'Musim Timur',
    tempDelta: -0.5,
    rhDelta: -4.2,
    windDelta: 2.8,
    waveDelta: 0.28,
    rainBaseMm: 1.8,
    visibilityBaseKm: 10.6,
    pressureBaseHpa: 1011.8,
    sstDelta: -0.4,
    cpueMultiplier: 1.08,
  },
  {
    month: 7,
    name: 'Juli',
    shortName: 'Jul',
    season: 'Musim Timur (Jun-Agu)',
    seasonShort: 'Musim Timur',
    tempDelta: -0.9,
    rhDelta: -6.0,
    windDelta: 3.9,
    waveDelta: 0.41,
    rainBaseMm: 0.9,
    visibilityBaseKm: 11.2,
    pressureBaseHpa: 1012.5,
    sstDelta: -0.8,
    cpueMultiplier: 1.11,
  },
  {
    month: 8,
    name: 'Agustus',
    shortName: 'Agu',
    season: 'Musim Timur (Jun-Agu)',
    seasonShort: 'Musim Timur',
    tempDelta: -0.3,
    rhDelta: -5.4,
    windDelta: 3.1,
    waveDelta: 0.32,
    rainBaseMm: 1.2,
    visibilityBaseKm: 11.0,
    pressureBaseHpa: 1012.1,
    sstDelta: -0.5,
    cpueMultiplier: 1.14,
  },
  {
    month: 9,
    name: 'September',
    shortName: 'Sep',
    season: 'Musim Peralihan II (Sep-Nov)',
    seasonShort: 'Peralihan II',
    tempDelta: 0.5,
    rhDelta: -1.5,
    windDelta: -0.9,
    waveDelta: -0.06,
    rainBaseMm: 2.4,
    visibilityBaseKm: 10.2,
    pressureBaseHpa: 1010.8,
    sstDelta: 0.4,
    cpueMultiplier: 1.22,
  },
  {
    month: 10,
    name: 'Oktober',
    shortName: 'Okt',
    season: 'Musim Peralihan II (Sep-Nov)',
    seasonShort: 'Peralihan II',
    tempDelta: 0.8,
    rhDelta: 0.0,
    windDelta: -1.4,
    waveDelta: -0.09,
    rainBaseMm: 3.1,
    visibilityBaseKm: 9.8,
    pressureBaseHpa: 1010.4,
    sstDelta: 0.7,
    cpueMultiplier: 1.28,
  },
  {
    month: 11,
    name: 'November',
    shortName: 'Nov',
    season: 'Musim Peralihan II (Sep-Nov)',
    seasonShort: 'Peralihan II',
    tempDelta: 0.0,
    rhDelta: 0.0,
    windDelta: 0.0,
    waveDelta: 0.0,
    rainBaseMm: 5.4,
    visibilityBaseKm: 8.8,
    pressureBaseHpa: 1009.8,
    sstDelta: 0.2,
    cpueMultiplier: 1.18,
  },
  {
    month: 12,
    name: 'Desember',
    shortName: 'Des',
    season: 'Musim Barat (Des-Feb)',
    seasonShort: 'Musim Barat',
    tempDelta: -0.8,
    rhDelta: 7.4,
    windDelta: 4.4,
    waveDelta: 0.52,
    rainBaseMm: 15.2,
    visibilityBaseKm: 5.8,
    pressureBaseHpa: 1007.9,
    sstDelta: -0.5,
    cpueMultiplier: 0.82,
  },
];

export function getDaysInMaritimeMonth(month: number, year: number): number {
  return new Date(year, month, 0).getDate();
}

const INDONESIAN_DAYS_FULL = [
  'Minggu',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
];
const INDONESIAN_DAYS_SHORT = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

export function formatIndonesianMaritimeDate(
  day: number,
  month: number,
  year: number
): {
  day: number;
  month: number;
  year: number;
  fullLabel: string;
  shortLabel: string;
  isoDate: string;
  season: SeasonType;
} {
  const mInfo =
    MARITIME_MONTHS.find((m) => m.month === month) || MARITIME_MONTHS[10];
  const maxDay = getDaysInMaritimeMonth(mInfo.month, year);
  const safeDay = Math.min(Math.max(1, day), maxDay);
  const dateObj = new Date(year, mInfo.month - 1, safeDay);
  const dow = dateObj.getDay();
  const isoMonth = String(mInfo.month).padStart(2, '0');
  const isoDay = String(safeDay).padStart(2, '0');

  return {
    day: safeDay,
    month: mInfo.month,
    year,
    fullLabel: `${INDONESIAN_DAYS_FULL[dow]}, ${safeDay} ${mInfo.name} ${year}`,
    shortLabel: `${INDONESIAN_DAYS_SHORT[dow]}, ${safeDay} ${mInfo.shortName} ${year}`,
    isoDate: `${year}-${isoMonth}-${isoDay}`,
    season: mInfo.season,
  };
}

function parseDateInputToDayMonth(
  dateInput: string,
  fallbackYear: number
): { day: number; month: number; year: SimulationYear } {
  // 1. Check YYYY-MM-DD ISO format
  const isoMatch = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(dateInput.trim());
  if (isoMatch) {
    const yr = Number(isoMatch[1]);
    const validYear: SimulationYear =
      yr === 2023 || yr === 2024 || yr === 2025 || yr === 2026
        ? yr
        : (fallbackYear as SimulationYear);
    const mo = Math.min(12, Math.max(1, Number(isoMatch[2])));
    const dy = Math.min(
      getDaysInMaritimeMonth(mo, validYear),
      Math.max(1, Number(isoMatch[3]))
    );
    return { day: dy, month: mo, year: validYear };
  }

  // 2. Check legacy preset format e.g. '15-jan', '09-nov', '15-okt'
  const shortMonthMap: Record<string, number> = {
    jan: 1,
    feb: 2,
    mar: 3,
    apr: 4,
    mei: 5,
    jun: 6,
    jul: 7,
    agu: 8,
    sep: 9,
    okt: 10,
    nov: 11,
    des: 12,
  };
  const presetMatch = /^(\d{1,2})-([a-z]{3})$/i.exec(dateInput.trim());
  if (presetMatch) {
    const dy = Number(presetMatch[1]);
    const mo = shortMonthMap[presetMatch[2].toLowerCase()] || 11;
    const validYear = fallbackYear as SimulationYear;
    return {
      day: Math.min(getDaysInMaritimeMonth(mo, validYear), Math.max(1, dy)),
      month: mo,
      year: validYear,
    };
  }

  return { day: 9, month: 11, year: fallbackYear as SimulationYear };
}

/**
 * Hourly BMKG Maritime Forecast Generator for Selected Region, Any Calendar Date (1-31, Jan-Dec), and Year (2023-2026)
 */
export interface HourlyForecastItem {
  timeWib: string;
  relativeLabel: string;
  dateLabel: string;
  fullDateLabel: string;
  isoDate: string;
  year: SimulationYear;
  season: SeasonType;
  condition: 'Cerah Berawan' | 'Berawan' | 'Hujan Ringan' | 'Hujan Petir';
  safetyColor: 'emerald' | 'cyan' | 'amber' | 'crimson';
  windDirection: string;
  windKnot: number;
  waveM: number;
  waveCategory: 'Tenang' | 'Rendah' | 'Sedang' | 'Tinggi';
  currentKnot: number;
  currentDirection: string;
  tideM: number;
  tempC: number;
  rhPercent: number;
  wbgtC: number;
  rainfallMm: number;
  visibilityKm: number;
  pressureHpa: number;
  sstC: number;
  estimatedCpueKg: number;
}

export function getRegionalHourlyForecast(
  region: RegionKey,
  dateInput: string = '2026-11-09',
  year: SimulationYear = 2026
): HourlyForecastItem[] {
  const base = STUDY_REGIONS[region];
  const parsed = parseDateInputToDayMonth(dateInput, year);
  const effectiveYear = year || parsed.year;
  const monthInfo =
    MARITIME_MONTHS.find((m) => m.month === parsed.month) ||
    MARITIME_MONTHS[10];
  const formattedDate = formatIndonesianMaritimeDate(
    parsed.day,
    parsed.month,
    effectiveYear
  );

  // Daily deterministic synoptic & lunar tidal modulation across the month (days 1..31)
  // Note: day=9, month=11 produces zero daily delta so default 9 Nov matches baseline telemetry
  const isBaselineDate = parsed.month === 11 && parsed.day === 9;
  const dayAngle = ((parsed.day - 9) / 31) * Math.PI * 2;
  const synopticWave = isBaselineDate
    ? 0
    : Math.sin(dayAngle * 2.3 + parsed.month * 0.7) * 0.14;
  const synopticWind = isBaselineDate
    ? 0
    : Math.sin(dayAngle * 2.1 + parsed.month * 0.5) * 1.35;
  const synopticTemp = isBaselineDate
    ? 0
    : Math.cos(dayAngle * 1.7 + parsed.month * 0.4) * 0.55;
  const synopticRain = isBaselineDate
    ? 0
    : Math.max(-1.8, Math.sin(dayAngle * 3.0 + parsed.month) * 2.6);
  // Lunar spring/neap tide cycle (peaks around day 1 & 15 full/new moon)
  const lunarTideOffset = isBaselineDate
    ? 0
    : Number((Math.cos(((parsed.day - 1) / 14.77) * Math.PI * 2) * 0.22).toFixed(2));

  // Multi-year warming & monsoon intensification factor (2023 -> 2026)
  const yearOffset = effectiveYear - 2026; // -3 for 2023, 0 for 2026
  const yearTempShift = yearOffset * 0.28;
  const yearWindShift = yearOffset * 0.45;
  const yearWaveShift = yearOffset * 0.06;
  const yearCpueFactor =
    effectiveYear === 2023
      ? 1.24
      : effectiveYear === 2024
        ? 1.15
        : effectiveYear === 2025
          ? 1.07
          : 1.0;

  const isWestMonsoon = monthInfo.season === 'Musim Barat (Des-Feb)';
  const isEastMonsoon = monthInfo.season === 'Musim Timur (Jun-Agu)';

  const slots = [
    {
      timeWib: '15.00 WIB',
      relativeLabel: 'Saat Ini',
      dTemp: 0.0,
      dRh: 0.0,
      dWind: 0.0,
      dWave: 0.0,
      dRain: 0.0,
      dVis: 0.0,
      dPress: 0.0,
      currentKnot: Number(
        (0.77 + (isWestMonsoon ? 0.35 : 0) + synopticWind * 0.04).toFixed(2)
      ),
      tideM: Number(Math.max(0.25, 0.85 + lunarTideOffset).toFixed(2)),
      condition: isWestMonsoon
        ? ('Hujan Ringan' as const)
        : synopticRain > 1.8
          ? ('Berawan' as const)
          : ('Cerah Berawan' as const),
      windDir: isWestMonsoon
        ? 'Barat Laut'
        : isEastMonsoon
          ? 'Tenggara'
          : 'Timur Laut',
      currDir: isWestMonsoon ? 'Timur' : 'Utara',
    },
    {
      timeWib: '18.00 WIB',
      relativeLabel: '+3 Jam',
      dTemp: -1.4,
      dRh: 4.5,
      dWind: 1.6,
      dWave: 0.18,
      dRain: 1.8,
      dVis: -0.9,
      dPress: 0.6,
      currentKnot: Number(
        (0.89 + (isWestMonsoon ? 0.38 : 0) + synopticWind * 0.04).toFixed(2)
      ),
      tideM: Number(Math.max(0.25, 0.94 + lunarTideOffset).toFixed(2)),
      condition: isWestMonsoon
        ? ('Hujan Petir' as const)
        : ('Berawan' as const),
      windDir: isWestMonsoon ? 'Barat' : 'Tenggara',
      currDir: 'Barat Laut',
    },
    {
      timeWib: '21.00 WIB',
      relativeLabel: '+6 Jam',
      dTemp: -2.6,
      dRh: 8.2,
      dWind: 3.1,
      dWave: 0.38,
      dRain: 3.4,
      dVis: -1.6,
      dPress: 1.2,
      currentKnot: Number(
        (1.12 + (isWestMonsoon ? 0.42 : 0) + synopticWind * 0.04).toFixed(2)
      ),
      tideM: Number(Math.max(0.25, 0.72 + lunarTideOffset).toFixed(2)),
      condition: isWestMonsoon
        ? ('Hujan Petir' as const)
        : ('Hujan Ringan' as const),
      windDir: 'Barat Daya',
      currDir: 'Barat',
    },
    {
      timeWib: '00.00 WIB',
      relativeLabel: '+9 Jam',
      dTemp: -3.2,
      dRh: 10.0,
      dWind: 2.2,
      dWave: 0.25,
      dRain: 1.1,
      dVis: -1.1,
      dPress: 0.8,
      currentKnot: Number(
        (0.95 + (isWestMonsoon ? 0.3 : 0) + synopticWind * 0.04).toFixed(2)
      ),
      tideM: Number(Math.max(0.25, 0.51 + lunarTideOffset).toFixed(2)),
      condition: isWestMonsoon
        ? ('Hujan Ringan' as const)
        : ('Berawan' as const),
      windDir: 'Selatan',
      currDir: 'Utara',
    },
  ];

  return slots.map((s) => {
    const tempC = Number(
      (
        base.defaultTempC +
        monthInfo.tempDelta +
        synopticTemp +
        yearTempShift +
        s.dTemp
      ).toFixed(1)
    );
    const rhPercent = Number(
      clip(
        base.defaultRhPercent + monthInfo.rhDelta - synopticTemp * 1.5 + s.dRh,
        52,
        96
      ).toFixed(1)
    );
    const windKnot = Number(
      Math.max(
        3.5,
        base.defaultWindKnot +
          monthInfo.windDelta +
          synopticWind +
          yearWindShift +
          s.dWind
      ).toFixed(2)
    );
    const waveM = Number(
      Math.max(
        0.15,
        base.defaultWaveM +
          monthInfo.waveDelta +
          synopticWave +
          yearWaveShift +
          s.dWave
      ).toFixed(2)
    );
    const wbgt = calculateMaritimeWbgt(tempC, rhPercent, windKnot);
    const waveCategory = classifyWaveHeight(waveM);

    const rainfallMm = Number(
      Math.max(
        0,
        monthInfo.rainBaseMm + synopticRain + s.dRain + yearOffset * 0.4
      ).toFixed(1)
    );
    const visibilityKm = Number(
      clip(
        monthInfo.visibilityBaseKm -
          synopticRain * 0.2 +
          s.dVis -
          (waveM > 1.5 ? 1.5 : 0),
        2.0,
        14.0
      ).toFixed(1)
    );
    const pressureHpa = Number(
      (monthInfo.pressureBaseHpa - synopticWind * 0.25 + s.dPress).toFixed(1)
    );
    const sstC = Number(
      (
        base.defaultTempC -
        3.6 +
        monthInfo.sstDelta +
        synopticTemp * 0.5 +
        yearTempShift * 0.7
      ).toFixed(1)
    );
    const estimatedCpueKg = Number(
      Math.max(
        5.5,
        base.base_cpue_2023 *
          monthInfo.cpueMultiplier *
          yearCpueFactor *
          (waveM > 1.5 ? 0.78 : 1.0) *
          (1 - synopticWave * 0.12)
      ).toFixed(2)
    );

    let safetyColor: 'emerald' | 'cyan' | 'amber' | 'crimson' = 'emerald';
    if (waveM > 1.8 || windKnot > 18) safetyColor = 'crimson';
    else if (waveM > 1.1 || windKnot > 14 || wbgt.wbgtC > 30.2)
      safetyColor = 'amber';
    else if (waveM <= 0.4) safetyColor = 'cyan';

    return {
      timeWib: s.timeWib,
      relativeLabel: s.relativeLabel,
      dateLabel: formattedDate.shortLabel,
      fullDateLabel: formattedDate.fullLabel,
      isoDate: formattedDate.isoDate,
      year: effectiveYear,
      season: monthInfo.season,
      condition: s.condition,
      safetyColor,
      windDirection: s.windDir,
      windKnot,
      waveM,
      waveCategory,
      currentKnot: s.currentKnot,
      currentDirection: s.currDir,
      tideM: s.tideM,
      tempC,
      rhPercent,
      wbgtC: wbgt.wbgtC,
      rainfallMm,
      visibilityKm,
      pressureHpa,
      sstC,
      estimatedCpueKg,
    };
  });
}

/**
 * Multi-Year PIPP KKP Reference Table Dataset Generator (2023-2026)
 */
export interface PippReferenceRow {
  id: string;
  region: RegionKey;
  year: SimulationYear;
  season: SeasonType;
  species: SpeciesKey;
  latinName: string;
  lmCm: number;
  caughtLengthCm: number;
  lmRatio: number;
  cpueKg: number;
  fuelLiters: number;
  explicitCostRp: number;
  implicitCostRp: number;
  tpiPriceRp: number;
  tengkulakPriceRp: number;
  fairEffortPriceRp: number;
  accountingProfitRp: number;
  economicProfitRp: number;
  wbgtC: number;
  kkpDistanceKm: number;
  aiScore: number;
  decisionBadge: 'LAYAK MELAUT' | 'WASPADA & NEGO HARGA' | 'TUNDA MELAUT';
}

export function generatePippReferenceDataset(): PippReferenceRow[] {
  const regions = Object.keys(STUDY_REGIONS) as RegionKey[];
  const years: SimulationYear[] = [2023, 2024, 2025, 2026];
  const speciesList = Object.keys(TARGET_SPECIES) as SpeciesKey[];
  const seasons: SeasonType[] = [
    'Musim Barat (Des-Feb)',
    'Musim Peralihan I (Mar-Mei)',
    'Musim Timur (Jun-Agu)',
    'Musim Peralihan II (Sep-Nov)',
  ];

  const rows: PippReferenceRow[] = [];
  let counter = 1;

  for (const region of regions) {
    const regInfo = STUDY_REGIONS[region];
    for (const year of years) {
      const yMult = YEARLY_MULTIPLIERS[year];
      for (const species of speciesList) {
        const spInfo = TARGET_SPECIES[species];
        const season = seasons[(counter + year) % seasons.length];
        const waveOffset =
          season === 'Musim Barat (Des-Feb)'
            ? 0.55
            : season === 'Musim Timur (Jun-Agu)'
              ? 0.25
              : 0.0;
        const lengthAdjust = year === 2026 ? -0.8 : year === 2025 ? -0.3 : 0.4;
        const caughtLengthCm = Number(
          (spInfo.defaultLengthCm + lengthAdjust).toFixed(1)
        );
        const distanceKm = Number(
          (regInfo.defaultDistanceKm * yMult.faktor_jarak).toFixed(1)
        );

        const sim = runPanduNelayanSimulation({
          region,
          year,
          species,
          fishLengthCm: caughtLengthCm,
          distanceKm,
          durationHours: regInfo.defaultDurationHours,
          fuelPriceRp: year >= 2025 ? 7500 : 6800,
          iceKg: 20,
          capitalSource:
            counter % 2 === 0 ? 'Pinjaman Tengkulak' : 'Mandiri / Koperasi',
          middlemanCutPercent: counter % 2 === 0 ? 20.8 : 2.0,
          tempC: regInfo.defaultTempC + (year - 2023) * 0.25,
          rhPercent: regInfo.defaultRhPercent,
          windKnot: regInfo.defaultWindKnot + waveOffset * 4,
          waveM: Number((regInfo.defaultWaveM + waveOffset).toFixed(2)),
          season,
        });

        rows.push({
          id: `TRIP-${String(counter).padStart(4, '0')}`,
          region,
          year,
          season,
          species,
          latinName: spInfo.latinName,
          lmCm: spInfo.lm_cm,
          caughtLengthCm,
          lmRatio: sim.rasioLm,
          cpueKg: sim.cpueKg,
          fuelLiters: sim.konsumsiBbmLiter,
          explicitCostRp: sim.totalModalOperasionalRp,
          implicitCostRp: sim.totalImplicitCostRp,
          tpiPriceRp: sim.hargaAcuanTpiRp,
          tengkulakPriceRp: sim.hargaAktualTengkulakRp,
          fairEffortPriceRp: sim.hargaLayakEffortRp,
          accountingProfitRp: sim.labaAkuntansiRp,
          economicProfitRp: sim.labaEkonomiRiilRp,
          wbgtC: sim.wbgtC,
          kkpDistanceKm: sim.jarakKkpKm,
          aiScore: sim.skorKelayakanAi,
          decisionBadge: sim.shortDecisionBadge,
        });
        counter++;
      }
    }
  }

  return rows;
}

export interface MaritimeToastAlert {
  id: string;
  severity: 'crimson' | 'amber';
  category: 'TUNDA_MELAUT' | 'GELOMBANG_TINGGI' | 'ZONA_INTI_KKP';
  title: string;
  message: string;
  metricsSummary: string;
}

/**
 * Pure helper evaluating whether current simulation state triggers critical toast warnings
 * for 'TUNDA MELAUT' status, high wave risk (>= 1.25 m), or KKP Core Zone violation.
 */
export function evaluateMaritimeToastAlerts(
  input: SimulationInput,
  output: SimulationOutput
): MaritimeToastAlert[] {
  const alerts: MaritimeToastAlert[] = [];

  if (output.shortDecisionBadge === 'TUNDA MELAUT') {
    const reason =
      output.zonaKkp === 'Zona Inti Larang Tangkap'
        ? `Kapal memasuki Zona Inti Larang Tangkap KKP (${output.jarakKkpKm} km < 2.0 km).`
        : input.waveM >= 2.2
          ? `Gelombang ekstrem ${input.waveM} m membahayakan keselamatan kapal < 5 GT.`
          : output.labaAkuntansiRp <= 0
            ? `Defisit kas operasional (Laba Akuntansi Rp ${output.labaAkuntansiRp.toLocaleString('id-ID')}).`
            : `Skor Kelayakan AI jatuh ke ${output.skorKelayakanAi}/100.`;

    alerts.push({
      id: `tunda-${input.region}-${output.skorKelayakanAi}-${input.waveM}-${output.jarakKkpKm}`,
      severity: 'crimson',
      category: 'TUNDA_MELAUT',
      title: 'PERINGATAN KRITIS AI: TUNDA MELAUT!',
      message: `${reason} Batalkan pelayaran dan alihkan ke kerja ekonomi darat (estimasi Rp ${(output.upahAltPerJamRp * 8).toLocaleString('id-ID')}/hari).`,
      metricsSummary: `Skor AI: ${output.skorKelayakanAi}/100 · Gelombang: ${input.waveM}m · Jarak KKP: ${output.jarakKkpKm}km`,
    });
  }

  if (input.waveM >= 1.25) {
    const isExtreme = input.waveM >= 2.0;
    alerts.push({
      id: `wave-${input.region}-${input.waveM}-${input.windKnot}`,
      severity: isExtreme ? 'crimson' : 'amber',
      category: 'GELOMBANG_TINGGI',
      title: isExtreme
        ? `BAHAYA GELOMBANG TINGGI (${input.waveM} m)!`
        : `PERINGATAN GELOMBANG WASPADA (${input.waveM} m)`,
      message: `Tinggi gelombang kategori ${output.waveCategory} disertai angin ${input.windKnot} knot meningkatkan konsumsi solar +${Math.round((output.faktorGelombangBbm - 1) * 100)}% dan risiko terbalik bagi perahu < 5 GT.`,
      metricsSummary: `Gelombang: ${input.waveM}m (${output.waveCategory}) · Angin: ${input.windKnot} kt · WBGT: ${output.wbgtC}°C`,
    });
  }

  return alerts;
}

export type HeatmapMode = 'CPUE_DENSITY' | 'WBGT_RISK' | 'COMBINED_SAFE_SPOT';

export interface MaritimeHeatmapCell {
  id: string;
  lat: number;
  lon: number;
  latBounds: [number, number];
  lonBounds: [number, number];
  jarakKkpKm: number;
  zonaKkp: KkpZoneStatus;
  localCpueKg: number;
  localWbgtC: number;
  localWaveM: number;
  intensity: number; // 0.0 to 1.0
  colorHex: string;
  avoidArea: boolean;
  statusLabel: 'HINDARI (ZONA INTI / PANAS EKSTREM)' | 'WASPADA TERMAL / PENYANGGA' | 'HOTSPOT TANGKAPAN OPTIMAL';
}

/**
 * Generates a spatial 7x7 marine grid around the selected DPI & KKP waters
 * to visualize Catch Density (CPUE) and WBGT Thermal Risk heatmaps on WebGIS.
 */
export function generateMaritimeHeatmapGrid(
  input: SimulationInput,
  output: SimulationOutput,
  mode: HeatmapMode
): MaritimeHeatmapCell[] {
  const reg = STUDY_REGIONS[input.region];
  const centerLat = (reg.lat + reg.kkp_lat) / 2;
  const centerLon = (reg.lon + reg.kkp_lon) / 2;

  const gridSteps = [-3, -2, -1, 0, 1, 2, 3];
  const stepDeg = 0.014; // ~1.55 km per grid cell
  const halfStep = stepDeg / 2;

  const cells: MaritimeHeatmapCell[] = [];

  for (const r of gridSteps) {
    for (const c of gridSteps) {
      const cellLat = Number((centerLat + r * stepDeg).toFixed(4));
      const cellLon = Number((centerLon + c * stepDeg).toFixed(4));

      const distKkp = calculateHaversineKm(
        cellLat,
        cellLon,
        reg.kkp_lat,
        reg.kkp_lon
      );
      const zone = classifyKkpZone(distKkp);

      // Spatial gradient: biomass spillover peaks at 5.2 - 7.5 km from KKP boundary
      const spilloverFactor =
        distKkp < 2.0
          ? 1.35
          : distKkp >= 5.0 && distKkp <= 8.0
            ? 1.28 - Math.abs(distKkp - 6.2) * 0.06
            : Math.max(0.65, 1.05 - Math.abs(distKkp - 5.5) * 0.05);

      const spatialWaveOffset = (r * 0.04 + c * 0.03);
      const localWaveM = Number(
        Math.max(0.15, input.waveM + spatialWaveOffset).toFixed(2)
      );

      // Spatial thermal gradient (shallower/leeward vs open solar exposure)
      const tempOffset = (r * 0.35 - c * 0.25);
      const localWbgt = calculateMaritimeWbgt(
        input.tempC + tempOffset,
        input.rhPercent,
        Math.max(3, input.windKnot - r * 0.6)
      ).wbgtC;

      const localCpueKg = Number(
        Math.max(4.0, output.cpueKg * spilloverFactor).toFixed(1)
      );

      const isCoreViolation = distKkp < 2.0;
      const isHighHeat = localWbgt >= 30.4;
      const avoidArea = isCoreViolation || localWbgt >= 30.8 || localWaveM >= 2.1;

      let statusLabel: MaritimeHeatmapCell['statusLabel'] =
        'HOTSPOT TANGKAPAN OPTIMAL';
      if (isCoreViolation || avoidArea) {
        statusLabel = 'HINDARI (ZONA INTI / PANAS EKSTREM)';
      } else if (distKkp < 5.0 || isHighHeat) {
        statusLabel = 'WASPADA TERMAL / PENYANGGA';
      }

      let intensity = 0.5;
      let colorHex = '#10B981';

      if (mode === 'WBGT_RISK') {
        // Normalize WBGT between 27.5C and 32.0C
        intensity = Number(
          clip((localWbgt - 27.5) / 4.5, 0.15, 0.95).toFixed(2)
        );
        colorHex =
          localWbgt >= 30.6
            ? '#EF4444'
            : localWbgt >= 29.8
              ? '#F59E0B'
              : localWbgt >= 29.0
                ? '#06B6D4'
                : '#10B981';
      } else if (mode === 'CPUE_DENSITY') {
        intensity = Number(
          clip(localCpueKg / (output.cpueKg * 1.35), 0.2, 0.95).toFixed(2)
        );
        // Core KKP is always marked Crimson so fishermen know to avoid it despite fish abundance
        colorHex = isCoreViolation
          ? '#EF4444'
          : localCpueKg >= output.cpueKg * 1.12
            ? '#10B981'
            : localCpueKg >= output.cpueKg * 0.9
              ? '#06B6D4'
              : '#3B82F6';
      } else {
        // COMBINED_SAFE_SPOT: High catch + Safe KKP (>= 5 km) + Safe WBGT
        if (isCoreViolation || avoidArea) {
          intensity = 0.85;
          colorHex = '#EF4444';
        } else if (distKkp < 5.0 || isHighHeat) {
          intensity = 0.55;
          colorHex = '#F59E0B';
        } else {
          intensity = 0.8;
          colorHex = '#10B981';
        }
      }

      cells.push({
        id: `cell-${r}-${c}`,
        lat: cellLat,
        lon: cellLon,
        latBounds: [
          Number((cellLat - halfStep).toFixed(4)),
          Number((cellLat + halfStep).toFixed(4)),
        ],
        lonBounds: [
          Number((cellLon - halfStep).toFixed(4)),
          Number((cellLon + halfStep).toFixed(4)),
        ],
        jarakKkpKm: distKkp,
        zonaKkp: zone.status,
        localCpueKg,
        localWbgtC: localWbgt,
        localWaveM,
        intensity,
        colorHex,
        avoidArea,
        statusLabel,
      });
    }
   }

  return cells;
}

export type CatchOverlayDimension = 'MONTHLY' | 'REGIONAL' | 'SPECIES';

export interface YearlyCatchOverlayOptions {
  yearA: SimulationYear;
  yearB: SimulationYear;
  dimension?: CatchOverlayDimension;
  regionFilter?: RegionKey | 'ALL';
  speciesFilter?: SpeciesKey | 'ALL';
}

export interface YearlyCatchOverlayResult {
  yearA: SimulationYear;
  yearB: SimulationYear;
  dimension: CatchOverlayDimension;
  labels: string[];
  seriesYearACpue: number[];
  seriesYearBCpue: number[];
  seriesDeltaCpue: number[];
  avgCpueYearA: number;
  avgCpueYearB: number;
  deltaCpueKg: number;
  deltaCpuePercent: number;
  avgFairPriceYearA: number;
  avgFairPriceYearB: number;
  deltaFairPricePercent: number;
  peakLabelYearA: string;
  peakLabelYearB: string;
}

const MONTHLY_SEASONAL_PROFILE: {
  monthLabel: string;
  season: SeasonType;
  monthlyMultiplier: number;
}[] = [
  { monthLabel: 'Jan (Barat)', season: 'Musim Barat (Des-Feb)', monthlyMultiplier: 0.78 },
  { monthLabel: 'Feb (Barat)', season: 'Musim Barat (Des-Feb)', monthlyMultiplier: 0.82 },
  { monthLabel: 'Mar (Peralihan I)', season: 'Musim Peralihan I (Mar-Mei)', monthlyMultiplier: 0.96 },
  { monthLabel: 'Apr (Peralihan I)', season: 'Musim Peralihan I (Mar-Mei)', monthlyMultiplier: 1.04 },
  { monthLabel: 'Mei (Peralihan I)', season: 'Musim Peralihan I (Mar-Mei)', monthlyMultiplier: 1.08 },
  { monthLabel: 'Jun (Timur)', season: 'Musim Timur (Jun-Agu)', monthlyMultiplier: 1.12 },
  { monthLabel: 'Jul (Timur)', season: 'Musim Timur (Jun-Agu)', monthlyMultiplier: 1.16 },
  { monthLabel: 'Agu (Timur)', season: 'Musim Timur (Jun-Agu)', monthlyMultiplier: 1.19 },
  { monthLabel: 'Sep (Peralihan II)', season: 'Musim Peralihan II (Sep-Nov)', monthlyMultiplier: 1.34 },
  { monthLabel: 'Okt (Peralihan II)', season: 'Musim Peralihan II (Sep-Nov)', monthlyMultiplier: 1.42 },
  { monthLabel: 'Nov (Peralihan II)', season: 'Musim Peralihan II (Sep-Nov)', monthlyMultiplier: 1.26 },
  { monthLabel: 'Des (Barat)', season: 'Musim Barat (Des-Feb)', monthlyMultiplier: 0.83 },
];

const SPECIES_CPUE_WEIGHT: Record<SpeciesKey, number> = {
  Kembung: 1.02,
  Tongkol: 1.14,
  Lemuru: 1.24,
  Tenggiri: 0.86,
};

/**
 * Pure analytical comparator generating overlaid fish catch trend series (CPUE kg/trip)
 * and fair-price shifts between any two selected years (2023-2026).
 */
export function compareYearlyCatchTrends(
  options: YearlyCatchOverlayOptions
): YearlyCatchOverlayResult {
  const {
    yearA,
    yearB,
    dimension = 'MONTHLY',
    regionFilter = 'ALL',
    speciesFilter = 'ALL',
  } = options;

  const multA = YEARLY_MULTIPLIERS[yearA];
  const multB = YEARLY_MULTIPLIERS[yearB];

  const allRegions = Object.keys(STUDY_REGIONS) as RegionKey[];
  const targetRegions =
    regionFilter === 'ALL' ? allRegions : [regionFilter];

  const allSpecies = Object.keys(TARGET_SPECIES) as SpeciesKey[];
  const targetSpecies =
    speciesFilter === 'ALL' ? allSpecies : [speciesFilter];

  const avgBaseRegionCpue =
    targetRegions.reduce((acc, r) => acc + STUDY_REGIONS[r].base_cpue_2023, 0) /
    targetRegions.length;

  const avgSpeciesWeight =
    targetSpecies.reduce((acc, s) => acc + SPECIES_CPUE_WEIGHT[s], 0) /
    targetSpecies.length;

  const labels: string[] = [];
  const seriesYearACpue: number[] = [];
  const seriesYearBCpue: number[] = [];

  if (dimension === 'MONTHLY') {
    for (let idx = 0; idx < MONTHLY_SEASONAL_PROFILE.length; idx++) {
      const m = MONTHLY_SEASONAL_PROFILE[idx];
      labels.push(m.monthLabel);
      // Slight inter-annual climate shift in monsoon intensity for realistic overlay separation
      const climateWaveShiftA = 1 - (yearA - 2023) * 0.015 * ((idx % 3) - 1);
      const climateWaveShiftB = 1 - (yearB - 2023) * 0.015 * ((idx % 3) - 1);

      const valA = Number(
        (
          avgBaseRegionCpue *
          avgSpeciesWeight *
          multA.faktor_cpue *
          m.monthlyMultiplier *
          climateWaveShiftA
        ).toFixed(2)
      );
      const valB = Number(
        (
          avgBaseRegionCpue *
          avgSpeciesWeight *
          multB.faktor_cpue *
          m.monthlyMultiplier *
          climateWaveShiftB
        ).toFixed(2)
      );
      seriesYearACpue.push(valA);
      seriesYearBCpue.push(valB);
    }
  } else if (dimension === 'REGIONAL') {
    for (const rKey of allRegions) {
      const reg = STUDY_REGIONS[rKey];
      labels.push(rKey);
      const valA = Number(
        (reg.base_cpue_2023 * avgSpeciesWeight * multA.faktor_cpue * 1.06).toFixed(2)
      );
      const valB = Number(
        (reg.base_cpue_2023 * avgSpeciesWeight * multB.faktor_cpue * 1.06).toFixed(2)
      );
      seriesYearACpue.push(valA);
      seriesYearBCpue.push(valB);
    }
  } else {
    // SPECIES dimension
    for (const sKey of allSpecies) {
      const spWeight = SPECIES_CPUE_WEIGHT[sKey];
      labels.push(`${sKey} (${TARGET_SPECIES[sKey].latinName.split(' ')[0]}.)`);
      const valA = Number(
        (avgBaseRegionCpue * spWeight * multA.faktor_cpue * 1.06).toFixed(2)
      );
      const valB = Number(
        (avgBaseRegionCpue * spWeight * multB.faktor_cpue * 1.06).toFixed(2)
      );
      seriesYearACpue.push(valA);
      seriesYearBCpue.push(valB);
    }
  }

  const seriesDeltaCpue = seriesYearACpue.map((a, i) =>
    Number((seriesYearBCpue[i] - a).toFixed(2))
  );

  const avgCpueYearA = Number(
    (
      seriesYearACpue.reduce((sum, v) => sum + v, 0) /
      Math.max(1, seriesYearACpue.length)
    ).toFixed(2)
  );
  const avgCpueYearB = Number(
    (
      seriesYearBCpue.reduce((sum, v) => sum + v, 0) /
      Math.max(1, seriesYearBCpue.length)
    ).toFixed(2)
  );

  const deltaCpueKg = Number((avgCpueYearB - avgCpueYearA).toFixed(2));
  const deltaCpuePercent = Number(
    (((avgCpueYearB - avgCpueYearA) / Math.max(0.01, avgCpueYearA)) * 100).toFixed(1)
  );

  const avgFairPriceYearA = Math.round(
    multA.avg_fair_price_dataset * (18.5 / Math.max(8, avgBaseRegionCpue))
  );
  const avgFairPriceYearB = Math.round(
    multB.avg_fair_price_dataset * (18.5 / Math.max(8, avgBaseRegionCpue))
  );
  const deltaFairPricePercent = Number(
    (
      ((avgFairPriceYearB - avgFairPriceYearA) /
        Math.max(1, avgFairPriceYearA)) *
      100
    ).toFixed(1)
  );

  let maxIdxA = 0;
  let maxIdxB = 0;
  for (let i = 1; i < labels.length; i++) {
    if (seriesYearACpue[i] > seriesYearACpue[maxIdxA]) maxIdxA = i;
    if (seriesYearBCpue[i] > seriesYearBCpue[maxIdxB]) maxIdxB = i;
  }

  return {
    yearA,
    yearB,
    dimension,
    labels,
    seriesYearACpue,
    seriesYearBCpue,
    seriesDeltaCpue,
    avgCpueYearA,
    avgCpueYearB,
    deltaCpueKg,
    deltaCpuePercent,
    avgFairPriceYearA,
    avgFairPriceYearB,
    deltaFairPricePercent,
    peakLabelYearA: labels[maxIdxA] || '-',
    peakLabelYearB: labels[maxIdxB] || '-',
  };
}

export type SeasonalHeatmapMetric = 'CPUE_KG' | 'VOLUME_TONS' | 'FAIR_PRICE_RP';

export interface SeasonalCatchHeatmapOptions {
  yearFilter?: SimulationYear | 'ALL';
  speciesFilter?: SpeciesKey | 'ALL';
  metric?: SeasonalHeatmapMetric;
}

export interface SeasonalHeatmapCell {
  id: string;
  region: RegionKey;
  regionFullName: string;
  wppCode: string;
  season: SeasonType;
  shortSeason: string;
  cpueKgPerTrip: number;
  activeTripsPerSeason: number;
  seasonalCatchTons: number;
  fairEffortPriceRp: number;
  avgWaveM: number;
  avgWbgtC: number;
  intensity: number; // 0.0 to 1.0 normalized across the 5x4 matrix
  tier: 'PEAK_OPTIMAL' | 'HIGH_YIELD' | 'MODERATE' | 'LOW_MONSOON';
  representativeSpecies: SpeciesKey;
  representativeYear: SimulationYear;
}

export interface SeasonalCatchHeatmapResult {
  seasons: SeasonType[];
  shortSeasons: string[];
  regions: RegionKey[];
  cells: SeasonalHeatmapCell[]; // 20 cells (5 regions x 4 seasons)
  rowsByRegion: Record<RegionKey, SeasonalHeatmapCell[]>;
  peakCell: SeasonalHeatmapCell;
  lowestCell: SeasonalHeatmapCell;
  totalSeasonalTons: number;
  avgMatrixCpueKg: number;
}

const SEASON_METADATA: {
  season: SeasonType;
  shortSeason: string;
  catchFactor: number;
  waveOffsetM: number;
  tempOffsetC: number;
  activeTripMultiplier: number;
}[] = [
  {
    season: 'Musim Barat (Des-Feb)',
    shortSeason: 'Musim Barat (Des–Feb)',
    catchFactor: 0.78,
    waveOffsetM: 0.55,
    tempOffsetC: -0.4,
    activeTripMultiplier: 0.68,
  },
  {
    season: 'Musim Peralihan I (Mar-Mei)',
    shortSeason: 'Peralihan I (Mar–Mei)',
    catchFactor: 1.04,
    waveOffsetM: 0.08,
    tempOffsetC: 0.35,
    activeTripMultiplier: 0.94,
  },
  {
    season: 'Musim Timur (Jun-Agu)',
    shortSeason: 'Musim Timur (Jun–Agu)',
    catchFactor: 1.15,
    waveOffsetM: 0.24,
    tempOffsetC: -0.15,
    activeTripMultiplier: 0.98,
  },
  {
    season: 'Musim Peralihan II (Sep-Nov)',
    shortSeason: 'Peralihan II (Sep–Nov)',
    catchFactor: 1.44,
    waveOffsetM: -0.05,
    tempOffsetC: 0.45,
    activeTripMultiplier: 1.12,
  },
];

// Regional monsoon anomaly modifier (eastern Indonesian WPP 714/715 experiences different monsoon wave exposure than Java Sea WPP 712)
const REGIONAL_SEASON_MODIFIER: Record<RegionKey, [number, number, number, number]> = {
  'Karangantu Serang': [0.82, 1.05, 1.16, 1.46],
  'Teluk Banten': [0.84, 1.03, 1.14, 1.42],
  'Pesisir Indramayu': [0.76, 1.02, 1.18, 1.38],
  'Kabaena Sultra': [0.86, 1.08, 1.04, 1.35],
  'Ambon Seram': [0.88, 1.12, 0.92, 1.31],
};

// Estimated active artisanal trips per 3-month season in each port's <5 GT fleet
const BASE_SEASONAL_FLEET_TRIPS: Record<RegionKey, number> = {
  'Karangantu Serang': 1420,
  'Teluk Banten': 1260,
  'Pesisir Indramayu': 1580,
  'Kabaena Sultra': 980,
  'Ambon Seram': 1120,
};

/**
 * Pure seasonal correlation heatmap generator across the 5 study regions and 4 monsoon seasons.
 */
export function generateSeasonalCatchHeatmap(
  options: SeasonalCatchHeatmapOptions = {}
): SeasonalCatchHeatmapResult {
  const {
    yearFilter = 'ALL',
    speciesFilter = 'ALL',
    metric = 'CPUE_KG',
  } = options;

  const regions = Object.keys(STUDY_REGIONS) as RegionKey[];
  const allYears: SimulationYear[] = [2023, 2024, 2025, 2026];
  const targetYears = yearFilter === 'ALL' ? allYears : [yearFilter];

  const allSpecies = Object.keys(TARGET_SPECIES) as SpeciesKey[];
  const targetSpecies =
    speciesFilter === 'ALL' ? allSpecies : [speciesFilter];

  const avgYearCpueFactor =
    targetYears.reduce((sum, y) => sum + YEARLY_MULTIPLIERS[y].faktor_cpue, 0) /
    targetYears.length;

  const avgYearFairPriceBase =
    targetYears.reduce(
      (sum, y) => sum + YEARLY_MULTIPLIERS[y].avg_fair_price_dataset,
      0
    ) / targetYears.length;

  const avgSpeciesWeight =
    targetSpecies.reduce((sum, s) => sum + SPECIES_CPUE_WEIGHT[s], 0) /
    targetSpecies.length;

  const representativeSpecies: SpeciesKey =
    speciesFilter === 'ALL' ? 'Kembung' : speciesFilter;
  const representativeYear: SimulationYear =
    yearFilter === 'ALL' ? 2026 : yearFilter;

  const rawCells: Omit<SeasonalHeatmapCell, 'intensity' | 'tier'>[] = [];
  const rowsByRegion = {} as Record<RegionKey, SeasonalHeatmapCell[]>;

  for (const region of regions) {
    const regInfo = STUDY_REGIONS[region];
    const regModifiers = REGIONAL_SEASON_MODIFIER[region];
    const baseTrips = BASE_SEASONAL_FLEET_TRIPS[region];
    rowsByRegion[region] = [];

    for (let sIdx = 0; sIdx < SEASON_METADATA.length; sIdx++) {
      const sMeta = SEASON_METADATA[sIdx];
      const regionalSeasonFactor = regModifiers[sIdx];

      const avgWaveM = Number(
        Math.max(0.18, regInfo.defaultWaveM + sMeta.waveOffsetM).toFixed(2)
      );
      const avgTempC = Number(
        (regInfo.defaultTempC + sMeta.tempOffsetC).toFixed(1)
      );
      const wbgt = calculateMaritimeWbgt(
        avgTempC,
        regInfo.defaultRhPercent,
        regInfo.defaultWindKnot + sMeta.waveOffsetM * 3.5
      );

      const cpueKgPerTrip = Number(
        Math.max(
          4.2,
          regInfo.base_cpue_2023 *
            avgYearCpueFactor *
            avgSpeciesWeight *
            regionalSeasonFactor
        ).toFixed(2)
      );

      const activeTripsPerSeason = Math.round(
        baseTrips * sMeta.activeTripMultiplier
      );

      // Total seasonal catch volume in metric tons (kg * activeTrips / 1000)
      const seasonalCatchTons = Number(
        ((cpueKgPerTrip * activeTripsPerSeason) / 1000).toFixed(1)
      );

      // Minimum Supply-Price inversely correlates with CPUE and positively with wave risk
      const fairEffortPriceRp = Math.round(
        avgYearFairPriceBase *
          (15.5 / Math.max(5.5, cpueKgPerTrip)) *
          (1 + Math.max(0, avgWaveM - 0.6) * 0.12)
      );

      rawCells.push({
        id: `${region}__${sMeta.season}`,
        region,
        regionFullName: regInfo.fullName,
        wppCode: regInfo.wppCode,
        season: sMeta.season,
        shortSeason: sMeta.shortSeason,
        cpueKgPerTrip,
        activeTripsPerSeason,
        seasonalCatchTons,
        fairEffortPriceRp,
        avgWaveM,
        avgWbgtC: wbgt.wbgtC,
        representativeSpecies,
        representativeYear,
      });
    }
  }

  const metricValues = rawCells.map((c) =>
    metric === 'VOLUME_TONS'
      ? c.seasonalCatchTons
      : metric === 'FAIR_PRICE_RP'
        ? c.fairEffortPriceRp
        : c.cpueKgPerTrip
  );

  const minVal = Math.min(...metricValues);
  const maxVal = Math.max(...metricValues);
  const span = Math.max(0.01, maxVal - minVal);

  const cells: SeasonalHeatmapCell[] = rawCells.map((c) => {
    const val =
      metric === 'VOLUME_TONS'
        ? c.seasonalCatchTons
        : metric === 'FAIR_PRICE_RP'
          ? c.fairEffortPriceRp
          : c.cpueKgPerTrip;

    const intensity = Number(clip((val - minVal) / span, 0.08, 1.0).toFixed(2));

    // Classify catch abundance tier based on CPUE/Volume ratio
    const catchScore = (c.cpueKgPerTrip - 7.5) / 16.0;
    let tier: SeasonalHeatmapCell['tier'] = 'MODERATE';
    if (catchScore >= 0.72) tier = 'PEAK_OPTIMAL';
    else if (catchScore >= 0.45) tier = 'HIGH_YIELD';
    else if (catchScore < 0.22) tier = 'LOW_MONSOON';

    const fullCell: SeasonalHeatmapCell = {
      ...c,
      intensity,
      tier,
    };
    rowsByRegion[c.region].push(fullCell);
    return fullCell;
  });

  let peakCell = cells[0];
  let lowestCell = cells[0];
  let sumTons = 0;
  let sumCpue = 0;

  for (const cell of cells) {
    sumTons += cell.seasonalCatchTons;
    sumCpue += cell.cpueKgPerTrip;
    if (cell.cpueKgPerTrip > peakCell.cpueKgPerTrip) peakCell = cell;
    if (cell.cpueKgPerTrip < lowestCell.cpueKgPerTrip) lowestCell = cell;
  }

  return {
    seasons: SEASON_METADATA.map((s) => s.season),
    shortSeasons: SEASON_METADATA.map((s) => s.shortSeason),
    regions,
    cells,
    rowsByRegion,
    peakCell,
    lowestCell,
    totalSeasonalTons: Number(sumTons.toFixed(1)),
    avgMatrixCpueKg: Number((sumCpue / Math.max(1, cells.length)).toFixed(2)),
  };
}




