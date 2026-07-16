export function formatDuration(seconds: number | undefined | null): string {
  if (
    seconds === undefined ||
    seconds === null ||
    !Number.isFinite(seconds) ||
    seconds < 0
  ) {
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
