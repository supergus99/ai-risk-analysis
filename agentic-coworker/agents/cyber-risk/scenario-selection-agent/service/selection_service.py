import json
from pathlib import Path


class ScenarioSelectionService:
    def __init__(self, repo_root: str) -> None:
        self.repo_root = Path(repo_root)

    def _load_json(self, relative_path: str) -> dict:
        path = self.repo_root / relative_path
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)

    def _load_scenarios(self) -> list[dict]:
        folder = self.repo_root / "data/cyber-risk/scenario-templates"
        scenarios = []

        for path in sorted(folder.glob("*.json")):
            with open(path, "r", encoding="utf-8") as f:
                scenarios.append(json.load(f))

        return scenarios

    def _scenario_score(self, business_profile: dict, threat_actors: dict, scenario: dict) -> tuple[float, list[str]]:
        score = 0.0
        reasons = []

        actor_types = {a["actor_type"] for a in threat_actors.get("actors", [])}
        scenario_family = scenario["scenario_family"]
        title = scenario["title"]

        tech = business_profile["technology_profile"]
        controls = business_profile["controls_profile"]
        critical_processes = set(business_profile.get("critical_processes", []))
        smb_flags = business_profile.get("smb_profile_flags", {})

        if scenario_family == "Ransomware" and "Ransomware" in actor_types:
            score += 0.35
            reasons.append("aligned with inferred ransomware actor")

        if scenario_family == "BEC" and "BEC" in actor_types:
            score += 0.35
            reasons.append("aligned with inferred BEC actor")

        if scenario_family in ["DataBreach", "CloudExposure", "Infostealer", "ShadowITExposure"] and "Opportunistic" in actor_types:
            score += 0.20
            reasons.append("aligned with opportunistic attacker profile")

        if scenario_family in ["SharedAdminAbuse", "PrivilegedTakeover"] and "Insider" in actor_types:
            score += 0.15
            reasons.append("aligned with insider misuse relevance")

        if tech.get("remote_access") in ["VPN", "Mixed"] and scenario_family in ["Ransomware", "EdgeExploitation", "PrivilegedTakeover"]:
            score += 0.18
            reasons.append("remote access exposure increases relevance")

        if tech.get("internet_facing_apps", 0) > 0 and scenario_family in ["DataBreach", "EdgeExploitation", "CloudExposure"]:
            score += 0.16
            reasons.append("internet-facing exposure increases relevance")

        if tech.get("email_suite") in ["M365", "Google Workspace", "Other"] and scenario_family in ["BEC", "CredentialTheft", "MaliciousOAuth", "MFASocialEngineering"]:
            score += 0.14
            reasons.append("email platform dependency increases relevance")

        if controls.get("mfa_coverage", 0) < 50 and scenario_family in ["BEC", "CredentialTheft", "PrivilegedTakeover", "MFASocialEngineering", "SaaSAdminCompromise"]:
            score += 0.16
            reasons.append("low MFA coverage increases relevance")

        if controls.get("patching_maturity") in ["Weak", "Basic"] and scenario_family in ["EdgeExploitation", "Infostealer", "Ransomware"]:
            score += 0.14
            reasons.append("weak patching increases relevance")

        if controls.get("backup_maturity") in ["Weak", "Basic"] and scenario_family == "Ransomware":
            score += 0.14
            reasons.append("weak backup maturity increases ransomware relevance")

        if "Finance" in critical_processes and scenario_family == "BEC":
            score += 0.10
            reasons.append("finance process increases BEC relevance")

        if business_profile.get("digital_dependency") in ["High", "Critical"] and scenario_family in ["Ransomware", "ThirdPartyCompromise", "SaaSAdminCompromise"]:
            score += 0.10
            reasons.append("high digital dependency increases operational scenario relevance")

        if smb_flags.get("uses_free_tools") and scenario_family in ["ShadowITExposure", "MaliciousOAuth"]:
            score += 0.18
            reasons.append("free tool usage increases relevance")

        if smb_flags.get("no_disk_encryption") and scenario_family == "LostDevice":
            score += 0.25
            reasons.append("lack of disk encryption increases lost device relevance")

        if smb_flags.get("shared_admin_accounts") and scenario_family in ["SharedAdminAbuse", "PrivilegedTakeover"]:
            score += 0.22
            reasons.append("shared admin access increases admin abuse relevance")

        if smb_flags.get("unmanaged_devices") and scenario_family == "Infostealer":
            score += 0.20
            reasons.append("unmanaged devices increase infostealer relevance")

        score = min(score, 0.99)

        if not reasons:
            reasons.append(f"general relevance based on scenario family {scenario_family} and business context")

        return round(score, 2), reasons

    def _build_tailored_scenarios(self, business_profile: dict) -> list[dict]:
        smb_flags = business_profile.get("smb_profile_flags", {})
        tailored = []

        if smb_flags.get("uses_free_tools"):
            tailored.append({
                "title": "Free file-sharing link exposes customer records",
                "scenario_family": "ShadowITExposure",
                "selection_confidence": 0.76,
                "selection_rationale": "Use of free collaboration tools makes accidental public exposure plausible."
            })

        if smb_flags.get("no_disk_encryption"):
            tailored.append({
                "title": "Lost laptop leads to reportable local data exposure",
                "scenario_family": "LostDevice",
                "selection_confidence": 0.82,
                "selection_rationale": "Absence of disk encryption makes device loss materially more serious."
            })

        if smb_flags.get("shared_admin_accounts"):
            tailored.append({
                "title": "Shared admin password misuse causes broad system disruption",
                "scenario_family": "SharedAdminAbuse",
                "selection_confidence": 0.79,
                "selection_rationale": "Shared admin access increases traceability and misuse problems."
            })

        return tailored[:3]

    def select(self, business_profile: dict, threat_actors: dict) -> dict:
        scenarios = self._load_scenarios()
        selected = []

        for scenario in scenarios:
            confidence, reasons = self._scenario_score(business_profile, threat_actors, scenario)

            selected.append({
                "scenario_id": scenario["scenario_id"],
                "scenario_family": scenario["scenario_family"],
                "title": scenario["title"],
                "selection_confidence": confidence,
                "selection_rationale": "; ".join(reasons)
            })

        selected.sort(key=lambda x: x["selection_confidence"], reverse=True)

        return {
            "selected_scenarios": selected[:10],
            "tailored_scenarios": self._build_tailored_scenarios(business_profile)
        }
