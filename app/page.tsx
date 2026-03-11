"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ── Types ──────────────────────────────────────────────────────

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

interface FundingOption {
  name: string;
  description: string;
  amount: string;
  fit: string;
}

interface Permit {
  name: string;
  description: string;
  estimatedCost: string;
  timeline: string;
}

interface ScenarioObj {
  revenueAssumption: string;
  cogsPercent: number;
  fixedOpexMonthly: number;
  breakevenMonth: number;
  yearOneRevenue: number;
}

interface ReportData {
  businessName: string;
  qualityGate: {
    readinessScore: string;
    topGaps: string[];
    unreliableSectionsWarning: string;
  };
  marketScan: {
    executiveSummary: string[];
    customerAndDemand: {
      personas: string;
      demandDrivers: string;
      willingnessToPay: string;
    };
    competitiveLandscape: {
      directCompetitors: string;
      whitespaceOpportunities: string;
    };
    locationAnalysis: {
      recommendedAreas: string;
      estimatedMonthlyRent: string;
      footTrafficNotes: string;
      proximityAdvantage: string;
    };
    feasibilityScorecard: {
      demand: number;
      competition: number;
      opsComplexity: number;
      capitalIntensity: number;
      regulatoryRisk: number;
      timelineRealism: number;
      scorecardNotes: string;
    };
    next5Actions: string[];
  };
  businessPlan: {
    executiveSummary: string;
    productService: {
      offerings: string;
      pricingLogic: string;
      differentiation: string;
    };
    goToMarket: {
      channels: string;
      launchPlan: string;
      retention: string;
    };
    operationsPlan: {
      location: string;
      staffing: string;
      workflow: string;
    };
    milestones: {
      days0to30: string | string[];
      days31to90: string | string[];
      days91to180: string | string[];
    };
    risksAndMitigations: Array<{ risk: string; trigger: string; response: string }>;
  };
  pitchDeck: {
    slides: Array<{
      slideNumber: number;
      title: string;
      bullets: string[];
      speakerNotes: string;
    }>;
  };
  fundingOptions: FundingOption[];
  permits: Permit[];
  nextSteps: string[];
  riskFactors: string[];
}

interface PipelineStage {
  name: string;
  status: "pending" | "running" | "complete" | "error";
}

// ── Constants ──────────────────────────────────────────────────

const INDUSTRY_OPTIONS = [
  "Restaurant/Food",
  "Retail",
  "Professional Services",
  "Health & Wellness",
  "Creative/Media",
  "Tech/Software",
  "Other",
];

const BUSINESS_STAGE_OPTIONS = [
  "Just an idea",
  "Validating / testing",
  "Ready to launch",
  "Already operating",
];

const MODEL_OPTIONS = [
  "Physical storefront",
  "Online only",
  "Hybrid (both)",
  "Mobile/Pop-up",
];

const NEIGHBORHOOD_OPTIONS = [
  "Downtown LA",
  "Silver Lake/Echo Park",
  "Santa Monica",
  "Venice",
  "Hollywood",
  "Koreatown",
  "Arts District",
  "Culver City",
  "Pasadena",
  "Not sure yet",
];

const CUSTOMER_OPTIONS = [
  "Local residents",
  "Tourists/visitors",
  "Other businesses (B2B)",
  "Online/national audience",
];

const BUDGET_OPTIONS = [
  "Under $25K",
  "$25K–$75K",
  "$75K–$150K",
  "$150K–$500K",
  "$500K+",
];

const FUNDING_OPTIONS_LIST = [
  "Self-funded",
  "Seeking loans",
  "Seeking investors",
  "Need to explore options",
];

const STAFFING_OPTIONS = [
  "Just me (owner-operator)",
  "Hire 1–3 people",
  "Hire 4+",
  "Use contractors/freelancers",
];

const SPACE_OPTIONS = [
  "No physical space",
  "Small (under 500 sqft)",
  "Medium (500–2,000 sqft)",
  "Large (2,000+ sqft)",
];

const TIMELINE_OPTIONS = [
  "Within 30 days",
  "1–3 months",
  "3–6 months",
  "6–12 months",
];

const EXPERIENCE_OPTIONS = [
  "First-time founder",
  "Some business experience",
  "Serial entrepreneur",
];

const PIPELINE_STAGE_NAMES = [
  "Input Quality Gate",
  "LA Market Scan & Feasibility",
  "Business Plan",
  "Pitch Deck",
];

const PIPELINE_MESSAGES = [
  "Cross-referencing Koreatown rent data...",
  "Evaluating SBA loan fit...",
  "Building your pitch narrative...",
  "Modeling 24-month cash runway...",
  "Scanning LA neighborhood foot traffic...",
  "Stress-testing your financial assumptions...",
  "Drafting competitive landscape analysis...",
  "Finalizing your business plan...",
];

// ── Autocomplete suggestions ───────────────────────────────────

const OFFERINGS_SUGGESTIONS: Record<string, string> = {
  "Restaurant/Food": "Signature tacos & house-made salsas, fresh-pressed juices, weekend brunch catering",
  "Retail": "Curated vintage clothing, custom alterations, personal styling sessions",
  "Professional Services": "Business consulting, financial planning, quarterly strategy workshops",
  "Health & Wellness": "60-min massage sessions, acupuncture treatments, monthly wellness coaching",
  "Creative/Media": "Brand identity design, social media content packages, short-form video production",
  "Tech/Software": "Custom web app development, API integrations, monthly maintenance retainers",
  "default": "Core product/service, premium tier offering, add-on or subscription option",
};

const DIFFERENTIATION_SUGGESTIONS: Record<string, string> = {
  "Restaurant/Food": "Only spot in the neighborhood using heirloom ingredients sourced directly from small farms — no distributors",
  "Retail": "Every item hand-curated by a working stylist — not bulk-bought. Clients get a stylist, not just a store",
  "Professional Services": "Flat-fee pricing, bilingual (Spanish/English), and 15 years of LA-specific industry experience",
  "Health & Wellness": "Integrative approach combining Eastern and Western techniques — no upselling, no packages required",
  "Creative/Media": "Founder-led — every client works directly with the creative director, never handed off to juniors",
  "Tech/Software": "Fixed-scope, fixed-price projects with a 30-day post-launch support guarantee — no scope creep surprises",
  "default": "Hyper-local focus, direct founder relationships, and quality over volume — we stay small on purpose",
};

const PRICING_SUGGESTIONS: Record<string, string> = {
  "Restaurant/Food": "$12–18 entrees, $5–8 drinks, $45/person for catering (50-person minimum)",
  "Retail": "$25–150 per item, $85/hr styling session, free alterations on purchases over $100",
  "Professional Services": "$150/hr consulting, $2,500/month retainer, $500 project minimum",
  "Health & Wellness": "$95 per session, $250/month membership (4 sessions), $50 à la carte add-ons",
  "Creative/Media": "$1,500 logo package, $800/month social media management, $3,500 full brand identity",
  "Tech/Software": "$5,000 project minimum, $150/hr hourly work, $500/month maintenance plan",
  "default": "Entry tier: $X, standard: $Y, premium: $Z — subscription or per-session options available",
};

const PERSONA_SUGGESTIONS: Record<string, string> = {
  "Local residents": "25–40, dual-income household ($80K–$130K), values local authenticity over chains, short on time but willing to pay for quality and convenience",
  "Tourists/visitors": "28–55, visiting LA for 3–7 days, staying in nearby hotels, looking for 'authentic local' experiences to share on social media",
  "Other businesses (B2B)": "Small business owner (5–50 employees), time-poor, frustrated with unreliable vendors, willing to pay a premium for dependable service",
  "Online/national audience": "25–45, follows niche online communities around this topic, early adopter who discovers brands before they go mainstream",
  "default": "28–42, college-educated, lives or works within 2 miles, frustrated with the current options, willing to pay 20–30% more for something that fits their values",
};

function getSuggestion(table: Record<string, string>, industry: string): string {
  return table[industry] ?? table["default"] ?? "";
}

function SuggestTextarea({
  value,
  onChange,
  placeholder,
  rows = 3,
  suggestion,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  rows?: number;
  suggestion: string;
}) {
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Tab" && value.trim() === "" && suggestion) {
      e.preventDefault();
      onChange(suggestion);
    }
  }

  return (
    <div className="space-y-2">
      <textarea
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        className="w-full bg-white/[0.03] border border-white/20 focus:border-gold outline-none font-dm text-lg text-white placeholder-white/20 p-4 rounded-xl transition-colors duration-200 resize-none"
      />
      {suggestion && (
        <div className="flex items-start gap-2">
          <button
            type="button"
            onClick={() => onChange(suggestion)}
            className="group flex items-start gap-2 text-left w-full"
          >
            <span className="shrink-0 mt-0.5 font-dm text-[10px] text-white/20 border border-white/10 rounded px-1 py-0.5 leading-none group-hover:border-gold/30 group-hover:text-gold/40 transition-colors">
              Tab ↹
            </span>
            <span className="font-dm text-xs text-white/25 leading-relaxed group-hover:text-white/40 transition-colors line-clamp-2">
              {suggestion}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}

// ── Animation ──────────────────────────────────────────────────

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -16 },
  transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
};

// ── Reusable Components ────────────────────────────────────────

function SelectCard({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-4 rounded-xl border text-left transition-all duration-200 font-dm text-sm ${
        selected
          ? "border-gold bg-gold/10 text-gold"
          : "border-white/10 bg-white/[0.03] text-white/70 hover:border-white/30 hover:text-white hover:bg-white/5"
      }`}
    >
      {label}
    </button>
  );
}

function SectionCard({
  title,
  children,
  delay = 0,
  id,
  open,
  onToggle,
}: {
  title: string;
  children: React.ReactNode;
  delay?: number;
  id?: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <motion.div
      id={id}
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className="bg-charcoal border border-white/[0.08] rounded-2xl p-8 backdrop-blur-sm"
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between text-left"
      >
        <h2 className="font-playfair text-2xl text-gold">{title}</h2>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.25 }}
          className="text-gold/40 text-lg ml-4 flex-shrink-0"
        >
          ▾
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-6">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-noir/60 border border-gold/20 rounded-xl p-5 text-center">
      <div className="font-playfair text-2xl text-gold leading-tight mb-1 break-words">
        {value}
      </div>
      <div className="font-dm text-xs text-white/50 uppercase tracking-widest mt-1">
        {label}
      </div>
    </div>
  );
}

function LabeledCard({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-dm text-xs text-gold/60 uppercase tracking-widest mb-1.5">
        {label}
      </div>
      <p className="font-dm text-white/70 leading-relaxed">{value}</p>
    </div>
  );
}

function FeasibilityBar({ label, value }: { label: string; value: number }) {
  const clamped = Math.max(1, Math.min(5, value));
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="font-dm text-xs text-white/60">{label}</span>
        <span className="font-dm text-xs text-gold">{clamped}/5</span>
      </div>
      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(clamped / 5) * 100}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full bg-gold rounded-full"
        />
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────

type Stage = "landing" | "chat" | "questionnaire" | "generating" | "report";

interface ChatMessage {
  role: "assistant" | "user";
  content: string;
}

export default function Home() {
  const [stage, setStage] = useState<Stage>("landing");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [formData, setFormData] = useState<FormData>({
    businessName: "",
    industry: "",
    businessStage: "",
    businessModel: "",
    neighborhoods: [],
    offerings: "",
    differentiation: "",
    pricing: "",
    targetCustomers: "",
    customerPersona: "",
    budget: "",
    funding: "",
    staffingPlan: "",
    spaceNeeds: "",
    launchTimeline: "",
    experienceLevel: "",
  });
  const [otherIndustry, setOtherIndustry] = useState("");
  const [report, setReport] = useState<ReportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pipelineStages, setPipelineStages] = useState<PipelineStage[]>(
    PIPELINE_STAGE_NAMES.map((name) => ({ name, status: "pending" }))
  );
  const [pipelineMsgIdx, setPipelineMsgIdx] = useState(0);
  const [isPptxExporting, setIsPptxExporting] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatStreaming, setChatStreaming] = useState(false);
  const [extractedFormData, setExtractedFormData] = useState<FormData | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    "quality-gate": true,
    "market-scan": false,
    "business-plan": false,
    "pitch-deck": false,
    "funding": false,
    "permits": false,
    "next-steps": true,
    "risks": false,
  });

  function toggleSection(id: string) {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function openAndScrollTo(id: string) {
    setOpenSections((prev) => ({ ...prev, [id]: true }));
    setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  // Cycle pipeline messages
  useEffect(() => {
    if (stage !== "generating") return;
    const interval = setInterval(() => {
      setPipelineMsgIdx((i) => (i + 1) % PIPELINE_MESSAGES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [stage]);

  const totalQuestions = 16;
  const progress = ((questionIndex + 1) / totalQuestions) * 100;

  function canAdvance(): boolean {
    switch (questionIndex) {
      case 0: return formData.businessName.trim().length > 0;
      case 1:
        return (
          formData.industry !== "" &&
          (formData.industry !== "Other" || otherIndustry.trim().length > 0)
        );
      case 2: return formData.businessStage !== "";
      case 3: return formData.businessModel !== "";
      case 4:
        return formData.neighborhoods.length > 0;
      case 5: return formData.offerings.trim().length > 0;
      case 6: return formData.differentiation.trim().length > 0;
      case 7: return formData.pricing.trim().length > 0;
      case 8: return formData.targetCustomers !== "";
      case 9: return formData.customerPersona.trim().length > 0;
      case 10: return formData.budget !== "";
      case 11: return formData.funding !== "";
      case 12: return formData.staffingPlan !== "";
      case 13: return formData.spaceNeeds !== "";
      case 14: return formData.launchTimeline !== "";
      case 15: return formData.experienceLevel !== "";
      default: return false;
    }
  }

  function handleNext() {
    if (!canAdvance()) return;
    if (questionIndex < totalQuestions - 1) {
      setQuestionIndex((i) => i + 1);
    } else {
      submitForm();
    }
  }

  function handleBack() {
    if (questionIndex > 0) setQuestionIndex((i) => i - 1);
    else setStage("landing");
  }

  function toggleNeighborhood(n: string) {
    setFormData((prev) => ({
      ...prev,
      neighborhoods: prev.neighborhoods.includes(n)
        ? prev.neighborhoods.filter((x) => x !== n)
        : [...prev.neighborhoods, n],
    }));
  }

  // ── Chat intake functions ─────────────────────────────────

  function startChat() {
    setChatMessages([{
      role: "assistant",
      content: "Tell me about your business idea — what do you want to build and where in LA?",
    }]);
    setExtractedFormData(null);
    setChatInput("");
    setStage("chat");
  }

  useEffect(() => {
    if (stage === "chat" && chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, stage]);

  async function sendChatMessage() {
    const trimmed = chatInput.trim();
    if (!trimmed || chatStreaming) return;

    const newMessages: ChatMessage[] = [
      ...chatMessages,
      { role: "user", content: trimmed },
    ];
    setChatMessages(newMessages);
    setChatInput("");
    setChatStreaming(true);

    // Optimistically add empty assistant message (shows typing dots)
    setChatMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!res.ok) {
        const body = await res.text();
        console.error(`[intake] HTTP ${res.status}:`, body);
        throw new Error(`HTTP ${res.status}`);
      }

      const { message, formData: fd } = await res.json();
      if (!message) throw new Error("Empty response from intake API");

      setChatMessages((prev) => [
        ...prev.slice(0, -1),
        { role: "assistant", content: message },
      ]);

      if (fd) setExtractedFormData(fd);
    } catch (err) {
      setChatMessages((prev) => [
        ...prev.slice(0, -1),
        { role: "assistant", content: "Sorry, I hit an error. Please try again." },
      ]);
      console.error(err);
    } finally {
      setChatStreaming(false);
    }
  }

  async function submitForm(overrideData?: FormData) {
    setStage("generating");
    setPipelineMsgIdx(0);
    setError(null);
    setPipelineStages(PIPELINE_STAGE_NAMES.map((name) => ({ name, status: "pending" })));

    const sourceData = overrideData ?? formData;
    const payload = {
      ...sourceData,
      industry: sourceData.industry === "Other" ? otherIndustry : sourceData.industry,
    };

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (payload === "[DONE]") break;

          let event: Record<string, unknown>;
          try {
            event = JSON.parse(payload);
          } catch {
            continue; // skip malformed SSE lines
          }

          if (event.status === "running") {
            setPipelineStages((prev) =>
              prev.map((s, i) =>
                i === (event.stage as number) - 1 ? { ...s, status: "running" } : s
              )
            );
          } else if (event.status === "complete") {
            setPipelineStages((prev) =>
              prev.map((s, i) =>
                i === (event.stage as number) - 1 ? { ...s, status: "complete" } : s
              )
            );
          } else if (event.status === "error") {
            throw new Error(event.message as string);
          } else if (event.type === "final") {
            setReport(event.report as ReportData);
            setStage("report");
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStage(extractedFormData ? "chat" : "questionnaire");
    }
  }

  function resetAll() {
    setStage("landing");
    setChatMessages([]);
    setChatInput("");
    setChatStreaming(false);
    setExtractedFormData(null);
    setQuestionIndex(0);
    setFormData({
      businessName: "",
      industry: "",
      businessStage: "",
      businessModel: "",
      neighborhoods: [],
      offerings: "",
      differentiation: "",
      pricing: "",
      targetCustomers: "",
      customerPersona: "",
      budget: "",
      funding: "",
      staffingPlan: "",
      spaceNeeds: "",
      launchTimeline: "",
      experienceLevel: "",
    });
    setOtherIndustry("");
    setReport(null);
    setError(null);
    setPipelineStages(PIPELINE_STAGE_NAMES.map((name) => ({ name, status: "pending" })));
  }

  function downloadHTML() {
    if (!report) return;
    const html = generateHTMLReport(report);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${report.businessName.replace(/\s+/g, "-")}-business-plan.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function exportPPTX() {
    if (!report || isPptxExporting) return;
    setIsPptxExporting(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mod = await import("pptxgenjs") as any;
      const PptxGen = mod.default ?? mod;

      const BG = "0A0A0A";
      const GOLD = "D4A853";
      const WHITE = "FFFFFF";
      const SUBTEXT = "AAAAAA";

      const pptx = new PptxGen();
      pptx.layout = "LAYOUT_16x9";

      for (const slide of report.pitchDeck.slides) {
        const s = pptx.addSlide();
        s.background = { color: BG };
        s.addText(`${slide.slideNumber}`, {
          x: 8.5, y: 0.2, w: 1.2, h: 0.4,
          color: GOLD, fontSize: 12, fontFace: "Arial", align: "right",
        });
        s.addText(slide.title, {
          x: 0.5, y: 0.5, w: 9, h: 0.9,
          color: GOLD, fontSize: 28, bold: true, fontFace: "Georgia",
        });
        slide.bullets.forEach((bullet, i) => {
          s.addText(`• ${bullet}`, {
            x: 0.5, y: 1.6 + i * 0.65, w: 9, h: 0.6,
            color: WHITE, fontSize: 14, fontFace: "Arial", wrap: true,
          });
        });
        s.addText(slide.speakerNotes, {
          x: 0.5, y: 5.8, w: 9, h: 0.6,
          color: SUBTEXT, fontSize: 9, fontFace: "Arial", wrap: true, italic: true,
        });
      }

      await pptx.writeFile({ fileName: `${report.businessName}-pitch-deck.pptx` });
    } finally {
      setIsPptxExporting(false);
    }
  }

  // ── LANDING ────────────────────────────────────────────────

  if (stage === "landing") {
    return (
      <div className="min-h-screen bg-noir flex flex-col items-center justify-center px-4 overflow-hidden relative">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% 40%, rgba(212,168,83,0.07) 0%, transparent 70%)",
          }}
        />
        <motion.div
          initial={fadeUp.initial}
          animate={fadeUp.animate}
          transition={fadeUp.transition}
          className="text-center max-w-2xl relative z-10"
        >
          <div className="font-dm text-xs tracking-[0.3em] text-gold/60 uppercase mb-6">
            Powered by Claude AI
          </div>
          <h1 className="font-playfair text-7xl md:text-8xl text-white mb-4 leading-none tracking-tight">
            LA Launch
          </h1>
          <div
            className="w-24 h-px mx-auto mb-6"
            style={{
              background: "linear-gradient(90deg, transparent, #D4A853, transparent)",
            }}
          />
          <p className="font-dm text-lg text-white/50 mb-12 leading-relaxed">
            Your AI-powered LA business plan in 60 seconds
          </p>
          <button
            onClick={startChat}
            className="px-10 py-4 bg-gold text-noir font-dm font-semibold text-sm tracking-wider uppercase rounded-full hover:bg-gold/90 transition-all duration-200 hover:scale-105 active:scale-95"
          >
            Build My Plan
          </button>
          <p className="font-dm text-xs text-white/25 mt-6">
            AI-powered advisor · No account required · 5-stage analysis
          </p>
          <button
            onClick={() => setStage("questionnaire")}
            className="mt-4 font-dm text-xs text-white/20 hover:text-white/40 transition-colors underline underline-offset-2"
          >
            Use structured form instead
          </button>
        </motion.div>
      </div>
    );
  }

  // ── QUESTIONNAIRE ──────────────────────────────────────────

  // ── CHAT INTAKE ────────────────────────────────────────────

  if (stage === "chat") {
    return (
      <div className="min-h-screen bg-noir flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <span className="font-playfair text-xl text-white">LA Launch</span>
            <span className="font-dm text-xs text-gold/50 uppercase tracking-widest">Advisor</span>
          </div>
          <button
            onClick={() => setStage("questionnaire")}
            className="font-dm text-xs text-white/25 hover:text-white/50 transition-colors"
          >
            Use structured form instead →
          </button>
        </div>

        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 max-w-2xl mx-auto w-full space-y-4">
          {chatMessages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="w-7 h-7 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center mr-3 shrink-0 mt-1">
                  <span className="text-gold text-xs">✦</span>
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-5 py-3.5 font-dm text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-gold/15 border border-gold/20 text-white/90 rounded-br-sm"
                    : "bg-white/[0.04] border border-white/[0.08] text-white/80 rounded-bl-sm"
                }`}
              >
                {msg.content || (chatStreaming && i === chatMessages.length - 1 ? (
                  <span className="inline-flex gap-1">
                    <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity }}>·</motion.span>
                    <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }}>·</motion.span>
                    <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}>·</motion.span>
                  </span>
                ) : "")}
              </div>
            </motion.div>
          ))}

          {/* Generate CTA — appears when form data is extracted */}
          <AnimatePresence>
            {extractedFormData && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-charcoal border border-gold/20 rounded-2xl p-5 space-y-4"
              >
                <div className="font-dm text-xs text-gold/60 uppercase tracking-widest">Ready to generate</div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(extractedFormData)
                    .filter(([, v]) => v && (typeof v === "string" ? v.trim() : (Array.isArray(v) ? v.length > 0 : true)))
                    .slice(0, 8)
                    .map(([key, val]) => (
                      <span key={key} className="font-dm text-xs bg-white/[0.05] border border-white/10 text-white/60 rounded-full px-3 py-1">
                        {Array.isArray(val) ? val.join(", ") : String(val)}
                      </span>
                    ))}
                </div>
                <button
                  onClick={() => submitForm(extractedFormData)}
                  className="w-full px-8 py-3.5 bg-gold text-noir font-dm font-semibold text-sm tracking-wider uppercase rounded-full hover:bg-gold/90 transition-all duration-200 hover:scale-[1.02] active:scale-95"
                >
                  Generate My Plan →
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={chatBottomRef} />
        </div>

        {/* Input bar */}
        <div className="border-t border-white/[0.06] px-4 py-4 max-w-2xl mx-auto w-full">
          {error && (
            <div className="mb-3 px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-xl font-dm text-xs text-red-400">
              {error}
            </div>
          )}
          <div className="flex gap-3">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendChatMessage()}
              disabled={chatStreaming}
              placeholder="Describe your business idea..."
              className="flex-1 bg-white/[0.04] border border-white/10 focus:border-gold/40 outline-none font-dm text-sm text-white placeholder-white/25 px-4 py-3 rounded-xl transition-colors duration-200"
              autoFocus
            />
            <button
              onClick={sendChatMessage}
              disabled={chatStreaming || !chatInput.trim()}
              className={`px-5 py-3 rounded-xl font-dm text-sm font-semibold transition-all duration-200 ${
                chatStreaming || !chatInput.trim()
                  ? "bg-white/5 text-white/20 cursor-not-allowed"
                  : "bg-gold text-noir hover:bg-gold/90 active:scale-95"
              }`}
            >
              →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── QUESTIONNAIRE ──────────────────────────────────────────

  if (stage === "questionnaire") {
    return (
      <div className="min-h-screen bg-noir flex flex-col px-4 py-8">
        <div className="fixed top-0 left-0 right-0 h-0.5 bg-white/5 z-50">
          <motion.div
            className="h-full bg-gold"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full">
          {error && (
            <div className="w-full mb-6 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl font-dm text-sm text-red-400">
              {error}
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={questionIndex}
              initial={fadeUp.initial}
              animate={fadeUp.animate}
              exit={fadeUp.exit}
              transition={fadeUp.transition}
              className="w-full"
            >
              {/* Q1: Business name */}
              {questionIndex === 0 && (
                <div>
                  <div className="font-dm text-xs text-gold/60 uppercase tracking-widest mb-3">Question 1 of 16</div>
                  <h2 className="font-playfair text-4xl text-white mb-8 leading-tight">
                    What&apos;s the name of your business?
                  </h2>
                  <input
                    autoFocus
                    type="text"
                    value={formData.businessName}
                    onChange={(e) => setFormData((p) => ({ ...p, businessName: e.target.value }))}
                    onKeyDown={(e) => e.key === "Enter" && handleNext()}
                    placeholder="e.g. Sunset Roasters"
                    className="w-full bg-transparent border-b-2 border-white/20 focus:border-gold outline-none font-dm text-3xl text-white placeholder-white/20 pb-3 transition-colors duration-200"
                  />
                </div>
              )}

              {/* Q2: Industry */}
              {questionIndex === 1 && (
                <div>
                  <div className="font-dm text-xs text-gold/60 uppercase tracking-widest mb-3">Question 2 of 16</div>
                  <h2 className="font-playfair text-4xl text-white mb-8 leading-tight">What industry are you in?</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {INDUSTRY_OPTIONS.map((opt) => (
                      <SelectCard key={opt} label={opt} selected={formData.industry === opt}
                        onClick={() => setFormData((p) => ({ ...p, industry: opt }))} />
                    ))}
                  </div>
                  {formData.industry === "Other" && (
                    <motion.input
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} autoFocus
                      type="text" value={otherIndustry} onChange={(e) => setOtherIndustry(e.target.value)}
                      placeholder="Describe your industry..."
                      className="mt-4 w-full bg-transparent border-b-2 border-white/20 focus:border-gold outline-none font-dm text-lg text-white placeholder-white/20 pb-2 transition-colors duration-200"
                    />
                  )}
                </div>
              )}

              {/* Q3: Business stage */}
              {questionIndex === 2 && (
                <div>
                  <div className="font-dm text-xs text-gold/60 uppercase tracking-widest mb-3">Question 3 of 16</div>
                  <h2 className="font-playfair text-4xl text-white mb-8 leading-tight">Where are you in your journey?</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {BUSINESS_STAGE_OPTIONS.map((opt) => (
                      <SelectCard key={opt} label={opt} selected={formData.businessStage === opt}
                        onClick={() => setFormData((p) => ({ ...p, businessStage: opt }))} />
                    ))}
                  </div>
                </div>
              )}

              {/* Q4: Business model */}
              {questionIndex === 3 && (
                <div>
                  <div className="font-dm text-xs text-gold/60 uppercase tracking-widest mb-3">Question 4 of 16</div>
                  <h2 className="font-playfair text-4xl text-white mb-8 leading-tight">What&apos;s your business model?</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {MODEL_OPTIONS.map((opt) => (
                      <SelectCard key={opt} label={opt} selected={formData.businessModel === opt}
                        onClick={() => setFormData((p) => ({ ...p, businessModel: opt }))} />
                    ))}
                  </div>
                </div>
              )}

              {/* Q5: Neighborhoods */}
              {questionIndex === 4 && (
                <div>
                  <div className="font-dm text-xs text-gold/60 uppercase tracking-widest mb-3">Question 5 of 16</div>
                  <div className="flex items-center gap-3 mb-3">
                    <h2 className="font-playfair text-4xl text-white leading-tight">Which neighborhoods interest you?</h2>
                    {formData.neighborhoods.length > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="font-dm text-xs text-noir bg-gold rounded-full px-2 py-0.5 leading-none shrink-0"
                      >
                        {formData.neighborhoods.length} selected
                      </motion.span>
                    )}
                  </div>
                  <p className="font-dm text-sm text-white/40 mb-6">Select all that apply</p>
                  <div className="grid grid-cols-2 gap-3">
                    {NEIGHBORHOOD_OPTIONS.map((opt) => (
                      <SelectCard key={opt} label={opt} selected={formData.neighborhoods.includes(opt)}
                        onClick={() => toggleNeighborhood(opt)} />
                    ))}
                  </div>
                </div>
              )}

              {/* Q6: Offerings */}
              {questionIndex === 5 && (
                <div>
                  <div className="font-dm text-xs text-gold/60 uppercase tracking-widest mb-3">Question 6 of 16</div>
                  <h2 className="font-playfair text-4xl text-white mb-3 leading-tight">What are your top 3 offerings?</h2>
                  <p className="font-dm text-sm text-white/40 mb-8">e.g. espresso drinks, pastries, catering</p>
                  <SuggestTextarea
                    value={formData.offerings}
                    onChange={(v) => setFormData((p) => ({ ...p, offerings: v }))}
                    placeholder="List your main products or services..."
                    suggestion={getSuggestion(OFFERINGS_SUGGESTIONS, formData.industry)}
                  />
                </div>
              )}

              {/* Q7: Differentiation */}
              {questionIndex === 6 && (
                <div>
                  <div className="font-dm text-xs text-gold/60 uppercase tracking-widest mb-3">Question 7 of 16</div>
                  <h2 className="font-playfair text-4xl text-white mb-3 leading-tight">What makes you different?</h2>
                  <p className="font-dm text-sm text-white/40 mb-8">Why will customers choose you over existing options?</p>
                  <SuggestTextarea
                    value={formData.differentiation}
                    onChange={(v) => setFormData((p) => ({ ...p, differentiation: v }))}
                    placeholder="Describe your unique advantage..."
                    suggestion={getSuggestion(DIFFERENTIATION_SUGGESTIONS, formData.industry)}
                  />
                </div>
              )}

              {/* Q8: Pricing */}
              {questionIndex === 7 && (
                <div>
                  <div className="font-dm text-xs text-gold/60 uppercase tracking-widest mb-3">Question 8 of 16</div>
                  <h2 className="font-playfair text-4xl text-white mb-3 leading-tight">What are your price points?</h2>
                  <p className="font-dm text-sm text-white/40 mb-8">e.g. $12 lunch bowls, $8 coffee, $45/hr consulting</p>
                  <SuggestTextarea
                    value={formData.pricing}
                    onChange={(v) => setFormData((p) => ({ ...p, pricing: v }))}
                    placeholder="Give example price points..."
                    suggestion={getSuggestion(PRICING_SUGGESTIONS, formData.industry)}
                  />
                </div>
              )}

              {/* Q9: Target customers */}
              {questionIndex === 8 && (
                <div>
                  <div className="font-dm text-xs text-gold/60 uppercase tracking-widest mb-3">Question 9 of 16</div>
                  <h2 className="font-playfair text-4xl text-white mb-8 leading-tight">Who are your primary customers?</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {CUSTOMER_OPTIONS.map((opt) => (
                      <SelectCard key={opt} label={opt} selected={formData.targetCustomers === opt}
                        onClick={() => setFormData((p) => ({ ...p, targetCustomers: opt }))} />
                    ))}
                  </div>
                </div>
              )}

              {/* Q10: Customer persona */}
              {questionIndex === 9 && (
                <div>
                  <div className="font-dm text-xs text-gold/60 uppercase tracking-widest mb-3">Question 10 of 16</div>
                  <h2 className="font-playfair text-4xl text-white mb-3 leading-tight">Describe your ideal customer</h2>
                  <p className="font-dm text-sm text-white/40 mb-8">Age, income level, lifestyle, and what problem you solve for them</p>
                  <SuggestTextarea
                    value={formData.customerPersona}
                    onChange={(v) => setFormData((p) => ({ ...p, customerPersona: v }))}
                    placeholder="e.g. 25–40, dual-income professionals who value quality..."
                    suggestion={getSuggestion(PERSONA_SUGGESTIONS, formData.targetCustomers)}
                  />
                </div>
              )}

              {/* Q11: Budget */}
              {questionIndex === 10 && (
                <div>
                  <div className="font-dm text-xs text-gold/60 uppercase tracking-widest mb-3">Question 11 of 16</div>
                  <h2 className="font-playfair text-4xl text-white mb-8 leading-tight">What&apos;s your startup budget?</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {BUDGET_OPTIONS.map((opt) => (
                      <SelectCard key={opt} label={opt} selected={formData.budget === opt}
                        onClick={() => setFormData((p) => ({ ...p, budget: opt }))} />
                    ))}
                  </div>
                </div>
              )}

              {/* Q12: Funding */}
              {questionIndex === 11 && (
                <div>
                  <div className="font-dm text-xs text-gold/60 uppercase tracking-widest mb-3">Question 12 of 16</div>
                  <h2 className="font-playfair text-4xl text-white mb-8 leading-tight">What&apos;s your funding situation?</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {FUNDING_OPTIONS_LIST.map((opt) => (
                      <SelectCard key={opt} label={opt} selected={formData.funding === opt}
                        onClick={() => setFormData((p) => ({ ...p, funding: opt }))} />
                    ))}
                  </div>
                </div>
              )}

              {/* Q13: Staffing */}
              {questionIndex === 12 && (
                <div>
                  <div className="font-dm text-xs text-gold/60 uppercase tracking-widest mb-3">Question 13 of 16</div>
                  <h2 className="font-playfair text-4xl text-white mb-8 leading-tight">What&apos;s your staffing plan?</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {STAFFING_OPTIONS.map((opt) => (
                      <SelectCard key={opt} label={opt} selected={formData.staffingPlan === opt}
                        onClick={() => setFormData((p) => ({ ...p, staffingPlan: opt }))} />
                    ))}
                  </div>
                </div>
              )}

              {/* Q14: Space needs */}
              {questionIndex === 13 && (
                <div>
                  <div className="font-dm text-xs text-gold/60 uppercase tracking-widest mb-3">Question 14 of 16</div>
                  <h2 className="font-playfair text-4xl text-white mb-8 leading-tight">How much space do you need?</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {SPACE_OPTIONS.map((opt) => (
                      <SelectCard key={opt} label={opt} selected={formData.spaceNeeds === opt}
                        onClick={() => setFormData((p) => ({ ...p, spaceNeeds: opt }))} />
                    ))}
                  </div>
                </div>
              )}

              {/* Q15: Timeline */}
              {questionIndex === 14 && (
                <div>
                  <div className="font-dm text-xs text-gold/60 uppercase tracking-widest mb-3">Question 15 of 16</div>
                  <h2 className="font-playfair text-4xl text-white mb-8 leading-tight">When do you plan to launch?</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {TIMELINE_OPTIONS.map((opt) => (
                      <SelectCard key={opt} label={opt} selected={formData.launchTimeline === opt}
                        onClick={() => setFormData((p) => ({ ...p, launchTimeline: opt }))} />
                    ))}
                  </div>
                </div>
              )}

              {/* Q16: Experience */}
              {questionIndex === 15 && (
                <div>
                  <div className="font-dm text-xs text-gold/60 uppercase tracking-widest mb-3">Question 16 of 16</div>
                  <h2 className="font-playfair text-4xl text-white mb-8 leading-tight">What&apos;s your experience level?</h2>
                  <div className="grid grid-cols-1 gap-3">
                    {EXPERIENCE_OPTIONS.map((opt) => (
                      <SelectCard key={opt} label={opt} selected={formData.experienceLevel === opt}
                        onClick={() => setFormData((p) => ({ ...p, experienceLevel: opt }))} />
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-between w-full mt-12">
            <button
              onClick={handleBack}
              className="font-dm text-sm text-white/40 hover:text-white/70 transition-colors"
            >
              ← Back
            </button>
            <button
              onClick={handleNext}
              disabled={!canAdvance()}
              className={`px-8 py-3.5 rounded-full font-dm font-semibold text-sm tracking-wider uppercase transition-all duration-200 ${
                canAdvance()
                  ? "bg-gold text-noir hover:bg-gold/90 hover:scale-105 active:scale-95"
                  : "bg-white/5 text-white/20 cursor-not-allowed"
              }`}
            >
              {questionIndex === totalQuestions - 1 ? "Generate Plan" : "Continue →"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── PIPELINE PROGRESS ──────────────────────────────────────

  if (stage === "generating") {
    return (
      <div className="min-h-screen bg-noir flex flex-col items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm"
        >
          <p className="font-playfair text-3xl text-white text-center mb-10">
            Building your plan
          </p>

          {/* 5-stage vertical stepper */}
          <div className="relative">
            {/* connecting line */}
            <div className="absolute left-4 top-4 bottom-4 w-px bg-white/10" />

            <div className="space-y-6">
              {pipelineStages.map((s, i) => (
                <div key={i} className="flex items-center gap-4 relative">
                  {/* stage indicator */}
                  <div className="relative z-10 w-8 h-8 shrink-0 flex items-center justify-center">
                    {s.status === "complete" ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-8 h-8 rounded-full bg-gold flex items-center justify-center"
                      >
                        <svg className="w-4 h-4 text-noir" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </motion.div>
                    ) : s.status === "running" ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                        className="w-8 h-8 rounded-full border-2 border-gold border-t-transparent"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full border-2 border-white/20 bg-noir" />
                    )}
                  </div>

                  <div>
                    <p className={`font-dm text-sm transition-colors ${
                      s.status === "complete" ? "text-gold" :
                      s.status === "running" ? "text-white" :
                      "text-white/30"
                    }`}>
                      {s.name}
                    </p>
                    {s.status === "complete" && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="font-dm text-xs text-gold/50"
                      >
                        Complete
                      </motion.p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rotating message */}
          <div className="mt-10 text-center">
            <AnimatePresence mode="wait">
              <motion.p
                key={pipelineMsgIdx}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.4 }}
                className="font-dm text-sm text-white/40 italic"
              >
                {PIPELINE_MESSAGES[pipelineMsgIdx]}
              </motion.p>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── REPORT ─────────────────────────────────────────────────

  if (stage === "report" && report) {
    const scorecard = report.marketScan?.feasibilityScorecard;

    return (
      <div className="min-h-screen bg-noir text-white pb-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="px-6 py-16 text-center border-b border-white/5"
        >
          <div className="font-dm text-xs text-gold/60 uppercase tracking-[0.3em] mb-4">
            Business Plan
          </div>
          <h1 className="font-playfair text-5xl md:text-6xl text-white mb-4">
            {report.businessName}
          </h1>
          <div
            className="w-20 h-px mx-auto"
            style={{ background: "linear-gradient(90deg, transparent, #D4A853, transparent)" }}
          />
        </motion.div>

        {/* TOC (desktop only) */}
        <div className="hidden xl:block fixed left-6 top-1/3 space-y-2 z-40">
          {["quality-gate", "market-scan", "business-plan", "pitch-deck"].map((id, i) => (
            <button
              key={id}
              onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })}
              className="block font-dm text-xs text-white/30 hover:text-gold transition-colors text-left"
            >
              {["Quality Gate", "Market Scan", "Business Plan", "Pitch Deck"][i]}
            </button>
          ))}
        </div>

        <div className="max-w-3xl mx-auto px-6 pt-12 space-y-6">

          {/* Section nav chips */}
          {(() => {
            const sections = [
              { id: "quality-gate", label: "Quality Gate" },
              { id: "market-scan", label: "Market Scan" },
              { id: "business-plan", label: "Business Plan" },
              { id: "pitch-deck", label: "Pitch Deck" },
              { id: "funding", label: "Funding" },
              { id: "permits", label: "Permits" },
              { id: "next-steps", label: "Next Steps" },
              { id: "risks", label: "Risks" },
            ];
            return (
              <div className="flex flex-wrap gap-2 pb-2">
                {sections.map(({ id, label }) => (
                  <button
                    key={id}
                    onClick={() => openAndScrollTo(id)}
                    className={`font-dm text-xs rounded-full px-3 py-1.5 cursor-pointer transition-colors duration-200 border ${
                      openSections[id]
                        ? "border-gold/40 text-gold bg-white/[0.04]"
                        : "border-white/10 text-white/50 bg-white/[0.04] hover:border-gold/30 hover:text-gold"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            );
          })()}

          {/* Section 1: Input Quality Gate */}
          <SectionCard title="Input Quality Gate" delay={0} id="quality-gate" open={openSections["quality-gate"]} onToggle={() => toggleSection("quality-gate")}>
            <div className="space-y-6">
              <StatBlock label="Readiness Score" value={report.qualityGate?.readinessScore ?? "N/A"} />

              {report.qualityGate?.unreliableSectionsWarning && (
                <div className="border border-amber-500/30 bg-amber-500/5 rounded-xl p-4">
                  <div className="font-dm text-xs text-amber-400/70 uppercase tracking-widest mb-2">Reliability Warning</div>
                  <p className="font-dm text-sm text-amber-200/80 leading-relaxed">
                    {report.qualityGate.unreliableSectionsWarning}
                  </p>
                </div>
              )}

              {report.qualityGate?.topGaps?.length > 0 && (
                <div>
                  <div className="font-dm text-xs text-gold/60 uppercase tracking-widest mb-3">
                    Top Gaps to Address
                  </div>
                  <ol className="space-y-3">
                    {report.qualityGate.topGaps.map((gap, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="font-playfair text-lg text-gold/40 w-6 shrink-0">{i + 1}</span>
                        <p className="font-dm text-sm text-white/70 leading-relaxed pt-0.5">{gap}</p>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          </SectionCard>

          {/* Section 2: LA Market Scan */}
          <SectionCard title="LA Market Scan & Feasibility" delay={0.05} id="market-scan" open={openSections["market-scan"]} onToggle={() => toggleSection("market-scan")}>
            <div className="space-y-8">
              {/* Feasibility scorecard */}
              {scorecard && (
                <div>
                  <div className="font-dm text-xs text-gold/60 uppercase tracking-widest mb-4">Feasibility Scorecard</div>
                  <div className="space-y-3">
                    {[
                      { label: "Demand", key: "demand" },
                      { label: "Competition", key: "competition" },
                      { label: "Ops Complexity", key: "opsComplexity" },
                      { label: "Capital Intensity", key: "capitalIntensity" },
                      { label: "Regulatory Risk", key: "regulatoryRisk" },
                      { label: "Timeline Realism", key: "timelineRealism" },
                    ].map(({ label, key }) => (
                      <FeasibilityBar key={key} label={label} value={scorecard[key as keyof typeof scorecard] as number} />
                    ))}
                  </div>
                  {scorecard.scorecardNotes && (
                    <p className="font-dm text-xs text-white/50 mt-3 leading-relaxed">{scorecard.scorecardNotes}</p>
                  )}
                </div>
              )}

              {/* Executive summary bullets */}
              {report.marketScan?.executiveSummary?.length > 0 && (
                <div>
                  <div className="font-dm text-xs text-gold/60 uppercase tracking-widest mb-3">Go / No-Go Analysis</div>
                  <div className="space-y-2">
                    {report.marketScan.executiveSummary.map((bullet, i) => (
                      <div key={i} className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3">
                        <p className="font-dm text-sm text-white/70 leading-relaxed">{bullet}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Location analysis */}
              {report.marketScan?.locationAnalysis && (
                <div className="space-y-4">
                  <StatBlock label="Est. Monthly Rent" value={report.marketScan.locationAnalysis.estimatedMonthlyRent} />
                  <LabeledCard label="Recommended Areas" value={report.marketScan.locationAnalysis.recommendedAreas} />
                  <LabeledCard label="Foot Traffic" value={report.marketScan.locationAnalysis.footTrafficNotes} />
                  <LabeledCard label="Proximity Advantage" value={report.marketScan.locationAnalysis.proximityAdvantage} />
                </div>
              )}

              {/* Customer & demand */}
              {report.marketScan?.customerAndDemand && (
                <div className="space-y-4">
                  <div className="font-dm text-xs text-gold/60 uppercase tracking-widest">Customer & Demand</div>
                  {Object.entries(report.marketScan.customerAndDemand).map(([k, v]) => (
                    <LabeledCard key={k} label={k.replace(/([A-Z])/g, " $1").trim()} value={v} />
                  ))}
                </div>
              )}

              {/* Competitive landscape */}
              {report.marketScan?.competitiveLandscape && (
                <div className="space-y-4">
                  <div className="font-dm text-xs text-gold/60 uppercase tracking-widest">Competitive Landscape</div>
                  {Object.entries(report.marketScan.competitiveLandscape).map(([k, v]) => (
                    <LabeledCard key={k} label={k.replace(/([A-Z])/g, " $1").trim()} value={v} />
                  ))}
                </div>
              )}

              {/* Next 5 actions */}
              {report.marketScan?.next5Actions?.length > 0 && (
                <div>
                  <div className="font-dm text-xs text-gold/60 uppercase tracking-widest mb-3">Next 5 Actions</div>
                  <ol className="space-y-3">
                    {report.marketScan.next5Actions.map((action, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="font-playfair text-lg text-gold/40 w-6 shrink-0">{i + 1}</span>
                        <p className="font-dm text-sm text-white/70 leading-relaxed pt-0.5">{action}</p>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          </SectionCard>

          {/* Section 3: Business Plan */}
          <SectionCard title="Business Plan" delay={0.1} id="business-plan" open={openSections["business-plan"]} onToggle={() => toggleSection("business-plan")}>
            <div className="space-y-8">
              {/* Executive summary — 3 paragraphs */}
              {report.businessPlan?.executiveSummary && (
                <div>
                  <div className="font-dm text-xs text-gold/60 uppercase tracking-widest mb-4">Executive Summary</div>
                  <blockquote className="border-l-2 border-gold/30 pl-6 space-y-4 min-h-[4rem]">
                    {(report.businessPlan.executiveSummary || "")
                      .split(/\n\n+/)
                      .filter(p => p.trim())
                      .map((para, i) => (
                        <p key={i} className="font-dm text-white/70 leading-relaxed">{para}</p>
                      ))}
                  </blockquote>
                </div>
              )}

              {/* Product/service */}
              {report.businessPlan?.productService && (
                <div className="space-y-4">
                  <div className="font-dm text-xs text-gold/60 uppercase tracking-widest">Product / Service</div>
                  <LabeledCard label="Offerings" value={report.businessPlan.productService.offerings} />
                  <LabeledCard label="Pricing Logic" value={report.businessPlan.productService.pricingLogic} />
                  <LabeledCard label="Differentiation" value={report.businessPlan.productService.differentiation} />
                </div>
              )}

              {/* Go to market */}
              {report.businessPlan?.goToMarket && (
                <div className="space-y-4">
                  <div className="font-dm text-xs text-gold/60 uppercase tracking-widest">Go-to-Market</div>
                  <LabeledCard label="Channels" value={report.businessPlan.goToMarket.channels} />
                  <LabeledCard label="Launch Plan" value={report.businessPlan.goToMarket.launchPlan} />
                  <LabeledCard label="Retention" value={report.businessPlan.goToMarket.retention} />
                </div>
              )}

              {/* Operations */}
              {report.businessPlan?.operationsPlan && (
                <div className="space-y-4">
                  <div className="font-dm text-xs text-gold/60 uppercase tracking-widest">Operations Plan</div>
                  <LabeledCard label="Location" value={report.businessPlan.operationsPlan.location} />
                  <LabeledCard label="Staffing" value={report.businessPlan.operationsPlan.staffing} />
                  <LabeledCard label="Workflow" value={report.businessPlan.operationsPlan.workflow} />
                </div>
              )}

              {/* Milestones — horizontal timeline */}
              {report.businessPlan?.milestones && (
                <div>
                  <div className="font-dm text-xs text-gold/60 uppercase tracking-widest mb-4">Milestones</div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { label: "Days 0–30", value: report.businessPlan.milestones.days0to30 },
                      { label: "Days 31–90", value: report.businessPlan.milestones.days31to90 },
                      { label: "Days 91–180", value: report.businessPlan.milestones.days91to180 },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-noir/60 border border-gold/20 rounded-xl p-4">
                        <div className="font-dm text-xs text-gold uppercase tracking-widest mb-2">{label}</div>
                        {Array.isArray(value) ? (
                          <ul className="space-y-1.5">
                            {value.map((bullet: string, i: number) => (
                              <li key={i} className="flex gap-2">
                                <span className="text-gold/30 shrink-0 mt-1">·</span>
                                <p className="font-dm text-xs text-white/70 leading-relaxed">{bullet}</p>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="font-dm text-sm text-white/70 leading-relaxed">{value as string}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Risks table */}
              {report.businessPlan?.risksAndMitigations?.length > 0 && (
                <div>
                  <div className="font-dm text-xs text-gold/60 uppercase tracking-widest mb-3">Risks & Mitigations</div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left font-dm text-xs text-gold/60 pb-2 pr-4 uppercase tracking-wider w-1/3">Risk</th>
                          <th className="text-left font-dm text-xs text-gold/60 pb-2 pr-4 uppercase tracking-wider w-1/3">Trigger</th>
                          <th className="text-left font-dm text-xs text-gold/60 pb-2 uppercase tracking-wider w-1/3">Response</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.businessPlan.risksAndMitigations.map((r, i) => (
                          <tr key={i} className="border-b border-white/5">
                            <td className="py-3 pr-4 font-dm text-white/70 align-top">{r.risk}</td>
                            <td className="py-3 pr-4 font-dm text-white/50 align-top text-xs">{r.trigger}</td>
                            <td className="py-3 font-dm text-white/50 align-top text-xs">{r.response}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>
          </SectionCard>

          {/* Section 4: Pitch Deck */}
          <SectionCard title="Pitch Deck" delay={0.2} id="pitch-deck" open={openSections["pitch-deck"]} onToggle={() => toggleSection("pitch-deck")}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {report.pitchDeck?.slides?.map((slide) => (
                <div
                  key={slide.slideNumber}
                  className="bg-noir/60 border border-white/[0.08] rounded-xl p-5 hover:border-gold/20 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="font-playfair text-xl text-gold/40">{slide.slideNumber}</span>
                    <h3 className="font-playfair text-base text-white leading-tight">{slide.title}</h3>
                  </div>
                  <ul className="space-y-1.5 mb-4">
                    {slide.bullets.map((bullet, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-gold/30 shrink-0">·</span>
                        <p className="font-dm text-xs text-white/60 leading-relaxed">{bullet}</p>
                      </li>
                    ))}
                  </ul>
                  <details className="group">
                    <summary className="cursor-pointer font-dm text-xs text-white/30 hover:text-white/50 uppercase tracking-widest list-none">
                      ▸ Speaker Notes
                    </summary>
                    <p className="mt-2 font-dm text-xs text-white/40 leading-relaxed italic">
                      {slide.speakerNotes}
                    </p>
                  </details>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Shared: Funding Options */}
          {report.fundingOptions?.length > 0 && (
            <SectionCard title="Funding Options" delay={0.25} id="funding" open={openSections["funding"]} onToggle={() => toggleSection("funding")}>
              <div className="space-y-4">
                {report.fundingOptions.map((opt, i) => (
                  <div key={i} className="border border-white/[0.08] rounded-xl p-5 hover:border-gold/20 transition-colors">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="font-dm font-semibold text-white">{opt.name}</div>
                      <div className="font-playfair text-gold text-sm shrink-0">{opt.amount}</div>
                    </div>
                    <p className="font-dm text-sm text-white/60 mb-2 leading-relaxed">{opt.description}</p>
                    <p className="font-dm text-xs text-gold/60 leading-relaxed">{opt.fit}</p>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {/* Shared: Permits */}
          {report.permits?.length > 0 && (
            <SectionCard title="Required Permits" delay={0.3} id="permits" open={openSections["permits"]} onToggle={() => toggleSection("permits")}>
              <div className="space-y-4">
                {report.permits.map((permit, i) => (
                  <div key={i} className="border border-white/[0.08] rounded-xl p-5 hover:border-gold/20 transition-colors">
                    <div className="flex items-start justify-between gap-4 mb-1.5">
                      <div className="font-dm font-semibold text-white text-sm min-w-0">{permit.name}</div>
                      <div className="text-right max-w-[45%] break-words shrink-0">
                        <div className="font-dm text-xs text-gold">{permit.estimatedCost}</div>
                        <div className="font-dm text-xs text-white/30">{permit.timeline}</div>
                      </div>
                    </div>
                    <p className="font-dm text-xs text-white/50 leading-relaxed">{permit.description}</p>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {/* Shared: Next Steps */}
          {report.nextSteps?.length > 0 && (
            <SectionCard title="Next Steps" delay={0.35} id="next-steps" open={openSections["next-steps"]} onToggle={() => toggleSection("next-steps")}>
              <ol className="space-y-4">
                {report.nextSteps.map((step, i) => (
                  <li key={i} className="flex gap-4">
                    <div className="font-playfair text-2xl text-gold/30 leading-none w-8 shrink-0">{i + 1}</div>
                    <p className="font-dm text-white/70 leading-relaxed pt-0.5">{step}</p>
                  </li>
                ))}
              </ol>
            </SectionCard>
          )}

          {/* Shared: Risk Factors */}
          {report.riskFactors?.length > 0 && (
            <SectionCard title="Risk Factors" delay={0.4} id="risks" open={openSections["risks"]} onToggle={() => toggleSection("risks")}>
              <div className="space-y-3">
                {report.riskFactors.map((risk, i) => (
                  <div key={i} className="border border-amber-500/20 bg-amber-500/5 rounded-xl p-4">
                    <p className="font-dm text-sm text-amber-200/70 leading-relaxed">{risk}</p>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {/* Coming Soon Section */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="pt-4"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(212,168,83,0.3))" }} />
              <span className="font-playfair text-base text-white/30 whitespace-nowrap">What&apos;s Coming to LA Launch</span>
              <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, rgba(212,168,83,0.3), transparent)" }} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  icon: "🔍",
                  title: "Live Competitor Scan",
                  description: "Real-time web search for actual businesses in your chosen neighborhood — menus, pricing, reviews, and market gaps.",
                },
                {
                  icon: "🏢",
                  title: "Real Estate Listings",
                  description: "Browse available commercial spaces matching your size, budget, and neighborhood — linked to actual listings.",
                },
                {
                  icon: "💬",
                  title: "Ask Your Advisor",
                  description: "Chat with an AI that knows your full plan — stress-test assumptions, explore pivots, get specific answers.",
                },
                {
                  icon: "🤝",
                  title: "Investor Matching",
                  description: "Surface LA-area angels and micro-VCs aligned to your industry and stage, with warm intro context.",
                },
                {
                  icon: "⚡",
                  title: "One-Click Applications",
                  description: "Pre-fill and submit directly to Kiva LA, LISC LA, and SBA Microloan programs from your plan data.",
                },
              ].map(({ icon, title, description }) => (
                <div
                  key={title}
                  className="border border-white/5 bg-white/[0.02] rounded-2xl p-6 relative overflow-hidden opacity-70 cursor-not-allowed"
                >
                  {/* Watermark */}
                  <div
                    className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
                    style={{ opacity: 0.03, fontSize: "4rem", fontFamily: "serif", transform: "rotate(-20deg)", letterSpacing: "0.5em", color: "#D4A853" }}
                  >
                    FUTURE
                  </div>
                  {/* Lock + badge */}
                  <div className="absolute top-4 right-4 flex items-center gap-2">
                    <span className="font-dm text-[10px] text-gold bg-gold/10 border border-gold/20 rounded-full px-2 py-0.5 uppercase tracking-widest">Coming Soon</span>
                    <span className="text-white/30 text-sm">🔒</span>
                  </div>
                  <div className="text-2xl mb-3">{icon}</div>
                  <h3 className="font-playfair text-base text-white/50 mb-2">{title}</h3>
                  <p className="font-dm text-xs text-white/30 leading-relaxed">{description}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Footer actions */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="pt-8 text-center space-y-4"
          >
            <div className="flex gap-4 justify-center flex-wrap">
              <button
                onClick={downloadHTML}
                className="px-8 py-3.5 border border-gold/30 text-gold font-dm font-semibold text-sm tracking-wider uppercase rounded-full hover:bg-gold/10 transition-all duration-200"
              >
                Download Report
              </button>
              <button
                onClick={exportPPTX}
                disabled={isPptxExporting}
                className={`px-8 py-3.5 border border-gold/30 text-gold font-dm font-semibold text-sm tracking-wider uppercase rounded-full transition-all duration-200 flex items-center gap-2 ${isPptxExporting ? "opacity-60 cursor-not-allowed" : "hover:bg-gold/10"}`}
              >
                {isPptxExporting ? (
                  <>
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="inline-block w-3.5 h-3.5 border-2 border-gold border-t-transparent rounded-full"
                    />
                    Exporting...
                  </>
                ) : (
                  "Export to PPTX"
                )}
              </button>
            </div>
            <button
              onClick={resetAll}
              className="px-10 py-4 border border-white/10 text-white/40 font-dm font-semibold text-sm tracking-wider uppercase rounded-full hover:text-white/60 hover:border-white/20 transition-all duration-200"
            >
              Start Over
            </button>
            <p className="font-dm text-xs text-white/20">
              Powered by Claude + LA Launch
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  return null;
}

// ── HTML Report Generator ──────────────────────────────────────

function generateHTMLReport(report: ReportData): string {
  const safeStr = (s: unknown) => String(s ?? "").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const scorecard = report.marketScan?.feasibilityScorecard;
  const bp = report.businessPlan;

  function renderMilestone(value: string | string[]): string {
    if (Array.isArray(value)) {
      return `<ul>${value.map(b => `<li>${safeStr(b)}</li>`).join("")}</ul>`;
    }
    return `<p>${safeStr(value)}</p>`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${safeStr(report.businessName)} — Business Plan</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  body { font-family: 'DM Sans', sans-serif; background: #0A0A0A; color: rgba(255,255,255,0.8); max-width: 900px; margin: 40px auto; padding: 0 24px; line-height: 1.7; }
  h1 { font-family: 'Playfair Display', serif; font-size: 2.8em; margin-bottom: 4px; color: #fff; }
  h2 { font-family: 'Playfair Display', serif; font-size: 1.5em; color: #D4A853; margin-top: 2.8em; border-bottom: 1px solid rgba(212,168,83,0.25); padding-bottom: 8px; }
  h3 { font-family: 'DM Sans', sans-serif; font-size: 0.75em; color: rgba(212,168,83,0.6); text-transform: uppercase; letter-spacing: .1em; margin-top: 1.8em; margin-bottom: 6px; }
  p { margin: 0.6em 0; }
  ul, ol { padding-left: 1.4em; }
  li { margin: 0.4em 0; color: rgba(255,255,255,0.7); }
  table { border-collapse: collapse; width: 100%; margin: 1em 0; font-size: 0.85em; }
  th { text-align: left; padding: 8px 10px; background: rgba(212,168,83,0.08); color: rgba(212,168,83,0.7); font-size: 0.75em; text-transform: uppercase; letter-spacing: .08em; }
  td { padding: 8px 10px; border-bottom: 1px solid rgba(255,255,255,0.05); vertical-align: top; color: rgba(255,255,255,0.6); }
  tr.highlight td { color: #D4A853; background: rgba(212,168,83,0.05); }
  tr.preopen td { color: rgba(251,191,36,0.8); background: rgba(245,158,11,0.05); }
  .stat { font-family: 'Playfair Display', serif; font-size: 1.5em; font-weight: 700; color: #D4A853; }
  .meta { color: rgba(255,255,255,0.3); font-size: 0.85em; margin-bottom: 2.5em; }
  .warning { background: rgba(245,158,11,0.07); border: 1px solid rgba(245,158,11,0.25); padding: 14px 18px; border-radius: 8px; margin: 1em 0; color: rgba(253,230,138,0.85); }
  .amber { background: rgba(245,158,11,0.05); border-left: 3px solid rgba(245,158,11,0.35); padding: 12px 16px; margin: 0.8em 0; color: rgba(253,230,138,0.75); }
  .assumptions-card { background: rgba(212,168,83,0.05); border: 1px solid rgba(212,168,83,0.2); border-radius: 8px; padding: 14px 18px; margin: 1em 0; display: flex; gap: 24px; flex-wrap: wrap; }
  .assumptions-card .kpi { text-align: center; flex: 1; min-width: 100px; }
  .assumptions-card .kpi-val { font-family: 'Playfair Display', serif; font-size: 1.4em; color: #D4A853; }
  .assumptions-card .kpi-lbl { font-size: 0.7em; text-transform: uppercase; letter-spacing: .08em; color: rgba(255,255,255,0.4); margin-top: 2px; }
  @media print { body { margin: 20px auto; } }
</style>
</head>
<body>
<h1>${safeStr(report.businessName)}</h1>
<p class="meta">Business Plan · Generated by LA Launch · Powered by Claude AI</p>

<h2>1. Input Quality Gate</h2>
<p class="stat">Readiness Score: ${safeStr(report.qualityGate?.readinessScore)}</p>
${report.qualityGate?.unreliableSectionsWarning ? `<div class="warning">${safeStr(report.qualityGate.unreliableSectionsWarning)}</div>` : ""}
<h3>Top Questions to Answer Next</h3>
<ol>${(report.qualityGate?.topGaps ?? []).map(q => `<li>${safeStr(q)}</li>`).join("")}</ol>

<h2>2. LA Market Scan & Feasibility</h2>
${scorecard ? `
<h3>Feasibility Scorecard</h3>
<table>
  <tr><th>Metric</th><th>Score (1–5)</th></tr>
  <tr><td>Demand</td><td>${scorecard.demand}</td></tr>
  <tr><td>Competition</td><td>${scorecard.competition}</td></tr>
  <tr><td>Ops Complexity</td><td>${scorecard.opsComplexity}</td></tr>
  <tr><td>Capital Intensity</td><td>${scorecard.capitalIntensity}</td></tr>
  <tr><td>Regulatory Risk</td><td>${scorecard.regulatoryRisk}</td></tr>
  <tr><td>Timeline Realism</td><td>${scorecard.timelineRealism}</td></tr>
</table>
` : ""}
<h3>Go / No-Go Analysis</h3>
<ul>${(report.marketScan?.executiveSummary ?? []).map(b => `<li>${safeStr(b)}</li>`).join("")}</ul>
<h3>Location Analysis</h3>
<p>${safeStr(report.marketScan?.locationAnalysis?.recommendedAreas)}</p>
<p class="stat">Est. Monthly Rent: ${safeStr(report.marketScan?.locationAnalysis?.estimatedMonthlyRent)}</p>
<h3>Next 5 Actions</h3>
<ol>${(report.marketScan?.next5Actions ?? []).map(a => `<li>${safeStr(a)}</li>`).join("")}</ol>

<h2>3. Business Plan</h2>
<h3>Executive Summary</h3>
${(bp?.executiveSummary ?? "").split(/\n\n+/).filter(p => p.trim()).map(p => `<p>${safeStr(p)}</p>`).join("")}
${bp?.productService ? `
<h3>Product / Service</h3>
<p><strong>Offerings:</strong> ${safeStr(bp.productService.offerings)}</p>
<p><strong>Pricing Logic:</strong> ${safeStr(bp.productService.pricingLogic)}</p>
<p><strong>Differentiation:</strong> ${safeStr(bp.productService.differentiation)}</p>
` : ""}
${bp?.goToMarket ? `
<h3>Go-to-Market</h3>
<p><strong>Channels:</strong> ${safeStr(bp.goToMarket.channels)}</p>
<p><strong>Launch Plan:</strong> ${safeStr(bp.goToMarket.launchPlan)}</p>
<p><strong>Retention:</strong> ${safeStr(bp.goToMarket.retention)}</p>
` : ""}
${bp?.operationsPlan ? `
<h3>Operations Plan</h3>
<p><strong>Location:</strong> ${safeStr(bp.operationsPlan.location)}</p>
<p><strong>Staffing:</strong> ${safeStr(bp.operationsPlan.staffing)}</p>
<p><strong>Workflow:</strong> ${safeStr(bp.operationsPlan.workflow)}</p>
` : ""}
<h3>Milestones</h3>
<p><strong>Days 0–30:</strong></p>${renderMilestone(bp?.milestones?.days0to30 ?? "")}
<p><strong>Days 31–90:</strong></p>${renderMilestone(bp?.milestones?.days31to90 ?? "")}
<p><strong>Days 91–180:</strong></p>${renderMilestone(bp?.milestones?.days91to180 ?? "")}
<h3>Risks & Mitigations</h3>
<table>
  <tr><th>Risk</th><th>Trigger</th><th>Response</th></tr>
  ${(bp?.risksAndMitigations ?? []).map(r => `<tr><td>${safeStr(r.risk)}</td><td>${safeStr(r.trigger)}</td><td>${safeStr(r.response)}</td></tr>`).join("")}
</table>

<h2>4. Pitch Deck</h2>
${(report.pitchDeck?.slides ?? []).map(slide => `
  <h3>${slide.slideNumber}. ${safeStr(slide.title)}</h3>
  <ul>${slide.bullets.map(b => `<li>${safeStr(b)}</li>`).join("")}</ul>
  <p class="amber"><em>Speaker notes: ${safeStr(slide.speakerNotes)}</em></p>
`).join("")}

<h2>Funding Options</h2>
${(report.fundingOptions ?? []).map(f => `<h3>${safeStr(f.name)} — ${safeStr(f.amount)}</h3><p>${safeStr(f.description)}</p><p><em>Why it fits: ${safeStr(f.fit)}</em></p>`).join("")}

<h2>Required Permits</h2>
${(report.permits ?? []).map(p => `<h3>${safeStr(p.name)} — ${safeStr(p.estimatedCost)} · ${safeStr(p.timeline)}</h3><p>${safeStr(p.description)}</p>`).join("")}

<h2>Next Steps</h2>
<ol>${(report.nextSteps ?? []).map(s => `<li>${safeStr(s)}</li>`).join("")}</ol>

<h2>Risk Factors</h2>
<ul>${(report.riskFactors ?? []).map(r => `<li>${safeStr(r)}</li>`).join("")}</ul>

<p style="margin-top:3em; font-size:0.75em; color:rgba(255,255,255,0.2); text-align:center;">Powered by Claude + LA Launch</p>
</body>
</html>`;
}
