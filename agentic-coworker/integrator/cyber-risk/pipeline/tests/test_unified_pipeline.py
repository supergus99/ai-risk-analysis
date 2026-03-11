from unified_assessment_pipeline import UnifiedAssessmentPipeline


def test_unified_pipeline_returns_expected_sections():
    pipeline = UnifiedAssessmentPipeline("/Users/ricardogusmao/projects/ai-risk-analysis/agentic-coworker")

    result = pipeline.run("small-business-low-maturity.json")

    assert "business_profile" in result
    assert "threat_actors" in result
    assert "scenario_selection" in result
    assert "executive_summary" in result
    assert "explanation_output" in result
    assert "narrative_output" in result
    assert "advisor_answers" in result

    assert len(result["threat_actors"]["actors"]) > 0
    assert len(result["scenario_selection"]["selected_scenarios"]) > 0
    assert len(result["advisor_answers"]) > 0


def test_unified_pipeline_has_top_risks():
    pipeline = UnifiedAssessmentPipeline("/Users/ricardogusmao/projects/ai-risk-analysis/agentic-coworker")

    result = pipeline.run("small-business-low-maturity.json")

    assert len(result["executive_summary"]["top_risks"]) > 0
