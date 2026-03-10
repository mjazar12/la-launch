import { NextRequest } from "next/server";
import { buildIntakeMessages } from "@/app/lib/intakePrompt";

export async function POST(request: NextRequest) {
  const { messages } = await request.json();

  const body = buildIntakeMessages(messages);

  const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!groqRes.ok) {
    const err = await groqRes.text();
    return new Response(JSON.stringify({ error: err }), { status: 500 });
  }

  const data = await groqRes.json();
  const fullText: string = data.choices?.[0]?.message?.content ?? "";

  // Split on marker — handle both "\nEXTRACTED_FORM_DATA:" and "EXTRACTED_FORM_DATA:" at start
  const MARKER = "EXTRACTED_FORM_DATA:";
  let displayText = fullText;
  let formData = null;

  const markerIdx = fullText.indexOf(MARKER);
  if (markerIdx !== -1) {
    displayText = fullText.slice(0, markerIdx);
    const jsonStr = fullText.slice(markerIdx + MARKER.length).trim();
    try {
      formData = JSON.parse(jsonStr);
    } catch {
      // JSON parse failed — still show the message, just no formData
    }
  }

  return new Response(
    JSON.stringify({ message: displayText.trim(), formData }),
    { headers: { "Content-Type": "application/json" } }
  );
}
