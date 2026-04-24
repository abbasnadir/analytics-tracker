type EventName = "page_view" | "click" | "scroll_depth" | "performance" | "session_end" | (string & {});

type TrackProperties = Record<string, unknown>;

type InitOptions = {
  endpoint?: string;
  autoTrack?: boolean;
  enableScrollTracking?: boolean;
  enablePerfTracking?: boolean;
};

type EventPayload = {
  apiKey: string;
  sessionId: string;
  eventName: EventName;
  timestamp: string;
  url: string;
  userAgent: string;
  viewport?: { w: number; h: number };
  screen?: { w: number; h: number };
  properties: TrackProperties;
  element?: {
    tagName?: string;
    id?: string;
    classes?: string[];
    text?: string;
  };
};

type Command = ["init", string, InitOptions?] | ["track", EventName, TrackProperties?];

const STORAGE_KEY = "mf_session_id";

const state = {
  apiKey: "",
  endpoint: "http://localhost:4000/api/v1/events",
  autoTrack: true,
  enableScrollTracking: false,
  enablePerfTracking: false,
  initialized: false,
  listenersAttached: false,
  queue: [] as Array<Omit<EventPayload, "apiKey">>,
  pageLoadTimestamp: typeof Date !== "undefined" ? Date.now() : 0,
};

function ensureSessionId() {
  if (typeof window === "undefined") {
    return "server-session";
  }

  const existing = window.localStorage.getItem(STORAGE_KEY);

  if (existing) {
    return existing;
  }

  const sessionId = crypto.randomUUID();
  window.localStorage.setItem(STORAGE_KEY, sessionId);
  return sessionId;
}

function buildPayload(
  eventName: EventName,
  properties: TrackProperties = {},
  element?: EventPayload["element"]
): Omit<EventPayload, "apiKey"> {
  const payload: Omit<EventPayload, "apiKey"> = {
    sessionId: ensureSessionId(),
    eventName,
    timestamp: new Date().toISOString(),
    url: typeof window === "undefined" ? "" : window.location.href,
    userAgent: typeof navigator === "undefined" ? "" : navigator.userAgent,
    properties,
    element
  };

  if (typeof window !== "undefined") {
    payload.viewport = { w: window.innerWidth, h: window.innerHeight };
    payload.screen = { w: window.screen.width, h: window.screen.height };
  }

  return payload;
}

function send(payload: EventPayload, useBeacon = false) {
  const body = JSON.stringify(payload);

  if (useBeacon && typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
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
        "x-api-key": state.apiKey
      },
      body,
      keepalive: true
    });
  }
}

function flushQueue(useBeacon = false) {
  while (state.queue.length > 0) {
    const event = state.queue.shift();

    if (!event) {
      continue;
    }

    send({ ...event, apiKey: state.apiKey }, useBeacon);
  }
}

function track(eventName: EventName, properties: TrackProperties = {}, element?: EventPayload["element"]) {
  const payload = buildPayload(eventName, properties, element);

  if (!state.initialized) {
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
      const scrollPct = (scrollPos / docHeight) * 100;
      
      const milestones = [25, 50, 75, 90];
      let reached = 0;
      for (const m of milestones) {
        if (scrollPct >= m) {
          reached = m;
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
      const entries = list.getEntries();
      for (const entry of entries) {
        if (entry.entryType === "paint" && entry.name === "first-contentful-paint") {
          track("performance", { metric: "FCP", valueMs: Math.round(entry.startTime) });
        }
        if (entry.entryType === "navigation") {
          const navEntry = entry as PerformanceNavigationTiming;
          const ttfb = navEntry.responseStart - navEntry.requestStart;
          if (ttfb > 0) {
            track("performance", { metric: "TTFB", valueMs: Math.round(ttfb) });
          }
        }
      }
    });

    observer.observe({ type: "paint", buffered: true });
    observer.observe({ type: "navigation", buffered: true });
  } catch (e) {
    // Ignore observer errors gracefully
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
    } else {
      // Basic reset timer logic on returning to tab.
      // state.pageLoadTimestamp = Date.now();
    }
  });

  window.addEventListener("beforeunload", () => {
    handleSessionEnd();
  });
}

function attachAutoTracking() {
  if (state.listenersAttached || typeof window === "undefined" || !state.autoTrack) {
    return;
  }

  window.addEventListener("load", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const properties: TrackProperties = {
      title: document.title,
      referrer: document.referrer
    };

    const utmTags = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];
    for (const tag of utmTags) {
      const val = urlParams.get(tag);
      if (val) {
        properties[tag] = val;
      }
    }

    track("page_view", properties);
  });

  document.addEventListener("click", (event) => {
    const target = event.target;

    if (!(target instanceof HTMLElement)) {
      return;
    }

    track(
      "click",
      {
        x: event.clientX,
        y: event.clientY
      },
      {
        tagName: target.tagName,
        id: target.id || undefined,
        classes: Array.from(target.classList),
        text: target.innerText?.slice(0, 120)
      }
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
  state.apiKey = apiKey;
  state.endpoint = options.endpoint ?? state.endpoint;
  state.autoTrack = options.autoTrack ?? true;
  state.enableScrollTracking = options.enableScrollTracking ?? false;
  state.enablePerfTracking = options.enablePerfTracking ?? false;
  state.initialized = true;
  attachAutoTracking();
  flushQueue();
}

function invoke(command: "init" | "track", ...args: unknown[]) {
  if (command === "init") {
    const [apiKey, options] = args as [string, InitOptions | undefined];
    init(apiKey, options);
    return;
  }

  if (command === "track") {
    const [eventName, properties] = args as [EventName, TrackProperties | undefined];
    track(eventName, properties);
  }
}

declare global {
  interface Window {
    mf?: (...args: Command) => void;
  }
}

if (typeof window !== "undefined") {
  const existing = window.mf;

  window.mf = invoke as (...args: Command) => void;
  attachAutoTracking();

  if (typeof existing === "function") {
    existing("track", "sdk_rehydrated", { queued: true });
  }
}

export { init, track };
export type { EventPayload, InitOptions, TrackProperties };