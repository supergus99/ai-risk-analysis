from calculators.aggregation import calculate_scenario_eal
from calculators.exposure import calculate_exposure_score
from calculators.impact import calculate_mean_loss
from calculators.probability import calculate_annual_probability
from scoring.risk_lens import calculate_probability_index, calculate_risk_band


def test_smoke():
    exposure = calculate_exposure_score({
        "external_attack_surface": 70,
        "identity_weakness": 60,
        "endpoint_weakness": 40,
        "cloud_misconfig_risk": 30,
        "vendor_dependency_risk": 50,
        "user_susceptibility": 55,
        "detection_gaps": 35,
        "recovery_weakness": 45,
    })
    assert exposure > 0

    probability = calculate_annual_probability(0.12, 1.3, 1.2, 1.1, 1.05)
    assert 0.005 <= probability <= 0.70

    mean_loss = calculate_mean_loss(100000, 200000, 500000, 50000, 30000, 120000)
    assert mean_loss == 1000000

    eal = calculate_scenario_eal(probability, mean_loss)
    assert eal > 0

    p_index = calculate_probability_index(4, 4, 3)
    band = calculate_risk_band(p_index * 4)
    assert band in {"Low", "Guarded", "Material", "High", "Critical"}
