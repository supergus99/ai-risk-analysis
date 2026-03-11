import json
from pathlib import Path

from engine_client.risk_engine_client import RiskEngineClient


class AssessmentOrchestrator:
    def __init__(self, repo_root: str, engine_base_url: str = "http://127.0.0.1:8010") -> None:
        self.repo_root = Path(repo_root)
        self.engine_client = RiskEngineClient(engine_base_url)

    def _load_json(self, relative_path: str) -> dict:
        path = self.repo_root / relative_path
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)

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

        base_sector_rate_defaults = {
            "ransomware_event_rate": 0.12,
            "bec_event_rate": 0.09,
            "data_breach_event_rate": 0.07
        }

        base_sector_rate = base_sector_rate_defaults[scenario_defaults["base_sector_rate_metric"]]

        return {
            "base_sector_rate": base_sector_rate,
            "actor_multiplier": scenario_defaults["default_actor_multiplier"],
            "exposure_multiplier": digital_multiplier,
            "control_adjustment": ir_modifier * scenario_defaults["default_control_adjustment"],
            "trend_adjustment": scenario_defaults["default_trend_adjustment"]
        }

    def _build_impact_inputs(self, scenario_template: dict, scenario_mapper: dict) -> dict:
        scenario_family = scenario_template["scenario_family"]
        return scenario_mapper["loss_defaults"][scenario_family]

    def _build_scoring_matrix(self, scenario_template: dict, scenario_mapper: dict) -> dict:
        scenario_family = scenario_template["scenario_family"]
        return scenario_mapper["scenario_family_defaults"][scenario_family]["default_scoring_matrix"]

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

        payload = {
            "exposure": {
                "factors": self._build_exposure_factors(business_profile, profile_mapper)
            },
            "probability": self._build_probability_inputs(
                business_profile, scenario_template, profile_mapper, scenario_mapper
            ),
            "impact": self._build_impact_inputs(scenario_template, scenario_mapper),
            "scoring_matrix": self._build_scoring_matrix(scenario_template, scenario_mapper)
        }

        return {
            "business_profile": business_profile,
            "scenario_template": scenario_template,
            "engine_payload": payload
        }

    def score_template(self, business_profile_name: str, template_name: str) -> dict:
        assembled = self.build_engine_payload(business_profile_name, template_name)
        score = self.engine_client.score_scenario(assembled["engine_payload"])

        return {
            "business_profile": assembled["business_profile"],
            "scenario_template": assembled["scenario_template"],
            "engine_payload": assembled["engine_payload"],
            "score": score
        }
