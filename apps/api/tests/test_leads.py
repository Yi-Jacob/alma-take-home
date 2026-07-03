from pathlib import Path

import pytest

from app.core.config import get_settings
from app.models.lead import LeadState
from app.services import leads as lead_service_module


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


def test_oversized_resume_returns_413(client, monkeypatch):
    monkeypatch.setattr(get_settings(), "max_resume_bytes", 10)
    response = client.post(
        "/api/v1/leads",
        data={"first_name": "Ada", "last_name": "Lovelace", "email": "ada@example.com"},
        files={"resume": ("resume.pdf", b"x" * 11, "application/pdf")},
    )
    assert response.status_code == 413


def test_wrong_resume_content_type_returns_422(client):
    response = client.post(
        "/api/v1/leads",
        data={"first_name": "Ada", "last_name": "Lovelace", "email": "ada@example.com"},
        files={"resume": ("resume.txt", b"plain text resume", "text/plain")},
    )
    assert response.status_code == 422


def test_empty_resume_file_returns_422(client):
    response = client.post(
        "/api/v1/leads",
        data={"first_name": "Ada", "last_name": "Lovelace", "email": "ada@example.com"},
        files={"resume": ("resume.pdf", b"", "application/pdf")},
    )
    assert response.status_code == 422


def test_invalid_email_format_returns_422(client):
    response = _submit_lead(client, email="not-an-email")
    assert response.status_code == 422


def test_missing_resume_file_returns_422(client):
    response = client.post(
        "/api/v1/leads",
        data={"first_name": "Ada", "last_name": "Lovelace", "email": "ada@example.com"},
    )
    assert response.status_code == 422


def test_blank_last_name_returns_422(client):
    response = _submit_lead(client, last_name="   ")
    assert response.status_code == 422


def test_successful_submission_sets_notification_sent_at(client):
    response = _submit_lead(client)
    assert response.json()["notification_sent_at"] is not None


class _FailingEmailService:
    def send(self, message):
        raise RuntimeError("email delivery failed")


@pytest.fixture
def failing_email(monkeypatch):
    monkeypatch.setattr(
        lead_service_module, "get_email_service", lambda: _FailingEmailService()
    )


def test_email_failure_still_returns_201(client, failing_email):
    response = _submit_lead(client)
    assert response.status_code == 201


def test_email_failure_leaves_notification_sent_at_null(client, failing_email):
    response = _submit_lead(client)
    assert response.json()["notification_sent_at"] is None


def test_email_failure_still_persists_lead(client, auth_headers, failing_email):
    _submit_lead(client)
    response = client.get("/api/v1/leads", headers=auth_headers)
    assert len(response.json()) == 1


def test_download_resume_returns_200_for_stored_key(client):
    resume_url = _submit_lead(client).json()["resume_url"]
    key = resume_url.rsplit("/", 1)[-1]
    response = client.get(f"/api/v1/leads/resumes/{key}")
    assert response.status_code == 200


def test_download_resume_sets_attachment_disposition(client):
    resume_url = _submit_lead(client).json()["resume_url"]
    key = resume_url.rsplit("/", 1)[-1]
    response = client.get(f"/api/v1/leads/resumes/{key}")
    assert response.headers["content-disposition"].startswith("attachment")


def test_download_resume_unknown_key_returns_404(client):
    response = client.get("/api/v1/leads/resumes/deadbeef.pdf")
    assert response.status_code == 404


def test_download_resume_percent_encoded_traversal_returns_404(client):
    response = client.get("/api/v1/leads/resumes/..%2F..%2Fetc%2Fpasswd")
    assert response.status_code == 404


def test_download_resume_dotdot_key_returns_404(client):
    response = client.get("/api/v1/leads/resumes/..somefile")
    assert response.status_code == 404


def test_get_lead_with_token_returns_200(client, auth_headers):
    lead_id = _submit_lead(client).json()["id"]
    response = client.get(f"/api/v1/leads/{lead_id}", headers=auth_headers)
    assert response.status_code == 200


def test_get_lead_unknown_id_returns_404(client, auth_headers):
    response = client.get("/api/v1/leads/9999", headers=auth_headers)
    assert response.status_code == 404


def test_get_lead_without_token_returns_401(client):
    lead_id = _submit_lead(client).json()["id"]
    response = client.get(f"/api/v1/leads/{lead_id}")
    assert response.status_code == 401
