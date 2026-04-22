import { useEffect, useRef, useState } from "react";
import { Loader2, Search, Sparkles } from "lucide-react";

import type { AssetSearchResult } from "@/types";

interface SearchInputProps {
  query: string;
  onQueryChange: (value: string) => void;
  results: AssetSearchResult[];
  isLoading: boolean;
  error: string | null;
  onSelect: (asset: AssetSearchResult) => void;
  disabled?: boolean;
}

export function SearchInput({
  query,
  onQueryChange,
  results,
  isLoading,
  error,
  onSelect,
  disabled,
}: SearchInputProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setIsOpen(false);
    }
  }, [query]);

  const showDropdown =
    isOpen &&
    query.trim().length >= 2 &&
    (!disabled || results.length > 0 || isLoading || Boolean(error));

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          value={query}
          disabled={disabled}
          onFocus={() => setIsOpen(query.trim().length >= 2)}
          onChange={(event) => {
            onQueryChange(event.target.value);
            setIsOpen(event.target.value.trim().length >= 2);
          }}
          placeholder="Busca por nombre, ticker o ISIN"
          className="pl-11"
        />
      </div>

      {showDropdown ? (
        <div className="absolute z-20 mt-3 w-full overflow-hidden rounded-[24px] border border-white/10 bg-slate-950/95 shadow-card backdrop-blur-2xl">
          {isLoading ? (
            <div className="flex items-center gap-3 px-4 py-4 text-sm text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              Buscando activos en Yahoo Finance...
            </div>
          ) : null}

          {error ? <div className="px-4 py-4 text-sm text-loss">{error}</div> : null}

          {!isLoading && !error && results.length === 0 ? (
            <div className="px-4 py-4 text-sm text-slate-400">No hay coincidencias para esa busqueda.</div>
          ) : null}

          {!isLoading && !error
            ? results.map((asset) => (
                <button
                  key={asset.symbol}
                  type="button"
                  onClick={() => {
                    onSelect(asset);
                    setIsOpen(false);
                  }}
                  className="flex w-full items-start justify-between gap-3 border-t border-white/5 px-4 py-3 text-left transition-colors first:border-t-0 hover:bg-white/[0.05]"
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-white">{asset.displaySymbol}</div>
                    <div className="truncate text-sm text-slate-400">{asset.description}</div>
                  </div>
                  <div className="surface-chip shrink-0">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    {asset.assetType.toUpperCase()}
                  </div>
                </button>
              ))
            : null}
        </div>
      ) : null}
    </div>
  );
}
