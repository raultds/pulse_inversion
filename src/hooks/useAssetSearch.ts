import { useEffect, useState } from "react";

import { searchAssets } from "@/services/yahooFinance";
import type { AssetSearchResult } from "@/types";

export function useAssetSearch(query: string) {
  const [results, setResults] = useState<AssetSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setError(null);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      try {
        setIsLoading(true);
        setError(null);
        const nextResults = await searchAssets(query);
        if (!controller.signal.aborted) {
          setResults(nextResults);
        }
      } catch (searchError) {
        if (!controller.signal.aborted) {
          setError(searchError instanceof Error ? searchError.message : "No se pudo completar la busqueda.");
          setResults([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, 280);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [query]);

  return {
    results,
    isLoading,
    error,
  };
}
