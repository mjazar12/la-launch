import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { MessageParam } from "@anthropic-ai/sdk/resources/messages";
import { buildIntakeMessages } from "@/app/lib/intakePrompt";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: NextRequest) {
  const { messages } = await request.json();
  const { system, messages: userMessages } = buildIntakeMessages(messages);

  let fullText = "";
  try {
    const response = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 512,
      system,
      messages: userMessages as MessageParam[],
    });
    fullText = response.content[0].type === "text" ? response.content[0].text : "";
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }

  // Split on marker — handle both "\nEXTRACTED_FORM_DATA:" and at start of string
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
