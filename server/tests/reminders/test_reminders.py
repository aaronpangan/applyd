"""Tests for the /jobs/{job_id}/reminders routes."""

import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy.ext.asyncio import async_sessionmaker

from src.models import Job, Reminder, WorkSetup
from src.reminders import service as reminders_service


def _future(days: int = 7) -> str:
    return (datetime.now(timezone.utc) + timedelta(days=days)).isoformat()


async def _create_job(client, auth_headers, job_payload):
    resp = await client.post("/jobs", json=job_payload(), headers=auth_headers)
    assert resp.status_code == 201, resp.text
    return resp.json()


async def test_create_reminder(client, auth_headers, job_payload):
    job = await _create_job(client, auth_headers, job_payload)
    resp = await client.post(
        f"/jobs/{job['id']}/reminders",
        json={"remind_at": _future(), "message": "Follow up with recruiter"},
        headers=auth_headers,
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["message"] == "Follow up with recruiter"
    assert body["is_sent"] is False
    assert body["job_id"] == job["id"]


async def test_create_reminder_rejects_past_datetime(client, auth_headers, job_payload):
    job = await _create_job(client, auth_headers, job_payload)
    past = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
    resp = await client.post(
        f"/jobs/{job['id']}/reminders",
        json={"remind_at": past, "message": "too late"},
        headers=auth_headers,
    )
    assert resp.status_code == 422


async def test_list_reminders(client, auth_headers, job_payload):
    job = await _create_job(client, auth_headers, job_payload)
    for i in range(2):
        resp = await client.post(
            f"/jobs/{job['id']}/reminders",
            json={"remind_at": _future(i + 1), "message": f"reminder {i}"},
            headers=auth_headers,
        )
        assert resp.status_code == 201

    resp = await client.get(f"/jobs/{job['id']}/reminders", headers=auth_headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 2


async def test_delete_reminder(client, auth_headers, job_payload):
    job = await _create_job(client, auth_headers, job_payload)
    created = await client.post(
        f"/jobs/{job['id']}/reminders",
        json={"remind_at": _future(), "message": "delete me"},
        headers=auth_headers,
    )
    reminder_id = created.json()["id"]

    resp = await client.delete(
        f"/jobs/{job['id']}/reminders/{reminder_id}", headers=auth_headers
    )
    assert resp.status_code == 204

    listed = await client.get(f"/jobs/{job['id']}/reminders", headers=auth_headers)
    assert listed.json() == []


async def test_delete_missing_reminder_returns_404(client, auth_headers, job_payload):
    job = await _create_job(client, auth_headers, job_payload)
    resp = await client.delete(
        f"/jobs/{job['id']}/reminders/{uuid.uuid4()}", headers=auth_headers
    )
    assert resp.status_code == 404


async def test_reminders_on_missing_job_returns_404(client, auth_headers):
    resp = await client.get(f"/jobs/{uuid.uuid4()}/reminders", headers=auth_headers)
    assert resp.status_code == 404


async def test_reminders_require_auth(client, auth_headers, job_payload):
    job = await _create_job(client, auth_headers, job_payload)
    resp = await client.get(f"/jobs/{job['id']}/reminders")
    assert resp.status_code == 401


# --- dispatcher tests ------------------------------------------------------


async def _add_job(session, user_id):
    job = Job(
        user_id=user_id,
        company="Acme",
        position="Backend Engineer",
        work_setup=WorkSetup.REMOTE,
        link="https://acme.test/jobs/1",
        applied_at=datetime.now(timezone.utc).date(),
    )
    session.add(job)
    await session.commit()
    await session.refresh(job)
    return job


async def _add_reminder(session, job, user_id, *, remind_at, is_sent=False, message="ping"):
    reminder = Reminder(
        job_id=job.id,
        user_id=user_id,
        remind_at=remind_at,
        message=message,
        is_sent=is_sent,
    )
    session.add(reminder)
    await session.commit()
    await session.refresh(reminder)
    return reminder


async def test_process_due_reminders_sends_and_flips_is_sent(
    engine, session, test_user, monkeypatch
):
    job = await _add_job(session, test_user.id)
    past = datetime.now(timezone.utc) - timedelta(minutes=1)
    reminder = await _add_reminder(session, job, test_user.id, remind_at=past)

    sent: list[uuid.UUID] = []

    async def fake_send(r):
        sent.append(r.id)

    monkeypatch.setattr(reminders_service, "send_reminder_email", fake_send)

    maker = async_sessionmaker(bind=engine, expire_on_commit=False)
    await reminders_service.process_due_reminders(maker)

    assert sent == [reminder.id]
    async with maker() as s:
        row = await s.get(Reminder, reminder.id)
        assert row is not None and row.is_sent is True


async def test_process_due_reminders_skips_future_and_already_sent(
    engine, session, test_user, monkeypatch
):
    job = await _add_job(session, test_user.id)
    future = datetime.now(timezone.utc) + timedelta(hours=1)
    past = datetime.now(timezone.utc) - timedelta(minutes=1)
    future_reminder = await _add_reminder(session, job, test_user.id, remind_at=future)
    already_sent = await _add_reminder(
        session, job, test_user.id, remind_at=past, is_sent=True
    )

    sent: list[uuid.UUID] = []

    async def fake_send(r):
        sent.append(r.id)

    monkeypatch.setattr(reminders_service, "send_reminder_email", fake_send)

    maker = async_sessionmaker(bind=engine, expire_on_commit=False)
    await reminders_service.process_due_reminders(maker)

    assert sent == []
    # state unchanged
    async with maker() as s:
        f = await s.get(Reminder, future_reminder.id)
        a = await s.get(Reminder, already_sent.id)
        assert f is not None and f.is_sent is False
        assert a is not None and a.is_sent is True


async def test_process_due_reminders_isolates_failures(
    engine, session, test_user, monkeypatch
):
    job = await _add_job(session, test_user.id)
    past = datetime.now(timezone.utc) - timedelta(minutes=1)
    failing = await _add_reminder(
        session, job, test_user.id, remind_at=past, message="boom"
    )
    succeeding = await _add_reminder(
        session, job, test_user.id, remind_at=past, message="ok"
    )

    async def fake_send(r):
        if r.message == "boom":
            raise RuntimeError("resend down")

    monkeypatch.setattr(reminders_service, "send_reminder_email", fake_send)

    maker = async_sessionmaker(bind=engine, expire_on_commit=False)
    await reminders_service.process_due_reminders(maker)

    async with maker() as s:
        f = await s.get(Reminder, failing.id)
        ok = await s.get(Reminder, succeeding.id)
        # failure stays false so next tick retries it
        assert f is not None and f.is_sent is False
        # success flips
        assert ok is not None and ok.is_sent is True
