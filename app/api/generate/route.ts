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
  model = "claude-haiku-4-5-20251001",
  {
    rateRetries = 3,
    parseRetries = 2,
    validate,
  }: {
    rateRetries?: number;
    parseRetries?: number;
    validate?: (result: object) => void;
  } = {}
): Promise<object> {
  // Inner: one API call + parse attempt
  async function attempt(): Promise<object> {
    try {
      const response = await client.messages.create({
        model,
        max_tokens: 8192,
        system,
        messages: [{ role: "user", content: "Output the JSON." }],
      });
      const text = response.content[0].type === "text" ? response.content[0].text.trim() : "";
      console.log("[generate] raw response preview:", text.slice(0, 200));
      try {
        const parsed = parseJSON(text);
        validate?.(parsed);
        return parsed;
      } catch (parseErr) {
        console.error("[generate] JSON/validation error. Full raw response:\n", text);
        throw parseErr;
      }
    } catch (err) {
      if (err instanceof Anthropic.RateLimitError && rateRetries > 0) {
        const waitMs = 20000;
        console.log(`[generate] Rate limited. Retrying in ${waitMs}ms... (${rateRetries} left)`);
        await new Promise((r) => setTimeout(r, waitMs));
        return callClaude(system, model, { rateRetries: rateRetries - 1, parseRetries });
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

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function deriveFinancialWarnings(
  result: object,
  qualityGate: object,
  marketScan: object
): { financialWarnings: string[]; financialConsistency: "aligned" | "fragile" | "optimistic" } {
  const financialWarnings: string[] = [];
  let financialConsistency: "aligned" | "fragile" | "optimistic" = "aligned";

  if (!isPlainObject(result)) {
    return {
      financialWarnings: ["Financial model could not be interpreted clearly."],
      financialConsistency: "fragile",
    };
  }

  const financials = isPlainObject(result.financials) ? result.financials : {};
  const scenarios = isPlainObject(financials.scenarios) ? financials.scenarios : {};
  const recommendedScenario = String(financials.recommendedScenario ?? "base");
  const recommended = isPlainObject(scenarios[recommendedScenario]) ? scenarios[recommendedScenario] : {};

  const quality = isPlainObject(qualityGate) ? qualityGate : {};
  const market = isPlainObject(marketScan) ? marketScan : {};
  const sectionConfidence = isPlainObject(quality.sectionConfidence) ? quality.sectionConfidence : {};
  const feasibility = isPlainObject(market.feasibility) ? market.feasibility : {};

  const readinessScore = Number(quality.readinessScore ?? 0);
  const financialConfidence = String(sectionConfidence.financials ?? "");
  const regulatoryRisk = Number(feasibility.regulatoryRisk ?? 5);
  const opsComplexity = Number(feasibility.opsComplexity ?? 5);
  const capitalIntensity = Number(feasibility.capitalIntensity ?? 5);
  const lowConfidencePlan = readinessScore <= 5
    || financialConfidence === "low"
    || regulatoryRisk <= 2
    || opsComplexity <= 2
    || capitalIntensity <= 2;

  const breakEvenMonth = Number(recommended.breakEvenMonth ?? 99);
  const year1Revenue = Number(recommended.year1Revenue ?? 0);
  const year1NetIncome = Number(recommended.year1NetIncome ?? 0);
  const margin = year1Revenue > 0 ? year1NetIncome / year1Revenue : 0;

  if (lowConfidencePlan) {
    financialConsistency = "fragile";
    financialWarnings.push("This idea is still early, so the forecast depends on several assumptions holding.");
  }
  if (recommendedScenario === "upside" && lowConfidencePlan) {
    financialConsistency = "optimistic";
    financialWarnings.push("The financial model is leaning on an upside case even though the idea still looks risky.");
  }
  if (lowConfidencePlan && breakEvenMonth > 0 && breakEvenMonth < 5) {
    financialConsistency = "optimistic";
    financialWarnings.push("Break-even happens very early for a risky idea, so the timing may be too optimistic.");
  }
  if (lowConfidencePlan && margin > 0.2) {
    financialConsistency = "optimistic";
    financialWarnings.push("Year 1 profit stays unusually strong for a weak concept, so treat it as best-case only.");
  }
  if ((breakEvenMonth > 12 || year1NetIncome <= 0) && !financialWarnings.includes("This idea is still early, so the forecast depends on several assumptions holding.")) {
    financialWarnings.push("The cautious case does not show an easy path to profitability in year 1.");
  }

  return { financialWarnings, financialConsistency };
}

function validateBusinessPlan(result: object): void {
  if (!isPlainObject(result)) throw new SyntaxError("Business plan is not an object");
  const financials = result.financials;
  if (!isPlainObject(financials)) throw new SyntaxError("Missing financials object");

  const scenarios = financials.scenarios;
  if (!isPlainObject(scenarios)) throw new SyntaxError("Missing financial scenarios");

  const recommendedScenario = financials.recommendedScenario;
  if (!["downside", "base", "upside"].includes(String(recommendedScenario))) {
    throw new SyntaxError("Invalid recommendedScenario");
  }

  const assumptionPressure = financials.assumptionPressure;
  if (!Array.isArray(assumptionPressure) || assumptionPressure.length !== 3) {
    throw new SyntaxError("assumptionPressure must have exactly 3 items");
  }

  for (const scenarioName of ["downside", "base", "upside"] as const) {
    const scenario = scenarios[scenarioName];
    if (!isPlainObject(scenario)) throw new SyntaxError(`Missing ${scenarioName} scenario`);
    if (!Array.isArray(scenario.monthlyProjections) || scenario.monthlyProjections.length !== 12) {
      throw new SyntaxError(`${scenarioName} must contain 12 monthly projections`);
    }
    if (typeof scenario.breakEvenMonth !== "number") {
      throw new SyntaxError(`${scenarioName} must include a numeric breakEvenMonth`);
    }
    if (typeof scenario.year1Revenue !== "number" || typeof scenario.year1NetIncome !== "number") {
      throw new SyntaxError(`${scenarioName} must include numeric year 1 totals`);
    }
  }
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
        const [qualityGate, marketScan] = await Promise.all([
          callClaude(buildQualityGatePrompt(formData), "claude-haiku-4-5-20251001"),
          callClaude(buildMarketScanPrompt(formData), "claude-haiku-4-5-20251001"),
        ]);
        console.log("[stage1] qualityGate:", JSON.stringify(qualityGate).slice(0, 300));
        console.log("[stage2] marketScan:", JSON.stringify(marketScan).slice(0, 300));
        emit({ stage: 1, stageName: "Input Quality Gate", status: "complete", result: qualityGate });
        emit({ stage: 2, stageName: "LA Market Scan", status: "complete", result: marketScan });

        // Wave 2: Stage 3 (Business Plan)
        emit({ stage: 3, stageName: "Business Plan", status: "running" });
        const businessPlan = await callClaude(
          buildBusinessPlanPrompt(formData, qualityGate, marketScan),
          "claude-haiku-4-5-20251001",
          {
            validate: validateBusinessPlan,
          }
        );
        const warningMeta = deriveFinancialWarnings(businessPlan, qualityGate, marketScan);
        const enrichedBusinessPlan = {
          ...businessPlan,
          ...warningMeta,
        };
        console.log("[stage3] businessPlan:", JSON.stringify(enrichedBusinessPlan).slice(0, 300));
        emit({ stage: 3, stageName: "Business Plan", status: "complete", result: enrichedBusinessPlan });

        // Wave 3: Stage 4 (Pitch Deck)
        emit({ stage: 4, stageName: "Pitch Deck", status: "running" });
        const pitchDeck = await callClaude(buildPitchDeckPrompt(formData), "claude-haiku-4-5-20251001");
        console.log("[stage4] pitchDeck:", JSON.stringify(pitchDeck).slice(0, 300));
        emit({ stage: 4, stageName: "Pitch Deck", status: "complete", result: pitchDeck });

        const report = {
          businessName: formData.businessName,
          qualityGate,
          marketScan,
          businessPlan: enrichedBusinessPlan,
          pitchDeck,
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
