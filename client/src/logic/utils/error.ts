import axios from "axios";

export function toErrorMessage(e: unknown): string {
  if (axios.isAxiosError(e)) {
    const serverMsg =
      (e.response?.data as any)?.detail ??
      (e.response?.data as any)?.message ??
      e.message;
    return typeof serverMsg === "string" ? serverMsg : e.message;
  }
  if (e instanceof Error) return e.message;
  if (typeof e === "string") return e;
  try { return JSON.stringify(e); } catch { return "Unknown error"; }
}

