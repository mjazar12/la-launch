# LA Launch — Local Business Plan Generator

## What This Is
A lightweight Next.js app for a UCLA Anderson class final project. A novice entrepreneur goes through a conversational AI intake, we call the Claude API through a 4-stage streaming pipeline with hardcoded LA-specific data baked into the prompts, and render a polished business plan report on-screen. That's it.

## Architecture — 5 Key Files
```
app/
  page.tsx                    # UI: landing → intake (conversational) → questionnaire → report
  api/
    generate/route.ts         # 4-stage SSE pipeline (Quality Gate, Market Scan, Business Plan, Pitch Deck)
    intake/route.ts           # Conversational intake — single call, returns message + optional FormData
  lib/
    prompt.ts                 # FormData interface + 4 prompt builders + LA data
    intakePrompt.ts           # INTAKE_SYSTEM_PROMPT + buildIntakeMessages()
```

No database. No auth. No separate data files. The LA research (neighborhood rents, funding programs, permits, demographics) is hardcoded directly into the prompt builders in `lib/prompt.ts`.

## Tech Stack
- **Next.js 14** (App Router)
- **Tailwind CSS** (styling, all inline)
- **Claude API** (`claude-haiku-4-5-20251001`) — 4-stage SSE streaming pipeline for report generation; single call for intake
- **Framer Motion** (`motion`) for animations
- No other dependencies unless absolutely necessary

## Design Direction — "Noir Deco LA"
The GUI is the wow factor. The aesthetic is **dark, cinematic, art-deco-meets-modern-LA** — think black/charcoal backgrounds, warm gold (#D4A853) and soft amber accents, dramatic typography, and smooth reveal animations. It should feel like opening a premium consulting report, not a generic SaaS form.

### Specific Design Rules
- **Dark theme only.** Background: near-black (#0A0A0A). Cards/sections: charcoal (#141414) with subtle warm borders.
- **Typography:** Use `Playfair Display` (serif, for headings — elegant, editorial) paired with `DM Sans` (body — clean, modern). Import from Google Fonts.
- **Gold accent color:** #D4A853 for highlights, progress indicators, section dividers, key metrics. Use sparingly — it should feel luxurious, not gaudy.
- **Animations:** Every state transition (landing → intake → questionnaire → generating → report) should animate smoothly. Use staggered fade-up reveals for report sections. The generating state should have a cinematic loading sequence (pulsing gold ring or animated city skyline silhouette).
- **Layout:** Full viewport height. Centered content, generous whitespace. Max-width ~800px for readability. No sidebars, no navbars — immersive single-page flow.
- **Cards:** Subtle glassmorphism (backdrop-blur + low-opacity warm borders). Soft box-shadows.
- **Key metrics in the report** (e.g., estimated startup cost, monthly rent range) should render as large, highlighted stat callouts — gold text, oversized numbers.

### The App States of `page.tsx`

**State 1 — Landing**
A dramatic hero with the app name "LA Launch", a one-line tagline ("Your AI-powered LA business plan in 60 seconds"), and a single gold CTA button. Subtle animated gradient or grain texture in the background. Keep it cinematic and minimal.

**State 2 — Intake (Conversational)**
Claude conducts a 5–8 turn conversational exchange to collect all 16 FormData fields. Chat-style UI. When complete, transitions to the generating state automatically.

**State 3 — Generating**
A centered animated loader showing exactly 4 stage progress indicators cycling through contextual messages: Quality Gate → Market Scan → Business Plan → Pitch Deck.

**State 4 — Report**
Sections fade in one by one with staggered delays. Each section is a card. Key financial figures are hero-sized stat blocks. Include a subtle "Powered by Claude + LA Launch" footer. Add a "Start Over" button at the bottom.

## FormData Interface (16 Fields)

```typescript
interface FormData {
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
```

## Intake Route (`/api/intake/route.ts`)

- Accepts `POST { messages }` array (conversation history)
- Claude conducts a 5–8 turn conversational exchange to collect all 16 FormData fields
- Model: `claude-haiku-4-5-20251001`, max_tokens: 512
- When all fields are collected, appends `EXTRACTED_FORM_DATA:{...}` as the last line of the response
- Backend parses the marker to extract FormData and returns `{ message: string, formData: object | null }`
- Frontend receives `formData` and automatically calls `/api/generate` to start the pipeline

## Generate Route (`/api/generate/route.ts`)

- Accepts `POST` with the full `FormData` as JSON body
- Returns a **Server-Sent Events (SSE)** stream
- Executes a **4-stage pipeline**, emitting progress events between stages:
  1. **Quality Gate** — assesses business idea readiness
  2. **Market Scan** — parallel market research (runs after Quality Gate)
  3. **Business Plan** — full narrative plan
  4. **Pitch Deck** — 8-slide deck
- Each stage calls `claude-haiku-4-5-20251001` with its respective prompt builder
- Streams stage results as JSON events to the frontend
- Handle errors gracefully (emit error event, close stream)

## Prompt Builders (`lib/prompt.ts`)

Four exported functions, each taking `FormData` and returning a prompt string:

- `buildQualityGatePrompt(formData)`
- `buildMarketScanPrompt(formData)`
- `buildBusinessPlanPrompt(formData)`
- `buildPitchDeckPrompt(formData)`

The LA data (neighborhood rents, funding programs, permit info) is hardcoded directly in these builders.

### LA Neighborhood Data (baked into prompts)
- **Downtown LA:** Commercial rent $2.50-5.00/sqft, high foot traffic, young professionals, rapid gentrification, good transit access
- **Silver Lake/Echo Park:** Rent $3.00-5.50/sqft, trendy/artsy demographic, strong local loyalty, competitive food scene
- **Santa Monica:** Rent $4.00-8.00/sqft, tourist-heavy, affluent, strict permitting, high visibility
- **Venice:** Rent $4.50-7.50/sqft, tourist + local mix, creative community, expensive but high brand value
- **Hollywood:** Rent $3.00-6.00/sqft, tourist-heavy, nightlife-oriented, mixed income, high visibility
- **Koreatown:** Rent $2.00-4.00/sqft, dense population, diverse demographics, strong food culture, affordable
- **Arts District:** Rent $3.50-6.00/sqft, creative professionals, growing rapidly, warehouse-to-retail conversions
- **Culver City:** Rent $3.00-5.50/sqft, tech workers (Amazon, Apple nearby), family-friendly, growing restaurant scene
- **Pasadena:** Rent $2.50-5.00/sqft, established community, Old Town foot traffic, less transient than Westside

### LA Funding Programs (baked into prompts)
- **Kiva LA:** 0% interest microloans up to $15K, no credit score minimum
- **LISC LA:** Small business loans $50K-$250K for underserved communities
- **LA County CDBG:** Grants for businesses in low-to-moderate income areas
- **SBA 7(a) Loans:** Up to $5M, requires good credit, 7-25 year terms
- **SBA Microloans:** Up to $50K through intermediary lenders
- **Cal OSBA Grants:** California small business grants, varies by program cycle
- **Local CDFI lenders:** Pacific Asian Consortium, Vermont Slauson EDC, etc.

### LA Permit Info (baked into prompts)
- Business Tax Registration Certificate (all businesses, ~$50-100)
- Seller's Permit (retail/food, free from CDTFA)
- Health Permit (food businesses, $500-1000+, LA County Dept of Public Health)
- Conditional Use Permit (alcohol, entertainment, ~$10K-15K, 6-12 months)
- Building/Fire permits (physical locations, varies)
- Sign permits (City of LA Dept of Building and Safety)
- Home Occupation Permit (home-based businesses, ~$100)

## Response JSON Schemas

### Stage 1 — Quality Gate
```json
{
  "readinessScore": "X/10 — [summary]",
  "topGaps": ["gap1", "gap2", "gap3", "gap4", "gap5"],
  "unreliableSectionsWarning": "string"
}
```

### Stage 2 — Market Scan
```json
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
    "recommendedAreas": "string",
    "estimatedMonthlyRent": "string",
    "footTrafficNotes": "string",
    "proximityAdvantage": "string"
  },
  "feasibilityScorecard": {
    "demand": "1-5",
    "competition": "1-5",
    "opsComplexity": "1-5",
    "capitalIntensity": "1-5",
    "regulatoryRisk": "1-5",
    "timelineRealism": "1-5",
    "scorecardNotes": "string"
  },
  "next5Actions": ["action1", "action2", "action3", "action4", "action5"]
}
```

### Stage 3 — Business Plan
```json
{
  "executiveSummary": "EXACTLY 3 paragraphs separated by \\n\\n. Paragraph 1: vision/opportunity. Paragraph 2: strategy/differentiation. Paragraph 3: risks/path forward.",
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
```

### Stage 4 — Pitch Deck (8 slides)
```json
{
  "slides": [
    {
      "slideNumber": "1-8",
      "title": "string",
      "bullets": ["string", "string", "string"],
      "speakerNotes": "string"
    }
  ]
}
```

Slide order: Vision, Problem, Solution, Customer, Market, Competition, Business Model, Go-to-Market.

## Intake Prompt (`lib/intakePrompt.ts`)

Exports:
- `INTAKE_SYSTEM_PROMPT` — system prompt for the conversational intake agent
- `buildIntakeMessages(messages)` — formats the conversation history for the Claude API call

## Code Style
- TypeScript strict mode
- All Tailwind, no separate CSS files
- Single-file components — no premature abstractions
- `"use client"` directive on page.tsx
- Comments only where logic is non-obvious
- Framer Motion for all animations (`motion.div`, `AnimatePresence`)

## What NOT to Build
- No auth / login
- No database
- No saving/sharing reports
- No multi-page routing (everything is page.tsx)
- No admin panel
- No separate mobile layout (just make it responsive with Tailwind)
- No testing (it's a class demo)

## Testing Checklist (Run After Every Major Change)
After completing any feature or bug fix, run through this checklist before moving on:

1. `npm run dev` — confirm no build errors
2. Full flow: Landing → intake chat → complete all questions → submit → wait for report
3. Confirm exactly 4 stage progress indicators appear: Quality Gate, Market Scan, Business Plan, Pitch Deck
4. Check that every report section renders with real content (no "undefined", no truncated text, no missing sections)
5. Executive Summary: exactly 3 paragraphs, first paragraph does NOT start with "However"
6. "Download Report" button: downloads `.html` file immediately (no print dialog); HTML must NOT contain a Financial Model section; Pitch Deck labeled "4. Pitch Deck"
7. "Start Over" button: resets cleanly to landing page
8. Check browser console for errors or warnings

If any step fails, fix it before moving to the next task.

## When to Restart
Run `npm run dev` fresh (kill and restart the dev server) whenever:

- You modify `.env.local`
- You see stale content after changing the API route
- The app is in a broken state and hot reload isn't picking up fixes
- You get unexplained hydration errors

If the app is completely broken and you can't figure out why, run `rm -rf .next && npm run dev` to clear the build cache.
