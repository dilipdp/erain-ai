from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from core.audit_engine import run_audit
from core.persistence import persist_audit
from reports.pdf_generator import generate_pdf
from schemas.input import AuditRequest
from schemas.output import AuditResponse
from core.emailer import send_followup_email

# Resolve project root deterministically
PHASE2_ROOT = Path(__file__).resolve().parents[1]  # .../erain-ai/phase2
DATA_DIR = PHASE2_ROOT / "data"
AUDITS_DIR = DATA_DIR / "audits"
LEADS_DIR = DATA_DIR / "leads"
REPORTS_DIR = PHASE2_ROOT / "reports"

# Ensure directories exist
AUDITS_DIR.mkdir(parents=True, exist_ok=True)
LEADS_DIR.mkdir(parents=True, exist_ok=True)
REPORTS_DIR.mkdir(parents=True, exist_ok=True)

# Admin token (optional). If set, endpoints require header X-Admin-Token.
ADMIN_TOKEN = os.getenv("ADMIN_TOKEN", "")

# CORS (comma-separated). Defaults to local Astro dev.
ALLOWED_ORIGINS = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "http://localhost:4321").split(",") if o.strip()]

app = FastAPI(
    title="EraIn AI — Business Health Audit API",
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"] ,
    allow_headers=["*"],
)

# Serve generated PDFs at /reports/<request_id>.pdf
app.mount("/reports", StaticFiles(directory=str(REPORTS_DIR)), name="reports")


@app.get("/health")
def health():
    return {"status": "ok"}


def _require_admin(x_admin_token: Optional[str]) -> None:
    if ADMIN_TOKEN and (x_admin_token or "") != ADMIN_TOKEN:
        raise HTTPException(status_code=401, detail="Unauthorized")


# Helper: build WhatsApp follow-up message for a lead
def _build_whatsapp_message(request_id: str, contact: dict, pdf_path: str) -> str:
    name = contact.get("name") or "there"
    msg = (
        f"Hi {name},\n\n"
        f"Thanks for requesting a free AI Business Assessment from EraIn AI.\n\n"
        f"Your Request ID: {request_id}\n"
        f"Download your report: {pdf_path}\n\n"
        f"We’ll review this and follow up with next steps shortly."
    )
    return msg


@app.post("/audit", response_model=AuditResponse)
def audit(req: AuditRequest):
    report = run_audit(req)

    pdf_fs_path = REPORTS_DIR / f"{report.request_id}.pdf"
    generate_pdf(report, str(pdf_fs_path))

    # Public URL path served by StaticFiles
    report.pdf_path = f"/reports/{report.request_id}.pdf"

    # Debug marker: proves this handler executed for this request
    (AUDITS_DIR / ".last_request_id").write_text(report.request_id + "\n", encoding="utf-8")

    # Persist audit trail (will raise if it fails)
    persist_audit(req, report)

    # Debug marker: proves persist_audit returned successfully
    (AUDITS_DIR / ".persist_ok").write_text("ok\n", encoding="utf-8")

    # Lead capture (optional)
    if getattr(req, "contact", None) is not None and req.contact is not None:

        lead_payload = {
            "request_id": report.request_id,
            "generated_at_utc": report.generated_at_utc,
            "contact": req.contact.model_dump(),
            "business": req.business.model_dump(),
        }

        # Auto WhatsApp follow-up (message generation only)
        wa_message = _build_whatsapp_message(
            report.request_id,
            lead_payload.get("contact", {}),
            report.pdf_path,
        )

        # Persist WhatsApp message for ops / future automation
        wa_path = LEADS_DIR / f"{report.request_id}.whatsapp.txt"
        wa_path.write_text(wa_message, encoding="utf-8")

        # Auto email follow-up (non-blocking, silent if SMTP not configured)
        email_body = (
            f"Hello {req.contact.name or ''},\n\n"
            f"Thank you for requesting a free AI Business Assessment from EraIn AI.\n\n"
            f"Your Request ID: {report.request_id}\n"
            f"You can download your report here:\n"
            f"{report.pdf_path}\n\n"
            f"Our team will review your assessment and contact you shortly."
        )

        send_followup_email(
            to_email=req.contact.email or "",
            subject="Your EraIn AI Business Assessment",
            body=email_body,
        )

        # Per-lead file
        lead_path = LEADS_DIR / f"{report.request_id}.json"
        lead_path.write_text(
            json.dumps(lead_payload, indent=2, ensure_ascii=False),
            encoding="utf-8",
        )

        # Append to leads_index.json (best-effort)
        idx_path = LEADS_DIR / "leads_index.json"
        try:
            if idx_path.exists():
                idx = json.loads(idx_path.read_text(encoding="utf-8"))
                if not isinstance(idx, list):
                    idx = []
            else:
                idx = []

            idx.append({
                "request_id": report.request_id,
                "name": req.contact.name or "",
                "phone": req.contact.phone or "",
                "email": req.contact.email or "",
                "company": req.business.company_name,
                "ts": report.generated_at_utc,
            })
            idx_path.write_text(
                json.dumps(idx, indent=2, ensure_ascii=False),
                encoding="utf-8",
            )
        except Exception:
            pass

    return report


@app.get("/admin/leads")
def admin_list_leads(x_admin_token: Optional[str] = Header(default=None, alias="X-Admin-Token")):
    _require_admin(x_admin_token)
    idx_path = LEADS_DIR / "leads_index.json"
    if not idx_path.exists():
        return []
    try:
        data = json.loads(idx_path.read_text(encoding="utf-8"))
        return data if isinstance(data, list) else []
    except Exception:
        return []


@app.get("/admin/leads/{request_id}")
def admin_get_lead(request_id: str, x_admin_token: Optional[str] = Header(default=None, alias="X-Admin-Token")):
    _require_admin(x_admin_token)
    lead_path = LEADS_DIR / f"{request_id}.json"
    if not lead_path.exists():
        raise HTTPException(status_code=404, detail="Not found")
    return json.loads(lead_path.read_text(encoding="utf-8"))


@app.get("/admin/audits")
def admin_list_audits(x_admin_token: Optional[str] = Header(default=None, alias="X-Admin-Token")):
    _require_admin(x_admin_token)
    if not AUDITS_DIR.exists():
        return []
    audits = []
    for p in sorted(AUDITS_DIR.iterdir()):
        if p.is_dir() and p.name.startswith("AR-"):
            audits.append(p.name)
    return audits


@app.get("/admin/audits/{request_id}")
def admin_get_audit_bundle(request_id: str, x_admin_token: Optional[str] = Header(default=None, alias="X-Admin-Token")):
    _require_admin(x_admin_token)
    bundle_path = AUDITS_DIR / request_id / "bundle.json"
    if not bundle_path.exists():
        raise HTTPException(status_code=404, detail="Not found")
    return json.loads(bundle_path.read_text(encoding="utf-8"))