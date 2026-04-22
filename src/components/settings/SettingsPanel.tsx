import { useState } from "react";
import { DatabaseZap, Globe2, KeyRound, RotateCcw, ShieldCheck, Trash2 } from "lucide-react";

import { Card } from "@/components/shared/Card";
import { clearMarketCache } from "@/services/yahooFinance";

interface SettingsPanelProps {
  finnhubApiKey: string;
  onSaveFinnhubApiKey: (apiKey: string) => void;
  onClearPortfolio: () => void;
}

export function SettingsPanel({
  finnhubApiKey,
  onSaveFinnhubApiKey,
  onClearPortfolio,
}: SettingsPanelProps) {
  const [draftKey, setDraftKey] = useState(finnhubApiKey);
  const [feedback, setFeedback] = useState<string | null>(null);

  const saveFinnhubApiKey = (event: React.FormEvent) => {
    event.preventDefault();
    onSaveFinnhubApiKey(draftKey);
    setFeedback("API key de Finnhub guardada como fallback opcional.");
  };

  const clearCache = () => {
    clearMarketCache();
    setFeedback("Cache de mercado limpiada correctamente.");
  };

  const wipePortfolio = () => {
    onClearPortfolio();
    setFeedback("Portafolio local reiniciado.");
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)]">
      <Card className="p-6">
        <div className="label">Integracion de mercado</div>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">Ajustes del workspace local</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
          PulseInversion usa Yahoo Finance como fuente principal. Si una cotizacion o historico falla, puede usar Finnhub como fallback opcional con una API key gratuita.
        </p>

        <div className="mt-6 rounded-[24px] border border-primary/15 bg-primary/10 p-5">
          <div className="flex items-start gap-3">
            <Globe2 className="mt-0.5 h-5 w-5 text-primary" />
            <div>
              <div className="font-semibold text-white">Proveedor principal: Yahoo Finance</div>
              <p className="mt-2 text-sm leading-6 text-slate-200">
                Busqueda con Yahoo y OpenFIGI, mas fallback de mercado con Finnhub si introduces tu clave.
              </p>
            </div>
          </div>
        </div>

        <form className="mt-5 space-y-5" onSubmit={saveFinnhubApiKey}>
          <label className="space-y-2">
            <span className="label">Finnhub fallback opcional</span>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="password"
                value={draftKey}
                onChange={(event) => setDraftKey(event.target.value)}
                placeholder="Introduce tu API key gratuita de Finnhub"
                className="pl-11"
              />
            </div>
          </label>

          <button type="submit" className="btn-primary">
            <ShieldCheck className="mr-2 h-4 w-4" />
            Guardar fallback
          </button>

          <div className={`rounded-[20px] px-4 py-3 text-sm ${finnhubApiKey ? "border border-gain/20 bg-gain/10 text-gain" : "border border-white/10 bg-white/[0.03] text-slate-300"}`}>
            {finnhubApiKey
              ? "Fallback de Finnhub activo para quote e historico cuando Yahoo falle."
              : "Fallback de Finnhub inactivo. Si Yahoo responde 401 para un simbolo, sin clave no habra segundo proveedor de mercado."}
          </div>
        </form>

        {feedback ? (
          <div className="mt-5 rounded-[24px] border border-primary/15 bg-primary/10 px-4 py-3 text-sm text-slate-100">
            {feedback}
          </div>
        ) : null}
      </Card>

      <Card className="space-y-4 p-6">
        <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center gap-3 text-white">
            <DatabaseZap className="h-5 w-5 text-primary" />
            <div className="font-semibold">Cache agresivo</div>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Los historicos y snapshots se guardan localmente para mejorar la respuesta y reducir peticiones repetidas.
          </p>
          <button type="button" className="btn-secondary mt-4 w-full" onClick={clearCache}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Limpiar cache
          </button>
        </div>

        <div className="rounded-[24px] border border-loss/15 bg-loss/10 p-5">
          <div className="font-semibold text-white">Zona sensible</div>
          <p className="mt-3 text-sm leading-6 text-slate-200">
            Si quieres reiniciar la demo o empezar de cero, puedes vaciar todas las transacciones persistidas.
          </p>
          <button type="button" className="btn-secondary mt-4 w-full !border-loss/20 !bg-loss/15 !text-white hover:!bg-loss/20" onClick={wipePortfolio}>
            <Trash2 className="mr-2 h-4 w-4" />
            Borrar portafolio
          </button>
        </div>
      </Card>
    </div>
  );
}
