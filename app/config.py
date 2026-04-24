from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import os

from dotenv import load_dotenv


ROOT_DIR = Path(__file__).resolve().parents[1]
load_dotenv(ROOT_DIR / ".env")


def _bool_env(name: str, default: bool) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


@dataclass(frozen=True)
class Settings:
    api_base_url: str
    raw_events_path: str
    summary_path: str
    api_token: str | None
    poll_interval_seconds: int
    request_timeout_seconds: int
    max_retries: int
    backoff_base_seconds: float
    backoff_max_seconds: float
    raw_range: str
    top_n: int
    state_file: Path
    dedupe_ttl_seconds: int
    cursor_overlap_seconds: int
    use_since_cursor: bool
    anomaly_page_view_threshold: int
    anomaly_click_threshold: int
    anomaly_spike_multiplier: float
    anomaly_history_limit: int
    log_level: str

    @property
    def raw_events_url(self) -> str:
        return f"{self.api_base_url.rstrip('/')}/{self.raw_events_path.lstrip('/')}"

    @property
    def summary_url(self) -> str:
        return f"{self.api_base_url.rstrip('/')}/{self.summary_path.lstrip('/')}"

    @classmethod
    def from_env(cls) -> "Settings":
        state_file = os.getenv("ANALYZER_STATE_FILE", ".analyzer_state.json")
        resolved_state_file = Path(state_file)
        if not resolved_state_file.is_absolute():
            resolved_state_file = ROOT_DIR / resolved_state_file

        return cls(
            api_base_url=os.getenv("ANALYZER_API_BASE_URL", "http://localhost:3000"),
            raw_events_path=os.getenv("ANALYZER_RAW_EVENTS_PATH", "/api/v1/events/raw"),
            summary_path=os.getenv("ANALYZER_SUMMARY_PATH", "/api/v1/events/summary"),
            api_token=os.getenv("ANALYZER_API_TOKEN") or None,
            poll_interval_seconds=int(os.getenv("ANALYZER_POLL_INTERVAL_SECONDS", "30")),
            request_timeout_seconds=int(os.getenv("ANALYZER_REQUEST_TIMEOUT_SECONDS", "30")),
            max_retries=int(os.getenv("ANALYZER_MAX_RETRIES", "5")),
            backoff_base_seconds=float(os.getenv("ANALYZER_BACKOFF_BASE_SECONDS", "1")),
            backoff_max_seconds=float(os.getenv("ANALYZER_BACKOFF_MAX_SECONDS", "30")),
            raw_range=os.getenv("ANALYZER_RAW_RANGE", "24h"),
            top_n=int(os.getenv("ANALYZER_TOP_N", "10")),
            state_file=resolved_state_file,
            dedupe_ttl_seconds=int(os.getenv("ANALYZER_DEDUPE_TTL_SECONDS", "172800")),
            cursor_overlap_seconds=int(os.getenv("ANALYZER_CURSOR_OVERLAP_SECONDS", "120")),
            use_since_cursor=_bool_env("ANALYZER_USE_SINCE_CURSOR", True),
            anomaly_page_view_threshold=int(
                os.getenv("ANALYZER_ANOMALY_PAGE_VIEW_THRESHOLD", "10000")
            ),
            anomaly_click_threshold=int(os.getenv("ANALYZER_ANOMALY_CLICK_THRESHOLD", "20000")),
            anomaly_spike_multiplier=float(
                os.getenv("ANALYZER_ANOMALY_SPIKE_MULTIPLIER", "3.0")
            ),
            anomaly_history_limit=int(os.getenv("ANALYZER_ANOMALY_HISTORY_LIMIT", "20")),
            log_level=os.getenv("ANALYZER_LOG_LEVEL", "INFO").upper(),
        )

