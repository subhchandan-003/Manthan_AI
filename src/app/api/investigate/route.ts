import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { equipment, incidents, PLANT_NAME } from "@/lib/mock-data";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { title, description, equipmentTag }: { title: string; description: string; equipmentTag?: string } =
    await req.json();

  const matchedEquipment = equipment.find((e) => e.tag === equipmentTag);
  const priorCases = incidents
    .map((i) => `- ${i.title}: root cause — ${i.rootCause}`)
    .join("\n");

  const prompt = `An incident was just raised at ${PLANT_NAME}:

Title: ${title}
Description: ${description}
${matchedEquipment ? `Equipment: ${matchedEquipment.tag} — ${matchedEquipment.name} (${matchedEquipment.system}, OEM: ${matchedEquipment.oem}, health: ${matchedEquipment.health}, running hours: ${matchedEquipment.runningHours}${matchedEquipment.bearingTemp ? `, bearing temp: ${matchedEquipment.bearingTemp}°C` : ""}${matchedEquipment.vibration ? `, vibration: ${matchedEquipment.vibration} mm/s` : ""})` : ""}

Prior RCA case studies on record:
${priorCases}

Act as the automated "AI Investigation" step of an incident-response workflow. In under 80 words, give the
Maintenance Engineer who will review this next: (1) a likely root-cause hypothesis, referencing a prior case
study by name if the pattern matches, (2) one concrete recommended check or action. Be direct and technical —
no preamble, no headings, just the analysis.`;

  try {
    const { text } = await generateText({
      model: anthropic("claude-sonnet-5"),
      prompt,
    });
    return Response.json({ recommendation: text.trim() });
  } catch {
    return Response.json({
      recommendation: fallbackRecommendation(title, matchedEquipment?.tag),
      aiUnavailable: true,
    });
  }
}

function fallbackRecommendation(title: string, tag?: string) {
  return `AI investigation unavailable right now — routed to Maintenance Engineer for manual review of "${title}"${
    tag ? ` on ${tag}` : ""
  }. Cross-check against the equipment's maintenance history and the IJMET 2010 case-study library before diagnosing.`;
}
