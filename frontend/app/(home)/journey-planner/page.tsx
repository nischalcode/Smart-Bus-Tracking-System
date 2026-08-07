"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Compass, ArrowRightLeft, Loader2, AlertCircle, RotateCcw } from "lucide-react";
import TrackLayout from "@/component/track-layout/TrackLayout";
import StopSelector from "@/component/journey/StopSelector";
import RecommendationCard from "@/component/journey/RecommendationCard";
import { fetchApi, RoutesResponse, JourneyOption, fetchAllRouteStops, fetchJourneyRecommendations } from "@/utils/api";

const Page = () => {
  // ── Stop data from all routes ──────────────────────────────────────────────
  const [allStopNames, setAllStopNames] = useState<string[]>([]);
  useEffect(() => {
    Promise.all([fetchApi<RoutesResponse>("/routes"), fetchAllRouteStops()])
      .then(([data, stopRecords]) => {
        if (!data.success) return;
        const names = new Set<string>();
        for (const route of data.routes) {
          for (const stop of route.stops ?? []) {
            if (stop.name) names.add(stop.name);
          }
        }
        for (const record of stopRecords) {
          for (const stop of record.stops ?? []) {
            if (stop.name) names.add(stop.name);
          }
        }
        setAllStopNames(Array.from(names).sort());
      })
      .catch(console.error);
  }, []);

  // ── Form state ─────────────────────────────────────────────────────────────
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");

  const canSearch = origin.trim().length > 0 && destination.trim().length > 0;

  const swapStops = () => {
    setOrigin(destination);
    setDestination(origin);
  };

  // ── Search state ───────────────────────────────────────────────────────────
  const [recommendations, setRecommendations] = useState<JourneyOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!canSearch) return;
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const results = await fetchJourneyRecommendations(
        origin.trim(),
        destination.trim()
      );
      setRecommendations(results);
    } catch (err: any) {
      setError(err?.message || "Failed to fetch recommendations. Please try again.");
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setOrigin("");
    setDestination("");
    setRecommendations([]);
    setError(null);
    setSearched(false);
  };

  return (
    <TrackLayout>
      <div className="min-h-full bg-background p-4 sm:p-6">
        {/* ── Page title ── */}
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
              <Compass className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
                Journey Planner
              </h1>
              <p className="text-sm text-muted-foreground">
                Find the best bus combination to reach your destination
              </p>
            </div>
          </div>
        </div>

        {/* ── Search card ── */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            {/* Origin */}
            <div className="flex-1">
              <StopSelector
                id="origin-stop"
                label="From (Origin)"
                placeholder="e.g. Ratna Park"
                value={origin}
                onChange={setOrigin}
                stopNames={allStopNames}
              />
            </div>

            {/* Swap button */}
            <div className="flex justify-center sm:pb-0.5">
              <button
                type="button"
                onClick={swapStops}
                aria-label="Swap origin and destination"
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground shadow-sm transition hover:border-primary hover:bg-primary/5 hover:text-primary"
              >
                <ArrowRightLeft className="h-4 w-4" />
              </button>
            </div>

            {/* Destination */}
            <div className="flex-1">
              <StopSelector
                id="destination-stop"
                label="To (Destination)"
                placeholder="e.g. Balkumari"
                value={destination}
                onChange={setDestination}
                stopNames={allStopNames}
              />
            </div>

            {/* Find button */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSearch}
                disabled={!canSearch || loading}
                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                {loading ? "Searching…" : "Find Journey"}
              </button>
              {searched && (
                <button
                  type="button"
                  onClick={handleReset}
                  aria-label="Reset"
                  className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition hover:border-primary hover:text-primary"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Results ── */}
        <div className="mt-6">
          {/* Loading skeleton */}
          {loading && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-32 animate-pulse rounded-2xl border border-border bg-muted/30"
                />
              ))}
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="font-semibold">Could not load recommendations</p>
                <p className="mt-0.5 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Empty — searched but no results */}
          {!loading && !error && searched && recommendations.length === 0 && (
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Compass className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <p className="font-semibold text-foreground">No routes found</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  No bus can connect <strong>{origin}</strong> to{" "}
                  <strong>{destination}</strong> with the current data. Try
                  nearby stops or check back when more buses are active.
                </p>
              </div>
            </div>
          )}

          {/* Results */}
          {!loading && !error && recommendations.length > 0 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Found{" "}
                <span className="font-semibold text-foreground">
                  {recommendations.length}
                </span>{" "}
                recommendation{recommendations.length > 1 ? "s" : ""} for{" "}
                <span className="font-semibold text-foreground">{origin}</span>{" "}
                →{" "}
                <span className="font-semibold text-foreground">
                  {destination}
                </span>
              </p>
              {recommendations.map((option, idx) => (
                <RecommendationCard
                  key={idx}
                  option={option}
                  rank={idx + 1}
                />
              ))}
            </div>
          )}

          {/* Initial state */}
          {!loading && !error && !searched && (
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border bg-muted/10 py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Compass className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Plan your journey</p>
                <p className="mt-1 text-sm text-muted-foreground max-w-sm">
                  Select your origin and destination stop above, then press{" "}
                  <span className="font-medium text-primary">Find Journey</span>{" "}
                  to see live recommendations ranked by score.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1">
                  ✓ Live ETA
                </span>
                <span className="flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1">
                  ✓ Transfer routes
                </span>
                <span className="flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1">
                  ✓ Traffic status
                </span>
                <span className="flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1">
                  ✓ Recommendation score
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </TrackLayout>
  );
};

export default Page;
