import axios from "axios";

export function toErrorMessage(e: unknown): string {
  if (axios.isAxiosError(e)) {
    const d = e.response?.data as any;
    const msg = d?.detail ?? d?.message ?? e.message;
    return typeof msg === "string" ? msg : e.message;
  }
  if (e instanceof Error) return e.message;
  if (typeof e === "string") return e;
  try { return JSON.stringify(e); } catch { return "Unknown error"; }
}
