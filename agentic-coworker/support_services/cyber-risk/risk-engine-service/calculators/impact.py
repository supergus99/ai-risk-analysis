def calculate_mean_loss(
    response_cost: float,
    recovery_cost: float,
    business_interruption_cost: float,
    regulatory_legal_cost: float,
    customer_remediation_cost: float,
    reputation_drag_cost: float,
) -> float:
    total = (
        response_cost
        + recovery_cost
        + business_interruption_cost
        + regulatory_legal_cost
        + customer_remediation_cost
        + reputation_drag_cost
    )
    return round(total, 2)
