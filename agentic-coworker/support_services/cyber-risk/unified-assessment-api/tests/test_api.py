from pathlib import Path

from fastapi.testclient import TestClient

from main import app


client = TestClient(app)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_run_assessment():
    response = client.post(
        "/cyber-risk/run-assessment",
        json={"business_profile_name": "small-business-low-maturity.json"}
    )
    assert response.status_code == 200

    body = response.json()
    assert "business_profile" in body
    assert "threat_actors" in body
    assert "scenario_selection" in body
    assert "executive_summary" in body
    assert "explanation_output" in body
    assert "narrative_output" in body
    assert "advisor_answers" in body
