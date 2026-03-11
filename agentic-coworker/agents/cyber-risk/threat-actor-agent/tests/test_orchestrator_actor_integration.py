from assessment_orchestrator import AssessmentOrchestrator


def test_run_assessment_includes_threat_actors():
    orchestrator = AssessmentOrchestrator("/Users/ricardogusmao/projects/ai-risk-analysis/agentic-coworker")

    result = orchestrator.run_assessment("small-business-low-maturity.json")

    assert "threat_actors" in result
    assert "actors" in result["threat_actors"]
    assert len(result["threat_actors"]["actors"]) > 0


def test_top_risks_include_priority_score():
    orchestrator = AssessmentOrchestrator("/Users/ricardogusmao/projects/ai-risk-analysis/agentic-coworker")

    result = orchestrator.build_executive_summary("small-business-low-maturity.json")

    assert len(result["top_risks"]) > 0
    assert "actor_priority_weight" in result["top_risks"][0]
    assert "priority_score" in result["top_risks"][0]
