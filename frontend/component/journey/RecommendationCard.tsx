"use client";

import { useState } from "react";
import {
  Star,
  Bus,
  Clock,
  ArrowRight,
  Footprints,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  ArrowDown,
  Zap,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import type { JourneyOption, JourneyLeg } from "@/utils/api";
import { formatRouteName } from "@/utils/routeFormatter";

interface Props {
  option: JourneyOption;
  rank: number;
}

const TRAFFIC_CONFIG = {
  Low: {
    label: "Low",
    color: "text-green-600",
    bg: "bg-green-50 border-green-200",
    Icon: CheckCircle2,
  },
  Moderate: {
    label: "Moderate",
    color: "text-yellow-600",
    bg: "bg-yellow-50 border-yellow-200",
    Icon: TrendingUp,
  },
  High: {
    label: "High",
    color: "text-red-600",
    bg: "bg-red-50 border-red-200",
    Icon: AlertTriangle,
  },
};

const SCORE_COLOR = (score: number) => {
  if (score >= 80) return "bg-green-500";
  if (score >= 60) return "bg-yellow-500";
  return "bg-red-500";
};

const LegCard = ({ leg, isFirst }: { leg: JourneyLeg; isFirst: boolean }) => {
  const traffic = TRAFFIC_CONFIG[leg.trafficStatus];

  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Bus className="h-4 w-4 shrink-0 text-primary" />
          <span className="font-semibold text-foreground">{leg.busNumber}</span>
        </div>
        <span
          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${traffic.bg} ${traffic.color}`}
        >
          <traffic.Icon className="h-3 w-3" />
          {traffic.label} Traffic
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5 text-sm">
        <span className="font-medium text-foreground">Route {leg.routeNo}</span>
        <span className="text-muted-foreground">·</span>
        <span className="text-muted-foreground">
          {formatRouteName(leg.routeFrom, leg.routeTo)}
        </span>
        <span className="text-muted-foreground">·</span>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            leg.direction === "Going"
              ? "bg-blue-100 text-blue-700"
              : "bg-orange-100 text-orange-700"
          }`}
        >
          {leg.direction}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <ArrowRight className="h-3.5 w-3.5 text-primary" />
          Board:{" "}
          <span className="font-medium text-foreground">{leg.boardStop}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <ArrowDown className="h-3.5 w-3.5 text-green-600" />
          Alight:{" "}
          <span className="font-medium text-foreground">{leg.alightStop}</span>
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-4 text-xs">
        {isFirst && (
          <span className="flex items-center gap-1">
            <Footprints className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Walk to stop:</span>{" "}
            <span className="font-medium text-foreground">
              {leg.walkingMetersToStop} m
            </span>
          </span>
        )}
        <span className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">ETA:</span>{" "}
          <span className="font-medium text-foreground">
            {leg.etaMinutes !== null ? `${leg.etaMinutes} min` : "N/A"}
          </span>
        </span>
        <span className="flex items-center gap-1">
          <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">Travel:</span>{" "}
          <span className="font-medium text-foreground">
            {leg.travelMinutes} min
          </span>
        </span>
        <span className="flex items-center gap-1">
          <Zap className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">Freq:</span>{" "}
          <span className="font-medium text-foreground">{leg.frequency}</span>
        </span>
      </div>
    </div>
  );
};

const RecommendationCard = ({ option, rank }: Props) => {
  const [expanded, setExpanded] = useState(rank === 1);
  const isTop = rank === 1;
  const traffic = TRAFFIC_CONFIG[option.trafficStatus];

  return (
    <div
      className={`overflow-hidden rounded-2xl border transition-shadow hover:shadow-md ${
        isTop
          ? "border-primary/40 shadow-sm shadow-primary/10"
          : "border-border"
      } bg-card`}
    >
      {/* ── Header ── */}
      <div
        className={`flex items-center justify-between px-5 py-4 ${
          isTop ? "bg-primary/5" : "bg-background"
        }`}
      >
        <div className="flex items-center gap-3">
          {isTop && (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white">
              <Star className="h-4 w-4 fill-white" />
            </div>
          )}
          {!isTop && (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground text-sm font-bold">
              {rank}
            </div>
          )}
          <div>
            <p className="text-xs text-muted-foreground">
              Recommendation {rank} {isTop ? "⭐" : ""}
            </p>
            <p className="text-sm font-bold text-foreground">
              {option.transfers === 0 ? "Direct Journey" : `${option.transfers} Transfer${option.transfers > 1 ? "s" : ""}`}
            </p>
          </div>
        </div>

        {/* Score badge */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1.5">
              <div className={`h-2 w-2 rounded-full ${SCORE_COLOR(option.score)}`} />
              <span className="text-xl font-extrabold text-foreground">
                {option.score}
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground">Score</span>
          </div>
        </div>
      </div>

      {/* ── Summary bar ── */}
      <div className="flex flex-wrap gap-4 border-t border-border px-5 py-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          Wait:{" "}
          <span className="ml-0.5 font-medium text-foreground">
            {option.waitingMinutes} min
          </span>
        </span>
        <span className="flex items-center gap-1">
          <TrendingUp className="h-3.5 w-3.5" />
          Travel:{" "}
          <span className="ml-0.5 font-medium text-foreground">
            {option.totalTravelMinutes} min
          </span>
        </span>
        <span className="flex items-center gap-1">
          <ArrowRight className="h-3.5 w-3.5" />
          Transfers:{" "}
          <span className="ml-0.5 font-medium text-foreground">
            {option.transfers}
          </span>
        </span>
        <span className="flex items-center gap-1">
          <Footprints className="h-3.5 w-3.5" />
          Walk:{" "}
          <span className="ml-0.5 font-medium text-foreground">
            {option.totalWalkingMeters} m
          </span>
        </span>
        <span className={`flex items-center gap-1 rounded-full border px-2 py-0.5 ${traffic.bg} ${traffic.color}`}>
          <traffic.Icon className="h-3 w-3" />
          {traffic.label} Traffic
        </span>
        <span className="flex items-center gap-1 ml-auto font-semibold text-primary">
          ~{option.estimatedArrivalMinutes} min total
        </span>
      </div>

      {/* ── Expandable detail ── */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-center gap-1.5 border-t border-border px-5 py-2.5 text-xs font-medium text-muted-foreground transition hover:bg-muted/20 hover:text-foreground"
      >
        {expanded ? (
          <>
            <ChevronUp className="h-3.5 w-3.5" /> Hide details
          </>
        ) : (
          <>
            <ChevronDown className="h-3.5 w-3.5" /> Show details
          </>
        )}
      </button>

      {expanded && (
        <div className="space-y-3 border-t border-border px-5 py-4">
          {option.legs.map((leg, idx) => (
            <div key={idx}>
              {idx > 0 && (
                <div className="my-3 flex items-center gap-3 text-xs text-muted-foreground">
                  <div className="h-px flex-1 bg-border" />
                  <span className="flex items-center gap-1 rounded-full border border-border bg-muted px-3 py-1 font-medium">
                    <ArrowDown className="h-3 w-3" /> Transfer at{" "}
                    {option.legs[idx - 1]?.alightStop}
                  </span>
                  <div className="h-px flex-1 bg-border" />
                </div>
              )}
              <LegCard leg={leg} isFirst={idx === 0} />

              {/* Stop list */}
              {leg.stops.length > 0 && (
                <div className="mt-2 ml-4 border-l-2 border-dashed border-primary/30 pl-4">
                  <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Stops
                  </p>
                  <ol className="space-y-1">
                    {leg.stops.map((stop, si) => (
                      <li
                        key={si}
                        className={`flex items-center gap-2 text-xs ${
                          stop.name === leg.boardStop
                            ? "font-semibold text-primary"
                            : stop.name === leg.alightStop
                            ? "font-semibold text-green-600"
                            : "text-muted-foreground"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                            stop.name === leg.boardStop
                              ? "bg-primary"
                              : stop.name === leg.alightStop
                              ? "bg-green-500"
                              : "bg-border"
                          }`}
                        />
                        {stop.name}
                        {stop.name === leg.boardStop && (
                          <span className="text-[10px] text-primary">(Board)</span>
                        )}
                        {stop.name === leg.alightStop && (
                          <span className="text-[10px] text-green-600">(Alight)</span>
                        )}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          ))}

          {/* Estimated arrival */}
          <div className="mt-3 flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
            <span className="text-muted-foreground">Estimated Arrival</span>
            <span className="font-bold text-primary">
              In ~{option.estimatedArrivalMinutes} minutes
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecommendationCard;
