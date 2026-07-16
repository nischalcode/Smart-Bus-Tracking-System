export function toObjectIdString(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if (obj._id) return toObjectIdString(obj._id);
    if (typeof obj.toString === "function") {
      try {
        const str = (obj as { toString: () => string }).toString();
        if (str !== "[object Object]") return str;
      } catch {
        return null;
      }
    }
  }
  return null;
}
