import RouteModel from "../routes/RouteModel.js";
import StopModel from "../stops/StopModel.js";
import TrackingModel from "../tracking/TrackingModel.js";
import ScheduleModel from "../schedules/ScheduleModel.js";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface JourneyStop {
  name: string;
  lat?: number;
  lng?: number;
}

export interface JourneyLeg {
  busNumber: string;
  busName: string;
  routeNo: string;
  routeFrom: string;
  routeTo: string;
  direction: string;
  boardStop: string;
  alightStop: string;
  stops: JourneyStop[];
  etaMinutes: number | null;
  travelMinutes: number;
  walkingMetersToStop: number;
  trafficStatus: "Low" | "Moderate" | "High";
  liveSpeed: number;
  frequency: string;
  scheduleStatus: string;
}

export interface JourneyOption {
  legs: JourneyLeg[];
  totalTravelMinutes: number;
  totalWalkingMeters: number;
  transfers: number;
  waitingMinutes: number;
  trafficStatus: "Low" | "Moderate" | "High";
  score: number;
  estimatedArrivalMinutes: number;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function normalizeStopName(name: string): string {
  return name.trim().toLowerCase();
}

function parseFrequencyMinutes(frequency: string): number {
  // E.g. "15 min", "Every 10 minutes", "10-15 min"
  const match = frequency?.match(/(\d+)/);
  return match?.[1] ? parseInt(match[1], 10) : 30;
}

function frequencyBonus(freqMin: number): number {
  if (freqMin <= 10) return 10;
  if (freqMin <= 20) return 5;
  return 0;
}

function trafficPenalty(status: "Low" | "Moderate" | "High"): number {
  if (status === "High") return 15;
  if (status === "Moderate") return 5;
  return 0;
}

function classifyTraffic(speedKmh: number): "Low" | "Moderate" | "High" {
  if (speedKmh <= 0) return "Low"; // bus not moving (parked/stopped)
  if (speedKmh < 15) return "High";
  if (speedKmh < 35) return "Moderate";
  return "Low";
}

function calcScore(option: Omit<JourneyOption, "score">): number {
  const freqMin = option.legs[0]
    ? parseFrequencyMinutes(option.legs[0].frequency)
    : 30;

  let score =
    100 -
    option.waitingMinutes * 2 -
    option.totalTravelMinutes * 0.5 -
    option.transfers * 20 -
    option.totalWalkingMeters / 50 -
    trafficPenalty(option.trafficStatus) +
    frequencyBonus(freqMin);

  return Math.max(0, Math.min(100, Math.round(score)));
}

// Walking distance estimate: each stop gap ≈ 200m
const METERS_PER_STOP_GAP = 200;

function walkingMeters(stopIndexDiff: number): number {
  return Math.abs(stopIndexDiff) * METERS_PER_STOP_GAP;
}

// ─── Main Service ─────────────────────────────────────────────────────────────

export class JourneyRecommendationService {
  async recommend(
    origin: string,
    destination: string
  ): Promise<JourneyOption[]> {
    const originNorm = normalizeStopName(origin);
    const destNorm = normalizeStopName(destination);

    if (!originNorm || !destNorm) return [];

    // ── 1. Load all data ──────────────────────────────────────────────────────
    const [routeDocs, stopDocs, trackingDocs, scheduleDocs] = await Promise.all([
      RouteModel.find({ isActive: { $ne: false } }).lean(),
      StopModel.find({}).lean(),
      TrackingModel.find({}).populate("bus route").lean(),
      ScheduleModel.find({ active: true }).populate("route bus").lean(),
    ]);

    // RouteModel stops are retained when available; the dedicated Bus Stops
    // records fill routes created before named stops were embedded on Route.
    const stopsByRouteId = new Map(
      stopDocs.map((record: any) => [record.routeId?.toString(), record.stops ?? []])
    );
    const routes = routeDocs.map((route: any) => ({
      ...route,
      stops: route.stops?.length ? route.stops : stopsByRouteId.get(route._id.toString()) ?? [],
    }));

    // Indexed lookups
    const trackingByRouteId = new Map<string, any>();
    for (const t of trackingDocs) {
      const rId = t.route?._id?.toString() ?? t.routeId?.toString();
      if (rId && !trackingByRouteId.has(rId)) {
        trackingByRouteId.set(rId, t);
      }
    }

    const scheduleByRouteId = new Map<string, any>();
    for (const s of scheduleDocs) {
      const rId = s.route?._id?.toString() ?? s.route?.toString();
      if (rId && !scheduleByRouteId.has(rId)) {
        scheduleByRouteId.set(rId, s);
      }
    }

    const options: JourneyOption[] = [];

    // ── 2. Helper: build a leg for a route from boardStop → alightStop ────────
    const buildLeg = (
      route: any,
      boardStopName: string,
      alightStopName: string,
      boardIdx: number,
      alightIdx: number,
      direction: string,
      walkingM: number
    ): JourneyLeg | null => {
      const liveTracking = trackingByRouteId.get(route._id?.toString());
      const schedule = scheduleByRouteId.get(route._id?.toString());

      const liveSpeed: number = liveTracking?.speed ?? 0;
      const trafficStatus = classifyTraffic(liveSpeed);

      // ETA to board stop from live tracking
      let etaMinutes: number | null = null;
      if (liveTracking?.stopETAs && Array.isArray(liveTracking.stopETAs)) {
        const etaEntry = liveTracking.stopETAs.find(
          (e: any) =>
            normalizeStopName(e.name) === normalizeStopName(boardStopName)
        );
        if (etaEntry?.eta) {
          const parsed = parseInt(String(etaEntry.eta));
          if (!isNaN(parsed)) etaMinutes = parsed;
        }
      }

      // Fallback ETA: half the frequency
      if (etaMinutes === null && schedule?.frequency) {
        etaMinutes = Math.round(parseFrequencyMinutes(schedule.frequency) / 2);
      }
      if (etaMinutes === null) etaMinutes = 10; // default fallback

      // Travel time: stop count × avg 3 min per stop, adjusted for traffic
      const stopCount = Math.abs(alightIdx - boardIdx);
      const avgMinPerStop =
        trafficStatus === "High" ? 5 : trafficStatus === "Moderate" ? 4 : 3;
      const travelMinutes = stopCount * avgMinPerStop;

      // Collect stops between board and alight
      const stopsSlice = route.stops?.slice(
        Math.min(boardIdx, alightIdx),
        Math.max(boardIdx, alightIdx) + 1
      ) ?? [];

      const busNumber =
        liveTracking?.busNo ??
        liveTracking?.bus?.busNumber ??
        schedule?.bus?.busNumber ??
        "Unknown Bus";

      return {
        busNumber,
        busName: busNumber,
        routeNo: route.routeNo,
        routeFrom: route.from,
        routeTo: route.to,
        direction,
        boardStop: boardStopName,
        alightStop: alightStopName,
        stops: (direction === "Coming" ? [...stopsSlice].reverse() : stopsSlice).map((s: any) => ({
          name: s.name,
          lat: s.lat,
          lng: s.lng,
        })),
        etaMinutes,
        travelMinutes,
        walkingMetersToStop: walkingM,
        trafficStatus,
        liveSpeed,
        frequency: schedule?.frequency ?? route.frequency ?? "Unknown",
        scheduleStatus: schedule?.status ?? liveTracking?.status ?? "N/A",
      };
    };

    // ── 3. Scan routes for direct journeys ────────────────────────────────────
    for (const route of routes) {
      const stops: any[] = route.stops ?? [];
      if (stops.length === 0) continue;

      const stopNames = stops.map((s: any) => normalizeStopName(s.name));

      // Going direction: origin before destination in stop list
      const originIdx = stopNames.findIndex((n) => n.includes(originNorm) || originNorm.includes(n));
      const destIdx   = stopNames.findIndex((n) => n.includes(destNorm)   || destNorm.includes(n));

      if (originIdx !== -1 && destIdx !== -1 && originIdx !== destIdx) {
        const direction = originIdx < destIdx ? "Going" : "Coming";
        const walkM = walkingMeters(0); // passenger is at the stop

        const leg = buildLeg(
          route,
          stops[originIdx].name,
          stops[destIdx].name,
          originIdx,
          destIdx,
          direction,
          walkM
        );
        if (!leg) continue;

        const waitingMinutes = leg.etaMinutes ?? 5;
        const opt: Omit<JourneyOption, "score"> = {
          legs: [leg],
          totalTravelMinutes: leg.travelMinutes,
          totalWalkingMeters: walkM,
          transfers: 0,
          waitingMinutes,
          trafficStatus: leg.trafficStatus,
          estimatedArrivalMinutes: waitingMinutes + leg.travelMinutes,
        };
        options.push({ ...opt, score: calcScore(opt) });
      }
    }

    // ── 4. One-transfer journeys ──────────────────────────────────────────────
    // Build: which stops appear in which routes
    const stopToRoutes = new Map<string, { routeIdx: number; stopIdx: number }[]>();
    routes.forEach((route, routeIdx) => {
      (route.stops ?? []).forEach((s: any, stopIdx: number) => {
        const key = normalizeStopName(s.name);
        if (!stopToRoutes.has(key)) stopToRoutes.set(key, []);
        stopToRoutes.get(key)!.push({ routeIdx, stopIdx });
      });
    });

    for (const route1 of routes) {
      const stops1: any[] = route1.stops ?? [];
      if (stops1.length === 0) continue;
      const stopNames1 = stops1.map((s: any) => normalizeStopName(s.name));

      const originIdx1 = stopNames1.findIndex(
        (n) => n.includes(originNorm) || originNorm.includes(n)
      );
      if (originIdx1 === -1) continue;

      // A transfer may be before or after the origin in the stored route order:
      // the leg direction is derived independently for each candidate.
      for (let ti = 0; ti < stops1.length; ti++) {
        if (ti === originIdx1) continue;
        const transferStopName = normalizeStopName(stops1[ti].name);

        // Look for route2 that covers transferStop → destination
        const routesAtTransfer = stopToRoutes.get(transferStopName) ?? [];
        for (const { routeIdx: r2Idx } of routesAtTransfer) {
          const route2 = routes[r2Idx];
          if (!route2 || route2._id?.toString() === route1._id?.toString()) continue;

          const stops2: any[] = route2.stops ?? [];
          const stopNames2 = stops2.map((s: any) => normalizeStopName(s.name));

          const transferIdx2 = stopNames2.findIndex(
            (n) => n.includes(transferStopName) || transferStopName.includes(n)
          );
          const destIdx2 = stopNames2.findIndex(
            (n) => n.includes(destNorm) || destNorm.includes(n)
          );

          if (
            transferIdx2 === -1 ||
            destIdx2 === -1 ||
            transferIdx2 === destIdx2
          )
            continue;

          // Build both legs
          const dir1 = originIdx1 < ti ? "Going" : "Coming";
          const dir2 = transferIdx2 < destIdx2 ? "Going" : "Coming";

          const leg1 = buildLeg(
            route1,
            stops1[originIdx1].name,
            stops1[ti].name,
            originIdx1,
            ti,
            dir1,
            walkingMeters(0)
          );
          const leg2 = buildLeg(
            route2,
            stops2[transferIdx2].name,
            stops2[destIdx2].name,
            transferIdx2,
            destIdx2,
            dir2,
            walkingMeters(0)
          );
          if (!leg1 || !leg2) continue;

          const waitingMinutes = (leg1.etaMinutes ?? 5) + (leg2.etaMinutes ?? 5);
          const totalTravel = leg1.travelMinutes + leg2.travelMinutes;

          const worstTraffic: "Low" | "Moderate" | "High" =
            leg1.trafficStatus === "High" || leg2.trafficStatus === "High"
              ? "High"
              : leg1.trafficStatus === "Moderate" ||
                leg2.trafficStatus === "Moderate"
              ? "Moderate"
              : "Low";

          const opt: Omit<JourneyOption, "score"> = {
            legs: [leg1, leg2],
            totalTravelMinutes: totalTravel,
            totalWalkingMeters: walkingMeters(0),
            transfers: 1,
            waitingMinutes,
            trafficStatus: worstTraffic,
            estimatedArrivalMinutes: waitingMinutes + totalTravel,
          };
          options.push({ ...opt, score: calcScore(opt) });
        }
      }
    }

    // ── 5. Sort & deduplicate, return top 3 ──────────────────────────────────
    const seen = new Set<string>();
    const unique = options.filter((opt) => {
      const key = opt.legs
        .map((l) => `${l.routeNo}:${l.boardStop}:${l.alightStop}`)
        .join("|");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    unique.sort((a, b) => b.score - a.score);
    return unique.slice(0, 3);
  }
}

export default JourneyRecommendationService;
