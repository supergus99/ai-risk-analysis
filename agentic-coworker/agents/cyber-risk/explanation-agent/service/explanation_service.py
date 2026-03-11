class ExplanationService:
    def explain(self, executive_summary_input: dict) -> dict:
        business = executive_summary_input["business_profile"]
        top_risks = executive_summary_input.get("top_risks", [])
        top_actions = executive_summary_input.get("top_actions", [])
        actors = executive_summary_input.get("threat_actors", {}).get("actors", [])
        portfolio_eal = executive_summary_input.get("baseline_portfolio_eal", 0)
        residual_eal = executive_summary_input.get("residual_portfolio_eal", 0)
        reduction = executive_summary_input.get("portfolio_eal_reduction", 0)

        org_name = business.get("organization_name", "This organization")
        industry = business.get("industry", "business")
        actor_names = ", ".join(sorted({a["actor_type"] for a in actors})) if actors else "general cyber threats"

        if top_risks:
            top_risk_title = top_risks[0]["title"]
            top_risk_value = top_risks[0]["scenario_eal"]
            executive_summary = (
                f"{org_name} has an estimated annual cyber exposure of {portfolio_eal:,.2f}. "
                f"The most important modeled risk is {top_risk_title}, which contributes about {top_risk_value:,.2f} "
                f"to annual exposure. The current threat picture is most consistent with {actor_names}. "
                f"If the top recommended action is implemented, modeled exposure falls by about {reduction:,.2f} "
                f"to {residual_eal:,.2f}."
            )
        else:
            executive_summary = (
                f"{org_name} has an estimated annual cyber exposure of {portfolio_eal:,.2f}. "
                f"The current assessment indicates exposure driven by {actor_names}."
            )

        risk_explanations = []
        for risk in top_risks[:3]:
            explanation = (
                f"{risk['title']} is a priority because it is both relevant to this {industry.lower()} business "
                f"and financially meaningful. Its modeled annual exposure is {risk['scenario_eal']:,.2f}, "
                f"and its relevance is reinforced by the inferred threat context."
            )
            risk_explanations.append({
                "scenario_family": risk["scenario_family"],
                "title": risk["title"],
                "explanation": explanation
            })

        action_explanations = []
        for action in top_actions[:3]:
            explanation = (
                f"{action['title']} is recommended because it delivers one of the largest modeled reductions in annual exposure "
                f"while requiring {action['implementation_effort'].lower()} implementation effort. "
                f"It reduces exposure by about {action['total_eal_reduction']:,.2f} in the current model."
            )
            action_explanations.append({
                "action_id": action["action_id"],
                "title": action["title"],
                "explanation": explanation
            })

        return {
            "executive_summary": executive_summary,
            "top_risk_explanations": risk_explanations,
            "top_action_explanations": action_explanations
        }
