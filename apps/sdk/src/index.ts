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
  eventName: EventName;
  timestamp: string;
  url: string;
  path?: string;
  referrer?: string;
  userAgent: string;
  viewport?: { w: number; h: number };
  screen?: { w: number; h: number };
  tzOffsetMin?: number;
  locale?: string;
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

const STORAGE_KEY = "mf_session_id";
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
    const existing = window.localStorage.getItem(STORAGE_KEY);

    if (existing) {
      return existing;
    }

    const sessionId = generateSessionId();
    window.localStorage.setItem(STORAGE_KEY, sessionId);
    return sessionId;
  } catch {
    return generateSessionId();
  }
}

function buildPayload(
  eventName: EventName,
  properties: TrackProperties = {},
  element?: EventPayload["element"],
): Omit<EventPayload, "apiKey"> {
  const payload: Omit<EventPayload, "apiKey"> = {
    schemaVersion: "1.0",
    scriptId: state.scriptId,
    sessionId: ensureSessionId(),
    eventName,
    timestamp: new Date().toISOString(),
    url: typeof window === "undefined" ? "" : window.location.href,
    userAgent: typeof navigator === "undefined" ? "" : navigator.userAgent,
    tzOffsetMin: new Date().getTimezoneOffset(),
    locale:
      typeof navigator !== "undefined" && navigator.language
        ? navigator.language
        : undefined,
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
  const handleSessionEnd = () => {
    const timeSpentMs = Date.now() - state.pageLoadTimestamp;
    track("session_end", { timeSpentMs });
    flushQueue(true);
  };

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      handleSessionEnd();
    }
  });

  window.addEventListener("beforeunload", () => {
    handleSessionEnd();
  });
}

function trackPageView() {
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
  state.endpoint = options.endpoint ?? state.endpoint;
  state.scriptId = options.scriptId ?? state.scriptId;
  state.autoTrack = options.autoTrack ?? true;
  state.enableScrollTracking = options.enableScrollTracking ?? false;
  state.enablePerfTracking = options.enablePerfTracking ?? false;
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
    endpoint: script.getAttribute("data-mf-endpoint") ?? undefined,
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
