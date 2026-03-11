from explanation_service import ExplanationService


def test_explain_returns_required_sections():
    service = ExplanationService()

    sample_input = {
        "business_profile": {
            "organization_name": "SmallBiz Services",
            "industry": "Retail"
        },
        "threat_actors": {
            "actors": [
                {"actor_type": "Ransomware"},
                {"actor_type": "BEC"}
            ]
        },
        "baseline_portfolio_eal": 344306.31,
        "residual_portfolio_eal": 259137.89,
        "portfolio_eal_reduction": 85168.42,
        "top_risks": [
            {
                "scenario_family": "Ransomware",
                "title": "Ransomware disrupts critical operations",
                "scenario_eal": 157956.30
            }
        ],
        "top_actions": [
            {
                "action_id": "act-smb-mfa-all",
                "title": "Turn on MFA for all email, admin, and remote access accounts",
                "implementation_effort": "Low",
                "total_eal_reduction": 85168.42
            }
        ]
    }

    result = service.explain(sample_input)

    assert "executive_summary" in result
    assert "top_risk_explanations" in result
    assert "top_action_explanations" in result
    assert len(result["top_risk_explanations"]) > 0
    assert len(result["top_action_explanations"]) > 0


def test_executive_summary_mentions_organization():
    service = ExplanationService()

    sample_input = {
        "business_profile": {
            "organization_name": "SmallBiz Services",
            "industry": "Retail"
        },
        "threat_actors": {"actors": []},
        "baseline_portfolio_eal": 100000,
        "residual_portfolio_eal": 80000,
        "portfolio_eal_reduction": 20000,
        "top_risks": [],
        "top_actions": []
    }

    result = service.explain(sample_input)
    assert "SmallBiz Services" in result["executive_summary"]
