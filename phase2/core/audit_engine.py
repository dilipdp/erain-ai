

from __future__ import annotations

from datetime import datetime, timezone
from typing import List

from schemas.input import AuditRequest
from schemas.output import AuditResponse, AuditSummary, Opportunity, RoadmapItem


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def _mk_request_id(now_utc: datetime) -> str:
    return f"AR-{now_utc.strftime('%Y%m%d')}-{now_utc.strftime('%H%M%S')}"


def run_audit(req: AuditRequest) -> AuditResponse:
    """Deterministic v1 AI Business Health Audit.

    This version is explainable and rules-based so you can deliver to clients immediately.
    LLMs / agents can be added later without breaking contracts.
    """

    now = datetime.now(timezone.utc).replace(microsecond=0)
    request_id = _mk_request_id(now)

    findings: List[str] = []
    risks: List[str] = []
    opportunities: List[Opportunity] = []

    industry = (req.business.industry or "").lower()
    systems = (req.operations.systems_used or "").lower()
    issues = (req.operations.known_issues or "").lower()

    # --- Explainable heuristics ---

    if "excel" in systems:
        risks.append(
            "Heavy dependence on spreadsheets increases risk of data inconsistency, delays, and manual errors."
        )
        opportunities.append(
            Opportunity(
                title="Automate KPI reporting",
                area="Reporting",
                description="Standardize core KPIs and automate weekly management reports from a single source.",
                estimated_annual_impact_inr=None,
                confidence=0.65,
                quick_win_days=10,
            )
        )

    if any(x in issues for x in ["downtime", "breakdown"]):
        findings.append(
            "Unplanned downtime is directly impacting throughput and delivery reliability."
        )
        opportunities.append(
            Opportunity(
                title="Reduce unplanned downtime",
                area="Maintenance",
                description="Track top downtime reasons and implement preventive maintenance for critical assets.",
                estimated_annual_impact_inr=None,
                confidence=0.70,
                quick_win_days=14,
            )
        )

    if any(x in issues for x in ["rejection", "scrap", "quality"]):
        findings.append(
            "Quality losses through rejections and scrap are eroding effective margins."
        )
        opportunities.append(
            Opportunity(
                title="Lower rejection rate",
                area="Quality",
                description="Analyze defect patterns by product, shift, and process step to remove root causes.",
                estimated_annual_impact_inr=None,
                confidence=0.72,
                quick_win_days=12,
            )
        )

    if any(x in issues for x in ["delay", "late", "dispatch"]):
        findings.append(
            "Delivery delays often originate from upstream bottlenecks and poor WIP visibility."
        )
        opportunities.append(
            Opportunity(
                title="Identify and relieve bottlenecks",
                area="Operations",
                description="Map process bottlenecks and introduce daily exception alerts for delayed orders.",
                estimated_annual_impact_inr=None,
                confidence=0.68,
                quick_win_days=15,
            )
        )

    if "manufact" in industry:
        findings.append(
            "Manufacturing value leakage typically arises from downtime, scrap, and uneven flow."
        )

    # --- Health score ---

    score = 80 - (len(risks) * 6)
    score = max(35, min(score, 95))

    if not findings:
        findings.append(
            "Initial operational snapshot captured; further data analysis is required for quantified ROI."
        )

    if not risks:
        risks.append(
            "No critical risks identified from the initial snapshot; deeper data review may surface hidden risks."
        )

    roadmap = [
        RoadmapItem(
            horizon="30 days",
            actions=[
                "Conduct data discovery workshop",
                "Define KPI dictionary and baselines",
                "Deliver AI Business Health Audit PDF",
                "Implement top 1–2 quick wins",
            ],
        ),
        RoadmapItem(
            horizon="60 days",
            actions=[
                "Integrate priority data sources",
                "Deploy KPI dashboards and alerts",
                "Measure ROI from quick wins",
            ],
        ),
        RoadmapItem(
            horizon="90 days",
            actions=[
                "Automate recurring insights",
                "Introduce agentic workflows for repeat decisions",
                "Scale solution across teams",
            ],
        ),
    ]

    return AuditResponse(
        request_id=request_id,
        generated_at_utc=_utc_now_iso(),
        summary=AuditSummary(
            overall_health_score=score,
            key_findings=findings,
            top_risks=risks,
        ),
        top_opportunities=opportunities[:10],
        roadmap_30_60_90=roadmap,
        pdf_path=None,
    )