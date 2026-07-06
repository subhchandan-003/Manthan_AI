"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Card, CardHeader } from "@/components/ui/Card";
import { documents, equipment } from "@/lib/mock-data";

const COLORS = {
  blue: "#3D8BFD",
  amber: "#F59E0B",
  red: "#EF4444",
  green: "#10B981",
  cyan: "#06B6D4",
  purple: "#8B5CF6",
};

const oeeTrend = [
  { month: "Feb", oee: 81 },
  { month: "Mar", oee: 83 },
  { month: "Apr", oee: 85 },
  { month: "May", oee: 82 },
  { month: "Jun", oee: 86 },
  { month: "Jul", oee: 87 },
];

const costBreakdown = [
  { month: "Feb", Preventive: 18, Corrective: 9, Emergency: 4 },
  { month: "Mar", Preventive: 20, Corrective: 7, Emergency: 2 },
  { month: "Apr", Preventive: 19, Corrective: 11, Emergency: 6 },
  { month: "May", Preventive: 22, Corrective: 8, Emergency: 3 },
  { month: "Jun", Preventive: 21, Corrective: 10, Emergency: 12 },
  { month: "Jul", Preventive: 23, Corrective: 6, Emergency: 8 },
];

const topFailing = equipment
  .map((e) => ({ name: e.tag, failures: e.health === "critical" ? 7 : e.health === "warning" ? 4 : 1 }))
  .sort((a, b) => b.failures - a.failures);

const incidentTrend = [
  { month: "Aug", incidents: 3 },
  { month: "Sep", incidents: 2 },
  { month: "Oct", incidents: 4 },
  { month: "Nov", incidents: 1 },
  { month: "Dec", incidents: 2 },
  { month: "Jan", incidents: 1 },
  { month: "Feb", incidents: 3 },
  { month: "Mar", incidents: 2 },
  { month: "Apr", incidents: 1 },
  { month: "May", incidents: 2 },
  { month: "Jun", incidents: 3 },
  { month: "Jul", incidents: 2 },
];

const complianceHistory = [
  { month: "Feb", score: 89 },
  { month: "Mar", score: 91 },
  { month: "Apr", score: 90 },
  { month: "May", score: 93 },
  { month: "Jun", score: 92 },
  { month: "Jul", score: 94 },
];

const insights = [
  "ID Fan-A failure probability is elevated based on vibration trend analysis. The IJMET 2010 NDT case study on a comparable Cooling System Fan found the same signature (impeller/bearing damage, sheared locking bolt) — recommend an early inspection before SPM readings cross the 35 dBN replace-bearing threshold.",
  "NTPC Unchahar TPS (2×210 MW) is a useful reliability benchmark from the ADB project completion report: PLF recovered from 84.4% (FY2001) to 91.2% (FY2002) with heat rate improving from 2,473 to 2,464 kcal/kWh — evidence that turnaround maintenance programs measurably move these KPIs within a year.",
  "Boiler excess O2 best practice (NTPC O&M Best Practices manual) targets 3.5% dry-basis, reducible to 2.5–2.8% with CO monitoring — current readings are trending above this target, indicating a combustion-tuning opportunity.",
];

const tooltipStyle = {
  background: "var(--bg-elevated)",
  border: "1px solid var(--border-subtle)",
  borderRadius: 8,
  fontSize: 12,
  color: "var(--text-primary)",
};

export default function AnalyticsPage() {
  return (
    <div className="mx-auto max-w-[1400px] p-6">
      <h1 className="font-display text-xl font-semibold text-text-primary">Analytics &amp; Insights</h1>

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader title="Equipment Reliability Trend (OEE %)" />
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={oeeTrend}>
              <CartesianGrid stroke="var(--border-subtle)" strokeDasharray="3 3" />
              <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={11} />
              <YAxis stroke="var(--text-muted)" fontSize={11} domain={[70, 100]} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="oee" stroke={COLORS.cyan} strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <CardHeader title="Maintenance Cost Breakdown (₹ Lakh)" />
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={costBreakdown}>
              <CartesianGrid stroke="var(--border-subtle)" strokeDasharray="3 3" />
              <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={11} />
              <YAxis stroke="var(--text-muted)" fontSize={11} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Preventive" stackId="a" fill={COLORS.green} />
              <Bar dataKey="Corrective" stackId="a" fill={COLORS.amber} />
              <Bar dataKey="Emergency" stackId="a" fill={COLORS.red} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <CardHeader title="Top Failing Equipment (failures / yr)" />
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={topFailing} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid stroke="var(--border-subtle)" strokeDasharray="3 3" />
              <XAxis type="number" stroke="var(--text-muted)" fontSize={11} />
              <YAxis type="category" dataKey="name" stroke="var(--text-muted)" fontSize={10.5} width={90} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="failures" fill={COLORS.blue} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <CardHeader title="Safety Incident Trend (12 months)" />
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={incidentTrend}>
              <CartesianGrid stroke="var(--border-subtle)" strokeDasharray="3 3" />
              <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={11} />
              <YAxis stroke="var(--text-muted)" fontSize={11} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="incidents" stroke={COLORS.red} strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <CardHeader title="Compliance Score History" />
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={complianceHistory}>
              <CartesianGrid stroke="var(--border-subtle)" strokeDasharray="3 3" />
              <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={11} />
              <YAxis stroke="var(--text-muted)" fontSize={11} domain={[80, 100]} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="score" stroke={COLORS.green} strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <CardHeader title="Document Ingestion &amp; AI Query Stats" />
          <div className="grid grid-cols-2 gap-4 text-center">
            <Stat value={String(documents.length)} label="Documents Indexed" />
            <Stat value="1,247" label="Equipment Tags" />
            <Stat value="892" label="SOP Mappings" />
            <Stat value="96%" label="AI Response Accuracy" />
          </div>
        </Card>
      </div>

      <div className="mt-5">
        <h2 className="font-display text-sm font-semibold text-text-primary">AI-Generated Insights</h2>
        <div className="mt-3 flex flex-col gap-3">
          {insights.map((insight) => (
            <Card key={insight} aiGenerated>
              <p className="text-sm leading-relaxed text-text-primary">💡 {insight}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="font-display text-2xl font-bold text-accent-cyan">{value}</p>
      <p className="mt-1 text-[11px] text-text-secondary">{label}</p>
    </div>
  );
}
