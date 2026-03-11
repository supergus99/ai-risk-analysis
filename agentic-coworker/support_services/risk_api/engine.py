RISK_DASHBOARD_DATA = {
    "scenarios": [
        {
            "id": "ransomware",
            "name": "Ransomware",
            "likelihood": 84,
            "impact": 1200000,
            "expectedLoss": 420000,
            "severity": "critical",
            "asset": "File Storage",
        },
        {
            "id": "data-leak",
            "name": "Data Leak",
            "likelihood": 62,
            "impact": 550000,
            "expectedLoss": 185000,
            "severity": "high",
            "asset": "CRM",
        },
        {
            "id": "insider-threat",
            "name": "Insider Threat",
            "likelihood": 28,
            "impact": 240000,
            "expectedLoss": 58000,
            "severity": "medium",
            "asset": "Production DB",
        },
        {
            "id": "vpn-exploit",
            "name": "VPN Exploit",
            "likelihood": 48,
            "impact": 760000,
            "expectedLoss": 210000,
            "severity": "high",
            "asset": "Remote Access",
        },
    ],
    "exposureHistory": [
        {"month": "Oct", "exposure": 2200000, "annotation": "Legacy access retained"},
        {"month": "Nov", "exposure": 2050000, "annotation": "EDR rollout phase 1"},
        {"month": "Dec", "exposure": 1940000, "annotation": "Patch backlog reduced"},
        {"month": "Jan", "exposure": 1780000, "annotation": "Backups hardened"},
        {"month": "Feb", "exposure": 1590000, "annotation": "MFA rolled out to admins"},
        {"month": "Mar", "exposure": 1410000, "annotation": "Remote access tightened"},
    ],
    "controls": [
        {"control": "MFA", "coverage": 42, "effectiveness": 61, "residualReduction": 34},
        {"control": "EDR", "coverage": 78, "effectiveness": 74, "residualReduction": 51},
        {"control": "Backups", "coverage": 64, "effectiveness": 91, "residualReduction": 68},
        {"control": "Email Filtering", "coverage": 72, "effectiveness": 58, "residualReduction": 39},
        {"control": "Vuln Patching", "coverage": 56, "effectiveness": 66, "residualReduction": 43},
    ],
    "assets": {
        "CRM": {"value": 420000, "criticality": 1.15},
        "Production DB": {"value": 720000, "criticality": 1.35},
        "File Storage": {"value": 510000, "criticality": 1.2},
        "Remote Access": {"value": 380000, "criticality": 1.1},
    },
    "scenarioBaseFactors": {
        "ransomware": {"baseLikelihood": 0.36, "baseImpact": 950000},
        "phishing": {"baseLikelihood": 0.32, "baseImpact": 340000},
        "supply-chain": {"baseLikelihood": 0.18, "baseImpact": 1250000},
        "insider": {"baseLikelihood": 0.14, "baseImpact": 460000},
    },
}


def get_dashboard_data():
    scenarios = RISK_DASHBOARD_DATA["scenarios"]
    controls = RISK_DASHBOARD_DATA["controls"]

    total_exposure = sum(item["expectedLoss"] for item in scenarios)
    top_scenario = sorted(scenarios, key=lambda x: x["expectedLoss"], reverse=True)[0]
    control_average = round(sum(item["effectiveness"] for item in controls) / len(controls))

    return {
        "scenarios": scenarios,
        "exposureHistory": RISK_DASHBOARD_DATA["exposureHistory"],
        "controls": controls,
        "assets": RISK_DASHBOARD_DATA["assets"],
        "summary": {
            "totalExposure": total_exposure,
            "topScenario": top_scenario,
            "controlAverage": control_average,
            "mostExposedAsset": "Production DB",
        },
    }


def simulate_risk(scenario_type, asset, entry_vector, controls_enabled):
    scenario = RISK_DASHBOARD_DATA["scenarioBaseFactors"][scenario_type]
    asset_profile = RISK_DASHBOARD_DATA["assets"][asset]

    vector_modifier = 1.15 if entry_vector == "phishing" else 1.05 if entry_vector == "vpn" else 1.22

    control_modifier = (
        (0.84 if controls_enabled["mfa"] else 1.0)
        * (0.88 if controls_enabled["edr"] else 1.0)
        * (0.72 if controls_enabled["backup"] else 1.0)
        * (0.81 if controls_enabled["segmentation"] else 1.0)
    )

    likelihood = min(
        0.95,
        scenario["baseLikelihood"] * vector_modifier * (0.82 if controls_enabled["mfa"] else 1.08),
    )

    impact = round(
        scenario["baseImpact"] * asset_profile["criticality"] * control_modifier
        + asset_profile["value"] * 0.35
    )

    expected_loss = round(likelihood * impact)
    reduction_pct = max(12, round((1 - control_modifier) * 100))

    return {
        "likelihood": likelihood,
        "impact": impact,
        "expectedLoss": expected_loss,
        "reductionPct": reduction_pct,
    }