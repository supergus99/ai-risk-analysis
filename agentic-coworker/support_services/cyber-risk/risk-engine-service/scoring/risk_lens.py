def calculate_probability_index(
    threat_relevance: int,
    exploitability: int,
    resilience_weakness: int,
) -> float:
    return round(
        0.35 * threat_relevance
        + 0.35 * exploitability
        + 0.30 * resilience_weakness,
        2,
    )


def calculate_risk_severity_score(probability_index: float, impact_severity: int) -> float:
    return round(probability_index * impact_severity, 2)


def calculate_risk_band(risk_severity_score: float) -> str:
    if risk_severity_score < 5.0:
        return "Low"
    if risk_severity_score < 10.0:
        return "Guarded"
    if risk_severity_score < 15.0:
        return "Material"
    if risk_severity_score < 20.0:
        return "High"
    return "Critical"
