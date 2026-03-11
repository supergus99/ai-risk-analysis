import json
from pathlib import Path

from inference_service import ThreatActorInferenceService
from selection_service import ScenarioSelectionService


def test_selection_returns_scenarios():
    repo_root = Path(__file__).resolve().parents[4]

    with open(repo_root / "data/cyber-risk/business-profiles/small-business-low-maturity.json", "r", encoding="utf-8") as f:
        business_profile = json.load(f)

    actor_service = ThreatActorInferenceService()
    actors = actor_service.infer(business_profile)

    service = ScenarioSelectionService(str(repo_root))
    result = service.select(business_profile, actors)

    assert "selected_scenarios" in result
    assert len(result["selected_scenarios"]) > 0


def test_selection_contains_ransomware_or_bec():
    repo_root = Path(__file__).resolve().parents[4]

    with open(repo_root / "data/cyber-risk/business-profiles/small-business-low-maturity.json", "r", encoding="utf-8") as f:
        business_profile = json.load(f)

    actor_service = ThreatActorInferenceService()
    actors = actor_service.infer(business_profile)

    service = ScenarioSelectionService(str(repo_root))
    result = service.select(business_profile, actors)

    scenario_families = {x["scenario_family"] for x in result["selected_scenarios"]}
    assert "Ransomware" in scenario_families or "BEC" in scenario_families


def test_tailored_scenarios_returned_for_smb():
    repo_root = Path(__file__).resolve().parents[4]

    with open(repo_root / "data/cyber-risk/business-profiles/small-business-low-maturity.json", "r", encoding="utf-8") as f:
        business_profile = json.load(f)

    actor_service = ThreatActorInferenceService()
    actors = actor_service.infer(business_profile)

    service = ScenarioSelectionService(str(repo_root))
    result = service.select(business_profile, actors)

    assert "tailored_scenarios" in result
    assert len(result["tailored_scenarios"]) > 0
