import { useMemo, useState } from "react";
import { ScenarioRiskChart, ThreatActorChart } from "./components/RiskCharts";
import "./App.css";

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
    <div className="app-shell">
      <header className="hero">
        <div>
          <div className="eyebrow">AI Powered Risk Analysis</div>
          <h1>Cyber Risk Dashboard</h1>
          <p>
            Unified assessment view for risks, actions, agent outputs, narrative,
            and advisor answers.
          </p>
        </div>
        <div className="hero-status card">
          <div className="status-label">API Health</div>
          <div className={`health-pill ${health?.status === "ok" ? "ok" : ""}`}>
            {health?.status || "Not checked"}
          </div>
          <div className="status-small">Profile: {profileName}</div>
          <div className="status-small">
            Assessment: {result ? "Loaded" : "None yet"}
          </div>
        </div>
      </header>

      <section className="card controls-card">
        <div className="section-title-row">
          <h2>Assessment Controls</h2>
          <span className="section-subtitle">Run the unified API from the UI</span>
        </div>

        <div className="controls-grid">
          <label className="field">
            <span>API Base URL</span>
            <input
              value={apiBase}
              onChange={(e) => setApiBase(e.target.value)}
              placeholder="API base URL"
            />
          </label>

          <label className="field">
            <span>Business Profile</span>
            <input
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              placeholder="business profile JSON"
            />
          </label>

          <button
            className="btn btn-secondary"
            onClick={checkHealth}
            disabled={loadingHealth}
          >
            {loadingHealth ? "Checking..." : "Check Health"}
          </button>

          <button
            className="btn btn-primary"
            onClick={runAssessment}
            disabled={loadingRun}
          >
            {loadingRun ? "Running..." : "Run Assessment"}
          </button>
        </div>
      </section>

      {error ? (
        <section className="error-banner">
          <strong>Request error:</strong> {error}
        </section>
      ) : null}

      {result ? (
        <>
          <section className="kpi-grid">
            {kpis.map((kpi) => (
              <div key={kpi.label} className="card kpi-card">
                <div className="kpi-label">{kpi.label}</div>
                <div className="kpi-value">{kpi.value}</div>
              </div>
            ))}
          </section>

          <section className="two-col">
            <div className="card">
              <div className="section-title-row">
                <h2>Scenario Risk Distribution</h2>
                <span className="section-subtitle">Risk contribution by scenario</span>
              </div>
              <ScenarioRiskChart risks={result?.executive_summary?.top_risks || []} />
            </div>

            <div className="card">
              <div className="section-title-row">
                <h2>Threat Actor Confidence</h2>
                <span className="section-subtitle">Confidence by inferred actor</span>
              </div>
              <ThreatActorChart actors={result?.threat_actors?.actors || []} />
            </div>
          </section>

          <section className="two-col">
            <div className="card">
              <div className="section-title-row">
                <h2>Narrative</h2>
                <span className="section-subtitle">Leadership-facing explanation</span>
              </div>
              <div className="stack">
                <div>
                  <h3>Risk story</h3>
                  <p>{result.narrative_output?.risk_story}</p>
                </div>
                <div>
                  <h3>Why this matters</h3>
                  <p>{result.narrative_output?.why_this_matters}</p>
                </div>
                <div>
                  <h3>What to do first</h3>
                  <p>{result.narrative_output?.what_to_do_first}</p>
                </div>
                <div>
                  <h3>Long-term direction</h3>
                  <p>{result.narrative_output?.long_term_security_direction}</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="section-title-row">
                <h2>Threat Actors</h2>
                <span className="section-subtitle">AI-inferred threat context</span>
              </div>
              <div className="stack">
                {actors.map((actor) => (
                  <div key={actor.actor_id} className="mini-card">
                    <div className="row-between">
                      <strong>{actor.actor_type}</strong>
                      <span className="badge">
                        {Math.round((actor.confidence || 0) * 100)}%
                      </span>
                    </div>
                    <p>{actor.rationale}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="two-col">
            <div className="card">
              <div className="section-title-row">
                <h2>Top Risks</h2>
                <span className="section-subtitle">Highest modeled risk priorities</span>
              </div>
              <div className="stack">
                {(result.executive_summary?.top_risks || []).map((risk) => (
                  <div key={risk.title} className="mini-card">
                    <div className="row-between">
                      <strong>{risk.title}</strong>
                      <span className="badge">{risk.risk_band}</span>
                    </div>
                    <div className="muted">{risk.scenario_family}</div>
                    <div className="detail-row">
                      <span>EAL</span>
                      <strong>{currency(risk.scenario_eal)}</strong>
                    </div>
                    <div className="detail-row">
                      <span>Priority Score</span>
                      <strong>{currency(risk.priority_score)}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="section-title-row">
                <h2>Top Actions</h2>
                <span className="section-subtitle">Highest-value next steps</span>
              </div>
              <div className="stack">
                {topActions.map((action) => (
                  <div key={action.action_id} className="mini-card">
                    <div className="row-between">
                      <strong>{action.title}</strong>
                      <span className="badge">{action.implementation_effort}</span>
                    </div>
                    <div className="detail-row">
                      <span>Reduction</span>
                      <strong>{currency(action.total_eal_reduction)}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="two-col">
            <div className="card">
              <div className="section-title-row">
                <h2>Selected Scenarios</h2>
                <span className="section-subtitle">AI-ranked scenario relevance</span>
              </div>
              <div className="stack">
                {selectedScenarios.slice(0, 8).map((scenario) => (
                  <div key={scenario.scenario_id} className="mini-card">
                    <div className="row-between">
                      <strong>{scenario.title}</strong>
                      <span className="badge">
                        {Math.round((scenario.selection_confidence || 0) * 100)}%
                      </span>
                    </div>
                    <div className="muted">{scenario.scenario_family}</div>
                  </div>
                ))}

                {tailoredScenarios.length ? (
                  <div className="mini-card accent-card">
                    <strong>Tailored Scenarios</strong>
                    <ul className="simple-list">
                      {tailoredScenarios.map((scenario) => (
                        <li key={scenario.title}>{scenario.title}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="card">
              <div className="section-title-row">
                <h2>Advisor Answers</h2>
                <span className="section-subtitle">Precomputed Q&amp;A</span>
              </div>
              <div className="stack">
                {advisorAnswers.map((item) => (
                  <div key={item.question} className="mini-card">
                    <strong>{item.question}</strong>
                    <p>{item.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      ) : (
        <section className="card empty-state">
          <h2>No assessment loaded yet</h2>
          <p>
            Check API health first, then run an assessment to populate the dashboard.
          </p>
        </section>
      )}
    </div>
  );
}
