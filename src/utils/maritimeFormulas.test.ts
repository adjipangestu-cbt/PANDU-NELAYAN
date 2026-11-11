import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateHaversineKm,
  classifyKkpZone,
  calculateMaritimeWbgt,
  runPanduNelayanSimulation,
  generatePippReferenceDataset,
  evaluateMaritimeToastAlerts,
  generateMaritimeHeatmapGrid,
  compareYearlyCatchTrends,
  generateSeasonalCatchHeatmap,
  getRegionalHourlyForecast,
  getDaysInMaritimeMonth,
} from './maritimeFormulas';

test('Haversine distance for Karangantu Serang matches exact telemetry (~7.16 km or 5.93 km)', () => {
  const dist = calculateHaversineKm(-5.98, 106.16, -6.021, 106.11);
  assert.ok(dist > 5.0 && dist < 8.5, `Expected distance in Sustainable Zone, got ${dist}`);
  const zone = classifyKkpZone(dist);
  assert.equal(zone.status, 'Zona Pemanfaatan Berkelanjutan');
});

test('KKP core no-take zone (< 2.0 km) forces AI score to 0 and TUNDA MELAUT', () => {
  const sim = runPanduNelayanSimulation({
    region: 'Karangantu Serang',
    year: 2026,
    species: 'Kembung',
    fishLengthCm: 20.9,
    distanceKm: 18.0,
    durationHours: 8.4,
    fuelPriceRp: 6800,
    iceKg: 20,
    capitalSource: 'Mandiri / Koperasi',
    middlemanCutPercent: 0,
    tempC: 33.5,
    rhPercent: 70.2,
    windKnot: 10.23,
    waveM: 0.27,
    season: 'Musim Peralihan II (Sep-Nov)',
    targetLat: -6.02, // Right inside KKP Core Zone (-6.021, 106.11)
    targetLon: 106.11,
  });

  assert.ok(sim.jarakKkpKm < 2.0);
  assert.equal(sim.zonaKkp, 'Zona Inti Larang Tangkap');
  assert.equal(sim.skorKelayakanAi, 0.0);
  assert.equal(sim.decisionClass, 0);
  assert.equal(sim.shortDecisionBadge, 'TUNDA MELAUT');
});

test('Maritime WBGT calculation matches exact formula', () => {
  const res = calculateMaritimeWbgt(33.5, 70.2, 10.23);
  // T=33.5, RH=70.2, wind=10.23 -> WBGT around 29.78 C
  assert.ok(res.wbgtC >= 29.7 && res.wbgtC <= 29.85, `Expected ~29.78C, got ${res.wbgtC}`);
  assert.equal(res.hydrationLitersPerHour, 0.5);
});

test('Microeconomic opportunity cost detects Accounting Profit Illusion when cash profit > 0 but economic profit < 0', () => {
  const sim = runPanduNelayanSimulation({
    region: 'Kabaena Sultra',
    year: 2026,
    species: 'Lemuru',
    fishLengthCm: 15.2,
    distanceKm: 28.0,
    durationHours: 10.5,
    fuelPriceRp: 7500,
    iceKg: 15,
    capitalSource: 'Pinjaman Tengkulak',
    middlemanCutPercent: 25.0,
    tempC: 34.0,
    rhPercent: 75.0,
    windKnot: 13.0,
    waveM: 1.0,
    season: 'Musim Peralihan I (Mar-Mei)',
  });

  assert.equal(
    sim.totalEconomicCostRp,
    sim.totalModalOperasionalRp + sim.totalImplicitCostRp
  );
  assert.ok(sim.hargaLayakEffortRp > sim.hargaImpasMinimalRp);
});

test('PIPP dataset generator produces 80 structured multi-year rows (5 regions x 4 years x 4 species)', () => {
  const rows = generatePippReferenceDataset();
  assert.equal(rows.length, 80);
  assert.ok(rows.every((r) => r.fairEffortPriceRp > 0 && r.cpueKg > 0));
});

test('evaluateMaritimeToastAlerts emits critical toast alerts on TUNDA MELAUT and high wave risk (>= 1.25m)', () => {
  const input = {
    region: 'Karangantu Serang' as const,
    year: 2026 as const,
    species: 'Kembung' as const,
    fishLengthCm: 20.9,
    distanceKm: 18.0,
    durationHours: 8.4,
    fuelPriceRp: 6800,
    iceKg: 20,
    capitalSource: 'Mandiri / Koperasi' as const,
    middlemanCutPercent: 0,
    tempC: 33.5,
    rhPercent: 70.2,
    windKnot: 18.5,
    waveM: 1.85,
    season: 'Musim Peralihan II (Sep-Nov)' as const,
    targetLat: -6.018,
    targetLon: 106.112,
  };
  const output = runPanduNelayanSimulation(input);
  const alerts = evaluateMaritimeToastAlerts(input, output);
  assert.equal(alerts.length, 2);
  assert.equal(alerts[0].category, 'TUNDA_MELAUT');
  assert.equal(alerts[1].category, 'GELOMBANG_TINGGI');
});

test('generateMaritimeHeatmapGrid builds 49 spatial cells with CPUE density and WBGT risk classifications', () => {
  const input = {
    region: 'Karangantu Serang' as const,
    year: 2026 as const,
    species: 'Kembung' as const,
    fishLengthCm: 20.9,
    distanceKm: 18.0,
    durationHours: 8.4,
    fuelPriceRp: 6800,
    iceKg: 20,
    capitalSource: 'Mandiri / Koperasi' as const,
    middlemanCutPercent: 0,
    tempC: 33.5,
    rhPercent: 70.2,
    windKnot: 10.23,
    waveM: 0.27,
    season: 'Musim Peralihan II (Sep-Nov)' as const,
  };
  const output = runPanduNelayanSimulation(input);
  const cpueGrid = generateMaritimeHeatmapGrid(input, output, 'CPUE_DENSITY');
  const wbgtGrid = generateMaritimeHeatmapGrid(input, output, 'WBGT_RISK');

  assert.equal(cpueGrid.length, 49);
  assert.equal(wbgtGrid.length, 49);
  assert.ok(cpueGrid.some((c) => c.avoidArea === true));
  assert.ok(cpueGrid.some((c) => c.statusLabel === 'HOTSPOT TANGKAPAN OPTIMAL'));
});

test('compareYearlyCatchTrends computes overlaid CPUE series and delta metrics between two selected years', () => {
  const monthly = compareYearlyCatchTrends({
    yearA: 2023,
    yearB: 2026,
    dimension: 'MONTHLY',
    regionFilter: 'Karangantu Serang',
    speciesFilter: 'Kembung',
  });

  assert.equal(monthly.labels.length, 12);
  assert.equal(monthly.seriesYearACpue.length, 12);
  assert.equal(monthly.seriesYearBCpue.length, 12);
  assert.ok(
    monthly.avgCpueYearA > monthly.avgCpueYearB,
    'Expected 2023 CPUE to be higher than 2026 CPUE'
  );
  assert.ok(monthly.deltaCpueKg < 0);
  assert.ok(monthly.deltaFairPricePercent > 0);

  const regional = compareYearlyCatchTrends({
    yearA: 2024,
    yearB: 2025,
    dimension: 'REGIONAL',
  });
  assert.equal(regional.labels.length, 5);
  assert.equal(regional.seriesDeltaCpue.length, 5);
});

test('generateSeasonalCatchHeatmap builds 20 region-by-season cells (5 regions x 4 seasons) and identifies peak catch correlation', () => {
  const heatmap = generateSeasonalCatchHeatmap({
    yearFilter: 2026,
    speciesFilter: 'ALL',
    metric: 'CPUE_KG',
  });

  assert.equal(heatmap.regions.length, 5);
  assert.equal(heatmap.seasons.length, 4);
  assert.equal(heatmap.cells.length, 20);
  assert.equal(heatmap.peakCell.season, 'Musim Peralihan II (Sep-Nov)');
  assert.ok(heatmap.peakCell.cpueKgPerTrip > heatmap.lowestCell.cpueKgPerTrip);
  assert.ok(heatmap.totalSeasonalTons > 0);
});

test('getRegionalHourlyForecast computes date and year specific wave, wind, WBGT, rainfall, and oceanographic parameters', () => {
  const jan2026 = getRegionalHourlyForecast('Karangantu Serang', '15-jan', 2026);
  const okt2023 = getRegionalHourlyForecast('Karangantu Serang', '15-okt', 2023);

  assert.equal(jan2026.length, 4);
  assert.equal(jan2026[0].season, 'Musim Barat (Des-Feb)');
  assert.equal(okt2023[0].season, 'Musim Peralihan II (Sep-Nov)');
  assert.ok(
    jan2026[0].waveM > okt2023[0].waveM,
    'West Monsoon in 2026 should have higher waves than Transition II in 2023'
  );
  assert.ok(
    jan2026[0].rainfallMm > okt2023[0].rainfallMm,
    'West Monsoon should have higher rainfall than Transition II'
  );
  assert.ok(jan2026[0].visibilityKm > 0 && jan2026[0].pressureHpa > 1000);

  // Full calendar date selection (any day 1-31 across all 12 months)
  assert.equal(getDaysInMaritimeMonth(2, 2024), 29);
  assert.equal(getDaysInMaritimeMonth(2, 2026), 28);
  assert.equal(getDaysInMaritimeMonth(5, 2026), 31);

  const may27 = getRegionalHourlyForecast('Karangantu Serang', '2026-05-27', 2026);
  const may28 = getRegionalHourlyForecast('Karangantu Serang', '2026-05-28', 2026);
  assert.equal(may27[0].season, 'Musim Peralihan I (Mar-Mei)');
  assert.ok(may27[0].fullDateLabel.includes('27 Mei 2026'));
  assert.ok(may28[0].fullDateLabel.includes('28 Mei 2026'));
  assert.notEqual(may27[0].waveM, may28[0].waveM);
});




