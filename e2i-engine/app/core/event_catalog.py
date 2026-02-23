import re
from functools import lru_cache
from pathlib import Path


CATALOG_PATH = Path(__file__).resolve().parents[3] / "frameworks" / "core" / "EVENT_TYPES_CATALOG.md"
EVENT_PATTERN = re.compile(r"`([a-z]+(?:\.[a-z_<>-]+)+)`")


@lru_cache(maxsize=1)
def load_catalog_events() -> set[str]:
    if not CATALOG_PATH.exists():
        # Minimal fallback for local development if framework docs are unavailable.
        return {
            "data.dataset.snapshot.created",
            "data.dataset.snapshot.superseded",
            "governance.decision.logged",
            "governance.approval.requested",
            "governance.approval.granted",
            "governance.approval.denied",
            "roi.attribution.calculated",
            "report.artifact.published",
            "system.security.invalid_event_rejected",
            "system.security.decision_lineage_missing",
        }

    content = CATALOG_PATH.read_text(encoding="utf-8")
    events: set[str] = set()
    for candidate in EVENT_PATTERN.findall(content):
        # Skip template-style placeholders such as erain.<entity>.rolled_back
        if "<" in candidate or ">" in candidate:
            continue
        events.add(candidate)
    return events


def is_event_type_allowed(event_type: str) -> bool:
    return event_type in load_catalog_events()


def requires_decision_and_snapshot(event_type: str) -> bool:
    prefixes = (
        "plan.",
        "execution.",
        "roi.",
        "report.",
        "governance.approval.",
        "audit.findings.",
    )
    return event_type.startswith(prefixes)


def requires_snapshot(event_type: str) -> bool:
    prefixes = (
        "audit.",
        "kpi.",
        "leakage.",
        "rootcause.",
        "roi.",
        "plan.",
        "execution.",
        "report.",
    )
    return event_type.startswith(prefixes)
