import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Loader2, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useLocation } from "wouter";

export default function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [, setLocation] = useLocation();
  const input = useMemo(() => ({ query }), [query]);
  const results = trpc.search.global.useQuery(input, { enabled: query.trim().length >= 2, retry: false });

  return (
    <div className="relative w-full max-w-md">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={query}
        onChange={event => setQuery(event.target.value)}
        placeholder="Rechercher un dossier, une activité…"
        className="h-10 rounded-xl border-border/70 bg-card pl-9 pr-9 shadow-sm"
        aria-label="Recherche globale"
      />
      {query && (
        <button onClick={() => setQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-muted" aria-label="Effacer la recherche">
          <X className="h-4 w-4" />
        </button>
      )}
      {query.trim().length >= 2 && (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-border/80 bg-card shadow-xl">
          {results.isLoading ? (
            <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Recherche en cours…</div>
          ) : results.data?.length ? (
            <ul className="max-h-80 overflow-auto p-1.5">
              {results.data.map((result, index) => (
                <li key={`${result.type}-${result.label}-${index}`}>
                  <button
                    className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted"
                    onClick={() => { setLocation(result.href); setQuery(""); }}
                  >
                    <span><span className="block text-sm font-medium text-foreground">{result.label}</span><span className="block text-xs text-muted-foreground">{result.detail}</span></span>
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-secondary-foreground">{result.type}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4 text-sm text-muted-foreground">Aucun résultat pour « {query} ».</div>
          )}
        </div>
      )}
    </div>
  );
}
