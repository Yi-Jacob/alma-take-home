from pathlib import Path

from app.core.config import get_settings
from app.models.lead import LeadState


def _submit_lead(client, *, first_name="Ada", last_name="Lovelace", email="ada@example.com"):
    return client.post(
        "/api/v1/leads",
        data={"first_name": first_name, "last_name": last_name, "email": email},
        files={"resume": ("resume.pdf", b"%PDF-1.4 fake resume", "application/pdf")},
    )


def test_valid_submission_returns_201(client):
    response = _submit_lead(client)
    assert response.status_code == 201


def test_valid_submission_persists_pending_lead(client):
    response = _submit_lead(client)
    assert response.json()["state"] == LeadState.PENDING.value


def test_valid_submission_writes_resume_file(client):
    response = _submit_lead(client)
    resume_url = response.json()["resume_url"]
    key = resume_url.rsplit("/", 1)[-1]
    stored_path = Path(get_settings().upload_dir) / key
    assert stored_path.is_file()


def test_blank_first_name_returns_422(client):
    response = _submit_lead(client, first_name="   ")
    assert response.status_code == 422


def test_missing_email_returns_422(client):
    response = client.post(
        "/api/v1/leads",
        data={"first_name": "Ada", "last_name": "Lovelace"},
        files={"resume": ("resume.pdf", b"%PDF-1.4", "application/pdf")},
    )
    assert response.status_code == 422


def test_list_leads_without_token_returns_401(client):
    response = client.get("/api/v1/leads")
    assert response.status_code == 401


def test_list_leads_with_token_returns_200(client, auth_headers):
    _submit_lead(client)
    response = client.get("/api/v1/leads", headers=auth_headers)
    assert response.status_code == 200


def test_list_leads_with_token_returns_submitted_lead(client, auth_headers):
    _submit_lead(client)
    response = client.get("/api/v1/leads", headers=auth_headers)
    assert len(response.json()) == 1


def test_patch_state_to_reached_out_returns_200(client, auth_headers):
    lead_id = _submit_lead(client).json()["id"]
    response = client.patch(
        f"/api/v1/leads/{lead_id}/state",
        json={"state": LeadState.REACHED_OUT.value},
        headers=auth_headers,
    )
    assert response.status_code == 200


def test_patch_state_transitions_lead_to_reached_out(client, auth_headers):
    lead_id = _submit_lead(client).json()["id"]
    response = client.patch(
        f"/api/v1/leads/{lead_id}/state",
        json={"state": LeadState.REACHED_OUT.value},
        headers=auth_headers,
    )
    assert response.json()["state"] == LeadState.REACHED_OUT.value


def test_patch_state_already_reached_out_returns_409(client, auth_headers):
    lead_id = _submit_lead(client).json()["id"]
    client.patch(
        f"/api/v1/leads/{lead_id}/state",
        json={"state": LeadState.REACHED_OUT.value},
        headers=auth_headers,
    )
    response = client.patch(
        f"/api/v1/leads/{lead_id}/state",
        json={"state": LeadState.REACHED_OUT.value},
        headers=auth_headers,
    )
    assert response.status_code == 409


def test_patch_state_unknown_lead_returns_404(client, auth_headers):
    response = client.patch(
        "/api/v1/leads/9999/state",
        json={"state": LeadState.REACHED_OUT.value},
        headers=auth_headers,
    )
    assert response.status_code == 404
