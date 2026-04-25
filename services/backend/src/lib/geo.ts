import type { Request } from "express";

const COUNTRY_HEADER_CANDIDATES = [
  "cf-ipcountry",
  "x-vercel-ip-country",
  "cloudfront-viewer-country",
  "x-appengine-country",
  "x-country-code",
  "x-country",
  "x-geo-country",
] as const;

const INVALID_COUNTRY_CODES = new Set([
  "A1",
  "A2",
  "AP",
  "EU",
  "O1",
  "T1",
  "XX",
  "ZZ",
]);

export function normalizeCountryCode(countryCode?: string | null) {
  if (!countryCode) {
    return undefined;
  }

  const normalized = countryCode.trim().toUpperCase();

  if (!/^[A-Z]{2}$/.test(normalized)) {
    return undefined;
  }

  if (INVALID_COUNTRY_CODES.has(normalized)) {
    return undefined;
  }

  return normalized;
}

export function resolveCountryCode(
  countryCode?: string | null,
  locale?: string | null,
) {
  const explicitCountryCode = normalizeCountryCode(countryCode);

  if (explicitCountryCode) {
    return explicitCountryCode;
  }

  if (!locale) {
    return undefined;
  }

  const match = locale.match(/[-_]([A-Za-z]{2})\b/);
  return normalizeCountryCode(match?.[1]);
}

export function resolveCountryCodeFromRequest(request: Request) {
  for (const headerName of COUNTRY_HEADER_CANDIDATES) {
    const countryCode = normalizeCountryCode(request.header(headerName));

    if (countryCode) {
      return countryCode;
    }
  }

  return undefined;
}
