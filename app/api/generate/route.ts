import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import {
  FormData,
  buildQualityGatePrompt,
  buildMarketScanPrompt,
  buildBusinessPlanPrompt,
  buildPitchDeckPrompt,
} from "@/app/lib/prompt";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function sanitizeJsonControlChars(text: string): string {
  // Replace literal control characters inside JSON string values with their escape sequences.
  // A naive global replace would break structural whitespace, so we walk char-by-char.
  let result = "";
  let inString = false;
  let escaped = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const code = ch.charCodeAt(0);
    if (escaped) { result += ch; escaped = false; continue; }
    if (ch === "\\") { result += ch; escaped = true; continue; }
    if (ch === '"') { inString = !inString; result += ch; continue; }
    if (inString && code < 0x20) {
      // Escape all control characters (0x00–0x1F) to their JSON unicode escape form
      if (ch === "\n") { result += "\\n"; continue; }
      if (ch === "\r") { result += "\\r"; continue; }
      if (ch === "\t") { result += "\\t"; continue; }
      result += `\\u${code.toString(16).padStart(4, "0")}`;
      continue;
    }
    result += ch;
  }
  return result;
}

// Walk forward from startIdx to find the matching closing } using depth tracking.
// More reliable than lastIndexOf when Haiku adds text after the JSON object.
function findMatchingBrace(text: string, startIdx: number): number {
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = startIdx; i < text.length; i++) {
    const ch = text[i];
    if (escaped) { escaped = false; continue; }
    if (ch === "\\" && inString) { escaped = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (!inString) {
      if (ch === "{") depth++;
      else if (ch === "}") { depth--; if (depth === 0) return i; }
    }
  }
  return -1;
}

function parseJSON(raw: string): object {
  let text = raw.trim();
  text = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  const start = text.indexOf("{");
  if (start === -1) throw new SyntaxError("No JSON object found");
  const end = findMatchingBrace(text, start);
  if (end === -1) throw new SyntaxError("No matching closing brace found");
  let candidate = text.slice(start, end + 1);
  // Remove trailing commas before } or ] (common Haiku output issue)
  candidate = candidate.replace(/,(\s*[}\]])/g, "$1");
  candidate = sanitizeJsonControlChars(candidate);
  return JSON.parse(candidate);
}

async function callClaude(
  system: string,
  user: string,
  model = "claude-haiku-4-5-20251001",
  { rateRetries = 3, parseRetries = 2 } = {}
): Promise<object> {
  // Inner: one API call + parse attempt
  async function attempt(): Promise<object> {
    try {
      const response = await client.messages.create({
        model,
        max_tokens: 8192,
        system,
        messages: [{ role: "user", content: user }],
      });
      const text = response.content[0].type === "text" ? response.content[0].text.trim() : "";
      console.log("[generate] raw response preview:", text.slice(0, 200));
      try {
        return parseJSON(text);
      } catch (parseErr) {
        console.error("[generate] JSON parse error. Full raw response:\n", text);
        throw parseErr;
      }
    } catch (err) {
      if (err instanceof Anthropic.RateLimitError && rateRetries > 0) {
        const waitMs = 20000;
        console.log(`[generate] Rate limited. Retrying in ${waitMs}ms... (${rateRetries} left)`);
        await new Promise((r) => setTimeout(r, waitMs));
        return callClaude(system, user, model, { rateRetries: rateRetries - 1, parseRetries });
      }
      throw err;
    }
  }

  // Outer: retry on JSON parse failure
  for (let i = 0; i <= parseRetries; i++) {
    try {
      return await attempt();
    } catch (err) {
      if (err instanceof SyntaxError && i < parseRetries) {
        console.log(`[generate] JSON parse failed, retrying (attempt ${i + 2}/${parseRetries + 1})...`);
        continue;
      }
      throw err;
    }
  }
  throw new Error("Unreachable");
}


export async function POST(request: NextRequest) {
  const formData: FormData = await request.json();

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      function emit(data: object) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      }

      try {
        // Wave 1: Stage 1 (Quality Gate) + Stage 2 (Market Scan) in parallel
        emit({ stage: 1, stageName: "Input Quality Gate", status: "running" });
        emit({ stage: 2, stageName: "LA Market Scan", status: "running" });
        const { system: s1, user: u1 } = buildQualityGatePrompt(formData);
        const { system: s2, user: u2 } = buildMarketScanPrompt(formData, {});
        const [qualityGate, marketScan] = await Promise.all([
          callClaude(s1, u1, "claude-haiku-4-5-20251001"),
          callClaude(s2, u2, "claude-haiku-4-5-20251001"),
        ]);
        console.log("[stage1] qualityGate:", JSON.stringify(qualityGate).slice(0, 300));
        console.log("[stage2] marketScan:", JSON.stringify(marketScan).slice(0, 300));
        emit({ stage: 1, stageName: "Input Quality Gate", status: "complete", result: qualityGate });
        emit({ stage: 2, stageName: "LA Market Scan", status: "complete", result: marketScan });

        // Wave 2: Stage 3 (Business Plan) — needs marketScan
        emit({ stage: 3, stageName: "Business Plan", status: "running" });
        const { system: s3, user: u3 } = buildBusinessPlanPrompt(formData, marketScan);
        const businessPlan = await callClaude(s3, u3, "claude-haiku-4-5-20251001");
        console.log("[stage3] businessPlan:", JSON.stringify(businessPlan).slice(0, 300));
        emit({ stage: 3, stageName: "Business Plan", status: "complete", result: businessPlan });

        // Wave 3: Stage 4 (Pitch Deck)
        emit({ stage: 4, stageName: "Pitch Deck", status: "running" });
        const { system: s4, user: u4 } = buildPitchDeckPrompt(formData, marketScan, businessPlan);
        const pitchDeck = await callClaude(s4, u4, "claude-haiku-4-5-20251001");
        console.log("[stage4] pitchDeck:", JSON.stringify(pitchDeck).slice(0, 300));
        emit({ stage: 4, stageName: "Pitch Deck", status: "complete", result: pitchDeck });

        // Pull top-level fields from businessPlan
        const bp = businessPlan as Record<string, unknown>;

        const report = {
          businessName: formData.businessName,
          qualityGate,
          marketScan,
          businessPlan,
          pitchDeck,
          fundingOptions: Array.isArray(bp.fundingOptions) ? bp.fundingOptions : [],
          permits: Array.isArray(bp.permits) ? bp.permits : [],
          nextSteps: Array.isArray(bp.nextSteps) ? bp.nextSteps : [],
          riskFactors: Array.isArray(bp.riskFactors) ? bp.riskFactors : [],
        };

        emit({ type: "final", report });
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        emit({ status: "error", message });
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } finally {
        controller.close();
      }
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
