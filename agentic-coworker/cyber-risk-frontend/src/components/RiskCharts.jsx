import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

const COLORS = ["#6366f1","#22c55e","#f59e0b","#ef4444","#06b6d4"];

export function ScenarioRiskChart({ risks }) {

  const data = risks.map(r => ({
    name: r.scenario_family,
    value: r.scenario_eal
  }));

  return (
    <div style={{height:300}}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis dataKey="name"/>
          <YAxis/>
          <Tooltip/>
          <Bar dataKey="value" fill="#6366f1"/>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ThreatActorChart({ actors }) {

  const data = actors.map(a => ({
    name: a.actor_type,
    value: Math.round(a.confidence * 100)
  }));

  return (
    <div style={{height:300}}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            dataKey="value"
            data={data}
            outerRadius={100}
            label
          >
            {data.map((entry, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip/>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
