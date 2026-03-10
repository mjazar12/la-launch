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

  const encoder = new TextEncoder();

  // Stream the Groq response, intercepting EXTRACTED_FORM_DATA
  const stream = new ReadableStream({
    async start(controller) {
      const reader = groqRes.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (payload === "[DONE]") {
            // Check if fullText contains EXTRACTED_FORM_DATA
            const marker = "EXTRACTED_FORM_DATA:";
            const markerIdx = fullText.indexOf(marker);
            if (markerIdx !== -1) {
              const jsonStr = fullText.slice(markerIdx + marker.length).trim();
              // Only take up to the first newline or end of string
              const endIdx = jsonStr.indexOf("\n");
              const cleanJson = endIdx !== -1 ? jsonStr.slice(0, endIdx) : jsonStr;
              try {
                const formData = JSON.parse(cleanJson);
                controller.enqueue(
                  encoder.encode(`data: [FORM_DATA]${JSON.stringify(formData)}\n\n`)
                );
              } catch {
                // JSON parse failed — don't emit form data
              }
            }
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            break;
          }

          let parsed: { choices?: Array<{ delta?: { content?: string } }> };
          try {
            parsed = JSON.parse(payload);
          } catch {
            continue;
          }

          const token = parsed.choices?.[0]?.delta?.content ?? "";
          if (!token) continue;

          const prevLength = fullText.length;
          fullText += token;

          // Strip EXTRACTED_FORM_DATA from streamed text (don't show it to user)
          const markerIdx = fullText.indexOf("EXTRACTED_FORM_DATA:");
          let displayText: string;

          if (markerIdx === -1) {
            // No marker yet — display the full token
            displayText = token;
          } else if (markerIdx >= fullText.length) {
            displayText = token;
          } else if (markerIdx <= prevLength) {
            // Marker was already seen in a previous token
            displayText = "";
          } else {
            // Marker starts within this token — only show part before it
            displayText = token.slice(0, markerIdx - prevLength);
          }

          if (displayText) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ token: displayText })}\n\n`)
            );
          }
        }
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
