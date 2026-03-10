import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import {
  FormData,
  buildQualityGatePrompt,
  buildMarketScanPrompt,
  buildBusinessPlanPrompt,
  buildFinancialModelPrompt,
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
    if (escaped) { result += ch; escaped = false; continue; }
    if (ch === "\\") { result += ch; escaped = true; continue; }
    if (ch === '"') { inString = !inString; result += ch; continue; }
    if (inString) {
      if (ch === "\n") { result += "\\n"; continue; }
      if (ch === "\r") { result += "\\r"; continue; }
      if (ch === "\t") { result += "\\t"; continue; }
    }
    result += ch;
  }
  return result;
}

function parseJSON(raw: string): object {
  let text = raw.trim();
  text = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) throw new SyntaxError("No JSON object found");
  const candidate = sanitizeJsonControlChars(text.slice(start, end + 1));
  return JSON.parse(candidate);
}

async function callClaude(system: string, user: string, retries = 3): Promise<object> {
  try {
    const response = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 8192,
      system,
      messages: [{ role: "user", content: user }],
    });
    const text = response.content[0].type === "text" ? response.content[0].text.trim() : "";
    console.log("[generate] raw response preview:", text.slice(0, 200));
    return parseJSON(text);
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError && retries > 0) {
      const waitMs = 20000;
      console.log(`[generate] Rate limited. Retrying in ${waitMs}ms... (${retries} retries left)`);
      await new Promise((r) => setTimeout(r, waitMs));
      return callClaude(system, user, retries - 1);
    }
    throw err;
  }
}

function validateFinancialModel(fm: Record<string, unknown>): string[] {
  const errors: string[] = [];
  const pnl = fm.monthlyPnL as Array<Record<string, number>>;
  const runway = fm.cashRunway as Array<Record<string, number>>;
  const TOLERANCE = 100;

  pnl?.filter(r => r.month > 0).forEach(row => {
    const expectedGP = row.revenue - row.cogs;
    const expectedEBITDA = row.grossProfit - row.opex;
    if (Math.abs(row.grossProfit - expectedGP) > TOLERANCE)
      errors.push(`Month ${row.month}: grossProfit math error (expected ${expectedGP}, got ${row.grossProfit})`);
    if (Math.abs(row.ebitda - expectedEBITDA) > TOLERANCE)
      errors.push(`Month ${row.month}: ebitda math error (expected ${expectedEBITDA}, got ${row.ebitda})`);
    const runwayRow = runway?.find(r => r.month === row.month);
    if (runwayRow && Math.abs((runwayRow.monthlyNetBurn ?? 0) - (-row.ebitda)) > TOLERANCE)
      errors.push(`Month ${row.month}: P&L/cashRunway mismatch (burn=${runwayRow.monthlyNetBurn}, -ebitda=${-row.ebitda})`);
  });

  return errors;
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
        // Stage 1: Quality Gate
        emit({ stage: 1, stageName: "Input Quality Gate", status: "running" });
        const { system: s1, user: u1 } = buildQualityGatePrompt(formData);
        const qualityGate = await callClaude(s1, u1);
        console.log("[stage1] qualityGate:", JSON.stringify(qualityGate).slice(0, 300));
        emit({ stage: 1, stageName: "Input Quality Gate", status: "complete", result: qualityGate });

        // Stage 2: Market Scan
        emit({ stage: 2, stageName: "LA Market Scan", status: "running" });
        const { system: s2, user: u2 } = buildMarketScanPrompt(formData, qualityGate);
        const marketScan = await callClaude(s2, u2);
        console.log("[stage2] marketScan:", JSON.stringify(marketScan).slice(0, 300));
        emit({ stage: 2, stageName: "LA Market Scan", status: "complete", result: marketScan });

        // Stage 3: Business Plan
        emit({ stage: 3, stageName: "Business Plan", status: "running" });
        const { system: s3, user: u3 } = buildBusinessPlanPrompt(formData, marketScan);
        const businessPlan = await callClaude(s3, u3);
        console.log("[stage3] businessPlan:", JSON.stringify(businessPlan).slice(0, 300));
        emit({ stage: 3, stageName: "Business Plan", status: "complete", result: businessPlan });

        // Stage 4: Financial Model
        emit({ stage: 4, stageName: "Financial Model", status: "running" });
        const { system: s4, user: u4 } = buildFinancialModelPrompt(formData, marketScan, businessPlan);
        const financialModel = await callClaude(s4, u4);
        console.log("[stage4] financialModel:", JSON.stringify(financialModel).slice(0, 300));
        const fm4 = financialModel as Record<string, unknown>;
        const validationWarnings = validateFinancialModel(fm4);
        if (validationWarnings.length > 0) {
          console.warn("[stage4] Financial model validation warnings:", validationWarnings);
          fm4.validationWarnings = validationWarnings;
        }
        emit({ stage: 4, stageName: "Financial Model", status: "complete", result: financialModel });

        // Stage 5: Pitch Deck — pass trimmed financial model to avoid token overflow
        emit({ stage: 5, stageName: "Pitch Deck", status: "running" });
        const fm = financialModel as Record<string, unknown>;
        const financialModelSummary = {
          modelOverview: fm.modelOverview,
          breakevenAnalysis: fm.breakevenAnalysis,
          scenarios: fm.scenarios,
          // omit the full 24-row tables to stay within token limits
          monthlyPnL_note: "24-month P&L generated — see financial model section",
          cashRunway_note: "24-month cash runway generated — see financial model section",
          dataPointsToCollect: fm.dataPointsToCollect,
        };
        const { system: s5, user: u5 } = buildPitchDeckPrompt(formData, marketScan, businessPlan, financialModelSummary);
        const pitchDeck = await callClaude(s5, u5);
        console.log("[stage5] pitchDeck:", JSON.stringify(pitchDeck).slice(0, 300));
        emit({ stage: 5, stageName: "Pitch Deck", status: "complete", result: pitchDeck });

        // Pull top-level fields from businessPlan
        const bp = businessPlan as Record<string, unknown>;

        const report = {
          businessName: formData.businessName,
          qualityGate,
          marketScan,
          businessPlan,
          financialModel,
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
