"use client";

import { useMemo, useState } from "react";
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

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const baseScenarios = [
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
];

const exposureHistory = [
  { month: "Oct", exposure: 2200000, annotation: "Legacy access retained" },
  { month: "Nov", exposure: 2050000, annotation: "EDR rollout phase 1" },
  { month: "Dec", exposure: 1940000, annotation: "Patch backlog reduced" },
  { month: "Jan", exposure: 1780000, annotation: "Backups hardened" },
  { month: "Feb", exposure: 1590000, annotation: "MFA rolled out to admins" },
  { month: "Mar", exposure: 1410000, annotation: "Remote access tightened" },
];

const controls = [
  { control: "MFA", coverage: 42, effectiveness: 61, residualReduction: 34 },
  { control: "EDR", coverage: 78, effectiveness: 74, residualReduction: 51 },
  { control: "Backups", coverage: 64, effectiveness: 91, residualReduction: 68 },
  { control: "Email Filtering", coverage: 72, effectiveness: 58, residualReduction: 39 },
  { control: "Vuln Patching", coverage: 56, effectiveness: 66, residualReduction: 43 },
];

const assets = {
  CRM: { value: 420000, criticality: 1.15 },
  "Production DB": { value: 720000, criticality: 1.35 },
  "File Storage": { value: 510000, criticality: 1.2 },
  "Remote Access": { value: 380000, criticality: 1.1 },
};

const scenarioBaseFactors = {
  ransomware: { baseLikelihood: 0.36, baseImpact: 950000 },
  phishing: { baseLikelihood: 0.32, baseImpact: 340000 },
  "supply-chain": { baseLikelihood: 0.18, baseImpact: 1250000 },
  insider: { baseLikelihood: 0.14, baseImpact: 460000 },
};

const severityColor: Record<string, string> = {
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

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: any;
}) {
  return (
    <Card className="rounded-2xl border-slate-200 shadow-sm">
      <CardContent className="flex items-start justify-between p-5">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
            {value}
          </p>
          <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
        </div>
        <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}

function HeatmapTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;

  return (
    <div className="rounded-xl border bg-white p-3 shadow-lg">
      <div className="font-medium text-slate-900">{data.name}</div>
      <div className="text-sm text-slate-600">Asset: {data.asset}</div>
      <div className="mt-2 text-sm text-slate-600">Likelihood: {data.likelihood}%</div>
      <div className="text-sm text-slate-600">Impact: {money.format(data.impact)}</div>
      <div className="text-sm text-slate-600">
        Expected loss: {money.format(data.expectedLoss)}
      </div>
    </div>
  );
}

function AdvisorPanel({ analysis }: { analysis: any }) {
  return (
    <Card className="h-full rounded-2xl border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bot className="h-5 w-5" /> AI Risk Advisor
        </CardTitle>
        <CardDescription>
          Human-readable guidance generated from the current risk posture.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-slate-700">
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="font-medium text-slate-900">Top concern</p>
          <p className="mt-2 leading-6">{analysis.summary}</p>
        </div>

        <div>
          <p className="mb-2 font-medium text-slate-900">Immediate actions</p>
          <div className="space-y-2">
            {analysis.actions.map((action: string, index: number) => (
              <div key={index} className="flex gap-2 rounded-xl border border-slate-200 p-3">
                <Badge variant="secondary" className="mt-0.5">
                  {index + 1}
                </Badge>
                <p className="leading-6">{action}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="font-medium text-emerald-900">Projected reduction</p>
          <p className="mt-2 text-emerald-800">{analysis.reduction}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function CommandCenterPage() {
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

  const filteredScenarios = useMemo(() => {
    return baseScenarios.filter((scenario) => {
      const term = search.toLowerCase();
      return (
        scenario.name.toLowerCase().includes(term) ||
        scenario.asset.toLowerCase().includes(term)
      );
    });
  }, [search]);

  const topScenario = useMemo(() => {
    return [...baseScenarios].sort((a, b) => b.expectedLoss - a.expectedLoss)[0];
  }, []);

  const totalExposure = useMemo(() => {
    return baseScenarios.reduce((sum, item) => sum + item.expectedLoss, 0);
  }, []);

  const controlAverage = useMemo(() => {
    return Math.round(
      controls.reduce((sum, item) => sum + item.effectiveness, 0) / controls.length
    );
  }, []);

  const simulation = useMemo(() => {
    const scenario = scenarioBaseFactors[scenarioType as keyof typeof scenarioBaseFactors];
    const assetProfile = assets[asset as keyof typeof assets];

    const vectorModifier =
      entryVector === "phishing" ? 1.15 : entryVector === "vpn" ? 1.05 : 1.22;

    const controlModifier =
      (controlsEnabled.mfa ? 0.84 : 1) *
      (controlsEnabled.edr ? 0.88 : 1) *
      (controlsEnabled.backup ? 0.72 : 1) *
      (controlsEnabled.segmentation ? 0.81 : 1);

    const likelihood = Math.min(
      0.95,
      scenario.baseLikelihood * vectorModifier * (controlsEnabled.mfa ? 0.82 : 1.08)
    );

    const impact = Math.round(
      scenario.baseImpact * assetProfile.criticality * controlModifier +
        assetProfile.value * 0.35
    );

    const expectedLoss = Math.round(likelihood * impact);
    const reductionPct = Math.max(12, Math.round((1 - controlModifier) * 100));

    return { likelihood, impact, expectedLoss, reductionPct };
  }, [scenarioType, asset, entryVector, controlsEnabled]);

  const advisorAnalysis = useMemo(() => {
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
  }, [asset, simulation.reductionPct, topScenario]);

  const radarData = controls.map((item) => ({
    subject: item.control,
    effectiveness: item.effectiveness,
    fullMark: 100,
  }));

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"
        >
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
              <Shield className="h-4 w-4" /> Step 16 · Command Center UI
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">
              Cyber Risk Command Center
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-600">
              A decision cockpit for visualizing concentration of risk, exposure
              trends, control strength, scenario simulations, and AI-generated
              guidance.
            </p>
          </div>

          <div className="w-full max-w-sm">
            <Label htmlFor="search" className="mb-2 block text-xs uppercase tracking-wide text-slate-500">
              Search scenarios
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                id="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by scenario or asset"
                className="rounded-2xl bg-white pl-9"
              />
            </div>
          </div>
        </motion.div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
            value="Production DB"
            subtitle="High criticality + broad blast radius"
            icon={Server}
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <Card className="xl:col-span-2 rounded-2xl border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5" /> Risk Heatmap
              </CardTitle>
              <CardDescription>
                Likelihood on the x-axis, financial impact on the y-axis, bubble size by expected loss.
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[360px]">
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
                  <Tooltip content={<HeatmapTooltip />} cursor={{ strokeDasharray: "3 3" }} />
                  <Scatter data={filteredScenarios}>
                    {filteredScenarios.map((entry) => (
                      <Cell key={entry.id} fill={severityColor[entry.severity]} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <AdvisorPanel analysis={advisorAnalysis} />
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <Card className="xl:col-span-2 rounded-2xl border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Exposure Trend</CardTitle>
              <CardDescription>
                Trend of total modeled exposure over time, with change annotations from security initiatives.
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={exposureHistory} margin={{ top: 20, right: 20, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`} />
                  <Tooltip
                    formatter={(value: number) => money.format(value)}
                    labelFormatter={(label, payload: any) => {
                      const note = payload?.[0]?.payload?.annotation;
                      return `${label}${note ? ` · ${note}` : ""}`;
                    }}
                  />
                  <Line type="monotone" dataKey="exposure" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Exposure Notes</CardTitle>
              <CardDescription>Milestones linked to reductions in modelled exposure.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {exposureHistory.slice(-4).map((item) => (
                <div key={item.month} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-slate-900">{item.month}</p>
                    <Badge variant="secondary">{money.format(item.exposure)}</Badge>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.annotation}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <Card className="xl:col-span-2 rounded-2xl border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Control Effectiveness</CardTitle>
              <CardDescription>
                Compare coverage, practical effectiveness, and residual risk reduction across safeguards.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="bars" className="w-full">
                <TabsList className="mb-4 grid w-full max-w-xs grid-cols-2 rounded-2xl">
                  <TabsTrigger value="bars">Bar View</TabsTrigger>
                  <TabsTrigger value="radar">Radar View</TabsTrigger>
                </TabsList>

                <TabsContent value="bars" className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={controls} margin={{ top: 20, right: 20, left: 10, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="control" />
                      <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                      <Tooltip formatter={(value: number) => `${value}%`} />
                      <Bar dataKey="coverage" radius={[10, 10, 0, 0]} />
                      <Bar dataKey="effectiveness" radius={[10, 10, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </TabsContent>

                <TabsContent value="radar" className="h-[320px]">
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
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Control Insights</CardTitle>
              <CardDescription>Where protection is strongest and where gaps remain.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {controls.map((item) => (
                <div key={item.control} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-slate-900">{item.control}</p>
                    <Badge variant="outline">{item.effectiveness}% effective</Badge>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600">
                    <div className="rounded-xl bg-slate-50 p-2">Coverage: {item.coverage}%</div>
                    <div className="rounded-xl bg-slate-50 p-2">
                      Residual reduction: {item.residualReduction}%
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Search className="h-5 w-5" /> Scenario Explorer
            </CardTitle>
            <CardDescription>
              Simulate attack paths, target assets, and defensive controls to estimate likelihood and financial loss.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 xl:grid-cols-3">
              <div className="space-y-4 xl:col-span-1">
                <div className="space-y-2">
                  <Label>Scenario type</Label>
                  <Select value={scenarioType} onValueChange={setScenarioType}>
                    <SelectTrigger className="rounded-2xl bg-white">
                      <SelectValue placeholder="Select scenario" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ransomware">Ransomware</SelectItem>
                      <SelectItem value="phishing">Business Email Compromise</SelectItem>
                      <SelectItem value="supply-chain">Supply Chain Compromise</SelectItem>
                      <SelectItem value="insider">Insider Threat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Target asset</Label>
                  <Select value={asset} onValueChange={setAsset}>
                    <SelectTrigger className="rounded-2xl bg-white">
                      <SelectValue placeholder="Select asset" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(assets).map((assetName) => (
                        <SelectItem key={assetName} value={assetName}>
                          {assetName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Entry vector</Label>
                  <Select value={entryVector} onValueChange={setEntryVector}>
                    <SelectTrigger className="rounded-2xl bg-white">
                      <SelectValue placeholder="Select vector" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="phishing">Phishing</SelectItem>
                      <SelectItem value="vpn">VPN Exploit</SelectItem>
                      <SelectItem value="rdp">RDP Brute Force</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="mb-4 font-medium text-slate-900">Controls included</p>
                  <div className="space-y-4">
                    {[
                      ["mfa", "MFA"],
                      ["edr", "EDR"],
                      ["backup", "Backups"],
                      ["segmentation", "Network Segmentation"],
                    ].map(([key, label]) => (
                      <div key={key} className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                        <Label htmlFor={key} className="cursor-pointer">
                          {label}
                        </Label>
                        <Switch
                          id={key}
                          checked={controlsEnabled[key as keyof typeof controlsEnabled]}
                          onCheckedChange={(checked) =>
                            setControlsEnabled((prev) => ({ ...prev, [key]: checked }))
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3 xl:col-span-2">
                <Card className="rounded-2xl border-slate-200 shadow-none">
                  <CardContent className="p-5">
                    <p className="text-sm text-slate-500">Likelihood</p>
                    <p className="mt-2 text-3xl font-semibold tracking-tight">
                      {Math.round(simulation.likelihood * 100)}%
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      Probability based on scenario, vector, and active controls.
                    </p>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border-slate-200 shadow-none">
                  <CardContent className="p-5">
                    <p className="text-sm text-slate-500">Impact</p>
                    <p className="mt-2 text-3xl font-semibold tracking-tight">
                      {money.format(simulation.impact)}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      Adjusted using asset criticality and mitigation strength.
                    </p>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border-slate-200 shadow-none">
                  <CardContent className="p-5">
                    <p className="text-sm text-slate-500">Expected Loss</p>
                    <p className="mt-2 text-3xl font-semibold tracking-tight">
                      {money.format(simulation.expectedLoss)}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      The working benchmark for prioritizing remediation.
                    </p>
                  </CardContent>
                </Card>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 md:col-span-2">
                  <p className="text-sm font-medium text-slate-900">Scenario interpretation</p>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
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
                  </p>
                </div>

                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                  <p className="text-sm font-medium text-emerald-900">Projected control gain</p>
                  <p className="mt-2 text-3xl font-semibold tracking-tight text-emerald-900">
                    {simulation.reductionPct}%
                  </p>
                  <p className="mt-2 text-sm leading-6 text-emerald-800">
                    Estimated reduction in impact from the currently enabled control stack.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}