import json
from pathlib import Path

from orchestrators.assessment_orchestrator import AssessmentOrchestrator


def main():
    repo_root = Path(__file__).resolve().parents[3]

    orchestrator = AssessmentOrchestrator(str(repo_root))

    result = orchestrator.build_executive_summary(
        "small-business-low-maturity.json"
    )

    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
