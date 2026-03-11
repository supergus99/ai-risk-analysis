import json
from pathlib import Path

from assessment_orchestrator import AssessmentOrchestrator
from explanation_service import ExplanationService
from narrative_service import NarrativeService


def main():
    repo_root = Path(__file__).resolve().parents[4]

    orchestrator = AssessmentOrchestrator(str(repo_root))
    summary = orchestrator.build_executive_summary("small-business-low-maturity.json")

    explanation_service = ExplanationService()
    explanation = explanation_service.explain(summary)

    narrative_input = {**summary, **explanation}

    narrative_service = NarrativeService()
    narrative = narrative_service.build(narrative_input)

    print(json.dumps({
        "executive_summary_input": summary,
        "explanation_output": explanation,
        "narrative_output": narrative
    }, indent=2))


if __name__ == "__main__":
    main()
