type EventName = "page_view" | "click" | (string & {});

type TrackProperties = Record<string, unknown>;

type InitOptions = {
  endpoint?: string;
  autoTrack?: boolean;
};

type EventPayload = {
  apiKey: string;
  sessionId: string;
  eventName: EventName;
  timestamp: string;
  url: string;
  userAgent: string;
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
  initialized: false,
  listenersAttached: false,
  queue: [] as Array<Omit<EventPayload, "apiKey">>
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
  return {
    sessionId: ensureSessionId(),
    eventName,
    timestamp: new Date().toISOString(),
    url: typeof window === "undefined" ? "" : window.location.href,
    userAgent: typeof navigator === "undefined" ? "" : navigator.userAgent,
    properties,
    element
  };
}

function send(payload: EventPayload) {
  const body = JSON.stringify(payload);

  if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
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

function flushQueue() {
  while (state.queue.length > 0) {
    const event = state.queue.shift();

    if (!event) {
      continue;
    }

    send({ ...event, apiKey: state.apiKey });
  }
}

function track(eventName: EventName, properties: TrackProperties = {}, element?: EventPayload["element"]) {
  const payload = buildPayload(eventName, properties, element);

  if (!state.initialized) {
    state.queue.push(payload);
    return;
  }

  send({ ...payload, apiKey: state.apiKey });
}

function attachAutoTracking() {
  if (state.listenersAttached || typeof window === "undefined" || !state.autoTrack) {
    return;
  }

  window.addEventListener("load", () => {
    track("page_view", {
      title: document.title,
      referrer: document.referrer
    });
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

  state.listenersAttached = true;
}

function init(apiKey: string, options: InitOptions = {}) {
  state.apiKey = apiKey;
  state.endpoint = options.endpoint ?? state.endpoint;
  state.autoTrack = options.autoTrack ?? true;
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
