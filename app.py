"""
PANDU-NELAYAN FastAPI Dual-Engine Random Forest Backend
========================================================
Serves real ML predictions from model_pandu_nelayan.pkl (Dual-Engine Random Forest)
and analytics from the 6,000-row dataset_kelayakan_melaut.csv.

Endpoints:
  GET  /api/health             - System health & model metrics
  POST /api/predict            - Dual-engine AI prediction (classifier + price regressor)
  GET  /api/trips              - Paginated & filtered trip reference data
  GET  /api/analytics/summary  - Aggregated statistics from the full dataset
"""

import os
import math
from typing import Optional
from pathlib import Path

import numpy as np
import pandas as pd
import joblib
from fastapi import FastAPI, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel

# ---------------------------------------------------------------------------
# 1. Auto-locate data files
# ---------------------------------------------------------------------------
CSV_SEARCH_PATHS = [
    "./data/dataset_kelayakan_melaut.csv",
    "./dataset_kelayakan_melaut.csv",
    "./public/assets/aistudio/dataset_kelayakan_melaut_53a4c9bd.csv",
]

PKL_SEARCH_PATHS = [
    "./data/model_pandu_nelayan.pkl",
    "./model_pandu_nelayan.pkl",
]

CSV_PATH: Optional[str] = None
for _p in CSV_SEARCH_PATHS:
    if os.path.exists(_p):
        CSV_PATH = _p
        break

PKL_PATH: Optional[str] = None
for _p in PKL_SEARCH_PATHS:
    if os.path.exists(_p):
        PKL_PATH = _p
        break

# ---------------------------------------------------------------------------
# 2. Load dataset & model bundle
# ---------------------------------------------------------------------------
df: pd.DataFrame = pd.read_csv(CSV_PATH) if CSV_PATH else pd.DataFrame()
bundle: dict = joblib.load(PKL_PATH) if PKL_PATH else {}

classifier = bundle.get("classifier_model")
regressor = bundle.get("price_regressor_model")
classifier_features = bundle.get("classifier_features", [])
regressor_features = bundle.get("regressor_features", [])
zonasi_map = bundle.get("zonasi_map", {})
modal_map = bundle.get("modal_map", {})
spesies_map = bundle.get("spesies_map", {})
accuracy = bundle.get("accuracy", 0.0)
r2_price = bundle.get("r2_price", 0.0)
mae_price = bundle.get("mae_price", 0.0)

print(f"[PANDU-NELAYAN] CSV loaded: {len(df)} rows from {CSV_PATH}")
print(f"[PANDU-NELAYAN] PKL loaded: {PKL_PATH}")
if classifier:
    print(f"  Classifier: {classifier.__class__.__name__} | Accuracy: {accuracy:.4f}")
if regressor:
    print(f"  Regressor:  {regressor.__class__.__name__} | R²: {r2_price:.4f} | MAE: {mae_price:.0f}")

# ---------------------------------------------------------------------------
# 3. Reference constants (mirrored from maritimeFormulas.ts)
# ---------------------------------------------------------------------------
REGION_KKP_COORDS: dict[str, dict] = {
    "Karangantu Serang": {
        "fullName": "Perairan PPN Karangantu Serang",
        "lat": -5.98, "lon": 106.16,
        "kkp_lat": -6.021, "kkp_lon": 106.11,
        "base_cpue_2023": 21.5,
        "defaultDistanceKm": 18.0, "defaultDurationHours": 8.4,
        "defaultTempC": 33.5, "defaultRhPercent": 70.2,
        "defaultWindKnot": 10.23, "defaultWaveM": 0.27,
    },
    "Teluk Banten": {
        "fullName": "Perairan Teluk Banten",
        "lat": -5.9, "lon": 106.22,
        "kkp_lat": -5.85, "kkp_lon": 106.15,
        "base_cpue_2023": 19.5,
        "defaultDistanceKm": 19.5, "defaultDurationHours": 8.5,
        "defaultTempC": 33.2, "defaultRhPercent": 72.0,
        "defaultWindKnot": 11.4, "defaultWaveM": 0.45,
    },
    "Pesisir Indramayu": {
        "fullName": "Perairan Pesisir Indramayu",
        "lat": -6.25, "lon": 108.35,
        "kkp_lat": -6.2, "kkp_lon": 108.28,
        "base_cpue_2023": 18.0,
        "defaultDistanceKm": 22.4, "defaultDurationHours": 9.2,
        "defaultTempC": 34.0, "defaultRhPercent": 74.5,
        "defaultWindKnot": 13.8, "defaultWaveM": 0.95,
    },
    "Kabaena Sultra": {
        "fullName": "Perairan Kabaena Sultra",
        "lat": -5.25, "lon": 121.95,
        "kkp_lat": -5.3, "kkp_lon": 121.9,
        "base_cpue_2023": 14.0,
        "defaultDistanceKm": 24.8, "defaultDurationHours": 9.8,
        "defaultTempC": 33.8, "defaultRhPercent": 75.0,
        "defaultWindKnot": 14.5, "defaultWaveM": 1.18,
    },
    "Ambon Seram": {
        "fullName": "Perairan Ambon Seram",
        "lat": -3.65, "lon": 128.15,
        "kkp_lat": -3.6, "kkp_lon": 128.1,
        "base_cpue_2023": 11.2,
        "defaultDistanceKm": 27.5, "defaultDurationHours": 10.5,
        "defaultTempC": 32.9, "defaultRhPercent": 76.8,
        "defaultWindKnot": 15.8, "defaultWaveM": 1.42,
    },
}

SPECIES_INFO: dict[str, dict] = {
    "Kembung": {"latinName": "Rastrelliger kanagurta", "lm_cm": 19.5, "harga_2023": 26_000, "csvKey": "Kembung (Rastrelliger kanagurta)"},
    "Tongkol": {"latinName": "Euthynnus affinis", "lm_cm": 43.0, "harga_2023": 24_000, "csvKey": "Tongkol (Euthynnus affinis)"},
    "Lemuru": {"latinName": "Sardinella lemuru", "lm_cm": 14.8, "harga_2023": 17_500, "csvKey": "Lemuru (Sardinella lemuru)"},
    "Tenggiri": {"latinName": "Scomberomorus commerson", "lm_cm": 65.0, "harga_2023": 58_000, "csvKey": "Tenggiri (Scomberomorus commerson)"},
}

YEARLY_MULT: dict[int, dict] = {
    2023: {"faktor_cpue": 1.0,  "inflasi": 1.0,  "upah_alt": 15_000},
    2024: {"faktor_cpue": 0.92, "inflasi": 1.05, "upah_alt": 16_000},
    2025: {"faktor_cpue": 0.81, "inflasi": 1.1,  "upah_alt": 17_000},
    2026: {"faktor_cpue": 0.68, "inflasi": 1.16, "upah_alt": 18_000},
}

# CSV ↔ Frontend mapping helpers
CSV_WILAYAH_TO_REGION = {v["fullName"]: k for k, v in REGION_KKP_COORDS.items()}
CSV_SPECIES_TO_KEY = {v["csvKey"]: k for k, v in SPECIES_INFO.items()}
CSV_SEASON_MAP = {
    "Musim Barat (Angin & Gelombang Tinggi)": "Musim Barat (Des-Feb)",
    "Musim Peralihan I (Pancaroba)": "Musim Peralihan I (Mar-Mei)",
    "Musim Timur (Angin Kencang & Arus Kuat)": "Musim Timur (Jun-Agu)",
    "Musim Peralihan II (Tenang & Panas Terik)": "Musim Peralihan II (Sep-Nov)",
}
CSV_DECISION_MAP = {
    "Layak Melaut (Hijau)": "LAYAK MELAUT",
    "Pertimbangkan Ulang (Kuning)": "WASPADA & NEGO HARGA",
    "Tidak Layak / Bahaya (Merah)": "TUNDA MELAUT",
}

# Season → estimated rainfall (mm) for classifier feature
SEASON_RAINFALL = {
    "Musim Barat (Des-Feb)": 15.0,
    "Musim Peralihan I (Mar-Mei)": 5.0,
    "Musim Timur (Jun-Agu)": 1.5,
    "Musim Peralihan II (Sep-Nov)": 3.5,
}

# ---------------------------------------------------------------------------
# 4. Scientific helper functions (matching TypeScript formulas)
# ---------------------------------------------------------------------------

def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Haversine great-circle distance in km."""
    R = 6371.0
    to_rad = math.pi / 180
    d_lat = (lat2 - lat1) * to_rad
    d_lon = (lon2 - lon1) * to_rad
    a = (math.sin(d_lat / 2) ** 2 +
         math.cos(lat1 * to_rad) * math.cos(lat2 * to_rad) *
         math.sin(d_lon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 2)


def classify_kkp_zone(distance_km: float) -> tuple[str, int, str]:
    """Returns (zone_name, kode_zonasi, zone_color)."""
    if distance_km < 2.0:
        return "Zona Inti Larang Tangkap", 0, "crimson"
    if distance_km < 5.0:
        return "Zona Penyangga Konservasi", 1, "amber"
    return "Zona Pemanfaatan Berkelanjutan", 2, "emerald"


def calculate_wbgt(temp_c: float, rh_percent: float, wind_knot: float) -> float:
    """Maritime WBGT index."""
    e = (rh_percent / 100) * 6.105 * math.exp((17.27 * temp_c) / (237.7 + temp_c))
    koreksi_angin = min(3.2, 0.14 * wind_knot)
    wbgt = 0.567 * temp_c + 0.28 * e + 2.1 - koreksi_angin
    return round(wbgt, 2)


def classify_wave_height(wave_m: float) -> str:
    if wave_m <= 0.5:
        return "Tenang"
    if wave_m <= 1.25:
        return "Rendah"
    if wave_m <= 2.5:
        return "Sedang"
    return "Tinggi"


def clip_val(val: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, val))

# ---------------------------------------------------------------------------
# 5. FastAPI application
# ---------------------------------------------------------------------------
app = FastAPI(
    title="PANDU-NELAYAN Dual-Engine AI Backend",
    version="1.0.0",
    description="Python FastAPI backend serving RandomForest predictions from model_pandu_nelayan.pkl",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Endpoint 1: GET /api/health
# ---------------------------------------------------------------------------
@app.get("/api/health")
def health_check():
    return {
        "ok": True,
        "engine": "FastAPI Dual-Engine Random Forest (.pkl)",
        "total_rows": len(df),
        "accuracy": round(accuracy * 100, 2) if accuracy else 0,
        "r2_price": round(r2_price, 4) if r2_price else 0,
        "mae_price": round(mae_price, 0) if mae_price else 0,
        "csv_path": CSV_PATH,
        "pkl_path": PKL_PATH,
    }


# ---------------------------------------------------------------------------
# Endpoint 2: POST /api/predict
# ---------------------------------------------------------------------------
class SimulationInputPayload(BaseModel):
    region: str
    year: int = 2026
    species: str = "Kembung"
    fishLengthCm: float = 20.9
    distanceKm: float = 18.0
    durationHours: float = 8.4
    fuelPriceRp: float = 6800
    iceKg: float = 20
    capitalSource: str = "Mandiri / Koperasi"
    middlemanCutPercent: float = 0.0
    tempC: float = 33.5
    rhPercent: float = 70.2
    windKnot: float = 10.23
    waveM: float = 0.27
    season: str = "Musim Peralihan II (Sep-Nov)"
    targetLat: Optional[float] = None
    targetLon: Optional[float] = None


@app.post("/api/predict")
def predict(payload: SimulationInputPayload):
    try:
        region_key = payload.region
        reg = REGION_KKP_COORDS.get(region_key)
        if not reg:
            return {"ok": False, "error": f"Unknown region: {region_key}"}

        sp_info = SPECIES_INFO.get(payload.species)
        if not sp_info:
            return {"ok": False, "error": f"Unknown species: {payload.species}"}

        y_mult = YEARLY_MULT.get(payload.year, YEARLY_MULT[2026])

        # --- Spatial Conservation ---
        target_lat = payload.targetLat if payload.targetLat is not None else reg["lat"]
        target_lon = payload.targetLon if payload.targetLon is not None else reg["lon"]
        jarak_kkp_km = haversine_km(target_lat, target_lon, reg["kkp_lat"], reg["kkp_lon"])
        zona_kkp, kode_zonasi, zona_color = classify_kkp_zone(jarak_kkp_km)

        # --- Meteorology WBGT ---
        wbgt_c = calculate_wbgt(payload.tempC, payload.rhPercent, payload.windKnot)
        wave_category = classify_wave_height(payload.waveM)
        e_val = (payload.rhPercent / 100) * 6.105 * math.exp((17.27 * payload.tempC) / (237.7 + payload.tempC))
        koreksi_angin = min(3.2, 0.14 * payload.windKnot)
        hydration = 0.8 if wbgt_c >= 31.0 else (0.5 if wbgt_c >= 29.5 else (0.35 if wbgt_c >= 28.0 else 0.25))

        # --- Biology ---
        lm_cm = sp_info["lm_cm"]
        rasio_lm = round(max(0, payload.fishLengthCm) / lm_cm, 2)
        is_biologically_compliant = rasio_lm >= 1.0
        status_biologi = "Layak Tangkap (Dewasa Gonad)" if is_biologically_compliant else "Tangkap Muda (Juvenil < Lm)"

        # --- Fuel & Cold-chain Cost ---
        faktor_gelombang_bbm = 1.0 + 0.15 * max(0, payload.waveM - 1.0)
        konsumsi_bbm_liter = max(0, (max(0, payload.distanceKm) * 0.36 + max(0, payload.durationHours) * 0.4) * faktor_gelombang_bbm)
        biaya_bbm_rp = round(konsumsi_bbm_liter * payload.fuelPriceRp)
        biaya_es_rp = round(max(0, payload.iceKg) * 1200 + 20000)
        total_modal_operasional_rp = biaya_bbm_rp + biaya_es_rp

        # Cold-chain freshness
        base_freshness = 100 - max(0, (wbgt_c - 29.5) * 2.5)
        ice_bonus = (payload.iceKg - 15) * 0.08
        indeks_kesegaran_persen = round(clip_val(base_freshness + ice_bonus, 60, 100), 1)

        # Implicit opportunity cost
        upah_alt_per_jam_rp = y_mult["upah_alt"]
        upah_kerja_wajar_rp = round(payload.durationHours * upah_alt_per_jam_rp)
        kompensasi_risiko_rp = round(max(0, payload.waveM - 0.8) * 20000 + max(0, wbgt_c - 29.0) * 10000)
        total_implicit_cost_rp = upah_kerja_wajar_rp + kompensasi_risiko_rp
        total_economic_cost_rp = total_modal_operasional_rp + total_implicit_cost_rp

        # --- CPUE Estimation ---
        season_key = payload.season
        season_factor_map = {
            "Musim Timur (Jun-Agu)": 1.08,
            "Musim Peralihan II (Sep-Nov)": 1.48,
            "Musim Peralihan I (Mar-Mei)": 1.02,
            "Musim Barat (Des-Feb)": 0.82,
        }
        season_factor = season_factor_map.get(season_key, 1.0)
        wave_catch_factor = max(0.55, 1.0 - max(0, payload.waveM - 0.9) * 0.18)
        cpue_kg = round(max(3.5, reg["base_cpue_2023"] * y_mult["faktor_cpue"] * season_factor * wave_catch_factor), 2)

        # --- Hauling frequency (derived) ---
        frekuensi_hauling = max(1, round(payload.durationHours / 2.5))

        # --- Species & Modal codes ---
        csv_species_key = sp_info["csvKey"]
        kode_spesies = spesies_map.get(csv_species_key, 0)
        kode_modal = modal_map.get(payload.capitalSource, 1)

        # --- Curah hujan (estimated from season) ---
        curah_hujan_mm = SEASON_RAINFALL.get(season_key, 5.0)

        # --- Pricing ---
        harga_acuan_tpi_rp = round(sp_info["harga_2023"] * y_mult["inflasi"] * (indeks_kesegaran_persen / 100))
        potongan_persen = max(15, payload.middlemanCutPercent) if payload.capitalSource == "Pinjaman Tengkulak" else min(4, payload.middlemanCutPercent)
        harga_aktual_tengkulak_rp = round(harga_acuan_tpi_rp * (1 - potongan_persen / 100))

        # =====================================================================
        # DUAL-ENGINE ML PREDICTIONS (from .pkl)
        # =====================================================================

        # Build regressor feature vector
        regressor_input = {
            "wbgt_index_c": wbgt_c,
            "tinggi_gelombang_m": payload.waveM,
            "kode_spesies": kode_spesies,
            "durasi_melaut_jam": payload.durationHours,
            "total_modal_operasional_rp": total_modal_operasional_rp,
            "cpue_estimasi_kg": cpue_kg,
        }

        # Build classifier feature vector
        classifier_input = {
            "kode_zonasi": kode_zonasi,
            "jarak_kkp_km": jarak_kkp_km,
            "suhu_udara_c": payload.tempC,
            "kelembapan_persen": payload.rhPercent,
            "wbgt_index_c": wbgt_c,
            "curah_hujan_mm": curah_hujan_mm,
            "kecepatan_angin_knot": payload.windKnot,
            "tinggi_gelombang_m": payload.waveM,
            "kode_spesies": kode_spesies,
            "rasio_ukuran_lm": rasio_lm,
            "jarak_tempuh_km": payload.distanceKm,
            "durasi_melaut_jam": payload.durationHours,
            "frekuensi_hauling": frekuensi_hauling,
            "konsumsi_bbm_liter": round(konsumsi_bbm_liter, 1),
            "total_modal_operasional_rp": total_modal_operasional_rp,
            "cpue_estimasi_kg": cpue_kg,
            "kode_modal": kode_modal,
            "potongan_tengkulak_persen": payload.middlemanCutPercent,
        }

        # --- Price Regressor Prediction ---
        if regressor and regressor_features:
            reg_X = np.array([[regressor_input[f] for f in regressor_features]])
            harga_layak_effort_rp = round(float(regressor.predict(reg_X)[0]))
        else:
            harga_layak_effort_rp = round(total_economic_cost_rp / max(1, cpue_kg))

        # --- Classifier Prediction ---
        class_probabilities = [0.0, 0.0, 0.0]
        if classifier and classifier_features:
            clf_X = np.array([[classifier_input[f] for f in classifier_features]])
            raw_class = int(classifier.predict(clf_X)[0])
            try:
                probs = classifier.predict_proba(clf_X)[0]
                class_probabilities = [round(float(p), 4) for p in probs]
            except Exception:
                class_probabilities = [0.0, 0.0, 0.0]
                if raw_class < len(class_probabilities):
                    class_probabilities[raw_class] = 1.0

            # Override to class 0 if inside KKP core zone
            if jarak_kkp_km < 2.0:
                raw_class = 0
            decision_class = raw_class
        else:
            decision_class = 2

        # Map class to labels
        if decision_class == 0:
            decision_label = "TUNDA MELAUT (RISIKO TINGGI / RUGI EFFORT)"
            short_badge = "TUNDA MELAUT"
            decision_color = "crimson"
        elif decision_class == 1:
            decision_label = "WASPADA (MITIGASI PANAS & NEGOSIASI HARGA)"
            short_badge = "WASPADA & NEGO HARGA"
            decision_color = "amber"
        else:
            decision_label = "LAYAK MELAUT (AMAN & HARGA SESUAI EFFORT)"
            short_badge = "LAYAK MELAUT"
            decision_color = "emerald"

        # --- AI Feasibility Score ---
        skor = 100.0
        skor -= max(0, (payload.waveM - 1.1) * 22.0)
        skor -= max(0, (payload.windKnot - 14.0) * 1.5)
        skor -= max(0, (wbgt_c - 30.5) * 6.0)
        if not is_biologically_compliant:
            skor -= 15.0
        if zona_kkp == "Zona Penyangga Konservasi":
            skor -= 12.0

        rasio_kelayakan_harga_persen = round((harga_aktual_tengkulak_rp / max(1, harga_layak_effort_rp)) * 100, 1)
        if rasio_kelayakan_harga_persen < 85.0:
            skor -= 30.0

        pendapatan_kotor_rp = round(cpue_kg * harga_aktual_tengkulak_rp)
        laba_akuntansi_rp = pendapatan_kotor_rp - total_modal_operasional_rp
        laba_ekonomi_riil_rp = pendapatan_kotor_rp - total_economic_cost_rp

        if laba_akuntansi_rp <= 0:
            skor -= 40.0
        if zona_kkp == "Zona Inti Larang Tangkap":
            skor = 0.0
        skor = round(clip_val(skor, 0, 100), 1)

        harga_impas_minimal_rp = round(total_modal_operasional_rp / max(1, cpue_kg))
        upah_melaut_per_jam_rp = round(laba_akuntansi_rp / max(1, payload.durationHours))
        is_accounting_profit_illusion = laba_akuntansi_rp > 0 and laba_ekonomi_riil_rp < 0

        # --- Recommendations ---
        recommendations: list[str] = []
        if zona_kkp == "Zona Inti Larang Tangkap":
            recommendations.append(
                f"PELANGGARAN SPASIAL KKP: Titik tangkap berjarak {jarak_kkp_km} km (< 2.0 km). "
                f"Geser haluan minimal {round(5.0 - jarak_kkp_km, 1)} km keluar."
            )
        elif zona_kkp == "Zona Penyangga Konservasi":
            recommendations.append(f"ZONA PENYANGGA ({jarak_kkp_km} km dari KKP): Gunakan alat tangkap pasif selektif.")
        if is_accounting_profit_illusion:
            recommendations.append(
                f"ILUSI LABA AKUNTANSI: Ada sisa kas Rp {laba_akuntansi_rp:,.0f} tapi "
                f"upah bersih hanya Rp {upah_melaut_per_jam_rp:,.0f}/jam. Tuntut harga minimal Rp {harga_layak_effort_rp:,.0f}/kg."
            )
        if not is_biologically_compliant:
            recommendations.append(
                f"KOREKSI BIOLOGI: Panjang {payload.fishLengthCm} cm < Lm {lm_cm} cm (Rasio {rasio_lm}). Perbesar mesh size."
            )
        if wbgt_c >= 29.8:
            recommendations.append(f"STRES PANAS WBGT ({wbgt_c}°C): Wajib minum elektrolit {hydration} L/jam.")
        if not recommendations:
            recommendations.append(f"KONDISI OPTIMAL: Cuaca aman, zona legal, ukuran ikan dewasa, harga sesuai effort.")

        land_activities = [
            {"title": "Perbaikan Alat Tangkap & Jaring Koperasi", "estDailyIncomeRp": round(upah_alt_per_jam_rp * 8), "detail": "Upah harian pasti tanpa risiko solar & es."},
            {"title": "Pengolahan Ikan Asin / Pemindangan", "estDailyIncomeRp": round(upah_alt_per_jam_rp * 8.5), "detail": "Nilai tambah jual +35%."},
            {"title": "Logistik Rantai Dingin & Sortir Lelang TPI", "estDailyIncomeRp": round(upah_alt_per_jam_rp * 7.5), "detail": "Kerja paruh waktu di TPI setempat."},
        ]

        # --- Build full SimulationOutput response ---
        result = {
            # Spatial
            "targetLat": target_lat,
            "targetLon": target_lon,
            "kkpLat": reg["kkp_lat"],
            "kkpLon": reg["kkp_lon"],
            "jarakKkpKm": jarak_kkp_km,
            "zonaKkp": zona_kkp,
            "zonaKkpColor": zona_color,
            # Meteorology
            "vaporPressureHpa": round(e_val, 2),
            "windChillCorrection": round(koreksi_angin, 2),
            "wbgtC": wbgt_c,
            "hydrationLitersPerHour": hydration,
            "waveCategory": wave_category,
            # Biology
            "lmAcuanCm": lm_cm,
            "rasioLm": rasio_lm,
            "statusBiologi": status_biologi,
            "isBiologicallyCompliant": is_biologically_compliant,
            # Economics
            "cpueKg": cpue_kg,
            "faktorGelombangBbm": round(faktor_gelombang_bbm, 3),
            "konsumsiBbmLiter": round(konsumsi_bbm_liter, 1),
            "biayaBbmRp": biaya_bbm_rp,
            "biayaEsPerbekalanRp": biaya_es_rp,
            "totalModalOperasionalRp": total_modal_operasional_rp,
            "indeksKesegaranPersen": indeks_kesegaran_persen,
            "upahAltPerJamRp": upah_alt_per_jam_rp,
            "upahKerjaWajarRp": upah_kerja_wajar_rp,
            "kompensasiRisikoRp": kompensasi_risiko_rp,
            "totalImplicitCostRp": total_implicit_cost_rp,
            "totalEconomicCostRp": total_economic_cost_rp,
            # Pricing
            "hargaAcuanTpiRp": harga_acuan_tpi_rp,
            "potonganModalPersen": potongan_persen,
            "hargaAktualTengkulakRp": harga_aktual_tengkulak_rp,
            "hargaImpasMinimalRp": harga_impas_minimal_rp,
            "hargaLayakEffortRp": harga_layak_effort_rp,
            "rasioKelayakanHargaPersen": rasio_kelayakan_harga_persen,
            "pendapatanKotorRp": pendapatan_kotor_rp,
            "labaAkuntansiRp": laba_akuntansi_rp,
            "labaEkonomiRiilRp": laba_ekonomi_riil_rp,
            "upahMelautPerJamRp": upah_melaut_per_jam_rp,
            "isAccountingProfitIllusion": is_accounting_profit_illusion,
            # AI Decision
            "skorKelayakanAi": skor,
            "decisionClass": decision_class,
            "decisionLabel": decision_label,
            "shortDecisionBadge": short_badge,
            "decisionColor": decision_color,
            "recommendations": recommendations,
            "landTradeoffActivities": land_activities,
            # PKL-specific extras
            "aiEngineSource": "Python RandomForest (.pkl)",
            "classProbabilities": class_probabilities,
        }

        return {"ok": True, "data": result}

    except Exception as exc:
        return {"ok": False, "error": str(exc)}


# ---------------------------------------------------------------------------
# Endpoint 3: GET /api/trips
# ---------------------------------------------------------------------------
@app.get("/api/trips")
def get_trips(
    region: Optional[str] = Query(None),
    year: Optional[int] = Query(None),
    season: Optional[str] = Query(None),
    species: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(250, ge=1, le=6000),
    offset: int = Query(0, ge=0),
):
    if df.empty:
        return {"ok": False, "error": "CSV dataset not loaded", "rows": [], "total": 0}

    filtered = df.copy()

    # Apply filters using CSV column values
    if region:
        # Accept both frontend key and CSV fullName
        csv_region = REGION_KKP_COORDS.get(region, {}).get("fullName", region)
        filtered = filtered[filtered["wilayah_dpi"] == csv_region]

    if year:
        filtered = filtered[filtered["tahun"] == year]

    if season:
        # Accept both frontend season and CSV season
        csv_seasons = {v: k for k, v in CSV_SEASON_MAP.items()}
        csv_season = csv_seasons.get(season, season)
        filtered = filtered[filtered["musim_tangkap"] == csv_season]

    if species:
        csv_sp = SPECIES_INFO.get(species, {}).get("csvKey", species)
        filtered = filtered[filtered["spesies_target"] == csv_sp]

    if search:
        q = search.lower()
        mask = (
            filtered["wilayah_dpi"].str.lower().str.contains(q, na=False) |
            filtered["spesies_target"].str.lower().str.contains(q, na=False)
        )
        filtered = filtered[mask]

    total = len(filtered)
    page = filtered.iloc[offset:offset + limit]

    # Decision badge mapping from status_rekomendasi
    DECISION_BADGE_MAP = {
        "LAYAK MELAUT (AMAN & SESUAI EFFORT)": "LAYAK MELAUT",
        "WASPADA & NEGOSIASI HARGA": "WASPADA & NEGO HARGA",
        "TUNDA MELAUT (RISIKO TINGGI)": "TUNDA MELAUT",
    }

    rows = []
    for idx, row in page.iterrows():
        csv_wilayah = str(row.get("wilayah_dpi", ""))
        csv_species = str(row.get("spesies_target", ""))
        csv_season_val = str(row.get("musim_tangkap", ""))
        csv_status = str(row.get("status_rekomendasi", ""))
        label_kep = int(row.get("label_keputusan", 1))

        region_key = CSV_WILAYAH_TO_REGION.get(csv_wilayah, csv_wilayah)
        species_key = CSV_SPECIES_TO_KEY.get(csv_species, csv_species)
        season_mapped = CSV_SEASON_MAP.get(csv_season_val, csv_season_val)

        # Map decision badge from label_keputusan or status_rekomendasi
        if label_kep == 2:
            decision_badge = "LAYAK MELAUT"
        elif label_kep == 1:
            decision_badge = "WASPADA & NEGO HARGA"
        elif label_kep == 0:
            decision_badge = "TUNDA MELAUT"
        else:
            decision_badge = DECISION_BADGE_MAP.get(csv_status, "WASPADA & NEGO HARGA")

        # Extract Latin name from the CSV species string
        latin_name = ""
        if "(" in csv_species and ")" in csv_species:
            latin_name = csv_species.split("(")[1].rstrip(")")
        elif species_key in SPECIES_INFO:
            latin_name = SPECIES_INFO[species_key]["latinName"]

        # Derive lm_cm from species
        sp = SPECIES_INFO.get(species_key, {})
        lm_cm = sp.get("lm_cm", 19.5)
        rasio_lm = float(row.get("rasio_ukuran_lm", 0))
        caught_length_cm = round(rasio_lm * lm_cm, 1) if rasio_lm > 0 else 0.0

        # Compute implicit cost: upah_per_jam * durasi as approximation
        durasi = float(row.get("durasi_melaut_jam", 0))
        yr = int(row.get("tahun", 2026))
        upah_alt = YEARLY_MULT.get(yr, YEARLY_MULT[2026])["upah_alt"]
        implicit_cost_rp = round(durasi * upah_alt)

        # Explicit cost = total_modal_operasional_rp
        explicit_cost_rp = float(row.get("total_modal_operasional_rp", 0))

        # Prices
        harga_jual = float(row.get("harga_jual_aktual_rp", 0))
        potongan = float(row.get("potongan_tengkulak_persen", 0))
        tengkulak_price = round(harga_jual * (1 - potongan / 100)) if potongan > 5 else round(harga_jual)
        tpi_price = round(harga_jual)

        # Profits
        cpue_kg = float(row.get("cpue_estimasi_kg", 0))
        accounting_profit = float(row.get("margin_bersih_rp", 0))
        economic_profit = round(accounting_profit - implicit_cost_rp)

        rows.append({
            "id": f"TRIP-{yr}-{int(idx)+1:04d}",
            "region": region_key,
            "year": yr,
            "season": season_mapped,
            "species": species_key,
            "latinName": latin_name,
            "lmCm": lm_cm,
            "caughtLengthCm": caught_length_cm,
            "lmRatio": rasio_lm,
            "cpueKg": cpue_kg,
            "fuelLiters": float(row.get("konsumsi_bbm_liter", 0)),
            "explicitCostRp": explicit_cost_rp,
            "implicitCostRp": implicit_cost_rp,
            "tpiPriceRp": tpi_price,
            "tengkulakPriceRp": tengkulak_price,
            "fairEffortPriceRp": float(row.get("harga_layak_effort_rp", 0)),
            "accountingProfitRp": accounting_profit,
            "economicProfitRp": economic_profit,
            "wbgtC": float(row.get("wbgt_index_c", 0)),
            "kkpDistanceKm": float(row.get("jarak_kkp_km", 0)),
            "aiScore": float(row.get("skor_kelayakan", 0)),
            "decisionBadge": decision_badge,
        })

    return {"ok": True, "rows": rows, "total": total, "limit": limit, "offset": offset}


# ---------------------------------------------------------------------------
# Endpoint 4: GET /api/analytics/summary
# ---------------------------------------------------------------------------
@app.get("/api/analytics/summary")
def analytics_summary():
    if df.empty:
        return {"ok": False, "error": "CSV dataset not loaded"}

    # 4a. Yearly Trends
    yearly_trends = []
    if "tahun" in df.columns:
        grouped_year = df.groupby("tahun")
        for year_val, grp in grouped_year:
            yearly_trends.append({
                "year": int(year_val),
                "avgCpueKg": round(float(grp["cpue_estimasi_kg"].mean()), 2),
                "avgDistanceKm": round(float(grp["jarak_tempuh_km"].mean()), 2),
                "avgFairPriceRp": round(float(grp["harga_layak_effort_rp"].mean()), 0),
                "avgWbgtC": round(float(grp["wbgt_index_c"].mean()), 2),
                "avgTotalModalRp": round(float(grp["total_modal_operasional_rp"].mean()), 0),
                "tripCount": int(len(grp)),
            })

    # 4b. Regional Costs
    regional_costs = []
    if "wilayah_dpi" in df.columns:
        grouped_region = df.groupby("wilayah_dpi")
        for wilayah, grp in grouped_region:
            region_key = CSV_WILAYAH_TO_REGION.get(str(wilayah), str(wilayah))
            regional_costs.append({
                "region": region_key,
                "fullName": str(wilayah),
                "avgExplicitCostRp": round(float(grp["total_modal_operasional_rp"].mean()), 0),
                "avgImplicitCostRp": round(float((grp["durasi_melaut_jam"] * grp["tahun"].map(lambda y: YEARLY_MULT.get(int(y), YEARLY_MULT[2026])["upah_alt"])).mean()), 0),
                "avgCpueKg": round(float(grp["cpue_estimasi_kg"].mean()), 2),
                "avgFairPriceRp": round(float(grp["harga_layak_effort_rp"].mean()), 0),
            })

    # 4c. Seasonal Matrix
    seasonal_matrix = []
    if "wilayah_dpi" in df.columns and "musim_tangkap" in df.columns:
        grouped_season = df.groupby(["wilayah_dpi", "musim_tangkap"])
        for (wilayah, musim), grp in grouped_season:
            region_key = CSV_WILAYAH_TO_REGION.get(str(wilayah), str(wilayah))
            season_mapped = CSV_SEASON_MAP.get(str(musim), str(musim))
            seasonal_matrix.append({
                "region": region_key,
                "season": season_mapped,
                "avgCpueKg": round(float(grp["cpue_estimasi_kg"].mean()), 2),
                "avgWaveM": round(float(grp["tinggi_gelombang_m"].mean()), 2),
                "avgWbgtC": round(float(grp["wbgt_index_c"].mean()), 2),
                "avgFairPriceRp": round(float(grp["harga_layak_effort_rp"].mean()), 0),
                "totalCatchVolume": round(float(grp["cpue_estimasi_kg"].sum()), 1),
            })

    # 4d. Feature Importances (from the trained models)
    feature_importances = {}
    if classifier and hasattr(classifier, "feature_importances_"):
        clf_imp = dict(zip(classifier_features, [round(float(x), 4) for x in classifier.feature_importances_]))
        feature_importances["classifier"] = clf_imp
    if regressor and hasattr(regressor, "feature_importances_"):
        reg_imp = dict(zip(regressor_features, [round(float(x), 4) for x in regressor.feature_importances_]))
        feature_importances["regressor"] = reg_imp

    # Group into 5 Academic Course Modules
    module_groups = {
        "MK Analisis Hasil Tangkapan": ["total_modal_operasional_rp", "cpue_estimasi_kg", "konsumsi_bbm_liter",
                                         "kode_modal", "potongan_tengkulak_persen", "durasi_melaut_jam", "frekuensi_hauling"],
        "MK Meteorologi & Klimatologi": ["wbgt_index_c", "tinggi_gelombang_m", "kecepatan_angin_knot",
                                          "suhu_udara_c", "kelembapan_persen", "curah_hujan_mm"],
        "MK Konservasi Sumberdaya Perairan": ["kode_zonasi", "jarak_kkp_km", "jarak_tempuh_km"],
        "MK Dinamika Populasi Ikan": ["kode_spesies", "rasio_ukuran_lm"],
    }

    module_importances = {}
    if "classifier" in feature_importances:
        for module_name, feature_list in module_groups.items():
            total_imp = sum(feature_importances["classifier"].get(f, 0) for f in feature_list)
            module_importances[module_name] = round(total_imp * 100, 1)

    feature_importances["modules"] = module_importances

    return {
        "ok": True,
        "yearlyTrends": yearly_trends,
        "regionalCosts": regional_costs,
        "seasonalMatrix": seasonal_matrix,
        "featureImportances": feature_importances,
    }


# ---------------------------------------------------------------------------
# Production static file serving (Vite build output)
# ---------------------------------------------------------------------------
DIST_DIR = Path(__file__).parent / "dist"

if DIST_DIR.is_dir():
    # Serve /assets/* and other static files from dist/
    app.mount("/assets", StaticFiles(directory=str(DIST_DIR / "assets")), name="assets")

    # Serve any static file that exists in dist/ (favicon, etc.)
    @app.get("/{full_path:path}")
    def serve_spa(full_path: str):
        """SPA fallback: serve the file if it exists, otherwise index.html."""
        file_path = DIST_DIR / full_path
        if file_path.is_file():
            return FileResponse(str(file_path))
        return FileResponse(str(DIST_DIR / "index.html"))

    print(f"[PANDU-NELAYAN] Serving static frontend from {DIST_DIR}")
else:
    print(f"[PANDU-NELAYAN] No dist/ folder found — run 'npm run build' first for production")


# ---------------------------------------------------------------------------
# Run with: uvicorn app:app --reload --port 8000
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=True)
