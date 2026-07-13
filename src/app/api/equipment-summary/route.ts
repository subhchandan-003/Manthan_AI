import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import { equipment, PLANT_NAME } from "@/lib/mock-data";
import {
  getCurrentCondition,
  getMaintenanceHistory,
  getInspectionReports,
  getLinkedSops,
} from "@/lib/equipmentIntelligence";

export const maxDuration = 30;

const summarySchema = z.object({
  currentCondition: z.string().describe("1-2 sentences on current operating condition"),
  recentMaintenance: z.string().describe("1-2 sentences on recent maintenance activity"),
  knownIssues: z.string().describe("1-2 sentences on known issues, or 'None on record' if healthy"),
  failureTrends: z.string().describe("1-2 sentences on failure trends / patterns"),
  recommendedActions: z.array(z.string()).describe("2-4 short recommended next actions"),
  reasoning: z.array(z.string()).describe("3-5 short bullet points citing which specific evidence source led to each conclusion, e.g. 'OEM Manual recommends bearing inspection above 80C'"),
  confidence: z.number().min(0).max(100).describe("Confidence 0-100 in this analysis given the available evidence"),
});

export async function POST(req: Request) {
  const { tag }: { tag: string } = await req.json();
  const e = equipment.find((x) => x.tag === tag);
  if (!e) return Response.json({ error: "Equipment not found" }, { status: 404 });

  const history = getMaintenanceHistory(tag);
  const inspections = getInspectionReports(tag);
  const condition = getCurrentCondition(tag);
  const sops = getLinkedSops(tag);

  const prompt = `You are the AI Executive Summary engine of an Equipment Intelligence Workspace for ${PLANT_NAME}.

Equipment: ${e.tag} — ${e.name}
Type: ${e.type} · System: ${e.system} · OEM: ${e.oem}
Health: ${e.health} · Running hours: ${e.runningHours}
${e.bearingTemp ? `Bearing temperature: ${e.bearingTemp}°C\n` : ""}${e.vibration ? `Vibration: ${e.vibration} mm/s\n` : ""}${e.lastTrip ? `Last trip/event: ${e.lastTrip}\n` : ""}

Current condition metrics:
${condition.map((c) => `- ${c.label}: ${c.value} (${c.status})`).join("\n")}

Maintenance history:
${history.map((h) => `- ${h.date} [${h.type}] ${h.description} (${h.performedBy})`).join("\n") || "- No maintenance events on record"}

Inspection reports:
${inspections.map((i) => `- ${i.date} (${i.inspector}): ${i.observations} [${i.status}]`).join("\n")}

Linked SOPs on file: ${sops.map((s) => s.category).join(", ")}

Analyze this equipment like a plant reliability engineer would. Ground every claim in the data above — do not invent facts not present here. Cite the specific source (OEM Manual, Maintenance Log, Inspection Report, Sensor Data) in your reasoning bullets.`;

  try {
    const { object } = await generateObject({
      model: anthropic("claude-sonnet-5"),
      schema: summarySchema,
      prompt,
    });
    return Response.json(object);
  } catch {
    return Response.json({
      currentCondition: `${e.tag} is currently ${e.health === "healthy" ? "operating normally" : e.health === "warning" ? "showing early warning signs" : "in a critical state"}.`,
      recentMaintenance: history[0] ? `Last activity: ${history[0].date} — ${history[0].description}` : "No recent maintenance on record.",
      knownIssues: e.lastTrip ?? "None on record.",
      failureTrends: "AI analysis unavailable — showing data-derived summary only.",
      recommendedActions: ["Check maintenance history", "Review inspection reports", "Request AI investigation if issues persist"],
      reasoning: ["AI Gateway unavailable — this summary was assembled directly from equipment records without model analysis."],
      confidence: 60,
      aiUnavailable: true,
    });
  }
}
