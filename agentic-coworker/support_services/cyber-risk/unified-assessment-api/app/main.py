from pathlib import Path

from fastapi import FastAPI
from pydantic import BaseModel

from unified_assessment_pipeline import UnifiedAssessmentPipeline


app = FastAPI(title="Cyber Risk Unified Assessment API", version="0.1.0")


class RunAssessmentRequest(BaseModel):
    business_profile_name: str


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/cyber-risk/run-assessment")
def run_assessment(request: RunAssessmentRequest) -> dict:
    repo_root = Path(__file__).resolve().parents[4]
    pipeline = UnifiedAssessmentPipeline(str(repo_root))
    return pipeline.run(request.business_profile_name)
