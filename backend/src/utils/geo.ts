export type Coord = [number, number];

const EARTH_RADIUS_KM = 6371;

export function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

export function coordDistance(a: Coord, b: Coord): number {
  return haversine(a[0], a[1], b[0], b[1]);
}

export function pathCumulativeDistances(path: Coord[]): number[] {
  const distances: number[] = [0];
  for (let i = 1; i < path.length; i++) {
    const prev = path[i - 1];
    const curr = path[i];
    if (!prev || !curr) {
      distances.push(distances[i - 1] ?? 0);
      continue;
    }
    distances.push((distances[i - 1] ?? 0) + coordDistance(prev, curr));
  }
  return distances;
}

export function distanceAlongPath(path: Coord[], fromIndex: number, toIndex: number): number {
  const distances = pathCumulativeDistances(path);
  const start = distances[fromIndex] ?? 0;
  const end = distances[toIndex] ?? 0;
  return Math.abs(end - start);
}

export function projectPointToPath(point: Coord, path: Coord[]): { index: number; point: Coord; distance: number } {
  if (path.length === 0) {
    return { index: 0, point, distance: 0 };
  }
  if (path.length === 1) {
    return { index: 0, point: path[0] as Coord, distance: coordDistance(point, path[0] as Coord) };
  }

  let bestIndex = 0;
  let bestPoint: Coord = path[0] as Coord;
  let bestDistance = coordDistance(point, path[0] as Coord);

  for (let i = 0; i < path.length - 1; i++) {
    const p1 = path[i] as Coord;
    const p2 = path[i + 1] as Coord;

    const projected = projectPointToSegment(point, p1, p2);
    const d = coordDistance(point, projected);
    if (d < bestDistance) {
      bestDistance = d;
      bestPoint = projected;
      bestIndex = i;
    }
  }

  const last = path[path.length - 1] as Coord;
  const lastDistance = coordDistance(point, last);
  if (lastDistance < bestDistance) {
    bestDistance = lastDistance;
    bestPoint = last;
    bestIndex = path.length - 1;
  }

  return { index: bestIndex, point: bestPoint, distance: bestDistance };
}

function projectPointToSegment(point: Coord, a: Coord, b: Coord): Coord {
  const [x, y] = [point[0], point[1]];
  const [x1, y1] = [a[0], a[1]];
  const [x2, y2] = [b[0], b[1]];

  const dx = x2 - x1;
  const dy = y2 - y1;

  if (dx === 0 && dy === 0) {
    return a;
  }

  const t = ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy);
  const clampedT = Math.max(0, Math.min(1, t));

  return [x1 + clampedT * dx, y1 + clampedT * dy];
}

export function weightedMovingAverage(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  let sum = 0;
  let weightSum = 0;
  for (let i = 0; i < values.length; i++) {
    const weight = i + 1;
    const value = values[i];
    if (typeof value === "number" && !Number.isNaN(value)) {
      sum += value * weight;
      weightSum += weight;
    }
  }
  return weightSum === 0 ? 0 : sum / weightSum;
}

export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "N/A";
  }
  if (seconds < 60) {
    return `${Math.round(seconds)} sec`;
  }
  if (seconds < 3600) {
    return `${Math.ceil(seconds / 60)} min`;
  }
  const hours = Math.floor(seconds / 3600);
  const mins = Math.ceil((seconds % 3600) / 60);
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export function interpolateAlongPath(path: Coord[], distanceFromStart: number): { index: number; point: Coord } {
  const distances = pathCumulativeDistances(path);
  const total = distances[distances.length - 1] ?? 0;

  if (path.length === 0 || distanceFromStart <= 0) {
    return { index: 0, point: path[0] ?? [0, 0] };
  }
  if (distanceFromStart >= total) {
    return { index: path.length - 1, point: path[path.length - 1] ?? [0, 0] };
  }

  let i = 1;
  while (i < distances.length && (distances[i] ?? 0) < distanceFromStart) {
    i++;
  }

  const segmentStart = distances[i - 1] ?? 0;
  const segmentEnd = distances[i] ?? 0;
  const segmentLength = segmentEnd - segmentStart;

  if (segmentLength === 0) {
    return { index: i - 1, point: path[i - 1] ?? [0, 0] };
  }

  const t = (distanceFromStart - segmentStart) / segmentLength;
  const p1 = path[i - 1] ?? [0, 0];
  const p2 = path[i] ?? [0, 0];
  const lat = p1[0] + t * (p2[0] - p1[0]);
  const lng = p1[1] + t * (p2[1] - p1[1]);

  return { index: i - 1, point: [lat, lng] };
}
