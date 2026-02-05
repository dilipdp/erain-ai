from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict

from schemas.input import AuditRequest
from schemas.output import AuditResponse
from core.emailer import build_whatsapp_message, build_email_draft


def _phase2_dir() -> Path:
    return Path(__file__).resolve().parents[1]


def persist_audit(req: AuditRequest, res: AuditResponse) -> str:
    """Persist audit input + output in an audit-ready structure.

    Writes:
      <phase2>/data/audits/<request_id>/input.json
      <phase2>/data/audits/<request_id>/output.json
      <phase2>/data/audits/<request_id>/bundle.json

    Returns the directory path where files were written.
    """

    base_dir = _phase2_dir()
    base = base_dir / "data" / "audits" / res.request_id
    base.mkdir(parents=True, exist_ok=True)

    input_path = base / "input.json"
    output_path = base / "output.json"
    bundle_path = base / "bundle.json"

    input_data: Dict[str, Any] = req.model_dump()
    output_data: Dict[str, Any] = res.model_dump()

    input_path.write_text(json.dumps(input_data, indent=2, ensure_ascii=False), encoding="utf-8")
    output_path.write_text(json.dumps(output_data, indent=2, ensure_ascii=False), encoding="utf-8")

    bundle = {
        "request_id": res.request_id,
        "generated_at_utc": res.generated_at_utc,
        "input": input_data,
        "output": output_data,
    }
    bundle_path.write_text(json.dumps(bundle, indent=2, ensure_ascii=False), encoding="utf-8")

    # Marker file to confirm persistence executed
    (base / ".written").write_text("ok\n", encoding="utf-8")

    return str(base)



def persist_lead(req: AuditRequest, res: AuditResponse) -> Path:
    """Persist lead summary + communication templates.

    Writes:
      <phase2>/data/leads/<request_id>.json
      <phase2>/data/leads/<request_id>.whatsapp.txt
      <phase2>/data/leads/<request_id>.email.txt
      <phase2>/data/leads/leads_index.json
    """

    base_dir = _phase2_dir()
    leads_dir = base_dir / "data" / "leads"
    leads_dir.mkdir(parents=True, exist_ok=True)

    # --- Lead JSON ---
    lead_record = {
        "request_id": res.request_id,
        "ts": res.generated_at_utc,
        "contact": req.contact.model_dump(),
        "business": req.business.model_dump(),
        "status": "new",
        "status_note": "",
        "status_updated_at_utc": res.generated_at_utc,
    }

    lead_json_path = leads_dir / f"{res.request_id}.json"
    lead_json_path.write_text(json.dumps(lead_record, indent=2, ensure_ascii=False), encoding="utf-8")

    # --- Templates ---
    whatsapp_path = leads_dir / f"{res.request_id}.whatsapp.txt"
    email_path = leads_dir / f"{res.request_id}.email.txt"

    try:
        whatsapp_text = build_whatsapp_message(req, res)
        email = build_email_draft(req, res)

        whatsapp_path.write_text(whatsapp_text, encoding="utf-8")

        email_payload = f"Subject: {email.subject}\n\n{email.body}"
        # Ensure file exists even if payload is empty
        email_path.write_text(email_payload, encoding="utf-8")

        # Marker file to confirm templates executed
        (leads_dir / f"{res.request_id}.templates.ok").write_text(
            f"whatsapp_bytes={whatsapp_path.stat().st_size}\nemail_bytes={email_path.stat().st_size}\n",
            encoding="utf-8",
        )
    except Exception as e:
        # Capture any failure so we can debug without crashing the API
        (leads_dir / f"{res.request_id}.templates.error").write_text(
            f"{type(e).__name__}: {e}\n",
            encoding="utf-8",
        )

    # --- Index ---
    index_path = leads_dir / "leads_index.json"
    if index_path.exists():
        index = json.loads(index_path.read_text(encoding="utf-8"))
        if not isinstance(index, list):
            index = []
    else:
        index = []

    # Remove existing entry if present
    index = [i for i in index if i.get("request_id") != res.request_id]

    index.append({
        "request_id": res.request_id,
        "ts": res.generated_at_utc,
        "contact": lead_record["contact"],
        "business": lead_record["business"],
        "whatsapp_file": str(whatsapp_path),
        "email_file": str(email_path),
        "status": lead_record["status"],
        "status_note": lead_record["status_note"],
        "status_updated_at_utc": lead_record["status_updated_at_utc"],
    })

    index_path.write_text(json.dumps(index, indent=2, ensure_ascii=False), encoding="utf-8")

    # Mark persistence ok
    (leads_dir / ".persist_ok").write_text("ok\n", encoding="utf-8")

    return leads_dir


# --- New function: update_lead_status
def update_lead_status(request_id: str, status: str, note: str = "") -> Dict[str, Any]:
    """Update lead status and note for a given request_id."""
    base_dir = _phase2_dir()
    leads_dir = base_dir / "data" / "leads"
    lead_path = leads_dir / f"{request_id}.json"
    index_path = leads_dir / "leads_index.json"

    if not lead_path.exists():
        raise FileNotFoundError(f"Lead {request_id} not found")

    lead = json.loads(lead_path.read_text(encoding="utf-8"))
    lead["status"] = status
    lead["status_note"] = note
    lead["status_updated_at_utc"] = __import__("datetime").datetime.utcnow().isoformat() + "Z"

    lead_path.write_text(json.dumps(lead, indent=2, ensure_ascii=False), encoding="utf-8")

    if index_path.exists():
        index = json.loads(index_path.read_text(encoding="utf-8"))
        if isinstance(index, list):
            for row in index:
                if row.get("request_id") == request_id:
                    row["status"] = lead["status"]
                    row["status_note"] = lead["status_note"]
                    row["status_updated_at_utc"] = lead["status_updated_at_utc"]
            index_path.write_text(json.dumps(index, indent=2, ensure_ascii=False), encoding="utf-8")

    return lead
