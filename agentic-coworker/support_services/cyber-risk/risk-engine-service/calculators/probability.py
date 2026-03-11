def clamp(value: float, min_value: float, max_value: float) -> float:
    return max(min_value, min(value, max_value))


def calculate_annual_probability(
    base_sector_rate: float,
    actor_multiplier: float,
    exposure_multiplier: float,
    control_adjustment: float,
    trend_adjustment: float,
) -> float:
    probability = (
        base_sector_rate
        * actor_multiplier
        * exposure_multiplier
        * control_adjustment
        * trend_adjustment
    )

    probability = clamp(probability, 0.005, 0.70)
    return round(probability, 6)
