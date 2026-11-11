import React from 'react';
import {
  Compass,
  ChevronRight,
  Waves,
  ThermometerSun,
  Scale,
  Cpu,
} from 'lucide-react';

export type NavTab =
  | 'hero'
  | 'bento'
  | 'webgis'
  | 'simulator'
  | 'analytics';

interface HeroLandingViewProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export const HeroLandingView: React.FC<HeroLandingViewProps> = ({
  onSelectTab,
}) => {
  return (
    <section
      aria-label="Halaman Utama PANDU-NELAYAN"
      className="relative min-h-screen w-full overflow-hidden bg-[#0F172A] text-[#F8FAFC] flex flex-col justify-between"
    >
      {/* Atmospheric Stormy Dusk Ocean Horizon Background & Artisanal Vessel Visual */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
        {/* Stormy sky & deep ocean horizon gradient */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 65% 42%, rgba(6, 182, 212, 0.22) 0%, rgba(30, 58, 138, 0.38) 38%, rgba(15, 23, 42, 0.96) 78%), linear-gradient(180deg, #1E293B 0%, #0F172A 54%, #091020 100%)',
          }}
        />

        {/* Subtle atmospheric cloud & horizon glow */}
        <svg
          viewBox="0 0 1440 900"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full object-cover opacity-90"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <linearGradient id="skyHorizon" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1E293B" stopOpacity="0.9" />
              <stop offset="48%" stopColor="#334155" stopOpacity="0.65" />
              <stop offset="53%" stopColor="#06B6D4" stopOpacity="0.28" />
              <stop offset="55%" stopColor="#0F172A" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#070C18" stopOpacity="1" />
            </linearGradient>
            <linearGradient id="waterShimmer" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#06B6D4" stopOpacity="0" />
              <stop offset="50%" stopColor="#06B6D4" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
            </linearGradient>
            <radialGradient id="radarAura" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.28" />
              <stop offset="60%" stopColor="#06B6D4" stopOpacity="0.06" />
              <stop offset="100%" stopColor="#06B6D4" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Sky to Sea Canvas */}
          <rect width="1440" height="900" fill="url(#skyHorizon)" />

          {/* Horizon Line & Ocean Swells */}
          <line
            x1="0"
            y1="485"
            x2="1440"
            y2="485"
            stroke="url(#waterShimmer)"
            strokeWidth="2"
          />
          <ellipse cx="920" cy="520" rx="460" ry="95" fill="url(#radarAura)" />

          {/* Ocean Wave Texture Lines */}
          <path
            d="M0 530 Q 360 518, 720 530 T 1440 526"
            stroke="#38BDF8"
            strokeOpacity="0.16"
            strokeWidth="1.5"
            fill="none"
          />
          <path
            d="M0 575 Q 420 560, 840 578 T 1440 570"
            stroke="#06B6D4"
            strokeOpacity="0.2"
            strokeWidth="1.5"
            fill="none"
          />
          <path
            d="M0 640 Q 480 622, 960 644 T 1440 635"
            stroke="#3B82F6"
            strokeOpacity="0.14"
            strokeWidth="2"
            fill="none"
          />

          {/* Spatial KKP Radar Rings around the Artisanal Vessel on Right Horizon */}
          <ellipse
            cx="1060"
            cy="560"
            rx="280"
            ry="54"
            stroke="#10B981"
            strokeOpacity="0.4"
            strokeWidth="1.5"
            strokeDasharray="8 6"
          />
          <ellipse
            cx="1060"
            cy="560"
            rx="185"
            ry="35"
            stroke="#06B6D4"
            strokeOpacity="0.6"
            strokeWidth="1.5"
          />

          {/* Centerpiece Silhouette & Detailed Indonesian Artisanal Fishing Vessel (< 5 GT) on Right Horizon */}
          <g className="animate-wave-drift" transform="translate(820, 365)">
            {/* Vessel Water Reflection */}
            <ellipse
              cx="240"
              cy="205"
              rx="185"
              ry="16"
              fill="#020617"
              fillOpacity="0.7"
            />
            <ellipse
              cx="240"
              cy="210"
              rx="140"
              ry="8"
              fill="#06B6D4"
              fillOpacity="0.22"
            />

            {/* Traditional Wooden Hull (Perahu Motor Tempel Nusantara < 5 GT) */}
            <path
              d="M45 162 L92 196 L385 196 L438 148 L395 152 L348 166 L128 166 L75 145 Z"
              fill="#0F172A"
              stroke="#38BDF8"
              strokeWidth="2"
            />
            {/* Cyan/Pelagic Hull Stripe */}
            <path
              d="M68 164 L398 164 L386 176 L82 176 Z"
              fill="#06B6D4"
              fillOpacity="0.85"
            />
            {/* Bow & Stern Prow Posts (Lunas Haluan & Buritan Khas Perahu Nelayan Indonesia) */}
            <path
              d="M45 162 L26 118 L38 115 L68 156 Z"
              fill="#1E293B"
              stroke="#06B6D4"
              strokeWidth="1.5"
            />
            <path
              d="M422 152 L446 116 L435 112 L406 152 Z"
              fill="#1E293B"
              stroke="#06B6D4"
              strokeWidth="1.5"
            />

            {/* Wooden Deckhouse / Cabin & Cold-Chain Insulated Coolbox */}
            <rect
              x="168"
              y="116"
              width="126"
              height="50"
              rx="4"
              fill="#1E293B"
              stroke="#94A3B8"
              strokeWidth="1.5"
            />
            {/* Cabin Roof Overhang */}
            <path
              d="M152 116 L312 116 L302 104 L162 104 Z"
              fill="#06B6D4"
              fillOpacity="0.9"
            />
            {/* Cabin Windows with Warm Navigation Glow */}
            <rect
              x="182"
              y="126"
              width="28"
              height="18"
              rx="2"
              fill="#38BDF8"
              fillOpacity="0.45"
              stroke="#38BDF8"
            />
            <rect
              x="218"
              y="126"
              width="28"
              height="18"
              rx="2"
              fill="#38BDF8"
              fillOpacity="0.45"
              stroke="#38BDF8"
            />
            <rect
              x="254"
              y="126"
              width="26"
              height="18"
              rx="2"
              fill="#F59E0B"
              fillOpacity="0.7"
            />

            {/* Cold-Chain Insulated Ice Box (Palka Berinsulasi Es Balok) */}
            <rect
              x="110"
              y="140"
              width="48"
              height="26"
              rx="3"
              fill="#0284C7"
              stroke="#E0F2FE"
              strokeWidth="1.2"
            />

            {/* Mast, Radar Transponder & Indonesian Red-White Pennant */}
            <line
              x1="230"
              y1="104"
              x2="230"
              y2="34"
              stroke="#CBD5E1"
              strokeWidth="2.5"
            />
            <line
              x1="195"
              y1="62"
              x2="265"
              y2="62"
              stroke="#94A3B8"
              strokeWidth="1.8"
            />
            {/* Glowing Radar Beacon */}
            <circle cx="230" cy="30" r="6" fill="#06B6D4" />
            <circle
              cx="230"
              cy="30"
              r="18"
              stroke="#06B6D4"
              strokeOpacity="0.6"
              strokeWidth="1.5"
            />
            {/* Merah Putih Flag */}
            <path d="M232 36 L266 42 L232 48 Z" fill="#EF4444" />
            <path d="M232 48 L266 48 L232 54 Z" fill="#F8FAFC" />

            {/* Telemetry Callout Lines on Vessel */}
            <g transform="translate(285, 36)">
              <rect
                x="0"
                y="0"
                width="172"
                height="44"
                rx="8"
                fill="#0F172A"
                fillOpacity="0.92"
                stroke="#06B6D4"
                strokeOpacity="0.6"
              />
              <text
                x="12"
                y="18"
                fill="#94A3B8"
                fontSize="10"
                fontFamily="Plus Jakarta Sans"
              >
                HARGA LAYAK EFFORT AI
              </text>
              <text
                x="12"
                y="34"
                fill="#10B981"
                fontSize="13"
                fontWeight="700"
                fontFamily="JetBrains Mono"
              >
                Rp 13.626 / kg • LAYAK
              </text>
            </g>
          </g>
        </svg>

        {/* Dramatic High-Contrast Dark Teal/Navy Gradient Overlay per Section 2.1 */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(90deg, rgba(15,23,42,0.92) 0%, rgba(15,23,42,0.68) 52%, rgba(15,23,42,0.35) 100%), linear-gradient(180deg, rgba(15,23,42,0.75) 0%, rgba(15,23,42,0.45) 50%, rgba(15,23,42,0.98) 100%)',
          }}
        />
      </div>

      {/* 2. Top Transparent Navbar (Following Top Bar Contract) */}
      <header className="relative z-20 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 py-3.5 sm:py-5 flex items-center justify-between gap-3 sm:gap-8 border-b border-slate-400/15">
        {/* Zone 1: Brand Title */}
        <button
          type="button"
          onClick={() => onSelectTab('hero')}
          className="flex items-center gap-2.5 sm:gap-3 text-left group focus:outline-none whitespace-nowrap shrink-0 cursor-pointer"
        >
          <span className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-cyan-500/15 border border-cyan-400/40 flex items-center justify-center text-[#06B6D4] shadow-lg shadow-cyan-500/10">
            <Compass className="w-4 h-4 sm:w-5 sm:h-5" />
          </span>
          <span className="text-base sm:text-lg font-extrabold tracking-tight text-[#F8FAFC]">
            PANDU-NELAYAN
          </span>
        </button>

        {/* Zone 2: Center Navigation Links */}
        <nav
          aria-label="Navigasi Utama"
          className="hidden xl:flex items-center gap-7 text-sm font-medium text-[#94A3B8]"
        >
          <button
            type="button"
            onClick={() => onSelectTab('hero')}
            className="text-[#F8FAFC] hover:text-[#06B6D4] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Beranda
          </button>
          <button
            type="button"
            onClick={() => onSelectTab('bento')}
            className="hover:text-[#F8FAFC] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Command Bento
          </button>
          <button
            type="button"
            onClick={() => onSelectTab('webgis')}
            className="hover:text-[#F8FAFC] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            WebGIS & Cuaca
          </button>
          <button
            type="button"
            onClick={() => onSelectTab('simulator')}
            className="hover:text-[#F8FAFC] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Simulasi AI & Harga Layak
          </button>
          <button
            type="button"
            onClick={() => onSelectTab('analytics')}
            className="hover:text-[#F8FAFC] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Analitik PIPP (2023-2026)
          </button>
        </nav>
      </header>

      {/* Mobile / Tablet Quick Horizontal Navigation Strip (xl:hidden) */}
      <div className="relative z-20 xl:hidden w-full border-b border-slate-400/10 bg-slate-950/40 backdrop-blur-sm">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-2 flex items-center gap-2 overflow-x-auto text-xs font-semibold text-slate-300">
          <button
            type="button"
            onClick={() => onSelectTab('bento')}
            className="px-3 py-1 rounded-full bg-slate-800/80 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 whitespace-nowrap shrink-0 cursor-pointer"
          >
            Command Bento
          </button>
          <button
            type="button"
            onClick={() => onSelectTab('webgis')}
            className="px-3 py-1 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-200 whitespace-nowrap shrink-0 cursor-pointer"
          >
            WebGIS &amp; Cuaca
          </button>
          <button
            type="button"
            onClick={() => onSelectTab('simulator')}
            className="px-3 py-1 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-200 whitespace-nowrap shrink-0 cursor-pointer"
          >
            Simulasi AI &amp; Harga Layak
          </button>
          <button
            type="button"
            onClick={() => onSelectTab('analytics')}
            className="px-3 py-1 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-200 whitespace-nowrap shrink-0 cursor-pointer"
          >
            Analitik PIPP (2023-2026)
          </button>
        </div>
      </div>

      {/* 3. Hero Content Block with Left Text & Right Artisanal Vessel Diagram (matching Command Bento) */}
      <div className="relative z-10 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 my-auto py-8 sm:py-12 lg:py-16 rounded-3xl transition-all duration-300 ease-out hover:shadow-2xl hover:shadow-cyan-950/60">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          {/* Left Side: Hero Copy & Actions */}
          <div className="lg:col-span-7 space-y-5 sm:space-y-6">
            {/* Top Translucent Pill Badge */}
            <div className="inline-flex items-center gap-2 bg-slate-800/75 border border-cyan-500/30 text-cyan-300 rounded-2xl sm:rounded-full px-3.5 sm:px-4 py-1.5 text-[11px] sm:text-xs font-medium tracking-wide leading-snug transition-all duration-300 ease-out hover:border-cyan-400/60 hover:shadow-lg hover:shadow-cyan-500/20">
              <span>
                ⚡ Powering Next-Gen Artisanal Fleet Protection &amp; Fair-Price AI •
                ASIK VI PKM-KC 2026
              </span>
            </div>

            {/* Main Headline (Huge, Crisp, 2 Lines) */}
            <h1 className="text-3xl sm:text-5xl lg:text-[54px] font-extrabold tracking-tight text-[#F8FAFC] leading-[1.14]">
              <span className="block">Dibangun untuk Lautan.</span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#F8FAFC] via-cyan-200 to-[#06B6D4]">
                Pelindung Keringat Nelayan.
              </span>
            </h1>

            {/* Sub-headline: Full 17-word official title */}
            <p className="text-sm sm:text-lg lg:text-xl text-slate-200/95 font-medium leading-relaxed max-w-2xl">
              &ldquo;PANDU-NELAYAN: Sistem Pendukung Keputusan Kelayakan Melaut
              dan Harga Layak berbasis WebGIS Terpadu Iklim, Konservasi, serta
              Biologi Perikanan&rdquo;
            </p>

            {/* Action Row: Primary White Pill CTA + Researcher/Fisherman Validation Stack */}
            <div className="pt-1 sm:pt-2 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3.5 sm:gap-5">
              <button
                type="button"
                onClick={() => onSelectTab('simulator')}
                className="bg-white text-slate-950 hover:bg-cyan-50 font-bold rounded-full px-6 py-3.5 text-sm sm:text-base flex items-center justify-center gap-3 transition-all duration-300 ease-out shadow-xl shadow-cyan-950/50 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-cyan-500/40 cursor-pointer whitespace-nowrap shrink-0"
              >
                <span>Mulai Simulasi Melaut</span>
                <span className="w-7 h-7 rounded-full bg-slate-950 text-white flex items-center justify-center">
                  <ChevronRight className="w-4 h-4" />
                </span>
              </button>

              {/* Overlapping Avatar Stack of 3 Fishermen/Researchers */}
              <div className="flex items-center gap-3.5 pt-1 sm:pt-0">
                <div className="flex -space-x-2.5 shrink-0">
                  <div
                    title="Kapten Nelayan Kecil (<5 GT) Karangantu"
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-700 border-2 border-[#0F172A] flex items-center justify-center text-xs font-bold text-white shadow-md transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:shadow-cyan-500/40"
                  >
                    NK
                  </div>
                  <div
                    title="Peneliti Oseanografi & Klimatologi Maritim"
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-700 border-2 border-[#0F172A] flex items-center justify-center text-xs font-bold text-white shadow-md transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/40"
                  >
                    BM
                  </div>
                  <div
                    title="Data Scientist Mikroekonomi Perikanan KKP"
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-700 border-2 border-[#0F172A] flex items-center justify-center text-xs font-bold text-white shadow-md transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:shadow-amber-500/40"
                  >
                    AI
                  </div>
                </div>
                <div className="text-xs sm:text-sm text-slate-200 leading-snug">
                  <p className="font-semibold text-[#F8FAFC]">
                    Tervalidasi pada 5 Wilayah DPI
                  </p>
                  <p className="text-[#94A3B8] font-mono text-[11px] sm:text-xs">
                    6.000 Trip Observasi (2023–2026)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Detailed Vector/SVG Side-Profile Diagram of Indonesian Artisanal Wooden Motor Boat (from Command Bento) */}
          <div className="lg:col-span-5">
            <div className="relative rounded-2xl bg-slate-900/95 border border-slate-700/70 p-4 sm:p-5 overflow-hidden shadow-2xl shadow-cyan-950/60 transition-all duration-300 ease-out hover:-translate-y-1 hover:border-cyan-500/50 hover:shadow-cyan-500/20">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div>
                  <p className="text-xs sm:text-sm font-bold text-[#F8FAFC]">
                    Telemetri Armada &amp; Selektivitas Biologi
                  </p>
                  <p className="text-[11px] text-[#94A3B8]">
                    Perahu Motor Tempel Tradisional (&lt; 5 GT) • Gillnet Milenium
                  </p>
                </div>
                <span className="font-mono text-[11px] font-semibold text-[#06B6D4] bg-cyan-500/15 border border-cyan-500/30 px-2.5 py-1 rounded-lg whitespace-nowrap">
                  CPUE: 21.64 kg/trip
                </span>
              </div>

              <svg
                viewBox="0 0 520 210"
                className="w-full h-40 sm:h-48 animate-radar-ping"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Animated Radar Pulse Rings */}
                <circle
                  cx="250"
                  cy="70"
                  r="42"
                  stroke="#06B6D4"
                  strokeOpacity="0.45"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  className="animate-radar-ring"
                />
                <circle
                  cx="250"
                  cy="70"
                  r="75"
                  stroke="#06B6D4"
                  strokeOpacity="0.3"
                  strokeWidth="1"
                  className="animate-radar-ring"
                  style={{ animationDelay: '1.2s' }}
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
                <circle
                  cx="250"
                  cy="26"
                  r="9"
                  fill="#06B6D4"
                  fillOpacity="0.35"
                  className="animate-radar-ring"
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
                    31.49 °C • 33.5°C
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
                    0.27 m • 10.23 kt
                  </text>
                </g>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Bottom-Left Mission Statement Block & 4-View Quick Strip */}
      <div className="relative z-10 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 pb-8 sm:pb-10 pt-5 sm:pt-6 border-t border-slate-400/15 flex flex-col lg:flex-row items-start lg:items-end justify-between gap-6 sm:gap-8">
        <p className="max-w-xl text-slate-300 text-xs sm:text-sm leading-relaxed">
          Menghapus <strong className="text-white">Ilusi Laba Akuntansi</strong>{' '}
          yang menjebak nelayan tradisional (&lt;5 GT) dengan mengintegrasikan
          beban panas kerja maritim (<span className="font-mono">WBGT</span>),
          zonasi kawasan konservasi perairan (<span className="font-mono">KKP</span>),
          kematangan gonad ikan (<span className="font-mono">Lm</span>), dan{' '}
          <em>Microeconomic Opportunity Cost</em> penuh ke dalam pipa{' '}
          <strong className="text-cyan-300">Dual-Engine Random Forest AI</strong>.
        </p>

        {/* Quick Interactive Navigation Cards to the 4 Core Views */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 w-full lg:w-auto">
          <button
            type="button"
            onClick={() => onSelectTab('bento')}
            className="text-left p-3 rounded-xl bg-[#1E293B]/80 hover:bg-[#334155]/90 border border-slate-400/15 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-[#06B6D4] mb-1">
              <Cpu className="w-4 h-4" />
              <span className="font-mono text-[10px] sm:text-[11px] text-[#94A3B8]">VIEW 2</span>
            </div>
            <p className="text-xs font-semibold text-[#F8FAFC] group-hover:text-cyan-300">
              Command Bento
            </p>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('webgis')}
            className="text-left p-3 rounded-xl bg-[#1E293B]/80 hover:bg-[#334155]/90 border border-slate-400/15 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-[#10B981] mb-1">
              <Waves className="w-4 h-4" />
              <span className="font-mono text-[10px] sm:text-[11px] text-[#94A3B8]">VIEW 3</span>
            </div>
            <p className="text-xs font-semibold text-[#F8FAFC] group-hover:text-emerald-300">
              WebGIS & BMKG
            </p>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('simulator')}
            className="text-left p-3 rounded-xl bg-[#1E293B]/80 hover:bg-[#334155]/90 border border-slate-400/15 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-[#F59E0B] mb-1">
              <Scale className="w-4 h-4" />
              <span className="font-mono text-[10px] sm:text-[11px] text-[#94A3B8]">VIEW 4</span>
            </div>
            <p className="text-xs font-semibold text-[#F8FAFC] group-hover:text-amber-300">
              Struk Harga AI
            </p>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('analytics')}
            className="text-left p-3 rounded-xl bg-[#1E293B]/80 hover:bg-[#334155]/90 border border-slate-400/15 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-[#3B82F6] mb-1">
              <ThermometerSun className="w-4 h-4" />
              <span className="font-mono text-[10px] sm:text-[11px] text-[#94A3B8]">VIEW 5</span>
            </div>
            <p className="text-xs font-semibold text-[#F8FAFC] group-hover:text-blue-300">
              Analitik PIPP
            </p>
          </button>
        </div>
      </div>
    </section>
  );
};
