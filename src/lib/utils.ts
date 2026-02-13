import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const TH_TZ = "Asia/Bangkok";

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString("th-TH", { timeZone: TH_TZ });
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("th-TH", { timeZone: TH_TZ });
}

export function formatTime(date: string | Date): string {
  return new Date(date).toLocaleTimeString("th-TH", { timeZone: TH_TZ });
}

// --- IP & Country Flag helpers ---

const IPV4_RE = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;

export function isIPAddress(str: string): boolean {
  return IPV4_RE.test(str);
}

export function isPrivateIP(ip: string): boolean {
  if (!isIPAddress(ip)) return false;
  const parts = ip.split(".").map(Number);
  if (parts[0] === 10) return true;
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
  if (parts[0] === 192 && parts[1] === 168) return true;
  if (parts[0] === 127) return true;
  return false;
}

const IP_COUNTRY_MAP: Record<string, string> = {
  "45.33.32.156": "US",
  "8.8.4.4": "US",
  "8.8.8.8": "US",
  "185.220.101.1": "DE",
};

function countryCodeToFlag(code: string): string {
  return [...code.toUpperCase()].map(
    (c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65)
  ).join("");
}

export function getCountryFlag(ip: string): string | null {
  if (!isIPAddress(ip) || isPrivateIP(ip)) return null;
  const code = IP_COUNTRY_MAP[ip];
  return code ? countryCodeToFlag(code) : null;
}
