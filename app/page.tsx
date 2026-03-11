"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  Tooltip, ReferenceLine, ResponsiveContainer, LabelList,
} from "recharts";

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

interface MonthlyProjection {
  month: number;
  revenue: number;
  cogs: number;
  opex: number;
  netIncome: number;
}

interface StartupCostItem {
  item: string;
  cost: number;
}

interface Financials {
  startupCosts: StartupCostItem[];
  unitEconomics: {
    avgTicket: number;
    cogs: number;
    grossMarginPct: number;
    dailyTransactionsToBreakEven: number;
  };
  scenarios: {
    downside: FinancialScenario;
    base: FinancialScenario;
    upside: FinancialScenario;
  };
  recommendedScenario: "downside" | "base" | "upside";
  assumptionPressure: string[];
  credibilityNote: string;
  totalStartupCost: number;
}

interface FinancialScenario {
  monthlyProjections: MonthlyProjection[];
  breakEvenMonth: number;
  year1Revenue: number;
  year1NetIncome: number;
}

interface ReportData {
  businessName: string;
  qualityGate: {
    readinessScore: number;
    readinessLabel: string;
    topGaps: string[];
    sectionConfidence: Record<string, "high" | "medium" | "low">;
  };
  marketScan: {
    verdict: string;
    feasibility: {
      demand: number;
      competition: number;
      opsComplexity: number;
      capitalIntensity: number;
      regulatoryRisk: number;
      timelineRealism: number;
    };
    targetCustomer: string;
    topCompetitors: Array<{ name: string; threat: string; weakness: string }>;
    locationRec: {
      primary: string;
      secondary: string;
      monthlyRent: string;
      whyHere: string;
    };
    next3Actions: string[];
  };
  businessPlan: {
    executiveSummary: string;
    product: {
      headline: string;
      bullets: string[];
      moat: string;
    };
    goToMarket: {
      phases: Array<{ label: string; action: string }>;
      channels: string[];
      retention: string;
    };
    operations: {
      locationName: string;
      locationWhy: string;
      bullets: string[];
    };
    milestones: Array<{ period: string; items: string[] }>;
    permits: Array<{ name: string; cost: number; timelineWeeks: number; action: string }>;
    funding: Array<{ source: string; amount: number; fit: string }>;
    risks: Array<{ risk: string; mitigation: string }>;
    financials: Financials;
    financialWarnings: string[];
    financialConsistency: "aligned" | "fragile" | "optimistic";
  };
  pitchDeck: {
    slides: Array<{
      slideNumber: number;
      title: string;
      bullets: string[];
    }>;
  };
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
  "Modeling 12-month cash runway...",
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

function StatCallout({ label, value, color = "gold" }: { label: string; value: string; color?: "gold" | "green" | "white" }) {
  const colorClass = color === "gold" ? "text-gold" : color === "green" ? "text-green-400" : "text-white";
  return (
    <div className="bg-noir/60 border border-gold/20 rounded-xl p-5 text-center">
      <div className={`font-playfair text-3xl font-bold ${colorClass} leading-tight mb-1`}>
        {value}
      </div>
      <div className="font-dm text-xs text-white/40 uppercase tracking-widest mt-1">
        {label}
      </div>
    </div>
  );
}

function FeasibilityBar({ label, value }: { label: string; value: number }) {
  const clamped = Math.max(1, Math.min(5, value));
  return (
    <div className="flex items-center gap-3">
      <span className="font-dm text-xs text-white/60 w-32 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(clamped / 5) * 100}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full bg-gold rounded-full"
        />
      </div>
      <span className="font-dm text-xs text-gold w-6 text-right">{clamped}</span>
    </div>
  );
}

function ReadinessGauge({ score }: { score: number }) {
  const color = score >= 7 ? "#D4A853" : score >= 4 ? "#F59E0B" : "#EF4444";
  const r = 36;
  const circ = 2 * Math.PI * r;
  const dash = circ * (score / 10);
  return (
    <svg width="96" height="96" viewBox="0 0 96 96" aria-label={`Readiness score: ${score} out of 10`}>
      <circle cx="48" cy="48" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
      <circle
        cx="48" cy="48" r={r} fill="none"
        stroke={color} strokeWidth="6"
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeLinecap="round"
        transform="rotate(-90 48 48)"
      />
      <text x="48" y="54" textAnchor="middle" fill={color} fontSize="26" fontFamily="Georgia, serif" fontWeight="bold">
        {score}
      </text>
    </svg>
  );
}

function formatCurrency(value: number | undefined | null): string {
  return `$${Number(value ?? 0).toLocaleString()}`;
}

function formatBreakEven(month: number | undefined | null): string {
  const numericMonth = Number(month ?? 0);
  if (!numericMonth || numericMonth > 12) return "No BE";
  return `Mo ${numericMonth}`;
}

function truncateWords(text: string, maxWords: number): string {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return text;
  return `${words.slice(0, maxWords).join(" ")}...`;
}

function compactStartupCostLabel(label: string): string {
  const normalized = label
    .split("(")[0]
    .split(",")[0]
    .replace(/\s+/g, " ")
    .trim();
  return truncateWords(normalized, 3);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ProjectionTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#1a1a1a", border: "1px solid rgba(212,168,83,0.35)", borderRadius: 8, padding: "8px 12px", fontSize: 11, fontFamily: "DM Sans, sans-serif" }}>
      <div style={{ color: "rgba(255,255,255,0.45)", marginBottom: 4 }}>Month {label}</div>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {payload.map((entry: any) => (
        <div key={entry.name} style={{ color: entry.color, marginBottom: 2 }}>
          {entry.name}: ${Number(entry.value).toLocaleString()}
        </div>
      ))}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CostTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#1a1a1a", border: "1px solid rgba(212,168,83,0.35)", borderRadius: 8, padding: "6px 10px", fontSize: 11, fontFamily: "DM Sans, sans-serif", color: "#D4A853" }}>
      ${Number(payload[0]?.value ?? 0).toLocaleString()}
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
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatStreaming, setChatStreaming] = useState(false);
  const [extractedFormData, setExtractedFormData] = useState<FormData | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    "market-scan": true,
    "business-plan": true,
    "financials": true,
    "pitch-deck": true,
  });
  const [activePitchSlide, setActivePitchSlide] = useState(0);
  const [openPermitActions, setOpenPermitActions] = useState<Record<string, boolean>>({});
  const [activeScenario, setActiveScenario] = useState<"downside" | "base" | "upside">("base");

  function toggleSection(id: string) {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function togglePermitAction(id: string) {
    setOpenPermitActions((prev) => ({ ...prev, [id]: !prev[id] }));
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
      case 4: return formData.neighborhoods.length > 0;
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
          const ssePayload = line.slice(6).trim();
          if (ssePayload === "[DONE]") break;

          let event: Record<string, unknown>;
          try {
            event = JSON.parse(ssePayload);
          } catch {
            continue;
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
            const nextReport = event.report as ReportData;
            setReport(nextReport);
            setActiveScenario(nextReport.businessPlan?.financials?.recommendedScenario ?? "base");
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
    setActivePitchSlide(0);
    setOpenPermitActions({});
    setActiveScenario("base");
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

          <div className="relative">
            <div className="absolute left-4 top-4 bottom-4 w-px bg-white/10" />
            <div className="space-y-6">
              {pipelineStages.map((s, i) => (
                <div key={i} className="flex items-center gap-4 relative">
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

  // ── REPORT DASHBOARD ───────────────────────────────────────

  if (stage === "report" && report) {
    const bp = report.businessPlan;
    const ms = report.marketScan;
    const fin = bp?.financials;
    const recommendedScenario = fin?.recommendedScenario ?? "base";
    const selectedScenario = fin?.scenarios?.[activeScenario] ?? fin?.scenarios?.[recommendedScenario];
    const score = typeof report.qualityGate?.readinessScore === "number"
      ? report.qualityGate.readinessScore
      : parseInt(String(report.qualityGate?.readinessScore ?? "5"), 10) || 5;

    const monthlyRevAtScale = selectedScenario?.monthlyProjections?.find((projection) => projection.month >= 6)?.revenue ?? 0;
    const sortedStartupCosts = fin?.startupCosts
      ? [...fin.startupCosts].sort((a, b) => b.cost - a.cost)
      : [];
    const chartStartupCosts = sortedStartupCosts.map((item) => ({
      ...item,
      shortLabel: compactStartupCostLabel(item.item),
    }));
    const productLabels = ["Offer", "Upsell", "Source"];
    const operationsLabels = ["Staffing", "Hours", "Supply"];

    const threatColor = (threat: string) => {
      if (threat === "high") return "text-red-400";
      if (threat === "medium") return "text-amber-400";
      return "text-green-400";
    };

    const confidenceStyles = (level: string) => {
      if (level === "high") return { text: "text-green-400", fill: "bg-green-400", width: "w-full" };
      if (level === "medium") return { text: "text-amber-400", fill: "bg-amber-400", width: "w-2/3" };
      return { text: "text-red-400", fill: "bg-red-400", width: "w-1/3" };
    };

    return (
      <div className="min-h-screen bg-noir text-white pb-24">

        {/* ── A. HERO HEADER ── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="px-6 py-14 border-b border-white/[0.06]"
          style={{ background: "radial-gradient(ellipse 70% 60% at 50% 0%, rgba(212,168,83,0.06) 0%, transparent 70%)" }}
        >
          <div className="max-w-3xl mx-auto">
            <div className="font-dm text-xs text-gold/50 uppercase tracking-[0.3em] mb-4 text-center">
              Business Plan · LA Launch
            </div>

            {/* Name + gauge row */}
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-10">
              <div className="shrink-0">
                <ReadinessGauge score={score} />
                <div className="font-dm text-xs text-white/40 text-center mt-1">Readiness</div>
              </div>
              <div className="flex-1 text-center md:text-left">
                <h1 className="font-playfair text-5xl md:text-6xl text-white leading-tight mb-2">
                  {report.businessName}
                </h1>
                {report.qualityGate?.readinessLabel && (
                  <p className="font-dm text-sm text-white/40">{report.qualityGate.readinessLabel}</p>
                )}
              </div>
            </div>

            {/* 3 financial hero stats */}
            {fin && (
              <div className="grid grid-cols-3 gap-4">
                <StatCallout
                  label="Total Startup Cost"
                  value={`$${(fin.totalStartupCost ?? 0).toLocaleString()}`}
                  color="gold"
                />
                <StatCallout
                  label="Monthly Revenue (Mo 6)"
                  value={formatCurrency(monthlyRevAtScale)}
                  color="gold"
                />
                <StatCallout
                  label="Break-even Month"
                  value={formatBreakEven(selectedScenario?.breakEvenMonth)}
                  color="gold"
                />
              </div>
            )}

            {/* Section confidence bars */}
            {report.qualityGate?.sectionConfidence && (
              <div className="mt-8 space-y-3">
                {Object.entries(report.qualityGate.sectionConfidence).map(([section, level]) => (
                  <div key={section} className="flex items-center gap-4">
                    <span className="font-dm text-base text-white w-32 shrink-0">
                      {section.replace(/([A-Z])/g, " $1").trim()}
                    </span>
                    <div className="h-6 w-full rounded-full bg-white/5 overflow-hidden">
                      <div className={`h-full rounded-full ${confidenceStyles(level).fill} ${confidenceStyles(level).width}`} />
                    </div>
                    <span className={`font-dm text-sm capitalize ${confidenceStyles(level).text}`}>
                      {level}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Top gaps */}
            {report.qualityGate?.topGaps?.length > 0 && (
              <div className="mt-8">
                <div className="font-dm text-xs text-gold/50 uppercase tracking-widest mb-4">Top Gaps</div>
                <ol className="space-y-3">
                  {report.qualityGate.topGaps.map((gap, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="font-dm text-base text-white/55 shrink-0">{i + 1}.</span>
                      <span className="text-base leading-relaxed shrink-0">⚠</span>
                      <p className="font-dm text-base text-white/70 leading-relaxed">{gap}</p>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </motion.div>

        {/* ── CARDS ── */}
        <div className="max-w-3xl mx-auto px-6 pt-10 space-y-6">

          {/* ── B. MARKET SCAN ── */}
          <SectionCard title="Market Scan" delay={0.1} id="market-scan" open={openSections["market-scan"]} onToggle={() => toggleSection("market-scan")}>
            <div className="space-y-8">

              {/* Verdict */}
              {ms?.verdict && (
                <div className="border-l-4 border-gold pl-5 py-1">
                  <p className="font-playfair text-lg text-gold leading-snug">{ms.verdict}</p>
                </div>
              )}

              {/* Target customer */}
              {ms?.targetCustomer && (
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3">
                  <div className="font-dm text-xs text-gold/50 uppercase tracking-widest mb-1">Target Customer</div>
                  <p className="font-dm text-sm text-white/70">{ms.targetCustomer}</p>
                </div>
              )}

              {/* Feasibility bars */}
              {ms?.feasibility && (
                <div>
                  <div className="font-dm text-xs text-gold/50 uppercase tracking-widest mb-4">Feasibility Scores (5 = best)</div>
                  <div className="space-y-3">
                    {[
                      { label: "Demand", key: "demand" },
                      { label: "Competition", key: "competition" },
                      { label: "Ops Complexity", key: "opsComplexity" },
                      { label: "Capital Intensity", key: "capitalIntensity" },
                      { label: "Regulatory Risk", key: "regulatoryRisk" },
                      { label: "Timeline Realism", key: "timelineRealism" },
                    ].map(({ label, key }) => (
                      <FeasibilityBar key={key} label={label} value={ms.feasibility[key as keyof typeof ms.feasibility] as number} />
                    ))}
                  </div>
                </div>
              )}

              {/* Competitors table */}
              {ms?.topCompetitors?.length > 0 && (
                <div>
                  <div className="font-dm text-xs text-gold/50 uppercase tracking-widest mb-3">Top Competitors</div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left font-dm text-xs text-gold/50 pb-2 pr-4 uppercase tracking-wider">Name</th>
                          <th className="text-left font-dm text-xs text-gold/50 pb-2 pr-4 uppercase tracking-wider w-24">Threat</th>
                          <th className="text-left font-dm text-xs text-gold/50 pb-2 uppercase tracking-wider">Weakness</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ms.topCompetitors.map((c, i) => (
                          <tr key={i} className="border-b border-white/5">
                            <td className="py-2.5 pr-4 font-dm text-white/80 align-top text-sm">{c.name}</td>
                            <td className={`py-2.5 pr-4 font-dm text-xs align-top capitalize ${threatColor(c.threat)}`}>{c.threat}</td>
                            <td className="py-2.5 font-dm text-white/50 align-top text-xs">{c.weakness}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Location rec */}
              {ms?.locationRec && (
                <div className="bg-noir/60 border border-gold/15 rounded-xl p-5">
                  <div className="font-dm text-xs text-gold/50 uppercase tracking-widest mb-3">Location Recommendation</div>
                  <div className="space-y-2">
                    <div>
                      <span className="font-dm text-xs text-white/40">Primary: </span>
                      <span className="font-dm text-sm text-white font-semibold">{ms.locationRec.primary}</span>
                    </div>
                    <div>
                      <span className="font-dm text-xs text-white/40">Secondary: </span>
                      <span className="font-dm text-sm text-white/70">{ms.locationRec.secondary}</span>
                    </div>
                    <div>
                      <span className="font-dm text-xs text-white/40">Rent: </span>
                      <span className="font-dm text-sm text-gold">{ms.locationRec.monthlyRent}</span>
                    </div>
                    <p className="font-dm text-xs text-white/50 mt-2">{ms.locationRec.whyHere}</p>
                  </div>
                </div>
              )}

              {/* Next 3 actions */}
              {ms?.next3Actions?.length > 0 && (
                <div>
                  <div className="font-dm text-xs text-gold/50 uppercase tracking-widest mb-3">Next 3 Actions</div>
                  <ol className="space-y-3">
                    {ms.next3Actions.map((action, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="font-playfair text-xl text-gold/30 w-6 shrink-0 leading-tight">{i + 1}</span>
                        <p className="font-dm text-sm text-white/70 leading-relaxed pt-0.5">{action}</p>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          </SectionCard>

          {/* ── C. BUSINESS PLAN ── */}
          <SectionCard title="Business Plan" delay={0.15} id="business-plan" open={openSections["business-plan"]} onToggle={() => toggleSection("business-plan")}>
            <div className="space-y-8">

              {/* Exec summary */}
              {bp?.executiveSummary && (
                <blockquote className="border-l-2 border-gold/40 pl-6">
                  <p className="font-dm text-white/75 leading-relaxed text-base">{bp.executiveSummary}</p>
                </blockquote>
              )}

              {/* Product / GoToMarket / Operations */}
              <div className="space-y-4">
                {bp?.product && (
                  <div className="bg-noir/60 border border-white/[0.07] rounded-xl p-6">
                    <div className="font-dm text-sm text-gold uppercase tracking-[0.2em]">Product</div>
                    <p className="mt-4 font-mono text-xl text-[#D4A853] leading-relaxed max-w-2xl">{bp.product.headline}</p>
                    <div className="mt-6 space-y-3 max-w-3xl">
                      {bp.product.bullets.map((bullet, i) => (
                        <div key={i} className="grid grid-cols-[88px_1fr] gap-4 items-start">
                          <span className="font-dm text-[11px] uppercase tracking-[0.18em] text-white/35">
                            {productLabels[i] ?? `Point ${i + 1}`}
                          </span>
                          <p className="font-dm text-base text-white/82 leading-7">
                            {truncateWords(bullet, 8)}
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-6 pt-5 border-t border-white/6">
                      <p className="italic text-base text-[#D4A853]/80 leading-7 max-w-3xl">{truncateWords(bp.product.moat, 20)}</p>
                    </div>
                  </div>
                )}
                {bp?.goToMarket && (
                  <div className="bg-noir/60 border border-white/[0.07] rounded-xl p-6">
                    <div className="font-dm text-sm text-gold uppercase tracking-[0.2em]">Go-to-Market</div>
                    <div className="mt-6 space-y-4 max-w-3xl">
                      {bp.goToMarket.phases.map((phase, i) => (
                        <div key={`${phase.label}-${i}`} className="flex items-start gap-3">
                          <div className="flex flex-col items-center shrink-0">
                            <div className="w-2.5 h-2.5 rounded-full bg-[#D4A853]" />
                            {i < bp.goToMarket.phases.length - 1 && <div className="w-px h-10 bg-[#D4A853]/30" />}
                          </div>
                          <div className="min-w-0">
                            <div className="text-lg font-medium text-white">{phase.label}</div>
                            <div className="text-base text-white/60 leading-7">{truncateWords(phase.action, 10)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {bp.goToMarket.channels.length > 0 && (
                      <div className="mt-6">
                        <div className="font-dm text-[11px] uppercase tracking-[0.18em] text-white/35 mb-2">Top Channels</div>
                        <div className="flex flex-wrap gap-2">
                        {bp.goToMarket.channels.slice(0, 3).map((channel, i) => (
                          <span key={`${channel}-${i}`} className="px-3 py-1 text-sm rounded-full border border-[#D4A853]/30 text-[#D4A853]/70">
                            {truncateWords(channel, 5)}
                          </span>
                        ))}
                        {bp.goToMarket.channels.length > 3 && (
                          <span className="px-3 py-1 text-sm rounded-full border border-white/10 text-white/35">
                            +{bp.goToMarket.channels.length - 3} more
                          </span>
                        )}
                        </div>
                      </div>
                    )}
                    <div className="mt-6 pt-5 border-t border-white/6">
                      <p className="italic text-base text-[#D4A853]/80 leading-7 max-w-3xl">{truncateWords(bp.goToMarket.retention, 20)}</p>
                    </div>
                  </div>
                )}
                {bp?.operations && (
                  <div className="bg-noir/60 border border-white/[0.07] rounded-xl p-6">
                    <div className="font-dm text-sm text-gold uppercase tracking-[0.2em]">Operations</div>
                    <div className="mt-6 space-y-5 max-w-3xl">
                      <div className="grid grid-cols-[88px_1fr] gap-4 items-start">
                        <span className="font-dm text-[11px] uppercase tracking-[0.18em] text-white/35">Where</span>
                        <div>
                          <div className="font-dm text-xl text-white leading-8">{truncateWords(bp.operations.locationName, 12)}</div>
                          <div className="font-dm text-base text-white/60 leading-7 mt-1">{truncateWords(bp.operations.locationWhy, 20)}</div>
                        </div>
                      </div>
                      {bp.operations.bullets.map((bullet, i) => (
                        <div key={i} className="grid grid-cols-[88px_1fr] gap-4 items-start">
                          <span className="font-dm text-[11px] uppercase tracking-[0.18em] text-white/35">
                            {operationsLabels[i] ?? `Step ${i + 1}`}
                          </span>
                          <p className="font-dm text-base text-white/82 leading-7">{truncateWords(bullet, 14)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Milestones timeline */}
              {bp?.milestones?.length > 0 && (
                <div>
                  <div className="font-dm text-xs text-gold/50 uppercase tracking-widest mb-4">Milestones</div>
                  <div className="relative">
                    {/* connecting line */}
                    <div className="hidden md:block absolute top-5 left-[calc(16.66%-1px)] right-[calc(16.66%-1px)] h-px bg-gold/20" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {bp.milestones.map((m, i) => (
                        <div key={i} className="relative">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-2.5 h-2.5 rounded-full bg-gold shrink-0" />
                            <div className="font-dm text-xs text-gold uppercase tracking-widest">{m.period}</div>
                          </div>
                          <ul className="space-y-1.5 pl-5">
                            {m.items.map((item, j) => (
                              <li key={j} className="flex gap-2">
                                <span className="text-gold/30 shrink-0 mt-1">·</span>
                                <p className="font-dm text-xs text-white/65 leading-relaxed">{item}</p>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-6">
                {bp?.permits?.length > 0 && (
                  <div>
                    <div className="font-dm text-xs text-gold/50 uppercase tracking-widest mb-3">Permits Required</div>
                    <div className="space-y-3">
                      {bp.permits.map((permit, i) => {
                        const permitId = `${permit.name}-${i}`;
                        const isOpen = openPermitActions[permitId] ?? false;
                        return (
                          <div key={permitId} className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3">
                            <button
                              onClick={() => togglePermitAction(permitId)}
                              className="w-full text-left"
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-[#D4A853] text-lg">✓</span>
                                <span className="font-dm font-medium text-white flex-1">{permit.name}</span>
                                <span className="font-dm text-sm text-[#D4A853]">{formatCurrency(permit.cost)}</span>
                                <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-white/40">
                                  {permit.timelineWeeks} wks
                                </span>
                                <span className={`inline-block text-white/35 transition-transform ${isOpen ? "rotate-180" : ""}`}>⌄</span>
                              </div>
                            </button>
                            {isOpen && (
                              <div className="pl-7 pt-2 text-sm text-white/40">
                                {permit.action}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {bp?.funding?.length > 0 && (
                  <div>
                    <div className="font-dm text-xs text-gold/50 uppercase tracking-widest mb-3">Funding Options</div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {bp.funding.map((funding, i) => (
                        <div key={`${funding.source}-${i}`} className="bg-[#1a1a1a] rounded-lg p-4 border-t-2 border-[#D4A853]">
                          <div className="text-xs uppercase tracking-wider text-[#D4A853]/60 mb-1">{funding.source}</div>
                          <div className="text-2xl font-bold text-[#D4A853]">{formatCurrency(funding.amount)}</div>
                          <div className="text-sm text-white/40 mt-1">{funding.fit}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {bp?.risks?.length > 0 && (
                  <div>
                    <div className="font-dm text-xs text-gold/50 uppercase tracking-widest mb-3">Risks & Mitigations</div>
                    <div className="divide-y divide-white/5">
                      {bp.risks.map((risk, i) => (
                        <div key={`${risk.risk}-${i}`} className="flex items-start gap-3 py-3">
                          <p className="flex-1 text-sm text-white/70">{risk.risk}</p>
                          <span className="text-[#D4A853] mt-0.5 shrink-0">→</span>
                          <p className="flex-1 text-sm text-white/40">{risk.mitigation}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </SectionCard>

          {/* ── D. FINANCIAL MODEL ── */}
          {fin && (
            <SectionCard title="Financial Model" delay={0.2} id="financials" open={openSections["financials"]} onToggle={() => toggleSection("financials")}>
              <div className="space-y-10">
                <div className="rounded-2xl border border-gold/15 bg-noir/70 p-5 space-y-5">
                  {(bp.financialWarnings.length > 0 || bp.financialConsistency !== "aligned") && (
                    <div className={`rounded-xl px-4 py-4 border ${
                      bp.financialConsistency === "optimistic"
                        ? "border-amber-400/20 bg-amber-400/8"
                        : "border-white/10 bg-white/[0.03]"
                    }`}>
                      <div className="font-dm text-xs uppercase tracking-widest text-gold/70">
                        Why this may not be a good idea yet
                      </div>
                      <div className="mt-2 space-y-2">
                        {bp.financialWarnings.map((warning, i) => (
                          <p key={i} className="text-sm text-white/75 leading-6">
                            {warning}
                          </p>
                        ))}
                        {bp.financialConsistency === "optimistic" && (
                          <div className="inline-flex rounded-full border border-amber-400/20 px-3 py-1 text-xs uppercase tracking-widest text-amber-300/80">
                            Best-case only warning
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="font-dm text-xs text-gold/50 uppercase tracking-widest">Scenario View</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {(["downside", "base", "upside"] as const).map((scenario) => (
                          <button
                            key={scenario}
                            onClick={() => setActiveScenario(scenario)}
                            className={`px-3 py-1.5 rounded-full border text-xs uppercase tracking-widest transition-colors ${
                              activeScenario === scenario
                                ? "border-gold bg-gold/10 text-gold"
                                : "border-white/10 text-white/40 hover:border-white/20 hover:text-white/60"
                            }`}
                          >
                            {scenario}
                            {scenario === recommendedScenario ? " *" : ""}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="text-left md:text-right">
                      <div className="font-dm text-xs text-white/35 uppercase tracking-widest">Most realistic for this idea</div>
                      <div className="mt-1 font-playfair text-2xl text-white capitalize">{recommendedScenario}</div>
                    </div>
                  </div>

                  {fin.assumptionPressure.length > 0 && (
                    <div>
                      <div className="font-dm text-xs text-gold/50 uppercase tracking-widest mb-3">What the numbers depend on</div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {fin.assumptionPressure.map((pressure, i) => (
                          <div key={i} className="rounded-xl border border-amber-400/15 bg-amber-400/5 px-4 py-3 text-sm text-white/72 leading-6">
                            {truncateWords(pressure, 10)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="rounded-xl border border-red-400/15 bg-red-400/5 px-4 py-3">
                    <div className="font-dm text-xs uppercase tracking-widest text-red-300/80">This only works if</div>
                    <p className="mt-2 text-sm text-white/72 leading-6">{fin.credibilityNote}</p>
                  </div>
                </div>

                {/* Unit economics row */}
                {fin.unitEconomics && (
                  <div>
                    <div className="font-dm text-xs text-gold/50 uppercase tracking-widest mb-4">Unit Economics</div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <StatCallout label="Avg Ticket" value={`$${fin.unitEconomics.avgTicket?.toFixed(2)}`} color="gold" />
                      <StatCallout label="COGS / Unit" value={`$${fin.unitEconomics.cogs?.toFixed(2)}`} color="white" />
                      <StatCallout label="Gross Margin" value={`${fin.unitEconomics.grossMarginPct}%`} color="gold" />
                      <StatCallout label="Daily Break-even" value={`${fin.unitEconomics.dailyTransactionsToBreakEven} txns`} color="white" />
                    </div>
                  </div>
                )}

                {/* Startup costs horizontal bar chart */}
                {sortedStartupCosts.length > 0 && (
                  <div>
                    <div className="font-dm text-xs text-gold/50 uppercase tracking-widest mb-4">Startup Costs Breakdown</div>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.6, delay: 0.3 }}
                    >
                      <ResponsiveContainer width="100%" height={Math.max(180, sortedStartupCosts.length * 36)}>
                        <BarChart
                          data={chartStartupCosts}
                          layout="vertical"
                          margin={{ top: 0, right: 80, left: 32, bottom: 0 }}
                        >
                          <XAxis type="number" hide />
                          <YAxis
                            type="category"
                            dataKey="shortLabel"
                            width={132}
                            tick={{ fill: "rgba(255,255,255,0.75)", fontSize: 12, fontFamily: "DM Sans, sans-serif" }}
                            axisLine={false}
                            tickLine={false}
                            tickMargin={14}
                          />
                          <Tooltip content={<CostTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                          <Bar dataKey="cost" fill="#D4A853" radius={[0, 4, 4, 0]}>
                            <LabelList
                              dataKey="cost"
                              position="right"
                              // eslint-disable-next-line @typescript-eslint/no-explicit-any
                              formatter={(v: any) => `$${Number(v).toLocaleString()}`}
                              style={{ fill: "rgba(255,255,255,0.45)", fontSize: 11, fontFamily: "DM Sans, sans-serif" }}
                            />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </motion.div>
                    <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
                      {sortedStartupCosts.map((item, index) => (
                        <div key={`${item.item}-${index}`} className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="font-dm text-sm text-white">{compactStartupCostLabel(item.item)}</div>
                              <div className="mt-1 font-dm text-xs text-white/45 leading-5">{item.item}</div>
                            </div>
                            <div className="font-dm text-sm text-gold shrink-0">{formatCurrency(item.cost)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 12-month projection line chart */}
                {selectedScenario?.monthlyProjections?.length > 0 && (
                  <div>
                    <div className="font-dm text-xs text-gold/50 uppercase tracking-widest mb-4">
                      12-Month P&L Projection · {activeScenario}
                    </div>

                    {/* Legend */}
                    <div className="flex flex-wrap gap-4 mb-4">
                      {[
                        { color: "#D4A853", label: "Revenue" },
                        { color: "#8B7355", label: "COGS", dashed: true },
                        { color: "#666666", label: "OpEx", dashed: true },
                        { color: "#4ADE80", label: "Net Income" },
                      ].map(({ color, label, dashed }) => (
                        <div key={label} className="flex items-center gap-1.5">
                          <svg width="20" height="10">
                            <line
                              x1="0" y1="5" x2="20" y2="5"
                              stroke={color} strokeWidth="2"
                              strokeDasharray={dashed ? "4 3" : undefined}
                            />
                          </svg>
                          <span className="font-dm text-xs text-white/40">{label}</span>
                        </div>
                      ))}
                    </div>

                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.6, delay: 0.4 }}
                    >
                      <ResponsiveContainer width="100%" height={260}>
                        <LineChart
                          data={selectedScenario.monthlyProjections}
                          margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                        >
                          <XAxis
                            dataKey="month"
                            tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10, fontFamily: "DM Sans, sans-serif" }}
                            axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
                            tickLine={false}
                            label={{ value: "Month", position: "insideBottomRight", fill: "rgba(255,255,255,0.25)", fontSize: 10, offset: -5 }}
                          />
                          <YAxis
                            tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10, fontFamily: "DM Sans, sans-serif" }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(v) => v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`}
                            width={48}
                          />
                          <Tooltip content={<ProjectionTooltip />} cursor={{ stroke: "rgba(212,168,83,0.2)", strokeWidth: 1 }} />
                          {selectedScenario.breakEvenMonth && selectedScenario.breakEvenMonth <= 12 && (
                            <ReferenceLine
                              x={selectedScenario.breakEvenMonth}
                              stroke="#D4A853"
                              strokeDasharray="4 4"
                              strokeOpacity={0.5}
                              label={{ value: `BE`, position: "top", fill: "#D4A853", fontSize: 9, fontFamily: "DM Sans, sans-serif" }}
                            />
                          )}
                          <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#D4A853" strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: "#D4A853" }} />
                          <Line type="monotone" dataKey="cogs" name="COGS" stroke="#8B7355" strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
                          <Line type="monotone" dataKey="opex" name="OpEx" stroke="#666666" strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
                          <Line type="monotone" dataKey="netIncome" name="Net Income" stroke="#4ADE80" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: "#4ADE80" }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </motion.div>
                  </div>
                )}

                {/* Year 1 summary stats */}
                  <div>
                    <div className="font-dm text-xs text-gold/50 uppercase tracking-widest mb-4">Year 1 Summary</div>
                    <div className="grid grid-cols-3 gap-4">
                      <StatCallout
                        label="Year 1 Revenue"
                        value={formatCurrency(selectedScenario?.year1Revenue)}
                        color="gold"
                      />
                      <StatCallout
                        label="Year 1 Net Income"
                        value={formatCurrency(selectedScenario?.year1NetIncome)}
                        color="green"
                      />
                      <StatCallout
                        label="Total Startup Cost"
                        value={formatCurrency(fin.totalStartupCost)}
                        color="white"
                      />
                    </div>
                  </div>
              </div>
            </SectionCard>
          )}

          {/* ── E. PITCH DECK ── */}
          <SectionCard title="Pitch Deck" delay={0.25} id="pitch-deck" open={openSections["pitch-deck"]} onToggle={() => toggleSection("pitch-deck")}>
            {report.pitchDeck?.slides?.length > 0 && (
              <div className="space-y-3">
                {/* Slide selector tabs */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {report.pitchDeck.slides.map((slide) => (
                    <button
                      key={slide.slideNumber}
                      onClick={() => setActivePitchSlide(slide.slideNumber - 1)}
                      className={`font-dm text-xs px-3 py-1.5 rounded-full border transition-all duration-200 ${
                        activePitchSlide === slide.slideNumber - 1
                          ? "border-gold bg-gold/10 text-gold"
                          : "border-white/10 text-white/40 hover:border-white/25 hover:text-white/60"
                      }`}
                    >
                      {slide.slideNumber}. {slide.title}
                    </button>
                  ))}
                </div>

                {/* Active slide display */}
                <AnimatePresence mode="wait">
                  {report.pitchDeck.slides[activePitchSlide] && (
                    <motion.div
                      key={activePitchSlide}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className="bg-noir/60 border border-gold/20 rounded-2xl p-8"
                    >
                      <div className="flex items-center gap-3 mb-6">
                        <span className="font-playfair text-3xl text-gold/30">
                          {report.pitchDeck.slides[activePitchSlide].slideNumber}
                        </span>
                        <h3 className="font-playfair text-2xl text-white">
                          {report.pitchDeck.slides[activePitchSlide].title}
                        </h3>
                      </div>
                      <ul className="space-y-4">
                        {report.pitchDeck.slides[activePitchSlide].bullets.map((bullet, i) => (
                          <li key={i} className="flex gap-4">
                            <span className="font-playfair text-lg text-gold/40 shrink-0 leading-tight">·</span>
                            <p className="font-dm text-base text-white/75 leading-relaxed">{bullet}</p>
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Prev / Next */}
                <div className="flex justify-between items-center pt-2">
                  <button
                    onClick={() => setActivePitchSlide((i) => Math.max(0, i - 1))}
                    disabled={activePitchSlide === 0}
                    className="font-dm text-sm text-white/30 hover:text-white/60 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                  >
                    ← Prev
                  </button>
                  <span className="font-dm text-xs text-white/25">
                    {activePitchSlide + 1} / {report.pitchDeck.slides.length}
                  </span>
                  <button
                    onClick={() => setActivePitchSlide((i) => Math.min(report.pitchDeck.slides.length - 1, i + 1))}
                    disabled={activePitchSlide === report.pitchDeck.slides.length - 1}
                    className="font-dm text-sm text-white/30 hover:text-white/60 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </SectionCard>

          {/* ── F. FOOTER ── */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="pt-8 text-center space-y-4"
          >
            <div className="flex gap-4 justify-center flex-wrap">
              <button
                onClick={downloadHTML}
                className="px-8 py-3.5 bg-gold text-noir font-dm font-semibold text-sm tracking-wider uppercase rounded-full hover:bg-gold/90 transition-all duration-200 hover:scale-105 active:scale-95"
              >
                Download Report
              </button>
              <button
                onClick={resetAll}
                className="px-8 py-3.5 border border-gold/40 text-gold font-dm font-semibold text-sm tracking-wider uppercase rounded-full hover:bg-gold/10 transition-all duration-200"
              >
                Start Over
              </button>
            </div>
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
  const bp = report.businessPlan;
  const ms = report.marketScan;
  const fin = bp?.financials;
  const scenarioKey = fin?.recommendedScenario ?? "base";
  const selectedScenario = fin?.scenarios?.[scenarioKey];
  const score = report.qualityGate?.readinessScore ?? "—";
  const formatMoney = (value: number | undefined | null) => `$${Number(value ?? 0).toLocaleString()}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${safeStr(report.businessName)} — Business Plan</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  body { font-family: 'DM Sans', sans-serif; background: #0A0A0A; color: rgba(255,255,255,0.8); max-width: 860px; margin: 40px auto; padding: 0 24px; line-height: 1.7; }
  h1 { font-family: 'Playfair Display', serif; font-size: 2.8em; margin-bottom: 4px; color: #fff; }
  h2 { font-family: 'Playfair Display', serif; font-size: 1.4em; color: #D4A853; margin-top: 2.5em; border-bottom: 1px solid rgba(212,168,83,0.2); padding-bottom: 8px; }
  h3 { font-family: 'DM Sans', sans-serif; font-size: 0.72em; color: rgba(212,168,83,0.55); text-transform: uppercase; letter-spacing: .1em; margin-top: 1.6em; margin-bottom: 6px; }
  p { margin: 0.5em 0; }
  ul, ol { padding-left: 1.4em; }
  li { margin: 0.35em 0; color: rgba(255,255,255,0.65); font-size: 0.9em; }
  table { border-collapse: collapse; width: 100%; margin: 1em 0; font-size: 0.82em; }
  th { text-align: left; padding: 7px 10px; background: rgba(212,168,83,0.07); color: rgba(212,168,83,0.65); font-size: 0.72em; text-transform: uppercase; letter-spacing: .08em; }
  td { padding: 7px 10px; border-bottom: 1px solid rgba(255,255,255,0.05); vertical-align: top; color: rgba(255,255,255,0.6); }
  .stat-row { display: flex; gap: 24px; flex-wrap: wrap; margin: 1em 0; }
  .stat { text-align: center; flex: 1; min-width: 120px; background: rgba(212,168,83,0.05); border: 1px solid rgba(212,168,83,0.2); border-radius: 8px; padding: 14px; }
  .stat-val { font-family: 'Playfair Display', serif; font-size: 1.6em; color: #D4A853; }
  .stat-lbl { font-size: 0.7em; text-transform: uppercase; letter-spacing: .08em; color: rgba(255,255,255,0.35); margin-top: 3px; }
  .meta { color: rgba(255,255,255,0.25); font-size: 0.82em; margin-bottom: 2em; }
  .verdict { border-left: 3px solid #D4A853; padding: 8px 16px; margin: 1em 0; color: #D4A853; font-family: 'Playfair Display', serif; font-size: 1.05em; }
  blockquote { border-left: 2px solid rgba(212,168,83,0.35); padding: 4px 16px; margin: 0.8em 0; color: rgba(255,255,255,0.7); }
  @media print { body { margin: 20px auto; } }
</style>
</head>
<body>
<h1>${safeStr(report.businessName)}</h1>
<p class="meta">Business Plan · Generated by LA Launch · Powered by Claude AI</p>

<h2>Readiness Score</h2>
<div class="stat-row">
  <div class="stat"><div class="stat-val">${safeStr(score)}/10</div><div class="stat-lbl">Readiness</div></div>
  ${fin ? `<div class="stat"><div class="stat-val">${formatMoney(fin.totalStartupCost)}</div><div class="stat-lbl">Total Startup Cost</div></div>` : ""}
  ${selectedScenario ? `<div class="stat"><div class="stat-val">${safeStr(formatBreakEven(selectedScenario.breakEvenMonth))}</div><div class="stat-lbl">Break-even Month</div></div>` : ""}
</div>
${(report.qualityGate?.readinessLabel) ? `<p style="color:rgba(255,255,255,0.45)">${safeStr(report.qualityGate.readinessLabel)}</p>` : ""}
<h3>Top Gaps</h3>
<ol>${(report.qualityGate?.topGaps ?? []).map(q => `<li>${safeStr(q)}</li>`).join("")}</ol>

<h2>Market Scan</h2>
${ms?.verdict ? `<div class="verdict">${safeStr(ms.verdict)}</div>` : ""}
${ms?.targetCustomer ? `<p><strong>Target Customer:</strong> ${safeStr(ms.targetCustomer)}</p>` : ""}

<h3>Feasibility Scores (1–5, higher = better)</h3>
${ms?.feasibility ? `
<table>
  <tr><th>Factor</th><th>Score</th></tr>
  <tr><td>Demand</td><td>${ms.feasibility.demand}</td></tr>
  <tr><td>Competition</td><td>${ms.feasibility.competition}</td></tr>
  <tr><td>Ops Complexity</td><td>${ms.feasibility.opsComplexity}</td></tr>
  <tr><td>Capital Intensity</td><td>${ms.feasibility.capitalIntensity}</td></tr>
  <tr><td>Regulatory Risk</td><td>${ms.feasibility.regulatoryRisk}</td></tr>
  <tr><td>Timeline Realism</td><td>${ms.feasibility.timelineRealism}</td></tr>
</table>` : ""}

<h3>Top Competitors</h3>
${ms?.topCompetitors?.length ? `
<table>
  <tr><th>Name</th><th>Threat</th><th>Weakness</th></tr>
  ${ms.topCompetitors.map(c => `<tr><td>${safeStr(c.name)}</td><td>${safeStr(c.threat)}</td><td>${safeStr(c.weakness)}</td></tr>`).join("")}
</table>` : ""}

<h3>Location Recommendation</h3>
${ms?.locationRec ? `
<p><strong>Primary:</strong> ${safeStr(ms.locationRec.primary)}</p>
<p><strong>Secondary:</strong> ${safeStr(ms.locationRec.secondary)}</p>
<p><strong>Rent:</strong> ${safeStr(ms.locationRec.monthlyRent)}</p>
<p>${safeStr(ms.locationRec.whyHere)}</p>` : ""}

<h3>Next 3 Actions</h3>
<ol>${(ms?.next3Actions ?? []).map(a => `<li>${safeStr(a)}</li>`).join("")}</ol>

<h2>Business Plan</h2>
${bp?.executiveSummary ? `<blockquote>${safeStr(bp.executiveSummary)}</blockquote>` : ""}

${bp?.product ? `
<h3>Product</h3>
<p><strong>${safeStr(bp.product.headline)}</strong></p>
<ul>${bp.product.bullets.map((bullet) => `<li>${safeStr(bullet)}</li>`).join("")}</ul>
<p><em>${safeStr(bp.product.moat)}</em></p>` : ""}

${bp?.goToMarket ? `
<h3>Go-to-Market</h3>
<ul>${bp.goToMarket.phases.map((phase) => `<li><strong>${safeStr(phase.label)}:</strong> ${safeStr(phase.action)}</li>`).join("")}</ul>
${bp.goToMarket.channels.length ? `<p><strong>Channels:</strong> ${bp.goToMarket.channels.map((channel) => safeStr(channel)).join(" · ")}</p>` : ""}
<p><strong>Retention:</strong> ${safeStr(bp.goToMarket.retention)}</p>` : ""}

${bp?.operations ? `
<h3>Operations</h3>
<p><strong>${safeStr(bp.operations.locationName)}</strong></p>
<p>${safeStr(bp.operations.locationWhy)}</p>
<ul>${bp.operations.bullets.map((bullet) => `<li>${safeStr(bullet)}</li>`).join("")}</ul>` : ""}

<h3>Milestones</h3>
${(bp?.milestones ?? []).map(m => `<p><strong>${safeStr(m.period)}:</strong></p><ul>${m.items.map(item => `<li>${safeStr(item)}</li>`).join("")}</ul>`).join("")}

${bp?.permits?.length ? `
<h3>Permits Required</h3>
<table>
  <tr><th>Permit</th><th>Cost</th><th>Timeline</th><th>Action</th></tr>
  ${bp.permits.map(p => `<tr><td>${safeStr(p.name)}</td><td>${formatMoney(p.cost)}</td><td>${safeStr(p.timelineWeeks)} weeks</td><td>${safeStr(p.action)}</td></tr>`).join("")}
</table>` : ""}

${bp?.funding?.length ? `
<h3>Funding Options</h3>
<table>
  <tr><th>Source</th><th>Amount</th><th>Fit</th></tr>
  ${bp.funding.map(f => `<tr><td>${safeStr(f.source)}</td><td>${formatMoney(f.amount)}</td><td>${safeStr(f.fit)}</td></tr>`).join("")}
</table>` : ""}

${bp?.risks?.length ? `
<h3>Risks & Mitigations</h3>
<table>
  <tr><th>Risk</th><th>Mitigation</th></tr>
  ${bp.risks.map(r => `<tr><td>${safeStr(r.risk)}</td><td>${safeStr(r.mitigation)}</td></tr>`).join("")}
</table>` : ""}

${fin ? `
<h2>Financial Model</h2>
<p><strong>Recommended Scenario:</strong> ${safeStr(scenarioKey)}</p>
${bp.financialWarnings?.length ? `<ul>${bp.financialWarnings.map(item => `<li>${safeStr(item)}</li>`).join("")}</ul>` : ""}
${fin.assumptionPressure?.length ? `<ul>${fin.assumptionPressure.map(item => `<li>${safeStr(item)}</li>`).join("")}</ul>` : ""}
${fin.credibilityNote ? `<p><strong>This only works if:</strong> ${safeStr(fin.credibilityNote)}</p>` : ""}
<div class="stat-row">
  <div class="stat"><div class="stat-val">${formatMoney(selectedScenario?.year1Revenue)}</div><div class="stat-lbl">Year 1 Revenue</div></div>
  <div class="stat"><div class="stat-val">${formatMoney(selectedScenario?.year1NetIncome)}</div><div class="stat-lbl">Year 1 Net Income</div></div>
  <div class="stat"><div class="stat-val">${safeStr(formatBreakEven(selectedScenario?.breakEvenMonth))}</div><div class="stat-lbl">Break-even</div></div>
</div>
${fin.unitEconomics ? `
<h3>Unit Economics</h3>
<table>
  <tr><th>Metric</th><th>Value</th></tr>
  <tr><td>Avg Ticket</td><td>${formatMoney(Number(fin.unitEconomics.avgTicket?.toFixed(2) ?? 0))}</td></tr>
  <tr><td>COGS / Unit</td><td>${formatMoney(Number(fin.unitEconomics.cogs?.toFixed(2) ?? 0))}</td></tr>
  <tr><td>Gross Margin</td><td>${fin.unitEconomics.grossMarginPct}%</td></tr>
  <tr><td>Daily Break-even Transactions</td><td>${fin.unitEconomics.dailyTransactionsToBreakEven}</td></tr>
</table>` : ""}
${fin.startupCosts?.length ? `
<h3>Startup Costs</h3>
<table>
  <tr><th>Item</th><th>Cost</th></tr>
  ${fin.startupCosts.map(c => `<tr><td>${safeStr(c.item)}</td><td>${formatMoney(c.cost)}</td></tr>`).join("")}
  <tr><td><strong>Total</strong></td><td><strong>${formatMoney(fin.totalStartupCost)}</strong></td></tr>
</table>` : ""}
${selectedScenario?.monthlyProjections?.length ? `
<h3>Monthly Projections</h3>
<table>
  <tr><th>Month</th><th>Revenue</th><th>COGS</th><th>OpEx</th><th>Net Income</th></tr>
  ${selectedScenario.monthlyProjections.map(m => `<tr${m.month === selectedScenario.breakEvenMonth ? ' style="background:rgba(212,168,83,0.07)"' : ""}><td>${m.month}</td><td>${formatMoney(m.revenue)}</td><td>${formatMoney(m.cogs)}</td><td>${formatMoney(m.opex)}</td><td style="color:${m.netIncome >= 0 ? '#4ADE80' : '#EF4444'}">${formatMoney(m.netIncome)}</td></tr>`).join("")}
</table>` : ""}` : ""}

<h2>Pitch Deck</h2>
${(report.pitchDeck?.slides ?? []).map(slide => `
<h3>${slide.slideNumber}. ${safeStr(slide.title)}</h3>
<ul>${slide.bullets.map(b => `<li>${safeStr(b)}</li>`).join("")}</ul>
`).join("")}

<p style="margin-top:3em; font-size:0.72em; color:rgba(255,255,255,0.18); text-align:center;">Powered by Claude + LA Launch</p>
</body>
</html>`;
}
