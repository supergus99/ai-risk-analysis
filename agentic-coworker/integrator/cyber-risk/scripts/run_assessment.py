import json
from pathlib import Path

from orchestrators.assessment_orchestrator import AssessmentOrchestrator


def main() -> None:
    repo_root = Path(__file__).resolve().parents[3]
    orchestrator = AssessmentOrchestrator(str(repo_root))

    result = orchestrator.run_assessment("acme-logistics.json")
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
