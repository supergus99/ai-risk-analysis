import json
from pathlib import Path

from assessment_orchestrator import AssessmentOrchestrator
from explanation_service import ExplanationService


def main():
    repo_root = Path(__file__).resolve().parents[4]
    orchestrator = AssessmentOrchestrator(str(repo_root))

    summary = orchestrator.build_executive_summary("small-business-low-maturity.json")

    service = ExplanationService()
    result = service.explain(summary)

    print(json.dumps({
        "executive_summary_input": summary,
        "explanation_output": result
    }, indent=2))


if __name__ == "__main__":
    main()
