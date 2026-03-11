export interface FormData {
  businessName: string;
  industry: string;
  businessStage: string;
  businessModel: string;
  neighborhoods: string[];
  offerings: string;
  differentiation: string;
  pricing: string;
  targetCustomers: string;
  customerPersona: string;
  budget: string;
  funding: string;
  staffingPlan: string;
  spaceNeeds: string;
  launchTimeline: string;
  experienceLevel: string;
}

const LA_DATA = `
## LA NEIGHBORHOOD DATA
- Downtown LA: $2.50–5.00/sqft/month. Young professionals, rapid gentrification. High foot traffic. Good transit access.
- Silver Lake/Echo Park: $3.00–5.50/sqft/month. Trendy/artsy, strong local loyalty. Moderate–High foot traffic. Competitive food scene.
- Santa Monica: $4.00–8.00/sqft/month. Affluent, tourist-heavy. Very High foot traffic. Strict permitting, high visibility.
- Venice: $4.50–7.50/sqft/month. Creative, tourist + local mix. High foot traffic. Expensive but strong brand value.
- Hollywood: $3.00–6.00/sqft/month. Tourist-heavy, nightlife, mixed income. High foot traffic. High visibility.
- Koreatown: $2.00–4.00/sqft/month. Dense, diverse, strong food culture. High foot traffic. Most affordable option.
- Arts District: $3.50–6.00/sqft/month. Creative professionals, rapidly growing. Moderate foot traffic. Warehouse-to-retail conversions.
- Culver City: $3.00–5.50/sqft/month. Tech workers (Amazon/Apple nearby), family-friendly. Moderate foot traffic. Growing restaurant scene.
- Pasadena: $2.50–5.00/sqft/month. Established community, Old Town foot traffic. Moderate foot traffic. Less transient than Westside.

## LA FUNDING PROGRAMS
- Kiva LA: 0% interest microloans up to $15K, no credit score minimum
- LISC LA: Small business loans $50K–$250K for underserved communities
- LA County CDBG: Grants for businesses in low-to-moderate income areas
- SBA 7(a) Loans: Up to $5M, requires good credit, 7–25 year terms
- SBA Microloans: Up to $50K through intermediary lenders
- Cal OSBA Grants: California small business grants, varies by program cycle
- Local CDFIs: Pacific Asian Consortium, Vermont Slauson EDC

## LA PERMIT REQUIREMENTS
- Business Tax Registration Certificate: all businesses, ~$50–100/year
- Seller's Permit: retail/food, free from CDTFA
- Health Permit: food businesses, $500–1,000+, LA County Dept of Public Health
- Conditional Use Permit: alcohol/entertainment, ~$10K–15K, 6–12 months
- Building/Fire Permits: physical locations, cost varies
- Sign Permits: City of LA Dept of Building and Safety
- Home Occupation Permit: home-based businesses, ~$100
`;

// Shared output format instruction prepended to every system prompt
const JSON_OUTPUT_RULE = `OUTPUT FORMAT (non-negotiable):
- Respond with a single raw JSON object. Nothing before it. Nothing after it.
- Do NOT wrap in markdown code fences (no \`\`\`json or \`\`\`).
- Within any JSON string value, represent line breaks as the two-character escape sequence \\n — never as a literal newline character. A literal newline inside a JSON string is a syntax error.

`;

function serializeFormData(formData: FormData): string {
  return JSON.stringify({
    businessName: formData.businessName,
    industry: formData.industry,
    businessStage: formData.businessStage,
    businessModel: formData.businessModel,
    neighborhoods: formData.neighborhoods.join(", ") || "Los Angeles (general)",
    offerings: formData.offerings,
    differentiation: formData.differentiation,
    pricing: formData.pricing,
    targetCustomers: formData.targetCustomers,
    customerPersona: formData.customerPersona,
    startupBudget: formData.budget,
    fundingSituation: formData.funding,
    staffingPlan: formData.staffingPlan,
    spaceNeeds: formData.spaceNeeds,
    launchTimeline: formData.launchTimeline,
    experienceLevel: formData.experienceLevel,
  }, null, 2);
}

export function buildQualityGatePrompt(formData: FormData): { system: string; user: string } {
  const system = `${JSON_OUTPUT_RULE}You are the Input Quality Gatekeeper for an LA small-business plan generator.
Your job is to review what the user has told you about their business and identify gaps
that would reduce the quality of a market scan, business plan, or pitch deck.

Return a JSON object matching this exact schema:
{
  "readinessScore": "X/10 — [one sentence summary]",
  "topGaps": ["gap1", "gap2", "gap3", "gap4", "gap5"],
  "unreliableSectionsWarning": "..."
}

Rules:
- topGaps must be exactly 5 items, ranked by impact (highest impact first).
- Be concise — this is a gap check, not a report.
- Do not invent facts about the business.
- Label which report sections will be most unreliable given the gaps.`;

  const user = `Business inputs:\n${serializeFormData(formData)}`;

  return { system, user };
}

export function buildMarketScanPrompt(
  formData: FormData,
  qualityGateOutput: object
): { system: string; user: string } {
  const system = `${JSON_OUTPUT_RULE}You are the LA Market Scan & Feasibility Analyst for a first-time founder.
Use the user's business inputs to generate a market scan for launching this business in Los Angeles.
Deliver a decision-ready report that is explicitly LA-grounded.

You have access to the following LA data:
${LA_DATA}

Return a JSON object matching this exact schema (integer score fields must be integers 1–5 — the 0s below are placeholders):
{
  "executiveSummary": ["bullet1", "bullet2", "bullet3"],
  "customerAndDemand": {
    "personas": "string",
    "demandDrivers": "string",
    "willingnessToPay": "string"
  },
  "competitiveLandscape": {
    "directCompetitors": "string",
    "whitespaceOpportunities": "string"
  },
  "locationAnalysis": {
    "recommendedAreas": "string — 3 to 5 LA neighborhoods with rationale",
    "estimatedMonthlyRent": "string (dollar range)",
    "footTrafficNotes": "string",
    "proximityAdvantage": "string"
  },
  "feasibilityScorecard": {
    "demand": 0,
    "competition": 0,
    "opsComplexity": 0,
    "capitalIntensity": 0,
    "regulatoryRisk": 0,
    "timelineRealism": 0,
    "scorecardNotes": "string"
  },
  "next5Actions": ["action1", "action2", "action3", "action4", "action5"]
}

Rules:
- feasibilityScorecard values must be integers 1–5 (not strings, not 0).
- executiveSummary must be exactly 3 string bullets about go/no-go, risks, and upside.
- next5Actions must be exactly 5 concrete validation steps.
- Label all assumptions explicitly.
- Avoid made-up statistics. Use directional reasoning.
- Be specific about neighborhoods, rent ranges, and LA-specific programs.`;

  const user = `Business inputs:\n${serializeFormData(formData)}\n\nInput Quality Gate output:\n${JSON.stringify(qualityGateOutput, null, 2)}`;

  return { system, user };
}

export function buildBusinessPlanPrompt(
  formData: FormData,
  marketScanOutput: object
): { system: string; user: string } {
  const system = `${JSON_OUTPUT_RULE}You are the LA Small Business Plan Builder.
Using the user inputs and the LA Market Scan output, write a complete business plan
suitable for a lender, partner, or early investor.

Return a JSON object matching this exact schema:
{
  "executiveSummary": "string — EXACTLY 3 paragraphs. Paragraph 1: vision/opportunity. Paragraph 2: strategy/differentiation. Paragraph 3: risks/path forward. Paragraphs are separated by the two-character sequence \\n\\n (backslash-n backslash-n). Para 1 must NOT start with 'However.'",
  "productService": {
    "offerings": "string",
    "pricingLogic": "string",
    "differentiation": "string"
  },
  "goToMarket": {
    "channels": "string",
    "launchPlan": "string",
    "retention": "string"
  },
  "operationsPlan": {
    "location": "string",
    "staffing": "string",
    "workflow": "string"
  },
  "milestones": {
    "days0to30": ["string", "string"],
    "days31to90": ["string", "string"],
    "days91to180": ["string", "string"]
  },
  "risksAndMitigations": [
    { "risk": "string", "trigger": "string", "response": "string" }
  ],
  "fundingOptions": [
    { "name": "string", "description": "string", "amount": "string", "fit": "string" }
  ],
  "permits": [
    { "name": "string", "description": "string", "estimatedCost": "string", "timeline": "string" }
  ],
  "nextSteps": ["string", "string", "string"],
  "riskFactors": ["string", "string", "string"]
}

Rules:
- executiveSummary: EXACTLY 3 paragraphs. Use \\n\\n (the escape sequence) between paragraphs — NOT literal newline characters. Para 1 must NOT start with "However."
- risksAndMitigations must be exactly 4 items.
- Include 2–3 fundingOptions most relevant to their situation.
- Include all applicable permits for their business type.
- nextSteps must be exactly 3 concrete, actionable items.
- riskFactors must be exactly 3 items.
- Tie all recommendations to the user's stated startup capital and timeline.
- Be practical and specific to LA. No generic startup advice.
- milestones.days0to30, days31to90, and days91to180 must each be arrays of exactly 2 bullet strings.
- Each risksAndMitigations trigger must be specific and measurable (e.g., "revenue below $X for 2 consecutive months"), not generic phrases like "if sales drop".`;

  const user = `Business inputs:\n${serializeFormData(formData)}\n\nLA Market Scan output:\n${JSON.stringify(marketScanOutput, null, 2)}`;

  return { system, user };
}


export function buildPitchDeckPrompt(
  formData: FormData,
  marketScanOutput: object,
  businessPlanOutput: object
): { system: string; user: string } {
  const system = `${JSON_OUTPUT_RULE}You are the Pitch Deck Agent for an LA small business.
Create an 8-slide pitch deck outline using all prior research and plan outputs.
For each slide: a title, 3–5 bullet points (max 12 words per bullet), and 2–3 sentences of speaker notes.

Return a JSON object matching this exact schema:
{
  "slides": [
    {
      "slideNumber": 1,
      "title": "string",
      "bullets": ["string", "string", "string"],
      "speakerNotes": "string — 2 to 3 sentences"
    }
  ]
}

Required slides in order:
1. Vision / One-liner
2. Problem (LA-specific)
3. Solution
4. Customer (persona + opportunity size)
5. Market snapshot (LA-grounded, directional)
6. Competition & differentiation
7. Business model + unit economics drivers
8. Go-to-market (first 90 days)

Rules:
- slides must have exactly 8 entries with slideNumber 1 through 8.
- Do not invent facts. Pull only from prior stage outputs.
- Label all estimates as estimates.
- Speaker notes should help a first-time founder know what to say — not just repeat the bullets.
- Keep bullets crisp — max 12 words per bullet.
- Each slide's speakerNotes must include at least one specific dollar amount, LA neighborhood name, or business-specific detail. Generic presenter advice like "tell your story" or "pause for questions" is not acceptable.`;

  const user = `Business inputs:\n${serializeFormData(formData)}\n\nLA Market Scan:\n${JSON.stringify(marketScanOutput, null, 2)}\n\nBusiness Plan:\n${JSON.stringify(businessPlanOutput, null, 2)}`;

  return { system, user };
}
