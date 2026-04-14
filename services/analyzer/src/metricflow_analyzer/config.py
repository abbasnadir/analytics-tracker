from __future__ import annotations

import os
from dataclasses import dataclass

from dotenv import load_dotenv


load_dotenv()


@dataclass(frozen=True)
class Settings:
    backend_url: str
    api_key: str
    lookback_minutes: int
    poll_seconds: int
    run_once: bool
    request_timeout: int


def load_settings() -> Settings:
    return Settings(
        backend_url=os.getenv("BACKEND_URL", "http://localhost:4000"),
        api_key=os.getenv("ANALYZER_API_KEY", "mf_demo_key"),
        lookback_minutes=int(os.getenv("ANALYZER_LOOKBACK_MINUTES", "1440")),
        poll_seconds=int(os.getenv("ANALYZER_POLL_SECONDS", "30")),
        run_once=os.getenv("ANALYZER_RUN_ONCE", "true").lower() == "true",
        request_timeout=int(os.getenv("ANALYZER_REQUEST_TIMEOUT", "20")),
    )
