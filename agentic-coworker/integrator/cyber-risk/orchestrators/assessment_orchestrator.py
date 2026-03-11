import json
from pathlib import Path

from engine_client.risk_engine_client import RiskEngineClient
from service.benchmark_service import BenchmarkService
from inference_service import ThreatActorInferenceService


class AssessmentOrchestrator:
    def __init__(self, repo_root: str, engine_base_url: str = "http://127.0.0.1:8010") -> None:
        self.repo_root = Path(repo_root)
        self.engine_client = RiskEngineClient(engine_base_url)
        self.benchmark_service = BenchmarkService(repo_root)
        self.threat_actor_service = ThreatActorInferenceService()

    def _load_json(self, relative_path: str) -> dict:
        path = self.repo_root / relative_path
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)

    def _list_scenario_templates(self) -> list[str]:
        folder = self.repo_root / "data/cyber-risk/scenario-templates"
        return sorted([p.name for p in folder.glob("*.json")])

    def _actor_to_scenario_weights(self, actor_output: dict) -> dict:
        mapping = {
            "Ransomware": {
                "Ransomware": 1.00,
                "PrivilegedTakeover": 0.60,
                "EdgeExploitation": 0.55,
                "CredentialTheft": 0.45
            },
            "BEC": {
                "BEC": 1.00,
                "CredentialTheft": 0.55,
                "MaliciousOAuth": 0.45,
                "MFASocialEngineering": 0.50
            },
            "Opportunistic": {
                "DataBreach": 0.60,
                "CloudExposure": 0.55,
                "Infostealer": 0.55,
                "ShadowITExposure": 0.50,
                "ThirdPartyCompromise": 0.45
            },
            "Insider": {
                "SharedAdminAbuse": 0.80,
                "PrivilegedTakeover": 0.60,
                "ShadowITExposure": 0.40
            },
            "Hacktivist": {},
            "StateAligned": {}
        }

        weights = {}

        for actor in actor_output.get("actors", []):
            actor_type = actor["actor_type"]
            confidence = actor["confidence"]
            scenario_map = mapping.get(actor_type, {})

            for scenario_family, scenario_weight in scenario_map.items():
                weighted_value = round(confidence * scenario_weight, 4)
                existing = weights.get(scenario_family, 0.0)
                weights[scenario_family] = max(existing, weighted_value)

        return weights

    def _build_exposure_factors(self, business_profile: dict, profile_mapper: dict) -> dict:
        controls = business_profile["controls_profile"]
        technology = business_profile["technology_profile"]

        internet_facing_apps = technology.get("internet_facing_apps", 0)
        remote_access = technology.get("remote_access", "None")

        external_attack_surface = min(
            100,
            (internet_facing_apps * 12)
            + profile_mapper["remote_access_to_external_attack_surface_bonus"].get(remote_access, 0)
        )

        identity_weakness = max(0, 100 - controls.get("mfa_coverage", 0))
        endpoint_weakness = profile_mapper["patching_maturity_to_endpoint_weakness"][controls["patching_maturity"]]
        cloud_misconfig_risk = 35 if technology.get("hosting_model") in ["Cloud", "Hybrid"] else 20
        vendor_dependency_risk = 50 if len(technology.get("critical_saas", [])) >= 3 else 30
        user_susceptibility = {
            "Low": 75,
            "Moderate": 55,
            "High": 30
        }.get(controls.get("security_awareness", "Moderate"), 55)
        detection_gaps = profile_mapper["logging_monitoring_to_detection_gaps"][controls["logging_monitoring"]]
        recovery_weakness = profile_mapper["backup_maturity_to_recovery_weakness"][controls["backup_maturity"]]

        return {
            "external_attack_surface": external_attack_surface,
            "identity_weakness": identity_weakness,
            "endpoint_weakness": endpoint_weakness,
            "cloud_misconfig_risk": cloud_misconfig_risk,
            "vendor_dependency_risk": vendor_dependency_risk,
            "user_susceptibility": user_susceptibility,
            "detection_gaps": detection_gaps,
            "recovery_weakness": recovery_weakness
        }

    def _build_probability_inputs(self, business_profile: dict, scenario_template: dict, profile_mapper: dict, scenario_mapper: dict) -> dict:
        scenario_family = scenario_template["scenario_family"]
        scenario_defaults = scenario_mapper["scenario_family_defaults"][scenario_family]

        digital_multiplier = profile_mapper["digital_dependency_to_multiplier"][business_profile["digital_dependency"]]
        ir_modifier = profile_mapper["ir_readiness_to_resilience_modifier"][business_profile["controls_profile"]["ir_readiness"]]

        sector = business_profile["industry"]
        region = business_profile["regions"][0]
        metric_name = scenario_defaults["base_sector_rate_metric"]

        benchmark = self.benchmark_service.get_metric(
            sector=sector,
            region=region,
            metric_name=metric_name
        )
        base_sector_rate = benchmark["value"]

        return {
            "base_sector_rate": base_sector_rate,
            "actor_multiplier": scenario_defaults["default_actor_multiplier"],
            "exposure_multiplier": digital_multiplier,
            "control_adjustment": ir_modifier * scenario_defaults["default_control_adjustment"],
            "trend_adjustment": scenario_defaults["default_trend_adjustment"],
            "benchmark_used": benchmark
        }

    def _scale_impact(self, business_profile: dict, impact_inputs: dict) -> dict:
        scaling = self._load_json("integrator/cyber-risk/mappings/impact-scaling.mapper.json")

        revenue_band = business_profile["revenue_band"]
        employee_band = business_profile["employee_band"]

        revenue_mult = scaling["revenue_band_multiplier"][revenue_band]
        employee_mult = scaling["employee_band_multiplier"][employee_band]

        revenue_weight = scaling["blended_weight"]["revenue"]
        employee_weight = scaling["blended_weight"]["employee"]

        blended_multiplier = (revenue_mult * revenue_weight) + (employee_mult * employee_weight)

        scaled = {}
        for key, value in impact_inputs.items():
            scaled[key] = round(value * blended_multiplier, 2)

        return scaled

    def _build_impact_inputs(self, business_profile: dict, scenario_template: dict, scenario_mapper: dict) -> dict:
        scenario_family = scenario_template["scenario_family"]
        base_impact = scenario_mapper["loss_defaults"][scenario_family]
        return self._scale_impact(business_profile, base_impact)

    def _build_scoring_matrix(self, scenario_template: dict, scenario_mapper: dict) -> dict:
        scenario_family = scenario_template["scenario_family"]
        return scenario_mapper["scenario_family_defaults"][scenario_family]["default_scoring_matrix"]

    def _load_actions(self, business_profile: dict) -> list[dict]:
        default_actions = self._load_json("data/cyber-risk/action-library/default-actions.json")["actions"]
        smb_flags = business_profile.get("smb_profile_flags", {})

        if smb_flags:
            smb_actions = self._load_json("data/cyber-risk/action-library/smb-actions.json")["actions"]
            return default_actions + smb_actions

        return default_actions

    def _count_risk_bands(self, ranked_scenarios: list[dict]) -> dict:
        counts = {
            "Low": 0,
            "Guarded": 0,
            "Material": 0,
            "High": 0,
            "Critical": 0
        }
        for scenario in ranked_scenarios:
            band = scenario["score"]["risk_band"]
            counts[band] = counts.get(band, 0) + 1
        return counts

    def build_engine_payload(self, business_profile_name: str, template_name: str) -> dict:
        business_profile = self._load_json(
            f"data/cyber-risk/business-profiles/{business_profile_name}"
        )
        scenario_template = self._load_json(
            f"data/cyber-risk/scenario-templates/{template_name}"
        )
        profile_mapper = self._load_json(
            "integrator/cyber-risk/mappings/business-profile.mapper.json"
        )
        scenario_mapper = self._load_json(
            "integrator/cyber-risk/mappings/scenario-to-engine.mapper.json"
        )

        probability_inputs = self._build_probability_inputs(
            business_profile, scenario_template, profile_mapper, scenario_mapper
        )

        payload = {
            "exposure": {
                "factors": self._build_exposure_factors(business_profile, profile_mapper)
            },
            "probability": {
                "base_sector_rate": probability_inputs["base_sector_rate"],
                "actor_multiplier": probability_inputs["actor_multiplier"],
                "exposure_multiplier": probability_inputs["exposure_multiplier"],
                "control_adjustment": probability_inputs["control_adjustment"],
                "trend_adjustment": probability_inputs["trend_adjustment"]
            },
            "impact": self._build_impact_inputs(business_profile, scenario_template, scenario_mapper),
            "scoring_matrix": self._build_scoring_matrix(scenario_template, scenario_mapper)
        }

        return {
            "business_profile": business_profile,
            "scenario_template": scenario_template,
            "engine_payload": payload,
            "benchmark_used": probability_inputs["benchmark_used"]
        }

    def score_template(self, business_profile_name: str, template_name: str) -> dict:
        assembled = self.build_engine_payload(business_profile_name, template_name)
        score = self.engine_client.score_scenario(assembled["engine_payload"])

        return {
            "business_profile": assembled["business_profile"],
            "scenario_template": assembled["scenario_template"],
            "engine_payload": assembled["engine_payload"],
            "benchmark_used": assembled["benchmark_used"],
            "score": score
        }

    def run_assessment(self, business_profile_name: str) -> dict:
        business_profile = self._load_json(
            f"data/cyber-risk/business-profiles/{business_profile_name}"
        )
        actor_output = self.threat_actor_service.infer(business_profile)
        scenario_weights = self._actor_to_scenario_weights(actor_output)

        templates = self._list_scenario_templates()
        scored_scenarios = []

        for template_name in templates:
            result = self.score_template(business_profile_name, template_name)
            scenario_family = result["scenario_template"]["scenario_family"]
            actor_priority_weight = scenario_weights.get(scenario_family, 0.0)
            scenario_eal = result["score"]["scenario_eal"]
            priority_score = round(scenario_eal * (1 + actor_priority_weight), 2)

            result["actor_priority_weight"] = actor_priority_weight
            result["priority_score"] = priority_score
            scored_scenarios.append(result)

        scored_scenarios.sort(
            key=lambda x: x["priority_score"],
            reverse=True
        )

        portfolio_eal = round(sum(x["score"]["scenario_eal"] for x in scored_scenarios), 2)

        return {
            "business_profile": business_profile,
            "threat_actors": actor_output,
            "scenario_count": len(scored_scenarios),
            "portfolio_eal": portfolio_eal,
            "ranked_scenarios": scored_scenarios
        }

    def simulate_action(self, scored_scenario: dict, action: dict) -> dict:
        current_probability = scored_scenario["score"]["annual_probability"]
        current_loss = scored_scenario["score"]["mean_loss"]

        residual_probability = round(
            current_probability * (1 - action["probability_reduction"]),
            6
        )
        residual_loss = round(
            current_loss * (1 - action["loss_reduction"]),
            2
        )
        residual_eal = round(
            residual_probability * residual_loss,
            2
        )

        eal_reduction = round(
            scored_scenario["score"]["scenario_eal"] - residual_eal,
            2
        )

        return {
            "action_id": action["action_id"],
            "title": action["title"],
            "scenario_family": scored_scenario["scenario_template"]["scenario_family"],
            "baseline_eal": scored_scenario["score"]["scenario_eal"],
            "residual_probability": residual_probability,
            "residual_loss": residual_loss,
            "residual_eal": residual_eal,
            "eal_reduction": eal_reduction,
            "implementation_effort": action["implementation_effort"]
        }

    def prioritize_actions(self, business_profile_name: str) -> dict:
        assessment = self.run_assessment(business_profile_name)
        actions = self._load_actions(assessment["business_profile"])

        action_results = []

        for action in actions:
            total_eal_reduction = 0.0
            affected_scenarios = []

            for scenario in assessment["ranked_scenarios"]:
                scenario_family = scenario["scenario_template"]["scenario_family"]
                if scenario_family in action["scenarios_affected"]:
                    simulation = self.simulate_action(scenario, action)
                    total_eal_reduction += simulation["eal_reduction"]
                    affected_scenarios.append(simulation)

            action_results.append({
                "action_id": action["action_id"],
                "title": action["title"],
                "description": action["description"],
                "implementation_effort": action["implementation_effort"],
                "scenarios_affected_count": len(affected_scenarios),
                "total_eal_reduction": round(total_eal_reduction, 2),
                "affected_scenarios": affected_scenarios
            })

        action_results.sort(key=lambda x: x["total_eal_reduction"], reverse=True)

        return {
            "business_profile": assessment["business_profile"],
            "threat_actors": assessment["threat_actors"],
            "baseline_portfolio_eal": assessment["portfolio_eal"],
            "recommended_actions": action_results
        }

    def simulate_portfolio_action(self, business_profile_name: str, action_id: str) -> dict:
        assessment = self.run_assessment(business_profile_name)
        actions = self._load_actions(assessment["business_profile"])

        action = next((a for a in actions if a["action_id"] == action_id), None)
        if action is None:
            raise ValueError(f"Unknown action_id: {action_id}")

        simulated_scenarios = []

        for scenario in assessment["ranked_scenarios"]:
            scenario_family = scenario["scenario_template"]["scenario_family"]

            if scenario_family in action["scenarios_affected"]:
                simulation = self.simulate_action(scenario, action)
                simulated_scenarios.append({
                    "scenario_template": scenario["scenario_template"],
                    "baseline_score": scenario["score"],
                    "simulation": simulation
                })
            else:
                simulated_scenarios.append({
                    "scenario_template": scenario["scenario_template"],
                    "baseline_score": scenario["score"],
                    "simulation": {
                        "action_id": action["action_id"],
                        "title": action["title"],
                        "scenario_family": scenario_family,
                        "baseline_eal": scenario["score"]["scenario_eal"],
                        "residual_probability": scenario["score"]["annual_probability"],
                        "residual_loss": scenario["score"]["mean_loss"],
                        "residual_eal": scenario["score"]["scenario_eal"],
                        "eal_reduction": 0.0,
                        "implementation_effort": action["implementation_effort"]
                    }
                })

        residual_portfolio_eal = round(
            sum(x["simulation"]["residual_eal"] for x in simulated_scenarios),
            2
        )
        portfolio_eal_reduction = round(
            assessment["portfolio_eal"] - residual_portfolio_eal,
            2
        )

        return {
            "business_profile": assessment["business_profile"],
            "threat_actors": assessment["threat_actors"],
            "selected_action": action,
            "baseline_portfolio_eal": assessment["portfolio_eal"],
            "residual_portfolio_eal": residual_portfolio_eal,
            "portfolio_eal_reduction": portfolio_eal_reduction,
            "simulated_scenarios": simulated_scenarios
        }

    def build_executive_summary(self, business_profile_name: str) -> dict:
        assessment = self.run_assessment(business_profile_name)
        actions = self.prioritize_actions(business_profile_name)

        top_risks = [
            {
                "title": x["scenario_template"]["title"],
                "scenario_family": x["scenario_template"]["scenario_family"],
                "risk_band": x["score"]["risk_band"],
                "scenario_eal": x["score"]["scenario_eal"],
                "actor_priority_weight": x["actor_priority_weight"],
                "priority_score": x["priority_score"]
            }
            for x in assessment["ranked_scenarios"][:3]
        ]

        top_actions = [
            {
                "action_id": x["action_id"],
                "title": x["title"],
                "implementation_effort": x["implementation_effort"],
                "total_eal_reduction": x["total_eal_reduction"]
            }
            for x in actions["recommended_actions"][:3]
        ]

        best_action = actions["recommended_actions"][0] if actions["recommended_actions"] else None

        residual_view = None
        if best_action:
            residual_view = self.simulate_portfolio_action(
                business_profile_name,
                best_action["action_id"]
            )

        return {
            "business_profile": assessment["business_profile"],
            "threat_actors": assessment["threat_actors"],
            "baseline_portfolio_eal": assessment["portfolio_eal"],
            "scenario_count": assessment["scenario_count"],
            "risk_count_by_band": self._count_risk_bands(assessment["ranked_scenarios"]),
            "top_risks": top_risks,
            "top_actions": top_actions,
            "best_action": {
                "action_id": best_action["action_id"],
                "title": best_action["title"],
                "total_eal_reduction": best_action["total_eal_reduction"]
            } if best_action else None,
            "residual_portfolio_eal": residual_view["residual_portfolio_eal"] if residual_view else None,
            "portfolio_eal_reduction": residual_view["portfolio_eal_reduction"] if residual_view else None
        }
