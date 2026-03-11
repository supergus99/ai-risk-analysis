class NarrativeService:

    def _format_actor_list(self, explanation_input: dict) -> str:
        actors = explanation_input.get("threat_actors", {}).get("actors", [])
        if not actors:
            return "general cyber threats"

        sorted_actors = sorted(
            actors,
            key=lambda x: x.get("confidence", 0),
            reverse=True
        )
        actor_names = [a["actor_type"] for a in sorted_actors]

        if len(actor_names) == 1:
            return actor_names[0]
        if len(actor_names) == 2:
            return f"{actor_names[0]} and {actor_names[1]}"
        return f"{actor_names[0]}, {actor_names[1]}, and {actor_names[2]}"

    def build(self, explanation_input: dict) -> dict:
        business = explanation_input["business_profile"]
        top_risks = explanation_input.get("top_risks", [])
        top_actions = explanation_input.get("top_actions", [])
        portfolio_eal = explanation_input.get("baseline_portfolio_eal", 0)
        residual_eal = explanation_input.get("residual_portfolio_eal", 0)
        reduction = explanation_input.get("portfolio_eal_reduction", 0)
        actor_phrase = self._format_actor_list(explanation_input)

        org_name = business.get("organization_name", "This organization")
        industry = business.get("industry", "business")
        smb_flags = business.get("smb_profile_flags", {})

        top_risk = top_risks[0] if top_risks else None
        top_action = top_actions[0] if top_actions else None

        if top_risk:
            risk_story = (
                f"{org_name} has modeled annual cyber exposure of {portfolio_eal:,.2f}. "
                f"The largest contributor is {top_risk['title']}, representing about {top_risk['scenario_eal']:,.2f} "
                f"of annual exposure. The threat pattern is most consistent with {actor_phrase}. "
                f"For this {industry.lower()} business, that means operational disruption, data exposure, and direct recovery cost "
                f"are the most important current concerns."
            )
        else:
            risk_story = (
                f"{org_name} has modeled annual cyber exposure of {portfolio_eal:,.2f}. "
                f"The current threat pattern is most consistent with {actor_phrase}."
            )

        if smb_flags:
            why_this_matters = (
                f"For a smaller {industry.lower()} business, a single cyber incident can interrupt normal operations, "
                f"consume limited staff time, and create customer trust or reporting problems. "
                f"This assessment helps focus attention on the few security improvements that reduce the most risk "
                f"without requiring a large security program."
            )
        else:
            why_this_matters = (
                "Cyber incidents increasingly affect operational continuity, regulatory obligations, and customer trust. "
                "Understanding which risks matter most allows leadership to prioritize the most effective defensive investments."
            )

        if top_action:
            what_to_do_first = (
                f"The most effective first step is to implement {top_action['title']}. "
                f"In the current model, this reduces annual exposure by about {top_action['total_eal_reduction']:,.2f}, "
                f"bringing residual annual exposure down to about {residual_eal:,.2f}. "
                f"This is a strong first move because it addresses common attack paths quickly and with "
                f"{top_action['implementation_effort'].lower()} implementation effort."
            )
        else:
            what_to_do_first = (
                "The first step should be to strengthen core identity, access, and recovery controls."
            )

        if smb_flags:
            long_term_security_direction = (
                "Over time, the organization should build a simple but disciplined security baseline: "
                "turn on MFA everywhere, remove shared admin access, encrypt laptops, use one approved collaboration platform, "
                "and maintain tested backups. These practical controls will reduce exposure to ransomware, account compromise, "
                "and accidental data exposure without requiring complex tooling."
            )
        else:
            long_term_security_direction = (
                "Over time, the organization should focus on strengthening identity protection, improving backup resilience, "
                "and increasing visibility into suspicious activity. Building these capabilities gradually will reduce exposure "
                "to ransomware, data breaches, and operational disruptions."
            )

        return {
            "risk_story": risk_story,
            "why_this_matters": why_this_matters,
            "what_to_do_first": what_to_do_first,
            "long_term_security_direction": long_term_security_direction
        }
