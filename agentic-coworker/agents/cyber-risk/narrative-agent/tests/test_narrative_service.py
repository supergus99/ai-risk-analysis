from narrative_service import NarrativeService


def test_narrative_structure():

    service = NarrativeService()

    sample_input = {
        "executive_summary": "Example summary",
        "top_risk_explanations": [
            {"title": "Ransomware disrupts critical operations"}
        ],
        "top_action_explanations": [
            {"title": "Enable MFA"}
        ]
    }

    result = service.build(sample_input)

    assert "risk_story" in result
    assert "why_this_matters" in result
    assert "what_to_do_first" in result
    assert "long_term_security_direction" in result


def test_primary_risk_used():

    service = NarrativeService()

    sample_input = {
        "executive_summary": "",
        "top_risk_explanations": [
            {"title": "Customer data breach"}
        ],
        "top_action_explanations": [
            {"title": "Enable MFA"}
        ]
    }

    result = service.build(sample_input)

    assert "Customer data breach" in result["risk_story"]
