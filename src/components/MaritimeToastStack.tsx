import React from 'react';
import {
  AlertOctagon,
  Waves,
  X,
  ArrowRight,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { MaritimeToastAlert } from '../utils/maritimeFormulas';

interface MaritimeToastStackProps {
  alerts: MaritimeToastAlert[];
  dismissedIds: string[];
  soundEnabled: boolean;
  onDismiss: (id: string) => void;
  onDismissAll: () => void;
  onToggleSound: () => void;
  onActionNavigate: () => void;
}

export const MaritimeToastStack: React.FC<MaritimeToastStackProps> = ({
  alerts,
  dismissedIds,
  soundEnabled,
  onDismiss,
  onDismissAll,
  onToggleSound,
  onActionNavigate,
}) => {
  const visibleAlerts = alerts.filter((a) => !dismissedIds.includes(a.id));

  if (visibleAlerts.length === 0) return null;

  return (
    <div
      role="region"
      aria-label="Notifikasi Peringatan Keselamatan Maritim & AI"
      aria-live="assertive"
      data-testid="maritime-toast-stack"
      className="fixed bottom-20 md:bottom-5 inset-x-3 sm:inset-x-auto sm:right-5 z-[950] w-auto sm:w-full sm:max-w-md flex flex-col gap-2.5 sm:gap-3 pointer-events-none"
    >
      {visibleAlerts.map((alert) => {
        const isCrimson = alert.severity === 'crimson';
        return (
          <div
            key={alert.id}
            role="alert"
            className={`pointer-events-auto rounded-2xl p-3.5 sm:p-4 shadow-2xl backdrop-blur-md border transition-all ${
              isCrimson
                ? 'bg-[#0F172A]/95 border-[#EF4444] text-[#F8FAFC] shadow-red-950/60'
                : 'bg-[#0F172A]/95 border-[#F59E0B] text-[#F8FAFC] shadow-amber-950/60'
            }`}
          >
            <div className="flex items-start justify-between gap-2.5 sm:gap-3">
              <div className="flex items-start gap-2.5 sm:gap-3 min-w-0">
                <div
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border ${
                    isCrimson
                      ? 'bg-red-500/20 border-red-500/40 text-[#EF4444]'
                      : 'bg-amber-500/20 border-amber-500/40 text-[#F59E0B]'
                  }`}
                >
                  {alert.category === 'GELOMBANG_TINGGI' ? (
                    <Waves className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : (
                    <AlertOctagon className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </div>

                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-wider ${
                        isCrimson ? 'text-[#EF4444]' : 'text-[#F59E0B]'
                      }`}
                    >
                      {alert.category === 'TUNDA_MELAUT'
                        ? 'EARLY WARNING SYSTEM • KEPUTUSAN AI'
                        : 'BMKG MARITIME SEA-STATE ALERT'}
                    </span>
                  </div>

                  <h4 className="text-xs sm:text-sm font-extrabold tracking-tight text-white">
                    {alert.title}
                  </h4>

                  <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed">
                    {alert.message}
                  </p>

                  <p className="text-[10px] sm:text-[11px] font-mono text-cyan-300 pt-0.5">
                    {alert.metricsSummary}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onDismiss(alert.id)}
                aria-label={`Tutup Notifikasi ${alert.title}`}
                className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Bottom Toast Action Bar */}
            <div className="mt-3 pt-2.5 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onToggleSound}
                  aria-label={
                    soundEnabled
                      ? 'Matikan Sirine Audio Peringatan'
                      : 'Aktifkan Sirine Audio Peringatan'
                  }
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] sm:text-[11px] font-mono text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {soundEnabled ? (
                    <>
                      <Volume2 className="w-3.5 h-3.5 text-[#06B6D4]" />
                      <span>Sirine: ON</span>
                    </>
                  ) : (
                    <>
                      <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                      <span>Sirine: OFF</span>
                    </>
                  )}
                </button>

                {visibleAlerts.length > 1 && (
                  <button
                    type="button"
                    onClick={onDismissAll}
                    className="text-[10px] sm:text-[11px] text-slate-400 hover:text-slate-200 underline cursor-pointer"
                  >
                    Tutup Semua ({visibleAlerts.length})
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={onActionNavigate}
                className={`px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  isCrimson
                    ? 'bg-[#EF4444] hover:bg-red-500 text-white'
                    : 'bg-[#F59E0B] hover:bg-amber-400 text-slate-950'
                }`}
              >
                <span>Lihat Mitigasi &amp; Opsi Darat</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
