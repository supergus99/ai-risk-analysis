from pathlib import Path

from orchestrators.assessment_orchestrator import AssessmentOrchestrator


def test_score_template_returns_expected_shape():
    repo_root = Path(__file__).resolve().parents[3]
    orchestrator = AssessmentOrchestrator(str(repo_root))

    result = orchestrator.score_template("acme-logistics.json", "ransomware-disruption.json")

    assert "business_profile" in result
    assert "scenario_template" in result
    assert "engine_payload" in result
    assert "score" in result

    assert result["scenario_template"]["scenario_family"] == "Ransomware"
    assert result["business_profile"]["industry"] == "Logistics"
    assert "risk_band" in result["score"]
    assert "factors" in result["engine_payload"]["exposure"]


def test_build_engine_payload_returns_expected_sections():
    repo_root = Path(__file__).resolve().parents[3]
    orchestrator = AssessmentOrchestrator(str(repo_root))

    result = orchestrator.build_engine_payload("acme-logistics.json", "ransomware-disruption.json")

    assert "business_profile" in result
    assert "scenario_template" in result
    assert "engine_payload" in result
    assert "exposure" in result["engine_payload"]
    assert "probability" in result["engine_payload"]
    assert "impact" in result["engine_payload"]
    assert "scoring_matrix" in result["engine_payload"]
