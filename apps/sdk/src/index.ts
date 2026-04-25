type EventName =
  | "page_view"
  | "click"
  | "scroll_depth"
  | "performance"
  | "session_end"
  | (string & {});

type TrackProperties = Record<string, unknown>;

type InitOptions = {
  endpoint?: string;
  scriptId?: string;
  autoTrack?: boolean;
  enableScrollTracking?: boolean;
  enablePerfTracking?: boolean;
};

type EventPayload = {
  apiKey: string;
  schemaVersion: string;
  scriptId: string;
  sessionId: string;
  visitorId?: string;
  eventName: EventName;
  timestamp: string;
  url: string;
  path?: string;
  referrer?: string;
  userAgent: string;
  viewport?: { w: number; h: number };
  screen?: { w: number; h: number };
  tzOffsetMin?: number;
  timeZone?: string;
  locale?: string;
  countryCode?: string;
  properties: TrackProperties;
  element?: {
    tagName?: string;
    id?: string;
    classes?: string[];
    text?: string;
  };
};

type InitCommandConfig = InitOptions & {
  token?: string;
  apiKey?: string;
};

type Command =
  | ["init", string, InitOptions?]
  | ["init", InitCommandConfig]
  | ["track", EventName, TrackProperties?];

type MfGlobal = ((...args: Command) => void) & {
  q?: unknown[];
};

const SESSION_STORAGE_KEY = "mf_session_id";
const VISITOR_STORAGE_KEY = "mf_visitor_id";
const DEFAULT_ENDPOINT = "/api/v1/events";

const state = {
  apiKey: "",
  endpoint: DEFAULT_ENDPOINT,
  scriptId: "default",
  autoTrack: true,
  enableScrollTracking: false,
  enablePerfTracking: false,
  initialized: false,
  listenersAttached: false,
  sessionEnding: false,
  lastTrackedPageKey: "",
  queue: [] as Array<Omit<EventPayload, "apiKey">>,
  pageLoadTimestamp: typeof Date !== "undefined" ? Date.now() : 0,
};

function generateSessionId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function ensureSessionId() {
  if (typeof window === "undefined") {
    return "server-session";
  }

  try {
    const existing = window.sessionStorage.getItem(SESSION_STORAGE_KEY);

    if (existing) {
      return existing;
    }

    const sessionId = generateSessionId();
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, sessionId);
    return sessionId;
  } catch {
    return generateSessionId();
  }
}

function ensureVisitorId() {
  if (typeof window === "undefined") {
    return "server-visitor";
  }

  try {
    const existing = window.localStorage.getItem(VISITOR_STORAGE_KEY);

    if (existing) {
      return existing;
    }

    const visitorId = generateSessionId();
    window.localStorage.setItem(VISITOR_STORAGE_KEY, visitorId);
    return visitorId;
  } catch {
    return generateSessionId();
  }
}

const TIME_ZONE_TO_COUNTRY_CODE: Record<string, string> = {
  "Asia/Calcutta": "IN",
  "Asia/Dubai": "AE",
  "Asia/Hong_Kong": "HK",
  "Asia/Kolkata": "IN",
  "Asia/Seoul": "KR",
  "Asia/Singapore": "SG",
  "Asia/Tokyo": "JP",
  "Australia/Melbourne": "AU",
  "Australia/Perth": "AU",
  "Australia/Sydney": "AU",
  "Europe/Berlin": "DE",
  "Europe/London": "GB",
  "Europe/Paris": "FR",
  "Pacific/Auckland": "NZ",
};

function inferCountryCodeFromTimeZone(timeZone?: string) {
  if (!timeZone) {
    return undefined;
  }

  return TIME_ZONE_TO_COUNTRY_CODE[timeZone];
}

function extractCountryCode(locale?: string, timeZone?: string) {
  const countryCodeFromTimeZone = inferCountryCodeFromTimeZone(timeZone);

  if (countryCodeFromTimeZone) {
    return countryCodeFromTimeZone;
  }

  if (!locale) {
    return undefined;
  }

  const match = locale.match(/[-_]([A-Za-z]{2})\b/);
  return match?.[1]?.toUpperCase();
}

function clearSessionId() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // Ignore storage cleanup failures.
  }
}

function buildPayload(
  eventName: EventName,
  properties: TrackProperties = {},
  element?: EventPayload["element"],
): Omit<EventPayload, "apiKey"> {
  const timeZone =
    typeof Intl !== "undefined"
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : undefined;
  const locale =
    typeof navigator !== "undefined" && navigator.language
      ? navigator.language
      : undefined;

  const payload: Omit<EventPayload, "apiKey"> = {
    schemaVersion: "1.0",
    scriptId: state.scriptId,
    sessionId: ensureSessionId(),
    visitorId: ensureVisitorId(),
    eventName,
    timestamp: new Date().toISOString(),
    url: typeof window === "undefined" ? "" : window.location.href,
    userAgent: typeof navigator === "undefined" ? "" : navigator.userAgent,
    tzOffsetMin: new Date().getTimezoneOffset(),
    timeZone,
    locale,
    countryCode: extractCountryCode(locale, timeZone),
    properties,
    element,
  };

  if (typeof window !== "undefined") {
    payload.path = window.location.pathname;
    payload.referrer = document.referrer || undefined;
    payload.viewport = { w: window.innerWidth, h: window.innerHeight };
    payload.screen = { w: window.screen.width, h: window.screen.height };
  }

  return payload;
}

function send(payload: EventPayload, useBeacon = false) {
  const body = JSON.stringify(payload);

  if (
    useBeacon &&
    typeof navigator !== "undefined" &&
    typeof navigator.sendBeacon === "function"
  ) {
    const blob = new Blob([body], { type: "application/json" });
    const sent = navigator.sendBeacon(state.endpoint, blob);

    if (sent) {
      return;
    }
  }

  if (typeof fetch !== "undefined") {
    void fetch(state.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": state.apiKey,
      },
      body,
      keepalive: true,
    }).catch(() => {
      // Keep the SDK fire-and-forget and silent on client pages.
    });
  }
}

function flushQueue(useBeacon = false) {
  while (state.queue.length > 0) {
    const event = state.queue.shift();

    if (!event || !state.apiKey) {
      continue;
    }

    send({ ...event, apiKey: state.apiKey }, useBeacon);
  }
}

function track(
  eventName: EventName,
  properties: TrackProperties = {},
  element?: EventPayload["element"],
) {
  const payload = buildPayload(eventName, properties, element);

  if (!state.initialized || !state.apiKey) {
    state.queue.push(payload);
    return;
  }

  const useBeacon = eventName === "session_end";
  send({ ...payload, apiKey: state.apiKey }, useBeacon);
}

function attachScrollTracking() {
  let highestMappedScroll = 0;
  let scrollTimeout: ReturnType<typeof setTimeout> | null = null;

  const handleScroll = () => {
    if (scrollTimeout) {
      clearTimeout(scrollTimeout);
    }

    scrollTimeout = setTimeout(() => {
      const docHeight = document.body.scrollHeight;
      const scrollPos = window.scrollY + window.innerHeight;
      const scrollPct = docHeight === 0 ? 0 : (scrollPos / docHeight) * 100;

      const milestones = [25, 50, 75, 90];
      let reached = 0;

      for (const milestone of milestones) {
        if (scrollPct >= milestone) {
          reached = milestone;
        }
      }

      if (reached > highestMappedScroll) {
        highestMappedScroll = reached;
        track("scroll_depth", { depth: reached });
      }
    }, 500);
  };

  window.addEventListener("scroll", handleScroll, { passive: true });
}

function attachPerformanceTracking() {
  if (typeof window.PerformanceObserver === "undefined") {
    return;
  }

  try {
    const observer = new window.PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (
          entry.entryType === "paint" &&
          entry.name === "first-contentful-paint"
        ) {
          track("performance", {
            metric: "FCP",
            valueMs: Math.round(entry.startTime),
          });
        }

        if (entry.entryType === "navigation") {
          const navEntry = entry as PerformanceNavigationTiming;
          const ttfb = navEntry.responseStart - navEntry.requestStart;

          if (ttfb > 0) {
            track("performance", {
              metric: "TTFB",
              valueMs: Math.round(ttfb),
            });
          }
        }
      }
    });

    observer.observe({ type: "paint", buffered: true });
    observer.observe({ type: "navigation", buffered: true });
  } catch {
    // Ignore observer errors gracefully.
  }
}

function attachSessionTracking() {
  const trackSessionEnd = () => {
    const timeSpentMs = Date.now() - state.pageLoadTimestamp;
    track("session_end", { timeSpentMs });
    flushQueue(true);
  };

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      trackSessionEnd();
    }
  });

  const finalizeSession = () => {
    if (state.sessionEnding) {
      return;
    }

    state.sessionEnding = true;
    trackSessionEnd();
    clearSessionId();
  };

  window.addEventListener("pagehide", finalizeSession);
  window.addEventListener("beforeunload", finalizeSession);
}

function trackPageView() {
  const pageKey = `${window.location.pathname}${window.location.search}${window.location.hash}`;

  if (state.lastTrackedPageKey === pageKey) {
    return;
  }

  state.lastTrackedPageKey = pageKey;

  const urlParams = new URLSearchParams(window.location.search);
  const properties: TrackProperties = {
    title: document.title,
    referrer: document.referrer,
  };

  const utmTags = [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
  ];

  for (const tag of utmTags) {
    const value = urlParams.get(tag);

    if (value) {
      properties[tag] = value;
    }
  }

  track("page_view", properties);
}

function attachAutoTracking() {
  if (
    state.listenersAttached ||
    typeof window === "undefined" ||
    !state.autoTrack
  ) {
    return;
  }

  if (document.readyState === "complete") {
    trackPageView();
  } else {
    window.addEventListener("load", trackPageView, { once: true });
  }

  document.addEventListener("click", (event) => {
    const target = event.target;

    if (!(target instanceof HTMLElement)) {
      return;
    }

    track(
      "click",
      {
        x: event.clientX,
        y: event.clientY,
      },
      {
        tagName: target.tagName,
        id: target.id || undefined,
        classes: Array.from(target.classList),
        text: target.innerText?.slice(0, 120),
      },
    );
  });

  const schedulePageView = () => {
    window.setTimeout(() => {
      trackPageView();
    }, 0);
  };

  const originalPushState = window.history.pushState.bind(window.history);
  window.history.pushState = function (...args) {
    originalPushState(...args);
    schedulePageView();
  };

  const originalReplaceState = window.history.replaceState.bind(window.history);
  window.history.replaceState = function (...args) {
    originalReplaceState(...args);
    schedulePageView();
  };

  window.addEventListener("popstate", schedulePageView);
  window.addEventListener("hashchange", schedulePageView);

  if (state.enableScrollTracking) {
    attachScrollTracking();
  }

  if (state.enablePerfTracking) {
    attachPerformanceTracking();
  }

  attachSessionTracking();
  state.listenersAttached = true;
}

function init(apiKey: string, options: InitOptions = {}) {
  if (!apiKey || typeof apiKey !== "string") {
    throw new Error("MetricFlow SDK init requires a non-empty API key/token.");
  }

  state.apiKey = apiKey;
  state.endpoint =
    options.endpoint ??
    inferDefaultEndpoint() ??
    state.endpoint;
  state.scriptId = options.scriptId ?? state.scriptId;
  state.autoTrack = options.autoTrack ?? true;
  state.enableScrollTracking = options.enableScrollTracking ?? false;
  state.enablePerfTracking = options.enablePerfTracking ?? false;
  state.sessionEnding = false;
  state.lastTrackedPageKey = "";
  state.initialized = true;
  attachAutoTracking();
  flushQueue();
}

function normalizeInitArgs(args: unknown[]) {
  if (typeof args[0] === "string") {
    return {
      apiKey: args[0],
      options: (args[1] as InitOptions | undefined) ?? {},
    };
  }

  if (typeof args[0] === "object" && args[0] !== null) {
    const config = args[0] as InitCommandConfig;
    const apiKey =
      typeof config.apiKey === "string"
        ? config.apiKey
        : typeof config.token === "string"
          ? config.token
          : "";

    return {
      apiKey,
      options: {
        endpoint: config.endpoint,
        scriptId: config.scriptId,
        autoTrack: config.autoTrack,
        enableScrollTracking: config.enableScrollTracking,
        enablePerfTracking: config.enablePerfTracking,
      } as InitOptions,
    };
  }

  return null;
}

function invoke(command: "init" | "track", ...args: unknown[]) {
  if (command === "init") {
    const normalized = normalizeInitArgs(args);

    if (!normalized) {
      return;
    }

    init(normalized.apiKey, normalized.options);
    return;
  }

  if (command === "track") {
    const [eventName, properties] = args;

    if (typeof eventName !== "string") {
      return;
    }

    track(
      eventName as EventName,
      (properties as TrackProperties | undefined) ?? {},
    );
  }
}

function asQueuedArgs(value: unknown) {
  if (Array.isArray(value)) {
    return value;
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "length" in value &&
    typeof (value as { length?: unknown }).length === "number"
  ) {
    return Array.from(value as ArrayLike<unknown>);
  }

  return null;
}

function replayPreloadQueue(previous: unknown) {
  if (typeof previous !== "function") {
    return;
  }

  const queued = (previous as { q?: unknown }).q;

  if (!Array.isArray(queued)) {
    return;
  }

  for (const item of queued) {
    const args = asQueuedArgs(item);

    if (!args || args.length === 0) {
      continue;
    }

    const [command, ...commandArgs] = args;

    if (command === "init" || command === "track") {
      invoke(command, ...commandArgs);
    }
  }
}

function parseBooleanAttribute(value: string | null, fallback: boolean) {
  if (value === null) {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();

  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }

  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }

  return fallback;
}

function findBootstrapScript() {
  if (typeof document === "undefined") {
    return null;
  }

  const current = document.currentScript;

  if (
    current instanceof HTMLScriptElement &&
    (current.hasAttribute("data-mf-token") ||
      current.hasAttribute("data-mf-api-key") ||
      current.hasAttribute("data-api-key"))
  ) {
    return current;
  }

  return document.querySelector(
    "script[data-mf-token],script[data-mf-api-key],script[data-api-key]",
  );
}

function inferEndpointFromScript(script: HTMLScriptElement) {
  const explicitEndpoint = script.getAttribute("data-mf-endpoint");

  if (explicitEndpoint) {
    return explicitEndpoint;
  }

  if (!script.src) {
    return undefined;
  }

  try {
    const scriptUrl = new URL(script.src, window.location.href);
    return new URL("/api/v1/events", scriptUrl.origin).toString();
  } catch {
    return undefined;
  }
}

function inferDefaultEndpoint() {
  if (typeof document === "undefined") {
    return undefined;
  }

  const script =
    findBootstrapScript() ??
    document.querySelector('script[src$="/mf.js"],script[src*="/mf.js?"],script[src$="mf.js"]');

  if (!(script instanceof HTMLScriptElement)) {
    return undefined;
  }

  return inferEndpointFromScript(script);
}

function autoInitFromScriptTag() {
  if (state.initialized) {
    return;
  }

  const script = findBootstrapScript();

  if (!(script instanceof HTMLScriptElement)) {
    return;
  }

  const token =
    script.getAttribute("data-mf-token") ||
    script.getAttribute("data-mf-api-key") ||
    script.getAttribute("data-api-key");

  if (!token) {
    return;
  }

  init(token, {
    endpoint: inferEndpointFromScript(script),
    scriptId: script.getAttribute("data-mf-script-id") ?? undefined,
    autoTrack: parseBooleanAttribute(
      script.getAttribute("data-mf-auto-track"),
      true,
    ),
    enableScrollTracking: parseBooleanAttribute(
      script.getAttribute("data-mf-scroll"),
      false,
    ),
    enablePerfTracking: parseBooleanAttribute(
      script.getAttribute("data-mf-perf"),
      false,
    ),
  });
}

declare global {
  interface Window {
    mf?: MfGlobal;
  }
}

if (typeof window !== "undefined") {
  const previousMf = window.mf;

  window.mf = ((...args: Command) => {
    const [command, ...commandArgs] = args;
    invoke(command, ...commandArgs);
  }) as MfGlobal;

  replayPreloadQueue(previousMf);

  if (!state.initialized) {
    autoInitFromScriptTag();
  }

  attachAutoTracking();
}

export { init, track };
export type { EventPayload, InitOptions, TrackProperties };
