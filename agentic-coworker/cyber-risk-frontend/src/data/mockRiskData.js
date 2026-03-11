export const riskDashboardData = {
    scenarios: [
      {
        id: "ransomware",
        name: "Ransomware",
        likelihood: 84,
        impact: 1200000,
        expectedLoss: 420000,
        severity: "critical",
        asset: "File Storage",
      },
      {
        id: "data-leak",
        name: "Data Leak",
        likelihood: 62,
        impact: 550000,
        expectedLoss: 185000,
        severity: "high",
        asset: "CRM",
      },
      {
        id: "insider-threat",
        name: "Insider Threat",
        likelihood: 28,
        impact: 240000,
        expectedLoss: 58000,
        severity: "medium",
        asset: "Production DB",
      },
      {
        id: "vpn-exploit",
        name: "VPN Exploit",
        likelihood: 48,
        impact: 760000,
        expectedLoss: 210000,
        severity: "high",
        asset: "Remote Access",
      },
    ],
  
    exposureHistory: [
      { month: "Oct", exposure: 2200000, annotation: "Legacy access retained" },
      { month: "Nov", exposure: 2050000, annotation: "EDR rollout phase 1" },
      { month: "Dec", exposure: 1940000, annotation: "Patch backlog reduced" },
      { month: "Jan", exposure: 1780000, annotation: "Backups hardened" },
      { month: "Feb", exposure: 1590000, annotation: "MFA rolled out to admins" },
      { month: "Mar", exposure: 1410000, annotation: "Remote access tightened" },
    ],
  
    controls: [
      { control: "MFA", coverage: 42, effectiveness: 61, residualReduction: 34 },
      { control: "EDR", coverage: 78, effectiveness: 74, residualReduction: 51 },
      { control: "Backups", coverage: 64, effectiveness: 91, residualReduction: 68 },
      { control: "Email Filtering", coverage: 72, effectiveness: 58, residualReduction: 39 },
      { control: "Vuln Patching", coverage: 56, effectiveness: 66, residualReduction: 43 },
    ],
  
    assets: {
      CRM: { value: 420000, criticality: 1.15 },
      "Production DB": { value: 720000, criticality: 1.35 },
      "File Storage": { value: 510000, criticality: 1.2 },
      "Remote Access": { value: 380000, criticality: 1.1 },
    },
  
    scenarioBaseFactors: {
      ransomware: { baseLikelihood: 0.36, baseImpact: 950000 },
      phishing: { baseLikelihood: 0.32, baseImpact: 340000 },
      "supply-chain": { baseLikelihood: 0.18, baseImpact: 1250000 },
      insider: { baseLikelihood: 0.14, baseImpact: 460000 },
    },
  };