#!/usr/bin/env python3
"""Generate a realistic multi-page sample audit PDF without external deps."""

from __future__ import annotations

import textwrap
from pathlib import Path

PAGE_W = 595
PAGE_H = 842
MARGIN_X = 56


class PdfBuilder:
    def __init__(self) -> None:
        self.objects: list[bytes | None] = [None]

    def add_obj(self, content: bytes | str) -> int:
        if isinstance(content, str):
            content = content.encode("latin-1", "replace")
        self.objects.append(content)
        return len(self.objects) - 1

    def add_stream(self, stream_data: str) -> int:
        data = stream_data.encode("latin-1", "replace")
        stream = b"<< /Length %d >>\nstream\n" % len(data) + data + b"\nendstream"
        return self.add_obj(stream)

    def set_obj(self, obj_id: int, content: bytes | str) -> None:
        if isinstance(content, str):
            content = content.encode("latin-1", "replace")
        self.objects[obj_id] = content

    def build(self, root_id: int) -> bytes:
        out = bytearray()
        out.extend(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")

        offsets = [0] * len(self.objects)
        for obj_id in range(1, len(self.objects)):
            obj = self.objects[obj_id]
            if obj is None:
                raise ValueError(f"Object {obj_id} is unset")
            offsets[obj_id] = len(out)
            out.extend(f"{obj_id} 0 obj\n".encode("ascii"))
            out.extend(obj)
            out.extend(b"\nendobj\n")

        xref_pos = len(out)
        out.extend(f"xref\n0 {len(self.objects)}\n".encode("ascii"))
        out.extend(b"0000000000 65535 f \n")
        for obj_id in range(1, len(self.objects)):
            out.extend(f"{offsets[obj_id]:010d} 00000 n \n".encode("ascii"))

        out.extend(
            (
                f"trailer\n<< /Size {len(self.objects)} /Root {root_id} 0 R >>\n"
                f"startxref\n{xref_pos}\n%%EOF\n"
            ).encode("ascii")
        )
        return bytes(out)


def esc(text: str) -> str:
    return text.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


def rgb(color: tuple[float, float, float]) -> str:
    return f"{color[0]:.3f} {color[1]:.3f} {color[2]:.3f}"


def rect(x: float, y: float, w: float, h: float, color: tuple[float, float, float]) -> str:
    return f"{rgb(color)} rg\n{x:.2f} {y:.2f} {w:.2f} {h:.2f} re f\n"


def stroke_rect(
    x: float,
    y: float,
    w: float,
    h: float,
    color: tuple[float, float, float],
    line_w: float = 1.0,
) -> str:
    return (
        f"{line_w:.2f} w\n"
        f"{rgb(color)} RG\n"
        f"{x:.2f} {y:.2f} {w:.2f} {h:.2f} re S\n"
    )


def text(
    x: float,
    y: float,
    value: str,
    size: int = 11,
    font: str = "F1",
    color: tuple[float, float, float] = (0.06, 0.11, 0.21),
) -> str:
    return (
        "BT\n"
        f"/{font} {size} Tf\n"
        f"{rgb(color)} rg\n"
        f"1 0 0 1 {x:.2f} {y:.2f} Tm\n"
        f"({esc(value)}) Tj\n"
        "ET\n"
    )


def paragraph(
    x: float,
    y_top: float,
    width: float,
    value: str,
    size: int = 11,
    leading: int = 15,
    font: str = "F1",
    color: tuple[float, float, float] = (0.16, 0.20, 0.29),
) -> tuple[str, float]:
    max_chars = max(22, int(width / (size * 0.52)))
    y = y_top
    out: list[str] = []

    for block in value.split("\n"):
        if not block.strip():
            y -= leading
            continue
        for line in textwrap.wrap(block, width=max_chars):
            out.append(text(x, y, line, size=size, font=font, color=color))
            y -= leading

    return "".join(out), y


def footer(page_no: int, total: int) -> str:
    out = []
    out.append(rect(0, 0, PAGE_W, 30, (0.95, 0.97, 1.0)))
    out.append(text(MARGIN_X, 12, "EraIn AI - Sample Pro Audit Report", size=9, color=(0.28, 0.34, 0.45)))
    out.append(text(PAGE_W - 112, 12, f"Page {page_no} / {total}", size=9, color=(0.28, 0.34, 0.45)))
    return "".join(out)


def page_cover(total_pages: int) -> str:
    out: list[str] = []
    out.append(rect(0, PAGE_H - 140, PAGE_W, 140, (0.07, 0.16, 0.36)))
    out.append(text(MARGIN_X, PAGE_H - 52, "ERAIN AI", size=16, font="F2", color=(1, 1, 1)))
    out.append(text(MARGIN_X + 96, PAGE_H - 52, "Sample Audit Delivery", size=15, color=(0.79, 0.88, 1.0)))

    out.append(text(MARGIN_X, PAGE_H - 188, "Sample Pro Audit Report", size=28, font="F2"))
    out.append(text(MARGIN_X, PAGE_H - 218, "Auditability, decision governance, and ROI attribution", size=13, color=(0.15, 0.22, 0.36)))

    intro = (
        "This document demonstrates the standard EraIn launch deliverable for mid-size and multi-site operators. "
        "Numbers are realistic but anonymized for public demonstration."
    )
    para_cmd, _ = paragraph(MARGIN_X, PAGE_H - 258, PAGE_W - (MARGIN_X * 2), intro, size=11)
    out.append(para_cmd)

    card_y = PAGE_H - 420
    card_w = (PAGE_W - (MARGIN_X * 2) - 24) / 3
    cards = [
        ("Revenue at risk", "INR 4.85 Cr", "Annualized leakage estimate"),
        ("Recovery horizon", "90 days", "From first corrective sprint"),
        ("Priority actions", "12", "Ranked by impact and confidence"),
    ]
    for idx, (k, v, s) in enumerate(cards):
        x = MARGIN_X + (idx * (card_w + 12))
        out.append(rect(x, card_y, card_w, 98, (0.95, 0.97, 1.0)))
        out.append(stroke_rect(x, card_y, card_w, 98, (0.79, 0.85, 0.95), line_w=0.9))
        out.append(text(x + 12, card_y + 74, k, size=10, color=(0.30, 0.38, 0.53)))
        out.append(text(x + 12, card_y + 48, v, size=19, font="F2", color=(0.06, 0.12, 0.25)))
        out.append(text(x + 12, card_y + 24, s, size=9, color=(0.33, 0.39, 0.50)))

    out.append(rect(MARGIN_X, 168, PAGE_W - (MARGIN_X * 2), 86, (0.97, 0.98, 1.0)))
    out.append(stroke_rect(MARGIN_X, 168, PAGE_W - (MARGIN_X * 2), 86, (0.81, 0.86, 0.95), line_w=0.8))
    out.append(text(MARGIN_X + 14, 230, "Client snapshot", size=11, font="F2", color=(0.14, 0.21, 0.34)))
    out.append(text(MARGIN_X + 14, 208, "Sector: precision manufacturing | Sites: 4 | ERP: SAP + Excel overlays", size=10, color=(0.24, 0.30, 0.42)))
    out.append(text(MARGIN_X + 14, 188, "Assessment window: 21 days | Data confidence: high in finance, medium in operations", size=10, color=(0.24, 0.30, 0.42)))

    out.append(footer(1, total_pages))
    return "".join(out)


def page_exec_summary(page_no: int, total_pages: int) -> str:
    out: list[str] = []
    out.append(text(MARGIN_X, PAGE_H - 74, "1. Executive summary", size=22, font="F2"))

    para, y = paragraph(
        MARGIN_X,
        PAGE_H - 108,
        PAGE_W - (MARGIN_X * 2),
        (
            "Audit confirms structural value leakage across production planning, inventory turns, and escalation latency. "
            "No single issue is catastrophic; cumulative effect is substantial and recoverable with disciplined execution."
        ),
        size=11,
    )
    out.append(para)

    out.append(text(MARGIN_X, y - 10, "Top observations", size=13, font="F2"))
    bullets = [
        "OTIF slippage averages 14.2 percent due to ad hoc schedule overrides.",
        "Slow-moving inventory creates INR 1.62 Cr annual carrying drag.",
        "Quality escapes tied to late-stage checks add INR 0.74 Cr scrap and rework.",
        "Decision latency between operations and finance averages 9.5 days.",
    ]
    line_y = y - 36
    for b in bullets:
        out.append(text(MARGIN_X + 12, line_y, "-", size=12, font="F2", color=(0.13, 0.36, 0.82)))
        p, next_y = paragraph(MARGIN_X + 26, line_y, PAGE_W - (MARGIN_X * 2) - 30, b, size=11)
        out.append(p)
        line_y = next_y - 6

    out.append(rect(MARGIN_X, 128, PAGE_W - (MARGIN_X * 2), 96, (0.95, 0.97, 1.0)))
    out.append(stroke_rect(MARGIN_X, 128, PAGE_W - (MARGIN_X * 2), 96, (0.79, 0.86, 0.96), line_w=0.9))
    out.append(text(MARGIN_X + 14, 200, "Recommendation", size=11, font="F2", color=(0.12, 0.22, 0.40)))
    rec_para, _ = paragraph(
        MARGIN_X + 14,
        182,
        PAGE_W - (MARGIN_X * 2) - 24,
        "Launch a 90-day recovery sprint with three workstreams: plan integrity, inventory release, and quality-gate redesign. Governance cadence should be weekly at function level and bi-weekly at leadership level.",
        size=10,
        leading=14,
    )
    out.append(rec_para)

    out.append(footer(page_no, total_pages))
    return "".join(out)


def draw_table(
    x: float,
    y_top: float,
    col_widths: list[float],
    headers: list[str],
    rows: list[list[str]],
    row_h: float = 30.0,
) -> str:
    out: list[str] = []
    table_w = sum(col_widths)
    y = y_top

    out.append(rect(x, y - row_h, table_w, row_h, (0.90, 0.94, 1.0)))
    out.append(stroke_rect(x, y - row_h, table_w, row_h, (0.72, 0.80, 0.93), line_w=0.8))

    cx = x
    for idx, h in enumerate(headers):
        out.append(text(cx + 6, y - 20, h, size=9, font="F2", color=(0.12, 0.21, 0.36)))
        cx += col_widths[idx]

    y -= row_h
    for row in rows:
        fill = (0.98, 0.99, 1.0) if int((y_top - y) / row_h) % 2 == 0 else (0.96, 0.98, 1.0)
        out.append(rect(x, y - row_h, table_w, row_h, fill))
        out.append(stroke_rect(x, y - row_h, table_w, row_h, (0.82, 0.88, 0.97), line_w=0.5))
        cx = x
        for idx, cell in enumerate(row):
            out.append(text(cx + 6, y - 20, cell, size=9, color=(0.18, 0.24, 0.35)))
            cx += col_widths[idx]
        y -= row_h

    x_cursor = x
    for w in col_widths[:-1]:
        x_cursor += w
        out.append(f"0.75 0.82 0.94 RG\n0.5 w\n{x_cursor:.2f} {y_top:.2f} m {x_cursor:.2f} {y:.2f} l S\n")

    return "".join(out)


def page_findings(page_no: int, total_pages: int) -> str:
    out: list[str] = []
    out.append(text(MARGIN_X, PAGE_H - 74, "2. Ranked value leakage", size=22, font="F2"))

    headers = ["Leak category", "Annual impact", "Confidence", "Owner", "Priority"]
    rows = [
        ["Production rescheduling", "INR 1.44 Cr", "High", "Plant Ops", "P1"],
        ["Slow-moving inventory", "INR 1.62 Cr", "High", "Supply Chain", "P1"],
        ["Quality rework and scrap", "INR 0.74 Cr", "Medium", "Quality", "P1"],
        ["Freight premium and expediting", "INR 0.58 Cr", "High", "Logistics", "P2"],
        ["Revenue leakage from delayed invoicing", "INR 0.47 Cr", "Medium", "Finance", "P2"],
    ]
    widths = [180, 95, 80, 100, 70]
    out.append(draw_table(MARGIN_X, PAGE_H - 120, widths, headers, rows, row_h=34.0))

    out.append(text(MARGIN_X, 280, "Interpretation", size=12, font="F2"))
    para, _ = paragraph(
        MARGIN_X,
        262,
        PAGE_W - (MARGIN_X * 2),
        (
            "Leak profile indicates cross-functional drift rather than isolated process failure. "
            "Priority should be assigned to interventions that collapse planning variance and improve inventory decisions first."
        ),
        size=10,
        leading=14,
    )
    out.append(para)

    out.append(footer(page_no, total_pages))
    return "".join(out)


def page_governance(page_no: int, total_pages: int) -> str:
    out: list[str] = []
    out.append(text(MARGIN_X, PAGE_H - 74, "3. Decision governance map", size=22, font="F2"))

    headers = ["Decision trigger", "Decision owner", "Cadence", "Escalation threshold"]
    rows = [
        ["OTIF below 92%", "COO + Plant Head", "Weekly", "2 consecutive cycles"],
        ["Inventory cover above 74 days", "Supply Chain Head", "Weekly", "> 10 day increase"],
        ["Scrap rate above 3.5%", "Quality Lead", "Daily", "48-hour unresolved root cause"],
        ["Cash conversion above 64 days", "CFO", "Bi-weekly", "5 day adverse trend"],
        ["Capex spend variance above 8%", "CEO + CFO", "Monthly", "Any single line item"],
    ]
    widths = [175, 120, 80, 164]
    out.append(draw_table(MARGIN_X, PAGE_H - 120, widths, headers, rows, row_h=35.0))

    out.append(rect(MARGIN_X, 120, PAGE_W - (MARGIN_X * 2), 130, (0.96, 0.98, 1.0)))
    out.append(stroke_rect(MARGIN_X, 120, PAGE_W - (MARGIN_X * 2), 130, (0.80, 0.87, 0.96), line_w=0.8))
    out.append(text(MARGIN_X + 14, 230, "Control policy", size=12, font="F2"))

    policy = (
        "All automation recommendations remain advisory until owner approval. "
        "Material-impact decisions require documented rationale, sign-off by accountable leader, and post-decision review after one cycle. "
        "This preserves traceability and avoids uncontrolled execution drift."
    )
    p, _ = paragraph(MARGIN_X + 14, 212, PAGE_W - (MARGIN_X * 2) - 24, policy, size=10, leading=14)
    out.append(p)

    out.append(footer(page_no, total_pages))
    return "".join(out)


def page_roadmap(page_no: int, total_pages: int) -> str:
    out: list[str] = []
    out.append(text(MARGIN_X, PAGE_H - 74, "4. 30-60-90 execution roadmap", size=22, font="F2"))

    headers = ["Window", "Primary outcomes", "Key actions", "Owner"]
    rows = [
        ["Day 0-30", "Stabilize planning", "Freeze override rules; weekly OTIF council", "COO"],
        ["Day 31-60", "Release working capital", "Inventory purge lanes; vendor cadence reset", "SCM Head"],
        ["Day 61-90", "Lock quality gains", "Shift quality checks upstream; close loop on scrap", "Quality Lead"],
        ["Day 91+", "Scale and standardize", "Automate recurrent signals and action tracking", "CEO Office"],
    ]
    widths = [85, 140, 240, 74]
    out.append(draw_table(MARGIN_X, PAGE_H - 120, widths, headers, rows, row_h=44.0))

    out.append(text(MARGIN_X, 296, "Milestones", size=12, font="F2"))
    bullets = [
        "Week 2: baseline KPIs validated by operations and finance.",
        "Week 5: first recovery wave released with named owners.",
        "Week 9: governance scorecard integrated into leadership reviews.",
        "Week 13: ROI checkpoint and scale recommendation published.",
    ]
    y = 274
    for b in bullets:
        out.append(text(MARGIN_X + 8, y, "-", size=12, font="F2", color=(0.13, 0.36, 0.82)))
        p, new_y = paragraph(MARGIN_X + 22, y, PAGE_W - (MARGIN_X * 2) - 20, b, size=10, leading=14)
        out.append(p)
        y = new_y - 4

    out.append(footer(page_no, total_pages))
    return "".join(out)


def page_roi(page_no: int, total_pages: int) -> str:
    out: list[str] = []
    out.append(text(MARGIN_X, PAGE_H - 74, "5. ROI attribution", size=22, font="F2"))

    headers = ["Metric", "Baseline", "Target (Q+2)", "Attribution logic"]
    rows = [
        ["OTIF", "85.8%", "95.0%", "Planning controls + schedule compliance"],
        ["Inventory cover", "78 days", "58 days", "Demand signal cleanup + release plan"],
        ["Scrap rate", "4.2%", "2.8%", "Upstream quality gates"],
        ["Cash conversion", "72 days", "59 days", "Inventory + invoice cycle discipline"],
    ]
    widths = [120, 80, 96, 243]
    out.append(draw_table(MARGIN_X, PAGE_H - 120, widths, headers, rows, row_h=36.0))

    out.append(rect(MARGIN_X, 146, PAGE_W - (MARGIN_X * 2), 112, (0.95, 0.97, 1.0)))
    out.append(stroke_rect(MARGIN_X, 146, PAGE_W - (MARGIN_X * 2), 112, (0.80, 0.87, 0.96), line_w=0.9))
    out.append(text(MARGIN_X + 14, 234, "Economics summary", size=12, font="F2"))
    econ = (
        "Conservative annual recovery estimate: INR 2.7 Cr to INR 3.3 Cr. "
        "Expected payback window for execution program: under 4 months. "
        "Attribution tracked through owner-confirmed action logs linked to KPI movement."
    )
    p, _ = paragraph(MARGIN_X + 14, 214, PAGE_W - (MARGIN_X * 2) - 24, econ, size=10, leading=14)
    out.append(p)

    out.append(footer(page_no, total_pages))
    return "".join(out)


def page_delivery(page_no: int, total_pages: int) -> str:
    out: list[str] = []
    out.append(text(MARGIN_X, PAGE_H - 74, "6. Delivery and next steps", size=22, font="F2"))

    intro, y = paragraph(
        MARGIN_X,
        PAGE_H - 108,
        PAGE_W - (MARGIN_X * 2),
        "This sample mirrors the standard launch package delivered to clients after the Pro Audit phase.",
        size=11,
    )
    out.append(intro)

    out.append(text(MARGIN_X, y - 10, "Launch package includes", size=12, font="F2"))
    package_items = [
        "Executive audit report (PDF)",
        "Root-cause map and owner matrix",
        "30-60-90 execution board",
        "Weekly decision briefing template",
        "ROI attribution workbook and governance log",
    ]
    line_y = y - 34
    for item in package_items:
        out.append(text(MARGIN_X + 8, line_y, "-", size=12, font="F2", color=(0.13, 0.36, 0.82)))
        p, ny = paragraph(MARGIN_X + 22, line_y, PAGE_W - (MARGIN_X * 2) - 20, item, size=10, leading=14)
        out.append(p)
        line_y = ny - 4

    out.append(rect(MARGIN_X, 164, PAGE_W - (MARGIN_X * 2), 160, (0.97, 0.98, 1.0)))
    out.append(stroke_rect(MARGIN_X, 164, PAGE_W - (MARGIN_X * 2), 160, (0.82, 0.88, 0.97), line_w=0.8))
    out.append(text(MARGIN_X + 14, 302, "Confidentiality note", size=11, font="F2"))
    note, _ = paragraph(
        MARGIN_X + 14,
        284,
        PAGE_W - (MARGIN_X * 2) - 24,
        (
            "This is a public sample prepared for website launch. All entities, values, and references are anonymized. "
            "Live client reports include engagement-specific controls, version history, and access logs."
        ),
        size=10,
        leading=14,
    )
    out.append(note)

    out.append(text(MARGIN_X + 14, 218, "Contact: hello@erainai.com | www.erainai.com", size=10, color=(0.20, 0.28, 0.41)))

    out.append(footer(page_no, total_pages))
    return "".join(out)


def generate_pdf(output_path: Path) -> None:
    builder = PdfBuilder()

    font_regular = builder.add_obj("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")
    font_bold = builder.add_obj("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>")

    pages_id = builder.add_obj(b"")

    pages = [
        page_cover(6),
        page_exec_summary(2, 6),
        page_findings(3, 6),
        page_governance(4, 6),
        page_roadmap(5, 6),
        page_roi(6, 6),
    ]

    page_ids: list[int] = []
    for page_stream in pages:
        content_id = builder.add_stream(page_stream)
        page_id = builder.add_obj(
            (
                "<< /Type /Page "
                f"/Parent {pages_id} 0 R "
                f"/MediaBox [0 0 {PAGE_W} {PAGE_H}] "
                f"/Resources << /Font << /F1 {font_regular} 0 R /F2 {font_bold} 0 R >> >> "
                f"/Contents {content_id} 0 R >>"
            )
        )
        page_ids.append(page_id)

    kids = " ".join(f"{pid} 0 R" for pid in page_ids)
    builder.set_obj(pages_id, f"<< /Type /Pages /Kids [ {kids} ] /Count {len(page_ids)} >>")

    catalog_id = builder.add_obj(f"<< /Type /Catalog /Pages {pages_id} 0 R >>")
    pdf_data = builder.build(catalog_id)
    output_path.write_bytes(pdf_data)


if __name__ == "__main__":
    output = Path(__file__).resolve().parents[1] / "public" / "sample-report.pdf"
    generate_pdf(output)
    print(f"Wrote {output}")
