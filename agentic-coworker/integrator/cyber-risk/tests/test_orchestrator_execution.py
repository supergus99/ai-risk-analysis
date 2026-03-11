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


def test_run_assessment_returns_ranked_portfolio():
    repo_root = Path(__file__).resolve().parents[3]
    orchestrator = AssessmentOrchestrator(str(repo_root))

    result = orchestrator.run_assessment("acme-logistics.json")

    assert "business_profile" in result
    assert "scenario_count" in result
    assert "portfolio_eal" in result
    assert "ranked_scenarios" in result

    assert result["scenario_count"] >= 3
    assert result["portfolio_eal"] > 0
    assert len(result["ranked_scenarios"]) == result["scenario_count"]

    eals = [x["score"]["scenario_eal"] for x in result["ranked_scenarios"]]
    assert eals == sorted(eals, reverse=True)


def test_prioritize_actions_returns_reductions():
    repo_root = Path(__file__).resolve().parents[3]
    orchestrator = AssessmentOrchestrator(str(repo_root))

    result = orchestrator.prioritize_actions("acme-logistics.json")

    assert "baseline_portfolio_eal" in result
    assert "recommended_actions" in result
    assert len(result["recommended_actions"]) > 0

    reductions = [x["total_eal_reduction"] for x in result["recommended_actions"]]
    assert reductions == sorted(reductions, reverse=True)


def test_executive_summary_returns_expected_shape():
    repo_root = Path(__file__).resolve().parents[3]
    orchestrator = AssessmentOrchestrator(str(repo_root))

    result = orchestrator.build_executive_summary("acme-logistics.json")

    assert "baseline_portfolio_eal" in result
    assert "scenario_count" in result
    assert "risk_count_by_band" in result
    assert "top_risks" in result
    assert "top_actions" in result
    assert "best_action" in result
    assert "residual_portfolio_eal" in result
    assert "portfolio_eal_reduction" in result

    assert result["baseline_portfolio_eal"] > 0
    assert result["scenario_count"] >= 3
    assert len(result["top_risks"]) > 0
    assert len(result["top_actions"]) > 0
