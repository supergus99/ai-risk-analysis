import json
from pathlib import Path

from service.inference_service import ThreatActorInferenceService


def main():
    repo_root = Path(__file__).resolve().parents[4]

    profile_path = repo_root / "data/cyber-risk/business-profiles/small-business-low-maturity.json"
    with open(profile_path, "r", encoding="utf-8") as f:
        business_profile = json.load(f)

    service = ThreatActorInferenceService()
    result = service.infer(business_profile)

    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
