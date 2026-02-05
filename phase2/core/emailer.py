from __future__ import annotations

import os
import smtplib
from dataclasses import dataclass
from email.message import EmailMessage
from typing import Optional

from schemas.input import AuditRequest
from schemas.output import AuditResponse

SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASS = os.getenv("SMTP_PASS")
SMTP_FROM = os.getenv("SMTP_FROM", "EraIn AI <hello@erainai.com>")


@dataclass(frozen=True)
class EmailDraft:
    subject: str
    body: str


def _safe(v: Optional[str]) -> str:
    return (v or "").strip()


def _summary_fields(res: AuditResponse):
    """Return (score, key_findings) supporting pydantic objects or dict-like."""
    s = getattr(res, "summary", None)
    if s is None and isinstance(res, dict):
        s = res.get("summary")

    score = None
    findings = []

    if isinstance(s, dict):
        score = s.get("overall_health_score")
        findings = s.get("key_findings") or []
    elif s is not None:
        score = getattr(s, "overall_health_score", None)
        findings = getattr(s, "key_findings", None) or []

    if score is None:
        score = 0

    # Ensure list[str]
    findings = [str(x) for x in findings if x is not None]
    return int(score), findings


def build_whatsapp_message(req: AuditRequest, res: AuditResponse) -> str:
    """
    Build a ready-to-send WhatsApp message for the lead.

    This is persisted to: data/leads/<request_id>.whatsapp.txt
    """
    c = req.contact
    b = req.business

    name = _safe(getattr(c, "name", None)) or "there"
    company = _safe(getattr(b, "company_name", None)) or "your company"

    score, findings = _summary_fields(res)

    lines = [
        f"Hi {name}, this is EraIn AI.",
        f"Your AI Business Health Audit is ready for {company}.",
        "",
        f"Request ID: {res.request_id}",
        f"Health Score: {score}/100",
        "",
        "Top findings:",
    ]

    for f in findings[:3]:
        lines.append(f"- {f}")

    lines += [
        "",
        "Want a deeper Pro Audit with quantified impact + 1-hour founder consultation?",
        "Reply YES and share your preferred time.",
        "",
        "— EraIn AI",
        "hello@erainai.com | +91 99860 06006",
    ]

    return "\n".join(lines).strip() + "\n"


def build_email_draft(req: AuditRequest, res: AuditResponse) -> EmailDraft:
    """
    Build a ready-to-send email draft (subject + body) for the lead.

    This is persisted to: data/leads/<request_id>.email.txt
    """
    c = req.contact
    b = req.business

    name = _safe(getattr(c, "name", None)) or "there"
    company = _safe(getattr(b, "company_name", None)) or "your company"

    score, findings = _summary_fields(res)

    subject = f"EraIn AI Audit Ready - {company} ({res.request_id})"

    body_lines = [
        f"Hi {name},",
        "",
        f"Your AI Business Health Audit is ready for {company}.",
        "",
        f"Request ID: {res.request_id}",
        f"Health Score: {score}/100",
        "",
        "Key findings:",
    ]

    for f in findings[:5]:
        body_lines.append(f"- {f}")

    body_lines += [
        "",
        "Next steps:",
        "- Reply to this email with your preferred time for a 20-min walkthrough, or",
        "- Upgrade to a Pro Audit for quantified impact + implementation roadmap.",
        "",
        "Thanks,",
        "EraIn AI",
        "hello@erainai.com",
        "+91 99860 06006",
    ]

    return EmailDraft(subject=subject, body="\n".join(body_lines).strip() + "\n")


def send_followup_email(
    *,
    to_email: str,
    subject: str,
    body: str,
) -> Optional[str]:
    """
    Send a plain-text follow-up email.

    Returns None on success, or an error string on failure.
    If SMTP is not configured, it exits silently.
    """
    if not SMTP_HOST or not to_email:
        return None  # SMTP not configured or no recipient

    try:
        msg = EmailMessage()
        msg["From"] = SMTP_FROM
        msg["To"] = to_email
        msg["Subject"] = subject
        msg.set_content(body)

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as server:
            server.starttls()
            if SMTP_USER and SMTP_PASS:
                server.login(SMTP_USER, SMTP_PASS)
            server.send_message(msg)

        return None
    except Exception as e:
        return str(e)