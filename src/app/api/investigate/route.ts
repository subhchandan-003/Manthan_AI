import { generateText } from "ai";
import { aiModel } from "@/lib/ai-model";
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

Act as the automated "AI Investigation" step of an incident-response workflow. Give the Maintenance Engineer
who will review this next a structured investigation, formatted as exactly these four paragraphs — each
starting with the label below followed by a colon, separated by a blank line, no markdown and no extra
headings:

Root Cause Hypothesis: 2-3 sentences on the most likely cause, referencing a prior case study by name if the
pattern matches.

Supporting Evidence: what specific data points (readings, trends, prior failure signatures) this diagnosis is
based on.

Recommended Actions: 2-3 concrete checks or actions the Maintenance Engineer should verify, numbered 1. 2. 3.
each on its own line.

Confidence: High, Medium, or Low — one sentence on why.

Be direct and technical. Ground everything in the equipment data and prior case studies provided above — do
not invent details not present here.`;

  try {
    const { text } = await generateText({
      model: aiModel(),
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
  return `Root Cause Hypothesis: AI investigation unavailable right now — routed to Maintenance Engineer for manual review of "${title}"${
    tag ? ` on ${tag}` : ""
  }.

Recommended Actions: Cross-check against the equipment's maintenance history and the IJMET 2010 case-study library before diagnosing.`;
}
