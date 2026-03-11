class ThreatActorInferenceService:
    def infer(self, business_profile: dict) -> dict:
        actors = []

        tech = business_profile["technology_profile"]
        controls = business_profile["controls_profile"]
        critical_processes = business_profile.get("critical_processes", [])
        smb_flags = business_profile.get("smb_profile_flags", {})

        mfa_coverage = controls.get("mfa_coverage", 0)
        remote_access = tech.get("remote_access", "None")
        digital_dependency = business_profile.get("digital_dependency", "Moderate")
        security_awareness = controls.get("security_awareness", "Moderate")

        if remote_access in ["VPN", "Mixed"] or digital_dependency in ["High", "Critical"]:
            actors.append({
                "actor_id": "actor-ransomware",
                "actor_type": "Ransomware",
                "confidence": 0.86 if digital_dependency in ["High", "Critical"] else 0.74,
                "rationale": "Remote access exposure and business dependency on digital operations increase ransomware relevance.",
                "evidence_tags": ["remote_access", "digital_dependency", "recovery_risk"]
            })

        if "Finance" in critical_processes or tech.get("email_suite") in ["M365", "Google Workspace", "Other"]:
            bec_confidence = 0.80 if mfa_coverage < 70 else 0.62
            actors.append({
                "actor_id": "actor-bec",
                "actor_type": "BEC",
                "confidence": bec_confidence,
                "rationale": "Email dependency and finance-related processes increase exposure to business email compromise.",
                "evidence_tags": ["email_dependency", "finance_process", "weak_mfa"]
            })

        if (
            controls.get("patching_maturity") in ["Weak", "Basic"]
            or controls.get("logging_monitoring") in ["Minimal", "Basic"]
            or smb_flags.get("unmanaged_devices") is True
        ):
            actors.append({
                "actor_id": "actor-opportunistic",
                "actor_type": "Opportunistic",
                "confidence": 0.78,
                "rationale": "Low-maturity controls and unmanaged exposure increase likelihood of opportunistic attackers.",
                "evidence_tags": ["weak_patching", "weak_monitoring", "unmanaged_devices"]
            })

        if smb_flags.get("shared_admin_accounts") is True or controls.get("pam") is False:
            actors.append({
                "actor_id": "actor-insider",
                "actor_type": "Insider",
                "confidence": 0.58,
                "rationale": "Weak administrative separation and shared access increase insider misuse relevance.",
                "evidence_tags": ["shared_admin_accounts", "no_pam"]
            })

        return {"actors": actors}
