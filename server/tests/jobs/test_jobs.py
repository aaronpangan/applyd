"""Tests for the /jobs routes."""


async def _create_job(client, auth_headers, job_payload, **overrides):
    resp = await client.post(
        "/jobs", json=job_payload(**overrides), headers=auth_headers
    )
    assert resp.status_code == 201, resp.text
    return resp.json()


async def test_create_job(client, auth_headers, job_payload):
    resp = await client.post(
        "/jobs", json=job_payload(), headers=auth_headers
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["company"] == "Acme Corp"
    assert body["status"] == "applied"
    assert body["is_archived"] is False


async def test_create_job_requires_auth(client, job_payload):
    resp = await client.post("/jobs", json=job_payload())
    assert resp.status_code == 401


async def test_create_job_detects_duplicate(client, auth_headers, job_payload):
    await _create_job(client, auth_headers, job_payload)
    resp = await client.post(
        "/jobs", json=job_payload(), headers=auth_headers
    )
    assert resp.status_code == 200
    assert resp.json()["duplicate"] is True


async def test_create_job_force_bypasses_duplicate(client, auth_headers, job_payload):
    await _create_job(client, auth_headers, job_payload)
    resp = await client.post(
        "/jobs?force=true", json=job_payload(), headers=auth_headers
    )
    assert resp.status_code == 201
    body = resp.json()
    assert "id" in body and "duplicate" not in body


async def test_list_jobs_returns_pagination_shape(client, auth_headers, job_payload):
    await _create_job(client, auth_headers, job_payload, company="A", position="One")
    await _create_job(client, auth_headers, job_payload, company="B", position="Two")
    resp = await client.get("/jobs", headers=auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] == 2
    assert body["page"] == 1
    assert len(body["items"]) == 2


async def test_list_jobs_filters_by_status(client, auth_headers, job_payload):
    await _create_job(
        client, auth_headers, job_payload, company="A", position="One", status="applied"
    )
    await _create_job(
        client, auth_headers, job_payload, company="B", position="Two", status="offer"
    )
    resp = await client.get("/jobs?status=offer", headers=auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] == 1
    assert body["items"][0]["status"] == "offer"


async def test_get_job_by_id(client, auth_headers, job_payload):
    job = await _create_job(client, auth_headers, job_payload)
    resp = await client.get(f"/jobs/{job['id']}", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["id"] == job["id"]


async def test_get_missing_job_returns_404(client, auth_headers):
    resp = await client.get(
        "/jobs/00000000-0000-0000-0000-000000000000", headers=auth_headers
    )
    assert resp.status_code == 404


async def test_update_job(client, auth_headers, job_payload):
    job = await _create_job(client, auth_headers, job_payload)
    resp = await client.patch(
        f"/jobs/{job['id']}",
        json={"position": "Senior Frontend Engineer", "priority": "low"},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["position"] == "Senior Frontend Engineer"
    assert body["priority"] == "low"


async def test_archive_and_restore_job(client, auth_headers, job_payload):
    job = await _create_job(client, auth_headers, job_payload)

    archived = await client.patch(f"/jobs/{job['id']}/archive", headers=auth_headers)
    assert archived.status_code == 200
    assert archived.json()["is_archived"] is True

    restored = await client.patch(f"/jobs/{job['id']}/restore", headers=auth_headers)
    assert restored.status_code == 200
    assert restored.json()["is_archived"] is False


async def test_delete_active_job_is_rejected(client, auth_headers, job_payload):
    job = await _create_job(client, auth_headers, job_payload)
    resp = await client.delete(f"/jobs/{job['id']}", headers=auth_headers)
    assert resp.status_code == 400


async def test_delete_archived_job_succeeds(client, auth_headers, job_payload):
    job = await _create_job(client, auth_headers, job_payload)
    await client.patch(f"/jobs/{job['id']}/archive", headers=auth_headers)

    resp = await client.delete(f"/jobs/{job['id']}", headers=auth_headers)
    assert resp.status_code == 204

    gone = await client.get(f"/jobs/{job['id']}", headers=auth_headers)
    assert gone.status_code == 404


async def test_bulk_archive(client, auth_headers, job_payload):
    a = await _create_job(client, auth_headers, job_payload, company="A", position="One")
    b = await _create_job(client, auth_headers, job_payload, company="B", position="Two")
    resp = await client.patch(
        "/jobs/bulk-archive",
        json={"job_ids": [a["id"], b["id"]]},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    assert all(job["is_archived"] for job in resp.json())


async def test_filter_options(client, auth_headers, job_payload):
    await _create_job(client, auth_headers, job_payload)
    resp = await client.get("/jobs/filter-options", headers=auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert "statuses" in body
    assert "companies" in body


async def test_export_xlsx_active(client, auth_headers, job_payload):
    await _create_job(client, auth_headers, job_payload)
    resp = await client.get("/jobs/export/xlsx", headers=auth_headers)
    assert resp.status_code == 200
    assert (
        resp.headers["content-type"]
        == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
    # .xlsx files are ZIP archives — the magic bytes start with "PK".
    assert resp.content[:2] == b"PK"
    assert "active" in resp.headers["content-disposition"]


async def test_export_xlsx_archived_variant(client, auth_headers, job_payload):
    job = await _create_job(client, auth_headers, job_payload)
    await client.patch(f"/jobs/{job['id']}/archive", headers=auth_headers)
    resp = await client.get("/jobs/export/xlsx?is_archived=true", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.content[:2] == b"PK"
    assert "archived" in resp.headers["content-disposition"]
