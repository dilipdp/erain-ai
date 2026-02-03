

from __future__ import annotations

import os
import smtplib
from email.message import EmailMessage
from typing import Optional

SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASS = os.getenv("SMTP_PASS")
SMTP_FROM = os.getenv("SMTP_FROM", "EraIn AI <hello@erainai.com>")


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