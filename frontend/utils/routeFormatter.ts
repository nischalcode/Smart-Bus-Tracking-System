export function formatRouteName(from?: string, to?: string): string {
  if (!from || !to) return "Unknown Route";
  return `${from} - ${to}`;
}
