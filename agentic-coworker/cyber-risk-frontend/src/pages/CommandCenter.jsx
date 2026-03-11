import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Cell,
} from "recharts";
import {
  Shield,
  TrendingUp,
  Bot,
  Search,
  AlertTriangle,
  DollarSign,
  Lock,
  Server,
} from "lucide-react";
import { getRiskDashboard, simulateScenario } from "../services/riskApi";

const severityColor = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#eab308",
  low: "#22c55e",
};

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function cardStyle() {
  return {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "20px",
    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
  };
}

function StatCard({ title, value, subtitle, icon: Icon }) {
  return (
    <div style={{ ...cardStyle(), padding: 20 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div>
          <div style={{ fontSize: 14, color: "#64748b" }}>{title}</div>
          <div
            style={{
              marginTop: 8,
              fontSize: 28,
              fontWeight: 700,
              color: "#0f172a",
            }}
          >
            {value}
          </div>
          <div style={{ marginTop: 6, fontSize: 12, color: "#64748b" }}>
            {subtitle}
          </div>
        </div>
        <div
          style={{
            background: "#f1f5f9",
            borderRadius: 16,
            padding: 12,
            color: "#334155",
          }}
        >
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

function HeatmapTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: 12,
        padding: 12,
        boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
      }}
    >
      <div style={{ fontWeight: 600, color: "#0f172a" }}>{data.name}</div>
      <div style={{ fontSize: 14, color: "#475569" }}>Asset: {data.asset}</div>
      <div style={{ marginTop: 8, fontSize: 14, color: "#475569" }}>
        Likelihood: {data.likelihood}%
      </div>
      <div style={{ fontSize: 14, color: "#475569" }}>
        Impact: {money.format(data.impact)}
      </div>
      <div style={{ fontSize: 14, color: "#475569" }}>
        Expected loss: {money.format(data.expectedLoss)}
      </div>
    </div>
  );
}

function AdvisorPanel({ analysis }) {
  return (
    <div style={{ ...cardStyle(), height: "100%" }}>
      <div style={{ padding: 20, borderBottom: "1px solid #e2e8f0" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 18,
            fontWeight: 700,
          }}
        >
          <Bot size={20} /> AI Risk Advisor
        </div>
        <div style={{ marginTop: 6, fontSize: 14, color: "#64748b" }}>
          Human-readable guidance generated from the current risk posture.
        </div>
      </div>

      <div style={{ padding: 20, display: "grid", gap: 16 }}>
        <div style={{ background: "#f8fafc", borderRadius: 16, padding: 16 }}>
          <div style={{ fontWeight: 600, color: "#0f172a" }}>Top concern</div>
          <div style={{ marginTop: 8, color: "#334155", lineHeight: 1.6 }}>
            {analysis.summary}
          </div>
        </div>

        <div>
          <div
            style={{
              marginBottom: 8,
              fontWeight: 600,
              color: "#0f172a",
            }}
          >
            Immediate actions
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {analysis.actions.map((action, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  gap: 10,
                  border: "1px solid #e2e8f0",
                  borderRadius: 14,
                  padding: 12,
                }}
              >
                <div
                  style={{
                    minWidth: 24,
                    height: 24,
                    borderRadius: 999,
                    background: "#e2e8f0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {index + 1}
                </div>
                <div style={{ color: "#334155", lineHeight: 1.6 }}>{action}</div>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            border: "1px solid #bbf7d0",
            background: "#f0fdf4",
            borderRadius: 16,
            padding: 16,
          }}
        >
          <div style={{ fontWeight: 600, color: "#166534" }}>
            Projected reduction
          </div>
          <div style={{ marginTop: 8, color: "#166534" }}>
            {analysis.reduction}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CommandCenter() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [scenarioType, setScenarioType] = useState("ransomware");
  const [asset, setAsset] = useState("Production DB");
  const [entryVector, setEntryVector] = useState("phishing");
  const [search, setSearch] = useState("");
  const [controlsEnabled, setControlsEnabled] = useState({
    mfa: true,
    edr: false,
    backup: true,
    segmentation: false,
  });
  const [controlView, setControlView] = useState("bars");
  const [simulation, setSimulation] = useState(null);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const data = await getRiskDashboard();
        setDashboardData(data);
      } catch (error) {
        console.error("Failed to load dashboard", error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  useEffect(() => {
    async function runSimulation() {
      if (!dashboardData) return;

      try {
        const result = await simulateScenario({
          scenarioType,
          asset,
          entryVector,
          controlsEnabled,
        });

        setSimulation(result);
      } catch (error) {
        console.error("Failed to simulate scenario", error);
      }
    }

    runSimulation();
  }, [dashboardData, scenarioType, asset, entryVector, controlsEnabled]);

  const baseScenarios = dashboardData?.scenarios ?? [];
  const exposureHistory = dashboardData?.exposureHistory ?? [];
  const controls = dashboardData?.controls ?? [];
  const assets = dashboardData?.assets ?? {};

  const filteredScenarios = useMemo(() => {
    return baseScenarios.filter((scenario) => {
      const term = search.toLowerCase();
      return (
        scenario.name.toLowerCase().includes(term) ||
        scenario.asset.toLowerCase().includes(term)
      );
    });
  }, [baseScenarios, search]);

  const topScenario = dashboardData?.summary?.topScenario ?? null;
  const totalExposure = dashboardData?.summary?.totalExposure ?? 0;
  const controlAverage = dashboardData?.summary?.controlAverage ?? 0;

  const advisorAnalysis = useMemo(() => {
    if (!topScenario || !simulation || controls.length === 0) {
      return {
        summary: "",
        actions: [],
        reduction: "",
      };
    }

    const weakControl = [...controls].sort((a, b) => a.coverage - b.coverage)[0];

    return {
      summary: `Your highest current exposure is ${topScenario.name} against ${
        topScenario.asset
      }, with an expected loss of ${money.format(
        topScenario.expectedLoss
      )}. The main weakness is ${weakControl.control} coverage at ${
        weakControl.coverage
      }%, which leaves common attack paths too open.`,
      actions: [
        `Prioritize ${weakControl.control} rollout for high-impact systems and remote access users first.`,
        `Use the scenario explorer to compare residual exposure with and without EDR and network segmentation.`,
        `Tie each control rollout to a business metric by tracking monthly exposure reduction instead of technical completion alone.`,
      ],
      reduction: `The current simulated control plan indicates a ${simulation.reductionPct}% reduction in scenario impact for ${asset}.`,
    };
  }, [asset, controls, simulation, topScenario]);

  const radarData = controls.map((item) => ({
    subject: item.control,
    effectiveness: item.effectiveness,
    fullMark: 100,
  }));

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#f8fafc",
          color: "#0f172a",
          fontFamily: "sans-serif",
        }}
      >
        Loading Command Center...
      </div>
    );
  }

  if (!dashboardData || !topScenario || !simulation) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#f8fafc",
          color: "#0f172a",
          fontFamily: "sans-serif",
        }}
      >
        Unable to load dashboard data.
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        padding: 24,
        color: "#0f172a",
      }}
    >
      <div style={{ maxWidth: 1400, margin: "0 auto", display: "grid", gap: 24 }}>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                border: "1px solid #e2e8f0",
                background: "#fff",
                color: "#475569",
                borderRadius: 999,
                padding: "6px 12px",
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              <Shield size={16} /> Step 16 · Command Center UI
            </div>
            <h1
              style={{
                marginTop: 12,
                fontSize: 36,
                lineHeight: 1.1,
                fontWeight: 800,
              }}
            >
              Cyber Risk Command Center
            </h1>
            <p
              style={{
                marginTop: 10,
                maxWidth: 900,
                fontSize: 14,
                color: "#64748b",
              }}
            >
              A decision cockpit for visualizing concentration of risk, exposure
              trends, control strength, scenario simulations, and AI-generated
              guidance.
            </p>
          </div>

          <div style={{ width: 320, maxWidth: "100%" }}>
            <label
              style={{
                display: "block",
                marginBottom: 8,
                fontSize: 12,
                color: "#64748b",
                fontWeight: 700,
              }}
            >
              Search scenarios
            </label>
            <div style={{ position: "relative" }}>
              <Search
                size={16}
                style={{
                  position: "absolute",
                  left: 12,
                  top: 12,
                  color: "#94a3b8",
                }}
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by scenario or asset"
                style={{
                  width: "100%",
                  borderRadius: 16,
                  border: "1px solid #e2e8f0",
                  background: "#fff",
                  padding: "12px 14px 12px 36px",
                  outline: "none",
                }}
              />
            </div>
          </div>
        </motion.div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 16,
          }}
        >
          <StatCard
            title="Total Expected Exposure"
            value={money.format(totalExposure)}
            subtitle="Across all modeled scenarios"
            icon={DollarSign}
          />
          <StatCard
            title="Top Scenario"
            value={topScenario.name}
            subtitle={`${money.format(topScenario.expectedLoss)} expected loss`}
            icon={AlertTriangle}
          />
          <StatCard
            title="Average Control Effectiveness"
            value={`${controlAverage}%`}
            subtitle="Weighted across existing safeguards"
            icon={Lock}
          />
          <StatCard
            title="Most Exposed Asset"
            value={dashboardData?.summary?.mostExposedAsset ?? "Unknown"}
            subtitle="High criticality + broad blast radius"
            icon={Server}
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr",
            gap: 24,
          }}
        >
          <div style={cardStyle()}>
            <div style={{ padding: 20, borderBottom: "1px solid #e2e8f0" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontWeight: 700,
                  fontSize: 18,
                }}
              >
                <TrendingUp size={20} /> Risk Heatmap
              </div>
              <div style={{ marginTop: 6, fontSize: 14, color: "#64748b" }}>
                Likelihood on the x-axis, financial impact on the y-axis, bubble
                size by expected loss.
              </div>
            </div>
            <div style={{ height: 360, padding: 20 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 24, left: 12, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    dataKey="likelihood"
                    name="Likelihood"
                    domain={[0, 100]}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <YAxis
                    type="number"
                    dataKey="impact"
                    name="Impact"
                    tickFormatter={(v) => `$${Math.round(v / 1000)}k`}
                  />
                  <ZAxis type="number" dataKey="expectedLoss" range={[120, 1200]} />
                  <Tooltip
                    content={<HeatmapTooltip />}
                    cursor={{ strokeDasharray: "3 3" }}
                  />
                  <Scatter data={filteredScenarios}>
                    {filteredScenarios.map((entry) => (
                      <Cell key={entry.id} fill={severityColor[entry.severity]} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>

          <AdvisorPanel analysis={advisorAnalysis} />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr",
            gap: 24,
          }}
        >
          <div style={cardStyle()}>
            <div style={{ padding: 20, borderBottom: "1px solid #e2e8f0" }}>
              <div style={{ fontWeight: 700, fontSize: 18 }}>Exposure Trend</div>
              <div style={{ marginTop: 6, fontSize: 14, color: "#64748b" }}>
                Trend of total modeled exposure over time, with change annotations
                from security initiatives.
              </div>
            </div>
            <div style={{ height: 320, padding: 20 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={exposureHistory}
                  margin={{ top: 20, right: 20, left: 10, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`} />
                  <Tooltip
                    formatter={(value) => money.format(value)}
                    labelFormatter={(label, payload) => {
                      const note = payload?.[0]?.payload?.annotation;
                      return `${label}${note ? ` · ${note}` : ""}`;
                    }}
                  />
                  <Line type="monotone" dataKey="exposure" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={cardStyle()}>
            <div style={{ padding: 20, borderBottom: "1px solid #e2e8f0" }}>
              <div style={{ fontWeight: 700, fontSize: 18 }}>Exposure Notes</div>
              <div style={{ marginTop: 6, fontSize: 14, color: "#64748b" }}>
                Milestones linked to reductions in modelled exposure.
              </div>
            </div>
            <div style={{ padding: 20, display: "grid", gap: 12 }}>
              {exposureHistory.slice(-4).map((item) => (
                <div
                  key={item.month}
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: 16,
                    padding: 16,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                    }}
                  >
                    <div style={{ fontWeight: 600 }}>{item.month}</div>
                    <div
                      style={{
                        background: "#f1f5f9",
                        borderRadius: 999,
                        padding: "4px 10px",
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      {money.format(item.exposure)}
                    </div>
                  </div>
                  <div
                    style={{
                      marginTop: 8,
                      fontSize: 14,
                      color: "#64748b",
                      lineHeight: 1.6,
                    }}
                  >
                    {item.annotation}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr",
            gap: 24,
          }}
        >
          <div style={cardStyle()}>
            <div style={{ padding: 20, borderBottom: "1px solid #e2e8f0" }}>
              <div style={{ fontWeight: 700, fontSize: 18 }}>
                Control Effectiveness
              </div>
              <div style={{ marginTop: 6, fontSize: 14, color: "#64748b" }}>
                Compare coverage, practical effectiveness, and residual risk
                reduction across safeguards.
              </div>
            </div>

            <div style={{ padding: 20 }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <button
                  onClick={() => setControlView("bars")}
                  style={{
                    border: "1px solid #e2e8f0",
                    background: controlView === "bars" ? "#0f172a" : "#fff",
                    color: controlView === "bars" ? "#fff" : "#0f172a",
                    borderRadius: 14,
                    padding: "10px 14px",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  Bar View
                </button>
                <button
                  onClick={() => setControlView("radar")}
                  style={{
                    border: "1px solid #e2e8f0",
                    background: controlView === "radar" ? "#0f172a" : "#fff",
                    color: controlView === "radar" ? "#fff" : "#0f172a",
                    borderRadius: 14,
                    padding: "10px 14px",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  Radar View
                </button>
              </div>

              <div style={{ height: 320 }}>
                {controlView === "bars" ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={controls}
                      margin={{ top: 20, right: 20, left: 10, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="control" />
                      <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                      <Tooltip formatter={(value) => `${value}%`} />
                      <Bar dataKey="coverage" radius={[10, 10, 0, 0]} />
                      <Bar dataKey="effectiveness" radius={[10, 10, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart outerRadius="72%" data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} />
                      <Radar
                        name="Effectiveness"
                        dataKey="effectiveness"
                        fillOpacity={0.5}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          <div style={cardStyle()}>
            <div style={{ padding: 20, borderBottom: "1px solid #e2e8f0" }}>
              <div style={{ fontWeight: 700, fontSize: 18 }}>Control Insights</div>
              <div style={{ marginTop: 6, fontSize: 14, color: "#64748b" }}>
                Where protection is strongest and where gaps remain.
              </div>
            </div>
            <div style={{ padding: 20, display: "grid", gap: 12 }}>
              {controls.map((item) => (
                <div
                  key={item.control}
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: 16,
                    padding: 16,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                    }}
                  >
                    <div style={{ fontWeight: 600 }}>{item.control}</div>
                    <div
                      style={{
                        border: "1px solid #cbd5e1",
                        borderRadius: 999,
                        padding: "4px 10px",
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      {item.effectiveness}% effective
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: 12,
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 8,
                      fontSize: 12,
                      color: "#475569",
                    }}
                  >
                    <div
                      style={{
                        background: "#f8fafc",
                        borderRadius: 12,
                        padding: 10,
                      }}
                    >
                      Coverage: {item.coverage}%
                    </div>
                    <div
                      style={{
                        background: "#f8fafc",
                        borderRadius: 12,
                        padding: 10,
                      }}
                    >
                      Residual reduction: {item.residualReduction}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={cardStyle()}>
          <div style={{ padding: 20, borderBottom: "1px solid #e2e8f0" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontWeight: 700,
                fontSize: 18,
              }}
            >
              <Search size={20} /> Scenario Explorer
            </div>
            <div style={{ marginTop: 6, fontSize: 14, color: "#64748b" }}>
              Simulate attack paths, target assets, and defensive controls to
              estimate likelihood and financial loss.
            </div>
          </div>

          <div
            style={{
              padding: 20,
              display: "grid",
              gridTemplateColumns: "1fr 2fr",
              gap: 24,
            }}
          >
            <div style={{ display: "grid", gap: 16 }}>
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: 8,
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  Scenario type
                </label>
                <select
                  value={scenarioType}
                  onChange={(e) => setScenarioType(e.target.value)}
                  style={{
                    width: "100%",
                    borderRadius: 14,
                    border: "1px solid #e2e8f0",
                    background: "#fff",
                    padding: 12,
                  }}
                >
                  <option value="ransomware">Ransomware</option>
                  <option value="phishing">Business Email Compromise</option>
                  <option value="supply-chain">Supply Chain Compromise</option>
                  <option value="insider">Insider Threat</option>
                </select>
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: 8,
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  Target asset
                </label>
                <select
                  value={asset}
                  onChange={(e) => setAsset(e.target.value)}
                  style={{
                    width: "100%",
                    borderRadius: 14,
                    border: "1px solid #e2e8f0",
                    background: "#fff",
                    padding: 12,
                  }}
                >
                  {Object.keys(assets).map((assetName) => (
                    <option key={assetName} value={assetName}>
                      {assetName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: 8,
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  Entry vector
                </label>
                <select
                  value={entryVector}
                  onChange={(e) => setEntryVector(e.target.value)}
                  style={{
                    width: "100%",
                    borderRadius: 14,
                    border: "1px solid #e2e8f0",
                    background: "#fff",
                    padding: 12,
                  }}
                >
                  <option value="phishing">Phishing</option>
                  <option value="vpn">VPN Exploit</option>
                  <option value="rdp">RDP Brute Force</option>
                </select>
              </div>

              <div
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: 16,
                  padding: 16,
                }}
              >
                <div style={{ marginBottom: 16, fontWeight: 600 }}>
                  Controls included
                </div>
                <div style={{ display: "grid", gap: 12 }}>
                  {[
                    ["mfa", "MFA"],
                    ["edr", "EDR"],
                    ["backup", "Backups"],
                    ["segmentation", "Network Segmentation"],
                  ].map(([key, label]) => (
                    <label
                      key={key}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                        background: "#f8fafc",
                        borderRadius: 12,
                        padding: 12,
                      }}
                    >
                      <span>{label}</span>
                      <input
                        type="checkbox"
                        checked={controlsEnabled[key]}
                        onChange={(e) =>
                          setControlsEnabled((prev) => ({
                            ...prev,
                            [key]: e.target.checked,
                          }))
                        }
                      />
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: 16,
              }}
            >
              <div style={{ ...cardStyle(), padding: 20 }}>
                <div style={{ fontSize: 14, color: "#64748b" }}>Likelihood</div>
                <div style={{ marginTop: 8, fontSize: 34, fontWeight: 800 }}>
                  {Math.round(simulation.likelihood * 100)}%
                </div>
                <div style={{ marginTop: 8, fontSize: 12, color: "#64748b" }}>
                  Probability based on scenario, vector, and active controls.
                </div>
              </div>

              <div style={{ ...cardStyle(), padding: 20 }}>
                <div style={{ fontSize: 14, color: "#64748b" }}>Impact</div>
                <div style={{ marginTop: 8, fontSize: 34, fontWeight: 800 }}>
                  {money.format(simulation.impact)}
                </div>
                <div style={{ marginTop: 8, fontSize: 12, color: "#64748b" }}>
                  Adjusted using asset criticality and mitigation strength.
                </div>
              </div>

              <div style={{ ...cardStyle(), padding: 20 }}>
                <div style={{ fontSize: 14, color: "#64748b" }}>Expected Loss</div>
                <div style={{ marginTop: 8, fontSize: 34, fontWeight: 800 }}>
                  {money.format(simulation.expectedLoss)}
                </div>
                <div style={{ marginTop: 8, fontSize: 12, color: "#64748b" }}>
                  The working benchmark for prioritizing remediation.
                </div>
              </div>

              <div
                style={{
                  gridColumn: "span 2",
                  border: "1px solid #e2e8f0",
                  background: "#f8fafc",
                  borderRadius: 16,
                  padding: 20,
                }}
              >
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#0f172a",
                  }}
                >
                  Scenario interpretation
                </div>
                <div
                  style={{
                    marginTop: 10,
                    fontSize: 14,
                    lineHeight: 1.8,
                    color: "#475569",
                  }}
                >
                  {scenarioType === "ransomware" &&
                    `This simulation shows a disruptive encryption event against ${asset}. ${
                      controlsEnabled.backup
                        ? "Backup resilience is reducing business downtime."
                        : "Lack of resilient backups is increasing recovery cost."
                    }`}
                  {scenarioType === "phishing" &&
                    `This simulation models account compromise and payment or data fraud impacting ${asset}. ${
                      controlsEnabled.mfa
                        ? "MFA is reducing credential abuse likelihood."
                        : "Weak identity controls are raising account takeover risk."
                    }`}
                  {scenarioType === "supply-chain" &&
                    `This simulation represents compromise through a trusted vendor or dependency. ${
                      controlsEnabled.segmentation
                        ? "Segmentation is containing blast radius."
                        : "Flat connectivity is amplifying propagation risk."
                    }`}
                  {scenarioType === "insider" &&
                    `This simulation focuses on misuse of legitimate access. ${
                      controlsEnabled.edr
                        ? "EDR raises the chance of detecting suspicious behavior earlier."
                        : "Limited endpoint telemetry delays detection."
                    }`}
                </div>
              </div>

              <div
                style={{
                  border: "1px solid #bbf7d0",
                  background: "#f0fdf4",
                  borderRadius: 16,
                  padding: 20,
                }}
              >
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#166534",
                  }}
                >
                  Projected control gain
                </div>
                <div
                  style={{
                    marginTop: 8,
                    fontSize: 34,
                    fontWeight: 800,
                    color: "#166534",
                  }}
                >
                  {simulation.reductionPct}%
                </div>
                <div
                  style={{
                    marginTop: 8,
                    fontSize: 14,
                    lineHeight: 1.6,
                    color: "#166534",
                  }}
                >
                  Estimated reduction in impact from the currently enabled control
                  stack.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}