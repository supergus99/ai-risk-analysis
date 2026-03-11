from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from unified_assessment_pipeline import UnifiedAssessmentPipeline


app = FastAPI(title="Cyber Risk Unified Assessment API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5173",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://localhost:3000",
        "http://127.0.0.1:3001",
        "http://localhost:3001",
        "http://127.0.0.1:3002",
        "http://localhost:3002",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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
