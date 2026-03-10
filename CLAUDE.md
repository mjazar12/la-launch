# LA Launch — Local Business Plan Generator

## What This Is
A lightweight Next.js app for a UCLA Anderson class final project. A novice entrepreneur answers ~8 questions, we call the Claude API with hardcoded LA-specific data baked into the prompt, and render a polished business plan report on-screen. That's it.

## Architecture — 3 Files, No More
```
app/
  page.tsx          # Everything: landing → questionnaire → report
  api/generate/route.ts   # Single API route, calls Claude, returns JSON
  lib/prompt.ts     # System prompt template with all LA data baked in
```

No database. No auth. No separate data files. The LA research (neighborhood rents, funding programs, permits, demographics) is hardcoded directly into the system prompt in `lib/prompt.ts`.

## Tech Stack
- **Next.js 14** (App Router)
- **Tailwind CSS** (styling, all inline)
- **Claude API** (`claude-sonnet-4-5-20250929`) — one call, structured JSON response
- **Framer Motion** (`motion`) for animations
- No other dependencies unless absolutely necessary

## Design Direction — "Noir Deco LA"
The GUI is the wow factor. The aesthetic is **dark, cinematic, art-deco-meets-modern-LA** — think black/charcoal backgrounds, warm gold (#D4A853) and soft amber accents, dramatic typography, and smooth reveal animations. It should feel like opening a premium consulting report, not a generic SaaS form.

### Specific Design Rules
- **Dark theme only.** Background: near-black (#0A0A0A). Cards/sections: charcoal (#141414) with subtle warm borders.
- **Typography:** Use `Playfair Display` (serif, for headings — elegant, editorial) paired with `DM Sans` (body — clean, modern). Import from Google Fonts.
- **Gold accent color:** #D4A853 for highlights, progress indicators, section dividers, key metrics. Use sparingly — it should feel luxurious, not gaudy.
- **Animations:** Every state transition (landing → questionnaire → generating → report) should animate smoothly. Use staggered fade-up reveals for report sections. The generating state should have a cinematic loading sequence (pulsing gold ring or animated city skyline silhouette).
- **Layout:** Full viewport height. Centered content, generous whitespace. Max-width ~800px for readability. No sidebars, no navbars — immersive single-page flow.
- **Cards:** Subtle glassmorphism (backdrop-blur + low-opacity warm borders). Soft box-shadows.
- **Key metrics in the report** (e.g., estimated startup cost, monthly rent range) should render as large, highlighted stat callouts — gold text, oversized numbers.

### The Three States of `page.tsx`

**State 1 — Landing**
A dramatic hero with the app name "LA Launch", a one-line tagline ("Your AI-powered LA business plan in 60 seconds"), and a single gold CTA button. Subtle animated gradient or grain texture in the background. Keep it cinematic and minimal.

**State 2 — Questionnaire**
One question at a time, full screen, large text. Progress bar at top (gold). Smooth slide transitions between questions. Input fields are minimal and large. Options for multiple-choice questions rendered as selectable cards, not dropdowns. Feel: calm, guided, premium. Think typeform-style.

**State 3 — Report**
Sections fade in one by one with staggered delays as the user scrolls or as they load. Each section is a card. Key financial figures are hero-sized stat blocks. Include a subtle "Powered by Claude + LA Launch" footer. Add a "Start Over" button at the bottom.

Between State 2 and 3, show a **generating state** — a centered animated loader with a message like "Analyzing LA market data..." that cycles through 3-4 contextual messages.

## Questionnaire Fields
Collect these from the user (one per screen):

1. **Business name** — text input
2. **Industry** — selectable cards: Restaurant/Food, Retail, Professional Services, Health & Wellness, Creative/Media, Tech/Software, Other (text input)
3. **Business model** — cards: Physical storefront, Online only, Hybrid (both), Mobile/Pop-up
4. **Preferred neighborhood(s)** — multi-select cards: Downtown LA, Silver Lake/Echo Park, Santa Monica, Venice, Hollywood, Koreatown, Arts District, Culver City, Pasadena, Other
5. **Startup budget** — cards: Under $25K, $25K–$75K, $75K–$150K, $150K–$500K, $500K+
6. **Funding situation** — cards: Self-funded, Seeking loans, Seeking investors, Need to explore options
7. **Target customers** — cards: Local residents, Tourists/visitors, Other businesses (B2B), Online/national audience
8. **Experience level** — cards: First-time founder, Some business experience, Serial entrepreneur

## API Route (`/api/generate/route.ts`)

- Accepts POST with the form data as JSON body
- Constructs the prompt by calling the template in `lib/prompt.ts` with the form data
- Calls Claude API (`claude-sonnet-4-5-20250929`, max_tokens: 4096)
- The prompt must instruct Claude to respond with **ONLY valid JSON**, no markdown fences, no preamble
- Parse the JSON response and return it
- Handle errors gracefully (return a 500 with message)

### Response JSON Schema
The Claude API must return exactly this shape:
```json
{
  "businessName": "string",
  "executiveSummary": "string — EXACTLY 3 paragraphs separated by \\n\\n. Paragraph 1: vision and opportunity. Paragraph 2: strategy and differentiation. Paragraph 3: risks and path forward.",
  "marketAnalysis": {
    "overview": "string",
    "targetDemographic": "string",
    "competitiveLandscape": "string",
    "localInsights": "string (LA-specific)"
  },
  "locationStrategy": {
    "recommendedAreas": "string",
    "estimatedMonthlyRent": "string (dollar range)",
    "footTrafficNotes": "string",
    "proximityAdvantage": "string"
  },
  "financialProjections": {
    "estimatedStartupCosts": "string (dollar range)",
    "monthlyOperatingCosts": "string (dollar range)",
    "revenueProjection": "string",
    "breakEvenTimeline": "string"
  },
  "fundingOptions": [
    {
      "name": "string",
      "description": "string",
      "amount": "string",
      "fit": "string (why it's relevant)"
    }
  ],
  "permits": [
    {
      "name": "string",
      "description": "string",
      "estimatedCost": "string",
      "timeline": "string"
    }
  ],
  "nextSteps": ["string", "string", "string", "string", "string"],
  "riskFactors": ["string", "string", "string"]
}
```

## System Prompt (`lib/prompt.ts`)

This is a single exported function that takes the form data and returns the full prompt string. The LA data is hardcoded directly in here. Include at minimum:

### LA Neighborhood Data (bake into prompt)
- **Downtown LA:** Commercial rent $2.50-5.00/sqft, high foot traffic, young professionals, rapid gentrification, good transit access
- **Silver Lake/Echo Park:** Rent $3.00-5.50/sqft, trendy/artsy demographic, strong local loyalty, competitive food scene
- **Santa Monica:** Rent $4.00-8.00/sqft, tourist-heavy, affluent, strict permitting, high visibility
- **Venice:** Rent $4.50-7.50/sqft, tourist + local mix, creative community, expensive but high brand value
- **Hollywood:** Rent $3.00-6.00/sqft, tourist-heavy, nightlife-oriented, mixed income, high visibility
- **Koreatown:** Rent $2.00-4.00/sqft, dense population, diverse demographics, strong food culture, affordable
- **Arts District:** Rent $3.50-6.00/sqft, creative professionals, growing rapidly, warehouse-to-retail conversions
- **Culver City:** Rent $3.00-5.50/sqft, tech workers (Amazon, Apple nearby), family-friendly, growing restaurant scene
- **Pasadena:** Rent $2.50-5.00/sqft, established community, Old Town foot traffic, less transient than Westside

### LA Funding Programs (bake into prompt)
- **Kiva LA:** 0% interest microloans up to $15K, no credit score minimum
- **LISC LA:** Small business loans $50K-$250K for underserved communities
- **LA County CDBG:** Grants for businesses in low-to-moderate income areas
- **SBA 7(a) Loans:** Up to $5M, requires good credit, 7-25 year terms
- **SBA Microloans:** Up to $50K through intermediary lenders
- **Cal OSBA Grants:** California small business grants, varies by program cycle
- **Local CDFI lenders:** Pacific Asian Consortium, Vermont Slauson EDC, etc.

### LA Permit Info (bake into prompt)
- Business Tax Registration Certificate (all businesses, ~$50-100)
- Seller's Permit (retail/food, free from CDTFA)
- Health Permit (food businesses, $500-1000+, LA County Dept of Public Health)
- Conditional Use Permit (alcohol, entertainment, ~$10K-15K, 6-12 months)
- Building/Fire permits (physical locations, varies)
- Sign permits (City of LA Dept of Building and Safety)
- Home Occupation Permit (home-based businesses, ~$100)

### Prompt Instructions
Tell Claude to:
- Be specific and quantitative — dollar ranges, timelines, real program names
- Tailor everything to the user's stated budget, industry, and neighborhood
- Write in a professional but accessible tone (the user may be a first-timer)
- Be honest about challenges and risks, not just optimistic
- Return ONLY the JSON object, no markdown fences, no explanation text
- If the user selected "Other" for neighborhood, give general LA-wide advice

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

1. Start the dev server (`npm run dev`) and confirm no build errors
2. Walk through the full flow: Landing → click CTA → complete all 8 questionnaire steps → submit → wait for report
3. Verify the API response: add a `console.log` of the raw LLM response in `/api/generate/route.ts` and confirm it's valid JSON with all expected fields
4. Check that every report section renders with real content (no "undefined", no truncated text, no missing sections)
5. Confirm Executive Summary shows **3 paragraphs** — first paragraph should describe vision/opportunity, not start with "However"
6. Test the "Other" write-in option on at least one question — confirm the typed value appears in the generated report
7. Test "Download Report" button — browser should immediately download a `.html` file (no print dialog)
8. Test "Export to PPTX" button — file downloads with correct content
9. Test the "Start Over" button — confirm it resets to the landing page cleanly
10. Check browser console for any errors or warnings

If any step fails, fix it before moving to the next task.

## When to Restart
Run `npm run dev` fresh (kill and restart the dev server) whenever:

- You modify `.env.local`
- You see stale content after changing the API route
- The app is in a broken state and hot reload isn't picking up fixes
- You get unexplained hydration errors

If the app is completely broken and you can't figure out why, run `rm -rf .next && npm run dev` to clear the build cache.
