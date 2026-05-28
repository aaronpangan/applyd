"""Tests for the /jobs/{job_id}/notes routes."""

import uuid


async def _create_job(client, auth_headers, job_payload):
    resp = await client.post("/jobs", json=job_payload(), headers=auth_headers)
    assert resp.status_code == 201, resp.text
    return resp.json()


async def test_create_note(client, auth_headers, job_payload):
    job = await _create_job(client, auth_headers, job_payload)
    resp = await client.post(
        f"/jobs/{job['id']}/notes",
        json={"content": "Recruiter call went well."},
        headers=auth_headers,
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["content"] == "Recruiter call went well."
    assert body["job_id"] == job["id"]


async def test_list_notes_in_chronological_order(client, auth_headers, job_payload):
    job = await _create_job(client, auth_headers, job_payload)
    for content in ("first note", "second note", "third note"):
        resp = await client.post(
            f"/jobs/{job['id']}/notes",
            json={"content": content},
            headers=auth_headers,
        )
        assert resp.status_code == 201

    resp = await client.get(f"/jobs/{job['id']}/notes", headers=auth_headers)
    assert resp.status_code == 200
    notes = resp.json()
    assert [n["content"] for n in notes] == ["first note", "second note", "third note"]


async def test_notes_require_auth(client, auth_headers, job_payload):
    job = await _create_job(client, auth_headers, job_payload)
    resp = await client.get(f"/jobs/{job['id']}/notes")
    assert resp.status_code == 401


async def test_notes_on_missing_job_returns_404(client, auth_headers):
    missing = uuid.uuid4()
    resp = await client.post(
        f"/jobs/{missing}/notes",
        json={"content": "orphan note"},
        headers=auth_headers,
    )
    assert resp.status_code == 404
