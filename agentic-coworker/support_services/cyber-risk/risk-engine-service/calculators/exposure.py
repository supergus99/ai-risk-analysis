from typing import Dict, Optional

DEFAULT_WEIGHTS = {
    "external_attack_surface": 0.20,
    "identity_weakness": 0.15,
    "endpoint_weakness": 0.15,
    "cloud_misconfig_risk": 0.10,
    "vendor_dependency_risk": 0.10,
    "user_susceptibility": 0.10,
    "detection_gaps": 0.10,
    "recovery_weakness": 0.10,
}


def calculate_exposure_score(
    factors: Dict[str, float],
    weights: Optional[Dict[str, float]] = None,
) -> float:
    active_weights = weights or DEFAULT_WEIGHTS
    score = 0.0

    for key, weight in active_weights.items():
        value = factors.get(key, 0.0)
        score += value * weight

    return round(score, 2)
