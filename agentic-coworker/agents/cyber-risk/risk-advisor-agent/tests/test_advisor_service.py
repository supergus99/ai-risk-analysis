from advisor_service import RiskAdvisorService


def build_context():
    return {
        "executive_summary_input": {
            "baseline_portfolio_eal": 344306.31,
            "residual_portfolio_eal": 259137.89,
            "portfolio_eal_reduction": 85168.42,
            "top_risks": [
                {
                    "title": "Ransomware disrupts critical operations",
                    "scenario_eal": 157956.30
                }
            ],
            "top_actions": [
                {
                    "title": "Turn on MFA for all email, admin, and remote access accounts",
                    "implementation_effort": "Low",
                    "total_eal_reduction": 85168.42
                }
            ]
        },
        "explanation_output": {
            "executive_summary": "SmallBiz Services has an estimated annual cyber exposure of 344,306.31."
        },
        "narrative_output": {
            "risk_story": "The main risk is ransomware due to weak controls."
        }
    }


def test_answers_top_risk():
    service = RiskAdvisorService()
    result = service.answer("What is my top risk?", build_context())
    assert "Ransomware" in result["answer"]


def test_answers_first_action():
    service = RiskAdvisorService()
    result = service.answer("What should I do first?", build_context())
    assert "MFA" in result["answer"] or "Turn on MFA" in result["answer"]


def test_answers_summary():
    service = RiskAdvisorService()
    result = service.answer("What is the overall summary?", build_context())
    assert "344,306.31" in result["answer"]
