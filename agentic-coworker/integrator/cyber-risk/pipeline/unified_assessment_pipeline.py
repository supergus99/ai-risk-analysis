import json
from pathlib import Path

from assessment_orchestrator import AssessmentOrchestrator
from inference_service import ThreatActorInferenceService
from selection_service import ScenarioSelectionService
from explanation_service import ExplanationService
from narrative_service import NarrativeService
from advisor_service import RiskAdvisorService


class UnifiedAssessmentPipeline:
    def __init__(self, repo_root: str) -> None:
        self.repo_root = Path(repo_root)
        self.orchestrator = AssessmentOrchestrator(str(self.repo_root))
        self.threat_actor_service = ThreatActorInferenceService()
        self.selection_service = ScenarioSelectionService(str(self.repo_root))
        self.explanation_service = ExplanationService()
        self.narrative_service = NarrativeService()
        self.advisor_service = RiskAdvisorService()

    def _load_business_profile(self, profile_name: str) -> dict:
        path = self.repo_root / f"data/cyber-risk/business-profiles/{profile_name}"
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)

    def run(self, profile_name: str) -> dict:
        business_profile = self._load_business_profile(profile_name)

        threat_actors = self.threat_actor_service.infer(business_profile)
        scenario_selection = self.selection_service.select(business_profile, threat_actors)

        executive_summary = self.orchestrator.build_executive_summary(profile_name)
        explanation_output = self.explanation_service.explain(executive_summary)
        narrative_output = self.narrative_service.build({**executive_summary, **explanation_output})

        advisor_context = {
            "executive_summary_input": executive_summary,
            "explanation_output": explanation_output,
            "narrative_output": narrative_output
        }

        advisor_questions = [
            "What is my top risk?",
            "What should I do first?",
            "What happens if I improve MFA?",
            "What is the overall summary?",
            "What should I do on a small budget?"
        ]
        advisor_answers = [
            self.advisor_service.answer(question, advisor_context)
            for question in advisor_questions
        ]

        return {
            "business_profile": business_profile,
            "threat_actors": threat_actors,
            "scenario_selection": scenario_selection,
            "executive_summary": executive_summary,
            "explanation_output": explanation_output,
            "narrative_output": narrative_output,
            "advisor_answers": advisor_answers
        }
