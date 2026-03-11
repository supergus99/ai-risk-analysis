import json
from pathlib import Path

from service.inference_service import ThreatActorInferenceService


def test_infer_returns_actors():
    repo_root = Path(__file__).resolve().parents[4]
    profile_path = repo_root / "data/cyber-risk/business-profiles/small-business-low-maturity.json"

    with open(profile_path, "r", encoding="utf-8") as f:
        business_profile = json.load(f)

    service = ThreatActorInferenceService()
    result = service.infer(business_profile)

    assert "actors" in result
    assert len(result["actors"]) > 0


def test_infer_contains_expected_actor_types():
    repo_root = Path(__file__).resolve().parents[4]
    profile_path = repo_root / "data/cyber-risk/business-profiles/small-business-low-maturity.json"

    with open(profile_path, "r", encoding="utf-8") as f:
        business_profile = json.load(f)

    service = ThreatActorInferenceService()
    result = service.infer(business_profile)

    actor_types = {actor["actor_type"] for actor in result["actors"]}
    assert "Ransomware" in actor_types
    assert "BEC" in actor_types
    assert "Opportunistic" in actor_types
