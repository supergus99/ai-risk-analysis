from pathlib import Path

from orchestrators.assessment_orchestrator import AssessmentOrchestrator


def test_paths_exist():
    repo_root = Path(__file__).resolve().parents[3]
    assert (repo_root / "data/cyber-risk/scenario-templates/ransomware-disruption.json").exists()
    assert (repo_root / "support_services/cyber-risk/risk-engine-service/api/examples/score-scenario.request.json").exists()


def test_orchestrator_init():
    repo_root = Path(__file__).resolve().parents[3]
    orchestrator = AssessmentOrchestrator(str(repo_root))
    assert orchestrator is not None
