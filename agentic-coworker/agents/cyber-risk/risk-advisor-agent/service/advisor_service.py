class RiskAdvisorService:
    def answer(self, question: str, context: dict) -> dict:
        q = question.lower()

        summary = context.get("executive_summary_input", {})
        explanation = context.get("explanation_output", {})
        narrative = context.get("narrative_output", {})

        top_risks = summary.get("top_risks", [])
        top_actions = summary.get("top_actions", [])
        baseline_eal = summary.get("baseline_portfolio_eal", 0)
        residual_eal = summary.get("residual_portfolio_eal", 0)
        reduction = summary.get("portfolio_eal_reduction", 0)

        if "top risk" in q or "biggest risk" in q or "highest risk" in q:
            if top_risks:
                risk = top_risks[0]
                answer = (
                    f"Your top modeled risk is {risk['title']}. "
                    f"It contributes about {risk['scenario_eal']:,.2f} to annual exposure, "
                    f"which makes it the largest single driver of the current portfolio."
                )
            else:
                answer = "No top risk is available in the current assessment."

        elif "what should i do first" in q or "do first" in q or "first action" in q:
            if top_actions:
                action = top_actions[0]
                answer = (
                    f"The best first action is {action['title']}. "
                    f"It has {action['implementation_effort'].lower()} implementation effort "
                    f"and reduces modeled annual exposure by about {action['total_eal_reduction']:,.2f}."
                )
            else:
                answer = "No action recommendation is available in the current assessment."

        elif "why ransomware" in q:
            if top_risks:
                answer = narrative.get(
                    "risk_story",
                    "Ransomware is prioritized because it is strongly aligned to the current threat and control profile."
                )
            else:
                answer = "The assessment does not currently contain a ransomware explanation."

        elif "mfa" in q and ("what happens" in q or "if" in q or "improve" in q):
            if top_actions:
                answer = (
                    f"In the current model, the top MFA-related improvement reduces annual exposure by about {reduction:,.2f}, "
                    f"lowering total modeled exposure from {baseline_eal:,.2f} to {residual_eal:,.2f}. "
                    f"This is why MFA appears as the best first action."
                )
            else:
                answer = "The current assessment does not contain enough data to explain the MFA improvement."

        elif "low effort" in q or "small budget" in q or "cheap" in q:
            low_effort_actions = [a for a in top_actions if a.get("implementation_effort") == "Low"]
            if low_effort_actions:
                action = low_effort_actions[0]
                answer = (
                    f"For a smaller budget, start with {action['title']}. "
                    f"It is modeled as low effort and reduces annual exposure by about {action['total_eal_reduction']:,.2f}."
                )
            elif top_actions:
                action = top_actions[0]
                answer = (
                    f"The strongest available action is {action['title']}, "
                    f"with a modeled reduction of {action['total_eal_reduction']:,.2f}."
                )
            else:
                answer = "No low-effort action recommendation is available."

        elif "summary" in q or "overall" in q:
            answer = explanation.get(
                "executive_summary",
                "No executive summary is available."
            )

        else:
            answer = (
                "I can help explain the top risk, the best first action, MFA improvement, "
                "or the overall assessment summary."
            )

        return {
            "question": question,
            "answer": answer
        }
