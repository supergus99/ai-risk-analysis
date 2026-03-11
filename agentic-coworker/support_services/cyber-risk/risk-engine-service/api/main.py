from typing import Dict, Optional

from fastapi import FastAPI
from pydantic import BaseModel, Field

from calculators.exposure import DEFAULT_WEIGHTS, calculate_exposure_score
from calculators.probability import calculate_annual_probability
from calculators.impact import calculate_mean_loss
from calculators.aggregation import calculate_scenario_eal
from scoring.risk_lens import (
    calculate_probability_index,
    calculate_risk_band,
    calculate_risk_severity_score,
)

app = FastAPI(title="Cyber Risk Engine Service")


class ExposureInput(BaseModel):
    factors: Dict[str, float]
    weights: Optional[Dict[str, float]] = None


class ProbabilityInput(BaseModel):
    base_sector_rate: float = Field(ge=0, le=1)
    actor_multiplier: float = Field(gt=0)
    exposure_multiplier: float = Field(gt=0)
    control_adjustment: float = Field(gt=0)
    trend_adjustment: float = Field(gt=0)


class ImpactInput(BaseModel):
    response_cost: float = Field(ge=0)
    recovery_cost: float = Field(ge=0)
    business_interruption_cost: float = Field(ge=0)
    regulatory_legal_cost: float = Field(ge=0)
    customer_remediation_cost: float = Field(ge=0)
    reputation_drag_cost: float = Field(ge=0)


class ScoringMatrixInput(BaseModel):
    threat_relevance: int = Field(ge=1, le=5)
    exploitability: int = Field(ge=1, le=5)
    resilience_weakness: int = Field(ge=1, le=5)
    impact_severity: int = Field(ge=1, le=5)


class ScenarioScoreRequest(BaseModel):
    exposure: ExposureInput
    probability: ProbabilityInput
    impact: ImpactInput
    scoring_matrix: ScoringMatrixInput


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/cyber-risk/score-scenario")
def score_scenario(request: ScenarioScoreRequest) -> dict:
    exposure_score = calculate_exposure_score(
        factors=request.exposure.factors,
        weights=request.exposure.weights or DEFAULT_WEIGHTS,
    )

    annual_probability = calculate_annual_probability(
        base_sector_rate=request.probability.base_sector_rate,
        actor_multiplier=request.probability.actor_multiplier,
        exposure_multiplier=request.probability.exposure_multiplier,
        control_adjustment=request.probability.control_adjustment,
        trend_adjustment=request.probability.trend_adjustment,
    )

    mean_loss = calculate_mean_loss(
        response_cost=request.impact.response_cost,
        recovery_cost=request.impact.recovery_cost,
        business_interruption_cost=request.impact.business_interruption_cost,
        regulatory_legal_cost=request.impact.regulatory_legal_cost,
        customer_remediation_cost=request.impact.customer_remediation_cost,
        reputation_drag_cost=request.impact.reputation_drag_cost,
    )

    scenario_eal = calculate_scenario_eal(annual_probability, mean_loss)

    probability_index = calculate_probability_index(
        threat_relevance=request.scoring_matrix.threat_relevance,
        exploitability=request.scoring_matrix.exploitability,
        resilience_weakness=request.scoring_matrix.resilience_weakness,
    )

    risk_severity_score = calculate_risk_severity_score(
        probability_index=probability_index,
        impact_severity=request.scoring_matrix.impact_severity,
    )

    risk_band = calculate_risk_band(risk_severity_score)

    return {
        "exposure_score": exposure_score,
        "annual_probability": annual_probability,
        "mean_loss": mean_loss,
        "scenario_eal": scenario_eal,
        "probability_index": probability_index,
        "impact_index": request.scoring_matrix.impact_severity,
        "risk_severity_score": risk_severity_score,
        "risk_band": risk_band,
    }
