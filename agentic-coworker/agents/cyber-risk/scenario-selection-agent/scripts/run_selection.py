import json
from pathlib import Path

from inference_service import ThreatActorInferenceService
from selection_service import ScenarioSelectionService


def main():
    repo_root = Path(__file__).resolve().parents[4]

    profile_path = repo_root / "data/cyber-risk/business-profiles/small-business-low-maturity.json"
    with open(profile_path, "r", encoding="utf-8") as f:
        business_profile = json.load(f)

    actor_service = ThreatActorInferenceService()
    actors = actor_service.infer(business_profile)

    selection_service = ScenarioSelectionService(str(repo_root))
    result = selection_service.select(business_profile, actors)

    print(json.dumps({
        "threat_actors": actors,
        "selection": result
    }, indent=2))


if __name__ == "__main__":
    main()
