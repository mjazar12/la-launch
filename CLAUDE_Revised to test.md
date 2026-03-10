# LA Launch — Local Business Plan Generator
### Revised Spec (Enhanced Multi-Stage Pipeline)

---

## What This Is
A lightweight Next.js app for a UCLA Anderson class final project. A novice entrepreneur answers ~16 questions across a guided questionnaire. The app then runs a **5-stage AI pipeline** — Input Quality Gate → LA Market Scan → Business Plan → Financial Model → Pitch Deck — using sequential Claude API calls, and renders a polished, multi-section report on-screen. That's it.

---

## Architecture — 4 Files, No More
```
app/
  page.tsx                    # Everything: landing → questionnaire → pipeline → report
  api/
    generate/route.ts         # Stage orchestrator: runs all 5 Claude calls sequentially, streams progress
  lib/
    prompt.ts                 # All 5 prompt-builder functions + LA data (hardcoded)
```

No database. No auth. No separate data files. All LA research (neighborhood rents, funding programs, permits, demographics) is hardcoded directly in `lib/prompt.ts`.

> **Note to implementer:** The original had a single API call. This version makes **5 sequential Claude calls** within a single POST request to `/api/generate`. The route streams back a `text/event-stream` (SSE) so the UI can show each stage completing in real time. Increase `max_tokens` to **8192** per call. Use `claude-sonnet-4-5-20250929` for all calls.

---

## Tech Stack
- **Next.js 14** (App Router)
- **Tailwind CSS** (all inline)
- **Claude API** (`claude-sonnet-4-5-20250929`) — 5 sequential calls, structured JSON per call
- **Framer Motion** (`motion`) for animations
- No other dependencies unless absolutely necessary

---

## Design Direction — "Noir Deco LA" (unchanged)
The GUI is the wow factor. Dark, cinematic, art-deco-meets-modern-LA. Keep everything from the original spec:

- **Dark theme only.** Background: `#0A0A0A`. Cards: `#141414` with warm borders.
- **Typography:** `Playfair Display` (headings) + `DM Sans` (body) from Google Fonts.
- **Gold accent:** `#D4A853` — used sparingly for highlights, progress, dividers, key metrics.
- **Animations:** Smooth state transitions. Staggered fade-up reveals for report sections.
- **Layout:** Full viewport height, centered, max-width ~800px, no sidebars or navbars.
- **Cards:** Subtle glassmorphism (backdrop-blur + low-opacity warm borders).
- **Key metrics** (costs, rents, timelines) → large gold stat callout blocks.

---

## The Four States of `page.tsx`

### State 1 — Landing (unchanged)
Dramatic hero, app name "LA Launch", tagline ("Your AI-powered LA business plan in 60 seconds"), single gold CTA button. Subtle animated gradient background.

### State 2 — Questionnaire (expanded)
One question at a time, full screen, large text. Gold progress bar at top. Smooth slide transitions. Selectable cards for multi-choice. Text inputs for free-form. **Now 16 questions** — see Questionnaire Fields below.

### State 3 — Pipeline Progress (new — replaces single loader)
Replace the single "Analyzing LA market data…" loader with a **5-stage pipeline progress view**:

- A vertical stepper (gold connecting line) showing the 5 stages:
  1. 🔍 Input Quality Gate
  2. 📊 LA Market Scan & Feasibility
  3. 📋 Business Plan
  4. 💰 Financial Model
  5. 🎯 Pitch Deck
- As each stage completes, its step animates to a gold checkmark with a subtle success pulse.
- The currently-running stage shows an animated gold spinner + a contextual message (e.g., "Scanning LA neighborhoods…", "Modeling 24-month runway…").
- Below the stepper, show a single rotating tagline: cycle through 6–8 LA-flavored messages (e.g., "Cross-referencing Koreatown rent data…", "Evaluating SBA loan fit…", "Building your pitch narrative…").

### State 4 — Report (expanded)
Sections fade in one by one. Each of the 5 pipeline outputs gets its own clearly delineated report section with a gold section header and icon. Key financial figures are hero-sized stat blocks. A sticky mini table-of-contents (left side, desktop only) lets users jump between sections. Include:
- Download Report (`.html`)
- Export to PPTX
- Start Over button at the bottom

---

## Questionnaire Fields (expanded from 8 → 16)
Collect these one per screen. Fields marked **(existing)** were in the original — keep them. Fields marked **(new)** are additions.

1. **(existing) Business name** — text input
2. **(existing) Industry** — selectable cards: Restaurant/Food, Retail, Professional Services, Health & Wellness, Creative/Media, Tech/Software, Other (text input)
3. **(new) Business stage** — cards: Just an idea, Validating / testing, Ready to launch, Already operating
4. **(existing) Business model** — cards: Physical storefront, Online only, Hybrid (both), Mobile/Pop-up
5. **(existing) Preferred neighborhood(s)** — multi-select cards: Downtown LA, Silver Lake/Echo Park, Santa Monica, Venice, Hollywood, Koreatown, Arts District, Culver City, Pasadena, Not sure yet
6. **(new) Your top 3 offerings** — free text (prompt: "List your main products or services, e.g. espresso drinks, pastries, catering")
7. **(new) Your differentiation** — free text (prompt: "What makes you different from existing options? Why will customers choose you?")
8. **(new) Pricing** — free text (prompt: "Give example price points, e.g. '$12 lunch bowls, $8 coffee, $45/hr consulting'")
9. **(existing) Target customers** — cards: Local residents, Tourists/visitors, Other businesses (B2B), Online/national audience
10. **(new) Customer persona detail** — free text (prompt: "Describe your ideal customer: age, income level, lifestyle, and what problem you solve for them")
11. **(existing) Startup budget** — cards: Under $25K, $25K–$75K, $75K–$150K, $150K–$500K, $500K+
12. **(existing) Funding situation** — cards: Self-funded, Seeking loans, Seeking investors, Need to explore options
13. **(new) Staffing plan** — cards: Just me (owner-operator), Hire 1–3 people, Hire 4+, Use contractors/freelancers
14. **(new) Space needs** — cards: No physical space, Small (under 500 sqft), Medium (500–2,000 sqft), Large (2,000+ sqft)
15. **(new) Launch timeline** — cards: Within 30 days, 1–3 months, 3–6 months, 6–12 months
16. **(existing) Experience level** — cards: First-time founder, Some business experience, Serial entrepreneur

---

## API Route (`/api/generate/route.ts`) — Revised

### Overview
Accepts `POST` with the 16-field form data as JSON. Runs **5 sequential Claude calls**, streaming progress back to the client via **Server-Sent Events (SSE)**. Each Claude call returns a structured JSON object for its stage. After all 5 calls complete, emits a final `data: [DONE]` event with the full combined result.

### SSE Event Format
```
data: {"stage": 1, "stageName": "Input Quality Gate", "status": "running"}
data: {"stage": 1, "stageName": "Input Quality Gate", "status": "complete", "result": { ...stageOneJSON }}
data: {"stage": 2, "stageName": "LA Market Scan", "status": "running"}
...
data: {"stage": 5, "stageName": "Pitch Deck", "status": "complete", "result": { ...stageFiveJSON }}
data: {"type": "final", "report": { ...allStagesJSON }}
data: [DONE]
```

### Error Handling
- If any stage fails, emit `{"stage": N, "status": "error", "message": "..."}` and abort.
- Return HTTP 200 for the stream; encode errors within the stream itself.
- Wrap each Claude call in try/catch.

### All Claude Calls
- Model: `claude-sonnet-4-5-20250929`
- `max_tokens: 8192`
- Response: **ONLY valid JSON**, no markdown fences, no preamble (enforce in prompt)
- Each call receives: (a) the system prompt for that stage from `lib/prompt.ts`, and (b) a user message containing the form data + any prior stage outputs needed

---

## Response JSON Schema — Full Combined Report

The `report` object in the final SSE event must have exactly this shape:

```json
{
  "businessName": "string",

  "qualityGate": {
    "readinessScore": "string (e.g. '7/10 — Strong foundation, a few gaps')",
    "missingInputs": {
      "offer": ["string"],
      "customer": ["string"],
      "location": ["string"],
      "ops": ["string"],
      "financials": ["string"],
      "risk": ["string"]
    },
    "topSevenQuestions": ["string", "string", "string", "string", "string", "string", "string"],
    "unreliableSectionsWarning": "string — which report sections will be least reliable given missing info"
  },

  "marketScan": {
    "executiveSummary": ["string x5 — bullet form: go/no-go, risks, upside"],
    "customerAndDemand": {
      "personas": "string",
      "demandDrivers": "string",
      "seasonality": "string",
      "willingnessToPay": "string"
    },
    "competitiveLandscape": {
      "directCompetitors": "string",
      "substitutes": "string",
      "whitespaceOpportunities": "string"
    },
    "locationAnalysis": {
      "recommendedAreas": "string — 3 to 5 LA neighborhoods with rationale",
      "estimatedMonthlyRent": "string (dollar range)",
      "footTrafficNotes": "string",
      "proximityAdvantage": "string"
    },
    "costsAndUnitEconomics": {
      "majorCostBuckets": "string",
      "breakevenEquation": "string",
      "assumptions": "string"
    },
    "regulatoryAndPermits": {
      "applicable": "string",
      "toVerifyNext": "string"
    },
    "feasibilityScorecard": {
      "demand": "number 1–5",
      "competition": "number 1–5",
      "opsComplexity": "number 1–5",
      "capitalIntensity": "number 1–5",
      "regulatoryRisk": "number 1–5",
      "timelineRealism": "number 1–5",
      "scorecardNotes": "string"
    },
    "next2WeeksActions": ["string x10"]
  },

  "businessPlan": {
    "executiveSummary": "string — EXACTLY 3 paragraphs separated by \\n\\n. Para 1: vision and opportunity. Para 2: strategy and differentiation. Para 3: risks and path forward.",
    "companyAndMission": "string",
    "productService": {
      "offerings": "string",
      "pricingLogic": "string",
      "differentiation": "string"
    },
    "marketAnalysis": "string",
    "goToMarket": {
      "channels": "string",
      "launchPlan": "string",
      "retention": "string"
    },
    "operationsPlan": {
      "location": "string",
      "staffing": "string",
      "vendors": "string",
      "workflow": "string"
    },
    "regulatoryPlan": "string",
    "milestones": {
      "days0to30": "string",
      "days31to90": "string",
      "days91to180": "string"
    },
    "risksAndMitigations": [
      { "risk": "string", "trigger": "string", "response": "string" }
    ],
    "financialSummary": "string",
    "assumptions": "string"
  },

  "financialModel": {
    "modelOverview": ["string x5 — bullet form"],
    "inputsTable": [
      { "variable": "string", "definition": "string", "example": "string", "howToEstimate": "string" }
    ],
    "monthlyPnL": [
      {
        "month": "number 1–24",
        "revenue": "string",
        "cogs": "string",
        "grossProfit": "string",
        "opex": "string",
        "ebitda": "string"
      }
    ],
    "cashRunway": [
      {
        "month": "number 1–24",
        "startingCash": "string",
        "monthlyNetBurn": "string",
        "endingCash": "string",
        "runwayMonthsRemaining": "string"
      }
    ],
    "breakevenAnalysis": {
      "formula": "string",
      "drivers": "string",
      "estimatedBreakevenMonth": "string"
    },
    "scenarios": {
      "base": "string — what assumptions define base case",
      "conservative": "string — what changes in conservative",
      "aggressive": "string — what changes in aggressive"
    },
    "founderInstructions": "string — step-by-step how to use this model, sanity checks, what to do if runway < goal",
    "dataPointsToCollect": ["string x8"]
  },

  "pitchDeck": {
    "slides": [
      {
        "slideNumber": "number 1–12",
        "title": "string",
        "bullets": ["string", "string", "string"],
        "speakerNotes": "string — 2 to 3 sentences"
      }
    ]
  },

  "fundingOptions": [
    { "name": "string", "description": "string", "amount": "string", "fit": "string" }
  ],

  "permits": [
    { "name": "string", "description": "string", "estimatedCost": "string", "timeline": "string" }
  ],

  "nextSteps": ["string x5"],
  "riskFactors": ["string x3"]
}
```

> **Rendering note for `financialModel.monthlyPnL` and `cashRunway`:** Render these as scrollable tables in the report, not as individual stat blocks. Highlight month 1, month 12, and month 24 rows in gold. The `breakevenAnalysis.estimatedBreakevenMonth` should also render as a large gold stat callout.

---

## System Prompt (`lib/prompt.ts`) — Revised

Export **five separate prompt-builder functions**, one per pipeline stage. Each function takes the form data object and (for later stages) the prior stage output(s), and returns the full prompt string.

### Shared LA Data (declare once, reference in all five functions)

#### Neighborhood Data
| Neighborhood | Rent/sqft | Character | Foot Traffic | Key Notes |
|---|---|---|---|---|
| Downtown LA | $2.50–5.00 | Young professionals, rapid gentrification | High | Good transit access |
| Silver Lake/Echo Park | $3.00–5.50 | Trendy/artsy, strong local loyalty | Moderate–High | Competitive food scene |
| Santa Monica | $4.00–8.00 | Affluent, tourist-heavy | Very High | Strict permitting, high visibility |
| Venice | $4.50–7.50 | Creative, tourist + local mix | High | Expensive but strong brand value |
| Hollywood | $3.00–6.00 | Tourist-heavy, nightlife, mixed income | High | High visibility |
| Koreatown | $2.00–4.00 | Dense, diverse, strong food culture | High | Most affordable option |
| Arts District | $3.50–6.00 | Creative professionals, rapidly growing | Moderate | Warehouse-to-retail conversions |
| Culver City | $3.00–5.50 | Tech workers (Amazon/Apple nearby), family | Moderate | Growing restaurant scene |
| Pasadena | $2.50–5.00 | Established community, Old Town foot traffic | Moderate | Less transient than Westside |

#### Funding Programs
- **Kiva LA:** 0% interest microloans up to $15K, no credit score minimum
- **LISC LA:** Small business loans $50K–$250K for underserved communities
- **LA County CDBG:** Grants for businesses in low-to-moderate income areas
- **SBA 7(a) Loans:** Up to $5M, requires good credit, 7–25 year terms
- **SBA Microloans:** Up to $50K through intermediary lenders
- **Cal OSBA Grants:** California small business grants, varies by program cycle
- **Local CDFIs:** Pacific Asian Consortium, Vermont Slauson EDC

#### Permit Info
- Business Tax Registration Certificate — all businesses, ~$50–100
- Seller's Permit — retail/food, free from CDTFA
- Health Permit — food businesses, $500–1,000+, LA County Dept of Public Health
- Conditional Use Permit — alcohol/entertainment, ~$10K–15K, 6–12 months
- Building/Fire Permits — physical locations, cost varies
- Sign Permits — City of LA Dept of Building and Safety
- Home Occupation Permit — home-based businesses, ~$100

---

### Stage 1: `buildQualityGatePrompt(formData)`

**System prompt:**
```
You are the Input Quality Gatekeeper for an LA small-business plan generator.
Your job is to review what the user has told you about their business and identify gaps
that would reduce the quality of a market scan, business plan, 24-month financial model,
or pitch deck.

Return ONLY a valid JSON object matching this exact schema — no markdown, no preamble:
{
  "readinessScore": "X/10 — [one sentence summary]",
  "missingInputs": {
    "offer": [...],
    "customer": [...],
    "location": [...],
    "ops": [...],
    "financials": [...],
    "risk": [...]
  },
  "topSevenQuestions": ["Q1", "Q2", "Q3", "Q4", "Q5", "Q6", "Q7"],
  "unreliableSectionsWarning": "..."
}

Rules:
- Rank the 7 questions by impact (highest impact first).
- Do not ask more than 7 questions.
- Be concise — this is a gap check, not a report.
- Do not invent facts about the business.
- Label which report sections will be most unreliable given the gaps.
```

**User message:** Serialize the full form data as JSON.

---

### Stage 2: `buildMarketScanPrompt(formData, qualityGateOutput)`

**System prompt:**
```
You are the LA Market Scan & Feasibility Analyst for a first-time founder.
Use the user's business inputs to generate a market scan for launching this business
in Los Angeles. Deliver a decision-ready report that is explicitly LA-grounded.

You have access to the following LA data: [INSERT hardcoded neighborhood, funding, and permit data here]

Return ONLY a valid JSON object matching the marketScan schema — no markdown, no preamble.

Output sections:
1. executiveSummary — 5 bullets: go/no-go, biggest risks, biggest upside
2. customerAndDemand — personas, demand drivers in LA, seasonality, willingness to pay (directional)
3. competitiveLandscape — direct competitors, substitutes, whitespace opportunities
4. locationAnalysis — 3–5 LA areas with rationale (foot traffic, demographics, rent, access)
5. costsAndUnitEconomics — major cost buckets, breakeven equation, assumptions
6. regulatoryAndPermits — what applies in LA + what to verify next
7. feasibilityScorecard — rate 1–5 on: demand, competition, opsComplexity, capitalIntensity, regulatoryRisk, timelineRealism
8. next2WeeksActions — exactly 10 concrete validation steps

Rules:
- Label all assumptions explicitly.
- Avoid made-up statistics. Use directional reasoning and name sources to verify.
- Be specific about neighborhoods, rent ranges, and LA-specific programs.
- If critical info is missing, note it but still complete the section using stated assumptions.
```

**User message:** Form data JSON + `"Input Quality Gate output: " + JSON.stringify(qualityGateOutput)`

---

### Stage 3: `buildBusinessPlanPrompt(formData, marketScanOutput)`

**System prompt:**
```
You are the LA Small Business Plan Builder.
Using the user inputs and the LA Market Scan output, write a complete business plan
suitable for a lender, partner, or early investor.

Return ONLY a valid JSON object matching the businessPlan schema — no markdown, no preamble.

Include in order:
1. executiveSummary — EXACTLY 3 paragraphs (\\n\\n separated). Para 1: vision/opportunity. Para 2: strategy/differentiation. Para 3: risks/path forward. Do NOT start Para 1 with "However."
2. companyAndMission — why this business, why now, why LA
3. productService — offerings, pricing logic, differentiation
4. marketAnalysis — key LA insights, competition, positioning
5. goToMarket — channels, launch plan, customer retention
6. operationsPlan — location, staffing, vendors, workflow
7. regulatoryPlan — applicable permits + mitigation approach
8. milestones — 0–30 days, 31–90 days, 91–180 days
9. risksAndMitigations — exactly 8 risks, each with trigger + response
10. financialSummary — key drivers, what matters most for this business
11. assumptions — open questions and stated assumptions

Rules:
- Tie all recommendations to the user's stated startup capital, runway, income goal, and time commitment.
- Be practical and specific to LA. Avoid generic startup advice.
- No fluff. Every sentence should be actionable or informative.
```

**User message:** Form data JSON + `"LA Market Scan output: " + JSON.stringify(marketScanOutput)`

---

### Stage 4: `buildFinancialModelPrompt(formData, marketScanOutput, businessPlanOutput)`

**System prompt:**
```
You are the Financial Model Agent for a new LA small business.
Based on the user inputs, LA Market Scan, and Business Plan, produce a
spreadsheet-ready financial model the founder can paste into Excel or Google Sheets.

Return ONLY a valid JSON object matching the financialModel schema — no markdown, no preamble.

Output:
A) modelOverview — 5 bullets summarizing the model's key assumptions and structure
B) inputsTable — the key variables a founder must fill in (variable, definition, example, howToEstimate)
C) monthlyPnL — 24 months of: revenue, COGS, grossProfit, opex, EBITDA (use realistic ramp-up, not flat numbers)
D) cashRunway — 24 months of: startingCash, monthlyNetBurn, endingCash, runwayMonthsRemaining
E) breakevenAnalysis — formula in plain English, key drivers, estimated month of breakeven
F) scenarios — define Base, Conservative, and Aggressive cases (what assumptions change)
G) founderInstructions — step-by-step: how to fill in the model, 3 sanity checks, what to do if runway < goal
H) dataPointsToCollect — exactly 8 real-world data points to gather before finalizing the model

Rules:
- Do NOT assume exact LA rent or labor costs unless the user provided them. Create input placeholders instead.
- Express all formulas in plain English (e.g. "Monthly Revenue = Avg Ticket × Daily Customers × 30").
- Use the user's stated startup budget as the starting cash balance.
- Model a realistic ramp: assume month 1–3 are below breakeven for most business types.
- Flag if the user's stated runway tolerance is at risk given conservative assumptions.
```

**User message:** Form data JSON + prior stage outputs as JSON

---

### Stage 5: `buildPitchDeckPrompt(formData, marketScanOutput, businessPlanOutput, financialModelOutput)`

**System prompt:**
```
You are the Pitch Deck Agent for an LA small business.
Create a 10–12 slide pitch deck outline using all prior research and plan outputs.
For each slide: a title, 3–6 bullet points, and 2–3 sentences of speaker notes.

Return ONLY a valid JSON object matching the pitchDeck schema — no markdown, no preamble.

Required slides (in order):
1. Vision / One-liner
2. Problem (LA-specific — why this problem exists in this market)
3. Solution
4. Customer (persona, size of opportunity directionally)
5. Market snapshot (LA-grounded, directional — label all estimates as estimates)
6. Competition & differentiation
7. Business model + unit economics drivers
8. Go-to-market (first 90 days)
9. Operations plan
10. Financial highlights (capital needs, runway, breakeven logic)
11. The Ask (funding amount, what it's used for, or partners/hires needed)
12. Risks & mitigations

Rules:
- Do not invent facts. Pull only from the market scan, business plan, and financial model outputs.
- Label all estimates and projections explicitly as estimates.
- Speaker notes should help a first-time founder know what to say out loud, not just repeat the bullets.
- Keep bullets crisp — max 12 words per bullet.
```

**User message:** Form data JSON + all three prior stage outputs as JSON

---

## Report Rendering — State 4

Render the five pipeline outputs as five distinct sections in the report. Use the following section order and gold-header labels:

### Section 1 — Input Quality Gate
- Show `readinessScore` as a large gold stat callout (e.g., "7 / 10")
- Show `unreliableSectionsWarning` in an amber-bordered callout box
- Render `topSevenQuestions` as a numbered list (styled as an action checklist the user can screenshot)
- If `missingInputs` has any non-empty arrays, render a collapsible "Gaps Identified" section

### Section 2 — LA Market Scan & Feasibility
- Render `feasibilityScorecard` as a **visual scorecard**: 6 metrics, each with a 1–5 bar (gold fill) and label
- Render `executiveSummary` bullets as styled callout cards (one per bullet)
- Render `next2WeeksActions` as a numbered checklist
- Render `locationAnalysis.estimatedMonthlyRent` as a gold stat callout
- All other sub-sections render as labeled cards

### Section 3 — Business Plan
- `executiveSummary` renders as 3 distinct paragraphs in a styled blockquote
- `milestones` renders as a horizontal timeline (3 phases)
- `risksAndMitigations` renders as a table: Risk | Trigger | Response
- All other sub-sections render as labeled cards

### Section 4 — Financial Model
- `monthlyPnL` and `cashRunway` render as **scrollable tables** — highlight months 1, 12, 24 in gold
- `breakevenAnalysis.estimatedBreakevenMonth` renders as a large gold stat callout
- `scenarios` renders as a 3-column comparison card (Base / Conservative / Aggressive)
- `founderInstructions` renders in an amber-bordered callout box with a distinct "How to use this model" header
- `inputsTable` renders as a table: Variable | Definition | Example | How to Estimate

### Section 5 — Pitch Deck
- Each slide renders as a card with: slide number (gold), title (Playfair Display), bullet list, and collapsible speaker notes
- Cards render in a 2-column grid on desktop, 1-column on mobile

### Shared Sections (appended after Section 5)
- `fundingOptions` → styled funding cards (same as original)
- `permits` → styled permit cards (same as original)
- `nextSteps` → numbered list
- `riskFactors` → amber warning cards

---

## Export Features

### Download Report (`.html`)
Same as original — browser downloads a self-contained HTML file with all five sections. No print dialog.

### Export to PPTX
Same as original — generates a PPTX file. Now also pulls from `pitchDeck.slides` to **pre-populate slide content** (title + bullets) rather than using generic placeholders.

### Start Over
Resets to landing page state. Clears all form data and all pipeline outputs from component state.

---

## Code Style (unchanged)
- TypeScript strict mode
- All Tailwind, no separate CSS files
- Single-file components — no premature abstractions
- `"use client"` on `page.tsx`
- Comments only where logic is non-obvious
- Framer Motion for all animations

## What NOT to Build (unchanged)
- No auth / login
- No database
- No saving/sharing reports
- No multi-page routing
- No admin panel
- No testing

---

## Testing Checklist (updated)
After every major change:

1. `npm run dev` — confirm no build errors
2. Walk the full flow: Landing → complete all 16 questions → submit → watch pipeline progress → report loads
3. Verify SSE stream: add `console.log` in the API route after each stage completes; confirm each stage returns valid JSON
4. Check all 5 report sections render with real content (no `undefined`, no truncated text)
5. Confirm Executive Summary in Business Plan shows **3 paragraphs** — Para 1 must not start with "However"
6. Confirm `financialModel.monthlyPnL` table has exactly 24 rows
7. Confirm `pitchDeck.slides` has 10–12 entries and each has title + bullets + speakerNotes
8. Confirm `feasibilityScorecard` renders as a visual bar chart (not raw numbers)
9. Test "Other" write-in on at least one question — confirm it appears in the generated report
10. Test Download Report — browser downloads `.html` immediately (no print dialog)
11. Test Export to PPTX — file downloads with pitch deck content pre-populated
12. Test Start Over — resets cleanly to landing page
13. Check browser console for errors or warnings

## When to Restart
- After modifying `.env.local`
- After changing the API route and seeing stale content
- After unexplained hydration errors
- Nuclear option: `rm -rf .next && npm run dev`
