from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel
from core.persistence import persist_audit, persist_lead, update_lead_status

from core.audit_engine import run_audit
from reports.pdf_generator import generate_pdf
from schemas.input import AuditRequest
from schemas.output import AuditResponse

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


class LeadStatusUpdate(BaseModel):
    status: str
    note: str = ""


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

    # Persist lead + communication templates
    persist_lead(req, report)

    # Debug marker: proves persist_audit returned successfully
    (AUDITS_DIR / ".persist_ok").write_text("ok\n", encoding="utf-8")

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


@app.patch("/admin/leads/{request_id}/status")
def admin_update_lead_status(
    request_id: str,
    body: LeadStatusUpdate,
    x_admin_token: Optional[str] = Header(default=None, alias="X-Admin-Token"),
):
    _require_admin(x_admin_token)
    try:
        updated = update_lead_status(request_id=request_id, status=body.status, note=body.note)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Not found")
    return {"ok": True, "lead": updated}


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


@app.get("/admin/leads/{request_id}/whatsapp", response_class=PlainTextResponse)
def admin_lead_whatsapp(request_id: str, x_admin_token: Optional[str] = Header(default=None, alias="X-Admin-Token")):
    _require_admin(x_admin_token)
    p = LEADS_DIR / f"{request_id}.whatsapp.txt"
    if not p.exists():
        raise HTTPException(status_code=404, detail="whatsapp template not found")
    return p.read_text(encoding="utf-8")


@app.get("/admin/leads/{request_id}/email", response_class=PlainTextResponse)
def admin_lead_email(request_id: str, x_admin_token: Optional[str] = Header(default=None, alias="X-Admin-Token")):
    _require_admin(x_admin_token)
    p = LEADS_DIR / f"{request_id}.email.txt"
    if not p.exists():
        raise HTTPException(status_code=404, detail="email template not found")
    return p.read_text(encoding="utf-8")

@app.get("/admin/metrics")
def admin_metrics(x_admin_token: Optional[str] = Header(default=None, alias="X-Admin-Token")):
    _require_admin(x_admin_token)

    leads = []
    if (LEADS_DIR / "leads_index.json").exists():
        try:
            leads = json.loads((LEADS_DIR / "leads_index.json").read_text())
        except Exception:
            leads = []

    total_leads = len(leads)

    by_status = {}
    for l in leads:
        status = l.get("status", "new")
        by_status[status] = by_status.get(status, 0) + 1

    audits = []
    if AUDITS_DIR.exists():
        audits = [p for p in AUDITS_DIR.iterdir() if p.is_dir() and p.name.startswith("AR-")]

    return {
        "total_leads": total_leads,
        "leads_by_status": by_status,
        "total_audits": len(audits),
    }