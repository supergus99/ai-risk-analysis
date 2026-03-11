import { useMemo, useState } from "react";

export default function App() {
  const [apiBase, setApiBase] = useState("http://127.0.0.1:8020");
  const [profileName, setProfileName] = useState("small-business-low-maturity.json");
  const [health, setHealth] = useState(null);
  const [result, setResult] = useState(null);
  const [loadingHealth, setLoadingHealth] = useState(false);
  const [loadingRun, setLoadingRun] = useState(false);
  const [error, setError] = useState("");

  const currency = (n) =>
    typeof n === "number"
      ? new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          maximumFractionDigits: 0,
        }).format(n)
      : "—";

  const topRisk = result?.executive_summary?.top_risks?.[0];
  const topActions = result?.executive_summary?.top_actions || [];
  const actors = result?.threat_actors?.actors || [];
  const advisorAnswers = result?.advisor_answers || [];
  const selectedScenarios = result?.scenario_selection?.selected_scenarios || [];
  const tailoredScenarios = result?.scenario_selection?.tailored_scenarios || [];

  const kpis = useMemo(() => {
    const summary = result?.executive_summary;
    if (!summary) return [];
    return [
      { label: "Annual Exposure", value: currency(summary.baseline_portfolio_eal) },
      { label: "Top Risk", value: topRisk?.scenario_family || "—" },
      { label: "Best Action Reduction", value: currency(summary.portfolio_eal_reduction) },
      { label: "Residual Exposure", value: currency(summary.residual_portfolio_eal) },
    ];
  }, [result, topRisk]);

  async function checkHealth() {
    setLoadingHealth(true);
    setError("");
    try {
      const res = await fetch(`${apiBase}/health`);
      if (!res.ok) throw new Error(`Health check failed: ${res.status}`);
      const data = await res.json();
      setHealth(data);
    } catch (e) {
      setHealth(null);
      setError(e?.message || "Unable to reach API");
    } finally {
      setLoadingHealth(false);
    }
  }

  async function runAssessment() {
    setLoadingRun(true);
    setError("");
    try {
      const res = await fetch(`${apiBase}/cyber-risk/run-assessment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business_profile_name: profileName }),
      });
      if (!res.ok) throw new Error(`Assessment failed: ${res.status}`);
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setResult(null);
      setError(e?.message || "Assessment request failed");
    } finally {
      setLoadingRun(false);
    }
  }

  return (
    <div style={{ padding: 24, fontFamily: "Arial, sans-serif", maxWidth: 1280, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 8 }}>Cyber Risk Dashboard</h1>
      <p style={{ color: "#555", marginBottom: 24 }}>
        Unified assessment view for risks, actions, agent outputs, narrative, and advisor answers.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 16 }}>
        <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16 }}>
          <h3>Assessment Controls</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto auto", gap: 12, marginTop: 12 }}>
            <input
              value={apiBase}
              onChange={(e) => setApiBase(e.target.value)}
              placeholder="API base URL"
              style={{ padding: 10, borderRadius: 8, border: "1px solid #ccc" }}
            />
            <input
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              placeholder="business profile JSON"
              style={{ padding: 10, borderRadius: 8, border: "1px solid #ccc" }}
            />
            <button onClick={checkHealth} disabled={loadingHealth} style={{ padding: "10px 14px", borderRadius: 8 }}>
              {loadingHealth ? "Checking..." : "Check Health"}
            </button>
            <button onClick={runAssessment} disabled={loadingRun} style={{ padding: "10px 14px", borderRadius: 8 }}>
              {loadingRun ? "Running..." : "Run Assessment"}
            </button>
          </div>
        </div>

        <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16 }}>
          <h3>Status</h3>
          <p>Health: <strong>{health?.status || "Not checked"}</strong></p>
          <p>Profile: <strong>{profileName}</strong></p>
          <p>Assessment: <strong>{result ? "Loaded" : "None yet"}</strong></p>
        </div>
      </div>

      {error ? (
        <div style={{ background: "#fee", color: "#900", border: "1px solid #fbb", borderRadius: 12, padding: 12, marginBottom: 16 }}>
          {error}
        </div>
      ) : null}

      {result ? (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 16 }}>
            {kpis.map((kpi) => (
              <div key={kpi.label} style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16 }}>
                <div style={{ color: "#666", fontSize: 14 }}>{kpi.label}</div>
                <div style={{ marginTop: 8, fontSize: 24, fontWeight: 700 }}>{kpi.value}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 16, marginBottom: 16 }}>
            <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16 }}>
              <h3>Narrative</h3>
              <p><strong>Risk story:</strong> {result.narrative_output?.risk_story}</p>
              <p><strong>Why this matters:</strong> {result.narrative_output?.why_this_matters}</p>
              <p><strong>What to do first:</strong> {result.narrative_output?.what_to_do_first}</p>
              <p><strong>Long-term direction:</strong> {result.narrative_output?.long_term_security_direction}</p>
            </div>

            <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16 }}>
              <h3>Threat Actors</h3>
              {actors.map((actor) => (
                <div key={actor.actor_id} style={{ border: "1px solid #eee", borderRadius: 10, padding: 10, marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <strong>{actor.actor_type}</strong>
                    <span>{Math.round((actor.confidence || 0) * 100)}%</span>
                  </div>
                  <div style={{ color: "#555", marginTop: 6 }}>{actor.rationale}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16 }}>
              <h3>Top Risks</h3>
              {(result.executive_summary?.top_risks || []).map((risk) => (
                <div key={risk.title} style={{ border: "1px solid #eee", borderRadius: 10, padding: 12, marginBottom: 10 }}>
                  <strong>{risk.title}</strong>
                  <div>{risk.scenario_family} · {risk.risk_band}</div>
                  <div>EAL: {currency(risk.scenario_eal)}</div>
                  <div>Priority score: {currency(risk.priority_score)}</div>
                </div>
              ))}
            </div>

            <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16 }}>
              <h3>Top Actions</h3>
              {topActions.map((action) => (
                <div key={action.action_id} style={{ border: "1px solid #eee", borderRadius: 10, padding: 12, marginBottom: 10 }}>
                  <strong>{action.title}</strong>
                  <div>Effort: {action.implementation_effort}</div>
                  <div>Reduction: {currency(action.total_eal_reduction)}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16 }}>
              <h3>Selected Scenarios</h3>
              {selectedScenarios.slice(0, 8).map((scenario) => (
                <div key={scenario.scenario_id} style={{ border: "1px solid #eee", borderRadius: 10, padding: 12, marginBottom: 10 }}>
                  <strong>{scenario.title}</strong>
                  <div>{scenario.scenario_family}</div>
                  <div>Confidence: {Math.round((scenario.selection_confidence || 0) * 100)}%</div>
                </div>
              ))}
              {tailoredScenarios.length ? (
                <div style={{ marginTop: 16 }}>
                  <h4>Tailored Scenarios</h4>
                  {tailoredScenarios.map((scenario) => (
                    <div key={scenario.title} style={{ marginBottom: 8 }}>
                      • {scenario.title}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16 }}>
              <h3>Advisor Answers</h3>
              {advisorAnswers.map((item) => (
                <div key={item.question} style={{ border: "1px solid #eee", borderRadius: 10, padding: 12, marginBottom: 10 }}>
                  <strong>{item.question}</strong>
                  <div style={{ marginTop: 6 }}>{item.answer}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div style={{ border: "1px dashed #ccc", borderRadius: 12, padding: 40, textAlign: "center", color: "#666" }}>
          No assessment loaded yet.
        </div>
      )}
    </div>
  );
}
