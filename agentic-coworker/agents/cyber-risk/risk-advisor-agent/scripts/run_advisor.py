import json
from pathlib import Path

from assessment_orchestrator import AssessmentOrchestrator
from explanation_service import ExplanationService
from narrative_service import NarrativeService
from advisor_service import RiskAdvisorService


def main():
    repo_root = Path(__file__).resolve().parents[4]

    orchestrator = AssessmentOrchestrator(str(repo_root))
    summary = orchestrator.build_executive_summary("small-business-low-maturity.json")

    explanation_service = ExplanationService()
    explanation = explanation_service.explain(summary)

    narrative_service = NarrativeService()
    narrative = narrative_service.build({**summary, **explanation})

    context = {
        "executive_summary_input": summary,
        "explanation_output": explanation,
        "narrative_output": narrative
    }

    advisor = RiskAdvisorService()

    questions = [
        "What is my top risk?",
        "What should I do first?",
        "What happens if I improve MFA?",
        "What is the overall summary?",
        "What should I do on a small budget?"
    ]

    answers = [advisor.answer(q, context) for q in questions]

    print(json.dumps({
        "answers": answers
    }, indent=2))


if __name__ == "__main__":
    main()
