from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from support_services.risk_api.engine import get_dashboard_data, simulate_risk

app = FastAPI(title="Risk API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ControlsEnabled(BaseModel):
    mfa: bool
    edr: bool
    backup: bool
    segmentation: bool


class SimulationRequest(BaseModel):
    scenarioType: str
    asset: str
    entryVector: str
    controlsEnabled: ControlsEnabled


@app.get("/api/risk/dashboard")
def get_risk_dashboard():
    return get_dashboard_data()


@app.post("/api/risk/simulate")
def simulate_risk_endpoint(req: SimulationRequest):
    return simulate_risk(
        scenario_type=req.scenarioType,
        asset=req.asset,
        entry_vector=req.entryVector,
        controls_enabled=req.controlsEnabled.model_dump(),
    )