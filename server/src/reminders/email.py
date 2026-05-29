"""Resend integration for reminder emails."""

from __future__ import annotations

import asyncio
import logging
from html import escape

import resend

from ..config import settings
from ..models import Job, Reminder

logger = logging.getLogger(__name__)

resend.api_key = settings.RESEND_API_KEY


_STATUS_LABELS = {
    "bookmarked": "Bookmarked",
    "applied": "Applied",
    "phone_screen": "Phone Screen",
    "tech_interview": "Tech Interview",
    "final_interview": "Final Interview",
    "offer": "Offer",
    "accepted": "Accepted",
    "rejected": "Rejected",
    "withdrawn": "Withdrawn",
}
_WORK_SETUP_LABELS = {"remote": "Remote", "hybrid": "Hybrid", "onsite": "Onsite"}
_PRIORITY_LABELS = {"low": "Low", "medium": "Medium", "high": "High"}


def _format_salary(job: Job) -> str | None:
    if job.salary_min is None and job.salary_max is None:
        return None
    cur = job.salary_currency
    if job.salary_min and job.salary_max:
        return f"{cur} {job.salary_min:,} – {job.salary_max:,}"
    if job.salary_min:
        return f"{cur} {job.salary_min:,}+"
    return f"Up to {cur} {job.salary_max:,}"


def _detail_rows(job: Job) -> list[tuple[str, str]]:
    rows: list[tuple[str, str]] = [
        ("Status", _STATUS_LABELS.get(job.status.value, job.status.value)),
        ("Priority", _PRIORITY_LABELS.get(job.priority.value, job.priority.value)),
        ("Work Setup", _WORK_SETUP_LABELS.get(job.work_setup.value, job.work_setup.value)),
    ]
    if job.location:
        rows.append(("Location", job.location))
    if job.industry:
        rows.append(("Industry", job.industry))
    salary = _format_salary(job)
    if salary:
        rows.append(("Salary", salary))
    rows.append(("Applied", job.applied_at.strftime("%B %d, %Y")))
    return rows


def _build_html(reminder: Reminder) -> str:
    job = reminder.job
    rows_html = "".join(
        f'<tr>'
        f'<td style="color:#6b7280;padding:6px 16px 6px 0;width:120px;vertical-align:top;font-size:13px;">{escape(label)}</td>'
        f'<td style="color:#111827;padding:6px 0;font-size:14px;font-weight:500;">{escape(value)}</td>'
        f'</tr>'
        for label, value in _detail_rows(job)
    )

    description_block = ""
    if job.job_description:
        description_block = (
            '<tr><td style="padding:4px 32px 0 32px;">'
            '<div style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#6b7280;margin:20px 0 10px;">Description</div>'
            f'<div style="font-size:14px;line-height:1.7;color:#374151;white-space:pre-wrap;">{escape(job.job_description)}</div>'
            "</td></tr>"
        )

    return f"""<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Reminder</title></head>
<body style="margin:0;padding:0;background-color:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1f2937;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e5e7eb;">
        <tr><td style="padding:28px 32px;background:#4f46e5;color:#ffffff;">
          <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;opacity:0.85;">Applyd Reminder</div>
          <div style="font-size:22px;font-weight:600;margin-top:6px;line-height:1.3;">{escape(job.position)}</div>
          <div style="font-size:15px;opacity:0.92;margin-top:2px;">{escape(job.company)}</div>
        </td></tr>
        <tr><td style="padding:24px 32px 4px 32px;">
          <div style="background-color:#eef2ff;border-left:4px solid #4f46e5;padding:14px 16px;border-radius:6px;font-size:14px;line-height:1.6;color:#1e1b4b;white-space:pre-wrap;">{escape(reminder.message)}</div>
        </td></tr>
        <tr><td style="padding:20px 32px 0 32px;">
          <div style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#6b7280;margin-bottom:6px;">Job Details</div>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">{rows_html}</table>
        </td></tr>
        {description_block}
        <tr><td style="padding:20px 32px 28px 32px;">
          <div style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#6b7280;margin-bottom:6px;">Original Posting</div>
          <a href="{escape(job.link)}" style="color:#4f46e5;font-size:14px;word-break:break-all;text-decoration:none;">{escape(job.link)}</a>
        </td></tr>
        <tr><td style="padding:14px 32px;background-color:#f9fafb;font-size:12px;color:#6b7280;text-align:center;border-top:1px solid #e5e7eb;">You're receiving this because you set a reminder in Applyd.</td></tr>
      </table>
    </td></tr>
  </table>
</body></html>"""


def _build_text(reminder: Reminder) -> str:
    job = reminder.job
    lines = [
        f"Reminder: {job.position} at {job.company}",
        "",
        reminder.message,
        "",
        "Job Details",
        "-----------",
    ]
    for label, value in _detail_rows(job):
        lines.append(f"{label}: {value}")
    if job.job_description:
        lines += ["", "Description", "-----------", job.job_description]
    lines += ["", f"Original posting: {job.link}", "", "— Applyd"]
    return "\n".join(lines)


async def _send_with_retry(params: dict, attempts: int = 3) -> None:
    logger.info("Sending email — from=%r to=%r subject=%r", params.get("from"), params.get("to"), params.get("subject"))
    delay = 1.0
    last_exc: Exception | None = None
    for attempt in range(1, attempts + 1):
        try:
            await asyncio.to_thread(resend.Emails.send, params)
            return
        except Exception as exc:
            last_exc = exc
            logger.warning(
                "Resend send attempt %d/%d failed: %s", attempt, attempts, exc
            )
            if attempt < attempts:
                await asyncio.sleep(delay)
                delay *= 2
    assert last_exc is not None
    raise last_exc


async def send_reminder_email(reminder: Reminder) -> None:
    job = reminder.job
    user = reminder.user
    to = [settings.RESEND_OVERRIDE_TO] if settings.RESEND_OVERRIDE_TO else [user.email]
    params = {
        "from": settings.RESEND_FROM_EMAIL,
        "to": to,
        "subject": f"Reminder: {job.position} at {job.company}",
        "html": _build_html(reminder),
        "text": _build_text(reminder),
    }
    await _send_with_retry(params)
