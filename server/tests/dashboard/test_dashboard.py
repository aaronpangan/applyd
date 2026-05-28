"""Tests for the /dashboard routes."""

from datetime import date, timedelta


async def test_dashboard_stats_requires_auth(client):
    resp = await client.get("/dashboard/stats")
    assert resp.status_code == 401


async def test_dashboard_stats_empty(client, auth_headers):
    resp = await client.get("/dashboard/stats", headers=auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["total_active"] == 0
    assert body["by_status"] == []


async def test_dashboard_stats_counts(client, auth_headers, job_payload):
    today = date.today().isoformat()
    old = (date.today() - timedelta(days=120)).isoformat()

    specs = [
        dict(company="A", position="1", status="applied", applied_at=today),
        dict(company="B", position="2", status="phone_screen", applied_at=old),
        dict(company="C", position="3", status="offer", applied_at=old),
        dict(company="D", position="4", status="bookmarked", applied_at=today),
    ]
    for spec in specs:
        resp = await client.post(
            "/jobs", json=job_payload(**spec), headers=auth_headers
        )
        assert resp.status_code == 201, resp.text

    # An archived job must not be counted in any stat.
    archived = await client.post(
        "/jobs", json=job_payload(company="E", position="5"), headers=auth_headers
    )
    await client.patch(
        f"/jobs/{archived.json()['id']}/archive", headers=auth_headers
    )

    resp = await client.get("/dashboard/stats", headers=auth_headers)
    assert resp.status_code == 200
    body = resp.json()

    assert body["total_active"] == 4
    assert body["total_applied"] == 3            # applied + phone_screen + offer
    assert body["scheduled_interviews"] == 1     # phone_screen
    assert body["total_offers"] == 1             # offer
    assert body["total_applied_this_month"] == 1  # only job A (applied today)

    assert sum(r["count"] for r in body["by_status"]) == 4
    assert sum(r["count"] for r in body["by_priority"]) == 4
    assert sum(r["count"] for r in body["by_work_setup"]) == 4

    status_counts = {r["status"]: r["count"] for r in body["by_status"]}
    assert status_counts["applied"] == 1
    assert status_counts["phone_screen"] == 1
