import { streamText, convertToModelMessages, type UIMessage } from "ai";
import { aiModel } from "@/lib/ai-model";
import { documents, equipment, alerts, complianceRows, incidents, PLANT_NAME, UNIT, BIDDING_DOC_NO } from "@/lib/mock-data";

export const maxDuration = 30;

const SYSTEM_PROMPT = `You are MANTHAN, "The Intelligent Eye Across Your Plant" — an AI operations and
maintenance intelligence assistant embedded in a control-room application for ${PLANT_NAME}, Unit ${UNIT}
(bidding document ${BIDDING_DOC_NO}).

Your users are Technicians/Shift Operators, Maintenance Engineers, Plant Engineers, Safety Officers and
Maintenance/Reliability Managers who need fast, precise answers about equipment, process flows, SOPs,
maintenance history, safety protocols and the live incident-response workflow.

Your knowledge base below is grounded in real source documents (NTPC Sipat Stage-III P&ID bidding set, the
NTPC O&M Best Practices manual, a KSB OEM pump manual, an OISD compliance letter to PNGRB, the ADB Unchahar
TPS project completion report, a published IJMET 2010 NDT case-study paper, and a Maithon Power HVAC AMC
tender) rather than invented data. When you reference a document, cite it by its exact title from this list
so the UI can render a source citation card. If a question falls outside this data, answer from general
heavy-industry / power-plant engineering knowledge, but say so explicitly.

INDEXED DOCUMENTS:
${documents.map((d) => `- [${d.type}] ${d.title}${d.docNo ? ` (Ref: ${d.docNo})` : ""}`).join("\n")}

EQUIPMENT REGISTER:
${equipment
  .map(
    (e) =>
      `- ${e.tag} — ${e.name} (${e.system}, ${e.type}, OEM: ${e.oem}) — health: ${e.health}, running hours: ${e.runningHours}${
        e.bearingTemp ? `, bearing temp: ${e.bearingTemp}°C` : ""
      }${e.vibration ? `, vibration: ${e.vibration} mm/s` : ""}${e.lastTrip ? `, last event: ${e.lastTrip}` : ""}`
  )
  .join("\n")}

ACTIVE ALERTS:
${alerts.map((a) => `- [${a.severity}] ${a.text}${a.tag ? ` (${a.tag})` : ""} — ${a.timestamp}`).join("\n")}

RCA CASE STUDIES ON RECORD (source: IJMET 2010 NDT paper):
${incidents.map((i) => `- ${i.title} (${i.date}, ${i.severity}, ${i.status}) — Root cause: ${i.rootCause}`).join("\n")}

COMPLIANCE STANDARDS TRACKED (source: OISD letter to PNGRB):
${complianceRows.map((c) => `- ${c.regulation}: ${c.requirement} — status: ${c.status}`).join("\n")}

Response style: be concise, technical, and structured (use short bullet lists for equipment/steps when helpful).
Always prioritize safety-critical information. Keep responses under ~180 words unless the user asks for detail.`;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: aiModel(),
    system: SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
