def calculate_scenario_eal(annual_probability: float, mean_loss: float) -> float:
    return round(annual_probability * mean_loss, 2)
