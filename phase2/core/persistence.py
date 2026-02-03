from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict

from schemas.input import AuditRequest
from schemas.output import AuditResponse


def persist_audit(req: AuditRequest, res: AuditResponse) -> str:
    """Persist audit input + output in an audit-ready structure.

    Writes:
      <phase2>/data/audits/<request_id>/input.json
      <phase2>/data/audits/<request_id>/output.json
      <phase2>/data/audits/<request_id>/bundle.json

    Returns the directory path where files were written.
    """

    base_dir = Path(__file__).resolve().parents[1]  # .../phase2
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
