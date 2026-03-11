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

const SYSTEM_PREAMBLE = `You are a direct, opinionated LA business strategist who gives founders clear, actionable plans — not consulting reports.

RULES YOU MUST FOLLOW:
1. Every statement is 1-2 sentences max. No filler, no hedging, no "if conditions are met" language.
2. Use specific LA names, streets, programs, and dollar amounts — never give generic advice.
3. Output ONLY valid JSON matching the schema below. No markdown, no commentary, no backticks.
4. Be opinionated. Say "Do X" not "Consider X." Say "$7,000 for a cart" not "approximately $5,000-$10,000 depending on various factors."
5. Financial numbers must be single values (your best estimate), not ranges. Ranges signal you're hedging.`;

const NEIGHBORHOOD_DATA: Record<string, string> = {
  'Downtown LA': 'Commercial rent $2.50-5.00/sqft, high foot traffic, young professionals, rapid gentrification, good Metro access',
  'Silver Lake': 'Rent $3.00-5.50/sqft, trendy/artsy, strong local loyalty, competitive food scene, Sunset Blvd corridor',
  'Echo Park': 'Rent $3.00-5.50/sqft, artsy demographic, Sunset Blvd foot traffic, gentrifying rapidly, lake-adjacent events',
  'Santa Monica': 'Rent $4.00-8.00/sqft, tourist-heavy, affluent, strict permitting, 3rd Street Promenade anchor, Main St boutiques',
  'Venice': 'Rent $4.50-7.50/sqft, tourist + local mix, Abbot Kinney corridor, creative community, high brand value',
  'Hollywood': 'Rent $3.00-6.00/sqft, tourist-heavy, nightlife-oriented, Highland/Vine corridor, mixed income',
  'Koreatown': 'Rent $2.00-4.00/sqft, dense population, diverse demographics, strong food culture, affordable, Western Ave corridor',
  'Arts District': 'Rent $3.50-6.00/sqft, creative professionals, growing rapidly, warehouse conversions, 3rd St/Traction Ave',
  'Culver City': 'Rent $3.00-5.50/sqft, tech workers (Amazon, Apple), family-friendly, Washington Blvd dining, growing scene',
  'Pasadena': 'Rent $2.50-5.00/sqft, established community, Old Town foot traffic, Colorado Blvd, less transient',
  'Westwood': 'Rent $3.50-6.50/sqft, UCLA (45K students), Westwood Village foot traffic, competitive food/bev, strict vendor rules',
};

function getNeighborhoodContext(neighborhoods: string[]): string {
  return neighborhoods
    .map(n => {
      const data = NEIGHBORHOOD_DATA[n];
      return data ? `- ${n}: ${data}` : null;
    })
    .filter(Boolean)
    .join('\n');
}

export function buildQualityGatePrompt(formData: FormData): string {
  return `${SYSTEM_PREAMBLE}

You are evaluating this business idea for readiness. Score it honestly. If they gave you thin information, score low — don't compensate with assumptions.

BUSINESS IDEA:
- Name: ${formData.businessName}
- Industry: ${formData.industry}
- Stage: ${formData.businessStage}
- Model: ${formData.businessModel}
- Neighborhoods: ${formData.neighborhoods.join(', ')}
- Offerings: ${formData.offerings}
- Differentiation: ${formData.differentiation}
- Pricing: ${formData.pricing}
- Target Customers: ${formData.targetCustomers}
- Customer Persona: ${formData.customerPersona}
- Budget: ${formData.budget}
- Funding: ${formData.funding}
- Staffing: ${formData.staffingPlan}
- Space: ${formData.spaceNeeds}
- Timeline: ${formData.launchTimeline}
- Experience: ${formData.experienceLevel}

OUTPUT JSON SCHEMA:
{
  "readinessScore": <integer 1-10>,
  "readinessLabel": "<8 words max summarizing the score>",
  "topGaps": ["<gap 1, one sentence>", "<gap 2, one sentence>", "<gap 3, one sentence>"],
  "sectionConfidence": {
    "market": "<high|medium|low>",
    "financials": "<high|medium|low>",
    "operations": "<high|medium|low>",
    "goToMarket": "<high|medium|low>"
  }
}

Output ONLY the JSON object. No other text.`;
}

export function buildMarketScanPrompt(formData: FormData): string {
  return `${SYSTEM_PREAMBLE}

Analyze this LA business idea's market feasibility. Be specific to their LA neighborhood(s).

BUSINESS CONTEXT:
- Name: ${formData.businessName}
- Industry: ${formData.industry}
- Neighborhoods: ${formData.neighborhoods.join(', ')}
- Offerings: ${formData.offerings}
- Pricing: ${formData.pricing}
- Target Customers: ${formData.targetCustomers}
- Differentiation: ${formData.differentiation}
- Budget: ${formData.budget}

LA NEIGHBORHOOD DATA:
${getNeighborhoodContext(formData.neighborhoods)}

OUTPUT JSON SCHEMA:
{
  "verdict": "<One bold sentence: Go / Proceed with caution / Rethink. Plus the why.>",
  "feasibility": {
    "demand": <1-5>,
    "competition": <1-5, where 5 = low competition = good>,
    "opsComplexity": <1-5, where 5 = simple = good>,
    "capitalIntensity": <1-5, where 5 = low capital needed = good>,
    "regulatoryRisk": <1-5, where 5 = low risk = good>,
    "timelineRealism": <1-5, where 5 = very achievable = good>
  },
  "targetCustomer": "<One sentence: who they are, how many, what they spend>",
  "topCompetitors": [
    { "name": "<real business name in LA>", "threat": "<high|medium|low>", "weakness": "<one sentence>" },
    { "name": "<real business name>", "threat": "<high|medium|low>", "weakness": "<one sentence>" },
    { "name": "<real business name>", "threat": "<high|medium|low>", "weakness": "<one sentence>" }
  ],
  "locationRec": {
    "primary": "<Specific location — street or intersection level>",
    "secondary": "<Backup location>",
    "monthlyRent": "<Single dollar figure or range for their space type>",
    "whyHere": "<One sentence on why this location wins>"
  },
  "next3Actions": [
    "<Specific action with who to contact and by when>",
    "<Specific action>",
    "<Specific action>"
  ]
}

IMPORTANT: Name REAL competing businesses in LA, not generic categories. "Starbucks on Westwood Blvd" not "coffee chains." Actions must include a specific person/office to contact and a week-number deadline.

Output ONLY the JSON object. No other text.`;
}

export function buildBusinessPlanPrompt(
  formData: FormData,
  qualityGateOutput: object,
  marketScanOutput: object
): string {
  return `${SYSTEM_PREAMBLE}

Write a concise, actionable business plan for this LA business. The financial model must include structured numbers that stay aligned with readiness, risk, and execution reality.

FULL BUSINESS CONTEXT:
- Name: ${formData.businessName}
- Industry: ${formData.industry}
- Stage: ${formData.businessStage}
- Model: ${formData.businessModel}
- Neighborhoods: ${formData.neighborhoods.join(', ')}
- Offerings: ${formData.offerings}
- Differentiation: ${formData.differentiation}
- Pricing: ${formData.pricing}
- Target Customers: ${formData.targetCustomers}
- Customer Persona: ${formData.customerPersona}
- Budget: ${formData.budget}
- Funding: ${formData.funding}
- Staffing: ${formData.staffingPlan}
- Space: ${formData.spaceNeeds}
- Timeline: ${formData.launchTimeline}
- Experience: ${formData.experienceLevel}

LA REFERENCE DATA:
${getNeighborhoodContext(formData.neighborhoods)}

QUALITY GATE OUTPUT:
${JSON.stringify(qualityGateOutput, null, 2)}

MARKET SCAN OUTPUT:
${JSON.stringify(marketScanOutput, null, 2)}

LA FUNDING PROGRAMS:
- Kiva LA: 0% interest microloans up to $15K, no credit score minimum
- LISC LA: Small business loans $50K-$250K for underserved communities
- SBA Microloans: Up to $50K through intermediary lenders
- SBA 7(a) Loans: Up to $5M, requires good credit, 7-25 year terms
- Cal OSBA Grants: California small business grants, varies by cycle
- CDFIs: Pacific Asian Consortium, Vermont Slauson EDC

LA PERMITS (include only those relevant to this business type):
- Business Tax Registration Certificate (~$50-100)
- Seller's Permit (free from CDTFA)
- Health Permit ($500-1000+, LA County Dept of Public Health)
- Conditional Use Permit (alcohol/entertainment, ~$10K-15K, 6-12 months)
- Building/Fire permits (varies)
- Home Occupation Permit (~$100)
- Mobile Food Facility Permit (LA County Public Health)
- Push-Cart License (City of LA, ~$263-400/year)

OUTPUT JSON SCHEMA:
{
  "executiveSummary": "<2-3 sentences. What is it, why does it win in LA, what's the financial bet.>",
  "product": {
    "headline": "<e.g. '$12 base · $12.50 avg ticket · 83% margin'>",
    "bullets": ["<what you sell, max 8 words>", "<key variation/upsell, max 8 words>", "<sourcing/quality, max 8 words>"],
    "moat": "<1 sentence: your defensible advantage>"
  },
  "goToMarket": {
    "phases": [
      { "label": "Phase 1 (Mo 1-2)", "action": "<verb-first clause, max 10 words>" },
      { "label": "Phase 2 (Mo 3-4)", "action": "<verb-first clause, max 10 words>" },
      { "label": "Phase 3 (Mo 5-6)", "action": "<verb-first clause, max 10 words>" }
    ],
    "channels": ["<LA-specific channel 1>", "<channel 2>", "<channel 3>", "<channel 4>"],
    "retention": "<1 sentence on loyalty/repeat strategy>"
  },
  "operations": {
    "locationName": "<specific spot name>",
    "locationWhy": "<1 sentence: why this spot>",
    "bullets": ["<staffing plan, max 10 words>", "<hours/schedule, max 10 words>", "<supply chain, max 10 words>"]
  },
  "milestones": [
    { "period": "Days 0-30", "items": ["<concrete action>", "<concrete action>"] },
    { "period": "Days 31-90", "items": ["<concrete action>", "<concrete action>"] },
    { "period": "Days 91-180", "items": ["<concrete action>", "<concrete action>"] }
  ],
  "permits": [
    { "name": "<permit name>", "cost": <integer>, "timelineWeeks": <integer>, "action": "<short next step>" }
  ],
  "funding": [
    { "source": "<program name>", "amount": <integer>, "fit": "<12 words max on why it fits>" }
  ],
  "risks": [
    { "risk": "<15 words max>", "mitigation": "<15 words max>" },
    { "risk": "<15 words max>", "mitigation": "<15 words max>" },
    { "risk": "<15 words max>", "mitigation": "<15 words max>" }
  ],
  "financials": {
    "startupCosts": [
      { "item": "<expense category>", "cost": <integer dollar amount> }
    ],
    "unitEconomics": {
      "avgTicket": <number>,
      "cogs": <number, cost per unit sold>,
      "grossMarginPct": <integer 0-100>,
      "dailyTransactionsToBreakEven": <integer>
    },
    "scenarios": {
      "downside": {
        "monthlyProjections": [
          { "month": 1, "revenue": <integer>, "cogs": <integer>, "opex": <integer>, "netIncome": <integer> },
          { "month": 2, "revenue": <integer>, "cogs": <integer>, "opex": <integer>, "netIncome": <integer> },
          { "month": 3, "revenue": <integer>, "cogs": <integer>, "opex": <integer>, "netIncome": <integer> },
          { "month": 4, "revenue": <integer>, "cogs": <integer>, "opex": <integer>, "netIncome": <integer> },
          { "month": 5, "revenue": <integer>, "cogs": <integer>, "opex": <integer>, "netIncome": <integer> },
          { "month": 6, "revenue": <integer>, "cogs": <integer>, "opex": <integer>, "netIncome": <integer> },
          { "month": 7, "revenue": <integer>, "cogs": <integer>, "opex": <integer>, "netIncome": <integer> },
          { "month": 8, "revenue": <integer>, "cogs": <integer>, "opex": <integer>, "netIncome": <integer> },
          { "month": 9, "revenue": <integer>, "cogs": <integer>, "opex": <integer>, "netIncome": <integer> },
          { "month": 10, "revenue": <integer>, "cogs": <integer>, "opex": <integer>, "netIncome": <integer> },
          { "month": 11, "revenue": <integer>, "cogs": <integer>, "opex": <integer>, "netIncome": <integer> },
          { "month": 12, "revenue": <integer>, "cogs": <integer>, "opex": <integer>, "netIncome": <integer> }
        ],
        "breakEvenMonth": <integer 1-12 or 99 if no break-even in year 1>,
        "year1Revenue": <integer>,
        "year1NetIncome": <integer>
      },
      "base": {
        "monthlyProjections": [<same 12 objects as downside>],
        "breakEvenMonth": <integer 1-12 or 99>,
        "year1Revenue": <integer>,
        "year1NetIncome": <integer>
      },
      "upside": {
        "monthlyProjections": [<same 12 objects as downside>],
        "breakEvenMonth": <integer 1-12 or 99>,
        "year1Revenue": <integer>,
        "year1NetIncome": <integer>
      }
    },
    "recommendedScenario": "<downside|base|upside>",
    "assumptionPressure": ["<pressure point 1>", "<pressure point 2>", "<pressure point 3>"],
    "credibilityNote": "<One sentence in plain English. State what must go right for the model to hold.>",
    "totalStartupCost": <integer, sum of startupCosts>
  }
}

FINANCIAL MODEL RULES:
- Month 1 is usually $0 revenue (permitting/setup month) unless they're already operating.
- Revenue ramps over months 2-6 based on realistic customer acquisition for LA.
- COGS should reflect actual industry margins (food: 25-35%, retail: 40-60%, services: 10-20%).
- OpEx includes rent, utilities, insurance, marketing, payroll (if any), supplies.
- startupCosts items should sum to totalStartupCost. Be realistic for LA.
- dailyTransactionsToBreakEven = monthly OpEx / (avgTicket - cogs) / 20 working days.
- All numbers are integers except avgTicket and cogs which can have decimals.
- product.bullets must have exactly 3 items.
- goToMarket.phases must have exactly 3 items.
- operations.bullets must have exactly 3 items.
- risks must have exactly 3 items.
- Each product bullet must stay under 8 words.
- Each goToMarket action must stay under 10 words and contain one action only.
- operations bullets must map cleanly to staffing, hours, and supply chain in that order.
- Use the quality gate and market scan as constraints, not background color.
- downside must assume slower ramp, weaker conversion, and more operating friction than base.
- upside can only improve if the offer, location, and execution evidence justify it.
- If readinessScore is 5 or below, or financial confidence is low, or regulatoryRisk/opsComplexity/capitalIntensity is 2 or below, recommendedScenario cannot be "upside".
- If the overall concept is weak, the recommended scenario should usually be downside or base. Do not hide bad ideas; show cautious numbers and explain the assumptions.
- Positive scenarios are allowed for weak ideas, but only when clearly framed as assumption-heavy, not likely outcomes.
- assumptionPressure must be exactly 3 short strings written so a beginner can understand them.
- credibilityNote must directly explain why a positive case may still fail in plain English.
- The financial model is for teaching, not for false precision. If the idea is weak, it is better to state conservative assumptions clearly than to force perfect-looking numbers.

Output ONLY the JSON object. No other text.`;
}

export function buildPitchDeckPrompt(formData: FormData): string {
  return `${SYSTEM_PREAMBLE}

Create an 8-slide pitch deck for this LA business. Each bullet must be punchy and memorable — this is a pitch, not an essay. Every bullet should make an investor lean forward.

BUSINESS: ${formData.businessName}
INDUSTRY: ${formData.industry}
LOCATION: ${formData.neighborhoods.join(', ')}
OFFERING: ${formData.offerings}
PRICING: ${formData.pricing}
TARGET: ${formData.targetCustomers}
DIFFERENTIATION: ${formData.differentiation}
BUDGET: ${formData.budget}

OUTPUT JSON SCHEMA:
{
  "slides": [
    { "slideNumber": 1, "title": "The Vision", "bullets": ["<punchy sentence>", "<punchy sentence>", "<punchy sentence>"] },
    { "slideNumber": 2, "title": "The Problem", "bullets": ["...", "...", "..."] },
    { "slideNumber": 3, "title": "The Solution", "bullets": ["...", "...", "..."] },
    { "slideNumber": 4, "title": "The Customer", "bullets": ["...", "...", "..."] },
    { "slideNumber": 5, "title": "The Market", "bullets": ["...", "...", "..."] },
    { "slideNumber": 6, "title": "The Competition", "bullets": ["...", "...", "..."] },
    { "slideNumber": 7, "title": "The Numbers", "bullets": ["...", "...", "..."] },
    { "slideNumber": 8, "title": "The Ask", "bullets": ["...", "...", "..."] }
  ]
}

RULES:
- Exactly 3 bullets per slide, no more, no less.
- Each bullet is max 15 words. Shorter is better.
- Slide 7 ("The Numbers") must include specific dollar amounts (revenue, margin, break-even).
- Slide 8 ("The Ask") must state what the founder needs and the 90-day milestone.
- Use LA-specific references where possible.
- No speaker notes. No descriptions. Just the slide content.

Output ONLY the JSON object. No other text.`;
}
