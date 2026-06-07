// Mock data for design review. Replaced by Supabase reads when wired.

export type FreezeStatus = "DRAFT" | "FROZEN" | "FROZEN-BLOCKED";
export type PhaseState = "done" | "active" | "blocked" | "pending";
export type Disposition =
  | "answered"
  | "unanswered"
  | "partial"
  | "assumption"
  | "deferred"
  | "excluded";

export type Project = {
  id: string;
  name: string;
  client: string;
  constitutionVersion: string;
  freezeStatus: FreezeStatus;
  blockCount: number;
  blockLast: number;
  coveragePct: number;
  coveredCount: number;
  totalDims: number;
  openQuestions: number;
  assignedCount: number;
  disciplines: number;
  lock: Lock | null;
  updatedAt: string;
};

export type Lock = {
  holder: string;
  initials: string;
  since: string;
  phase: string;
};

export type Phase = {
  key: string;
  name: string;
  state: PhaseState;
  meta: string;
};

export type CoverageRow = {
  id: string;
  name: string;
  total: number;
  covered: number;
  partial: number;
  gap: number;
};

export type Question = {
  id: string;
  tag: "BLOCK" | "PARTIAL" | "DISPOSITIONED";
  text: string;
  disposition: Disposition;
  dispositionLabel: string;
  assigneeInitials: string;
  assigneeColor: string;
  discipline: string;
};

export const project: Project = {
  id: "northwind",
  name: "Northwind Field CRM",
  client: "Northwind Traders",
  constitutionVersion: "const. v4.2",
  freezeStatus: "DRAFT",
  blockCount: 3,
  blockLast: 5,
  coveragePct: 87,
  coveredCount: 94,
  totalDims: 108,
  openQuestions: 11,
  assignedCount: 7,
  disciplines: 4,
  lock: {
    holder: "Aisha B.",
    initials: "AB",
    since: "12m ago",
    phase: "clarify",
  },
  updatedAt: "2m ago",
};

export const phases: Phase[] = [
  { key: "map", name: "Map", state: "done", meta: "Scored · 3d ago" },
  { key: "clarify", name: "Clarify", state: "active", meta: "In progress · Aisha B." },
  { key: "generate", name: "Generate", state: "blocked", meta: "Blocked · [BLOCK]>0" },
  { key: "review", name: "Review", state: "pending", meta: "Not started" },
];

export const coverage: CoverageRow[] = [
  { id: "SCO", name: "Scope", total: 18, covered: 16, partial: 2, gap: 0 },
  { id: "DAT", name: "Data & Privacy", total: 14, covered: 11, partial: 1, gap: 2 },
  { id: "ARC", name: "Architecture", total: 12, covered: 11, partial: 1, gap: 0 },
  { id: "SEC", name: "Security", total: 10, covered: 7, partial: 2, gap: 1 },
  { id: "INT", name: "Integration", total: 9, covered: 8, partial: 1, gap: 0 },
  { id: "RAID", name: "RAID Register", total: 8, covered: 7, partial: 1, gap: 0 },
];

export const questions: Question[] = [
  {
    id: "DAT-07",
    tag: "BLOCK",
    text: "Where is customer PII stored, and which data-residency regime applies?",
    disposition: "unanswered",
    dispositionLabel: "Unanswered",
    assigneeInitials: "AB",
    assigneeColor: "var(--partial)",
    discipline: "Data & Privacy",
  },
  {
    id: "SCO-08",
    tag: "PARTIAL",
    text: "Exception & edge scenarios for offline sync conflicts are not exampled.",
    disposition: "partial",
    dispositionLabel: "Vague — needs example",
    assigneeInitials: "MR",
    assigneeColor: "var(--covered)",
    discipline: "Scope",
  },
  {
    id: "NFR-05",
    tag: "DISPOSITIONED",
    text: "Peak concurrent users expected at launch and at 12 months?",
    disposition: "assumption",
    dispositionLabel: "Assumption",
    assigneeInitials: "AB",
    assigneeColor: "var(--partial)",
    discipline: "Non-functional",
  },
  {
    id: "INT-02",
    tag: "DISPOSITIONED",
    text: "ERP integration auth handshake — confirm token exchange flow.",
    disposition: "deferred",
    dispositionLabel: "Deferred · T&M",
    assigneeInitials: "MR",
    assigneeColor: "var(--covered)",
    discipline: "Integration",
  },
];

export const projects: Project[] = [
  project,
  {
    id: "atlas",
    name: "Atlas Logistics Portal",
    client: "Atlas Freight Co.",
    constitutionVersion: "const. v4.2",
    freezeStatus: "FROZEN",
    blockCount: 0,
    blockLast: 0,
    coveragePct: 100,
    coveredCount: 96,
    totalDims: 96,
    openQuestions: 0,
    assignedCount: 0,
    disciplines: 0,
    lock: null,
    updatedAt: "Frozen 6d ago",
  },
  {
    id: "vela",
    name: "Vela Patient Intake",
    client: "Vela Health",
    constitutionVersion: "const. v4.2 · regulated",
    freezeStatus: "DRAFT",
    blockCount: 9,
    blockLast: 14,
    coveragePct: 61,
    coveredCount: 74,
    totalDims: 121,
    openQuestions: 28,
    assignedCount: 12,
    disciplines: 7,
    lock: {
      holder: "Mateo R.",
      initials: "MR",
      since: "3m ago",
      phase: "map",
    },
    updatedAt: "just now",
  },
  {
    id: "orion",
    name: "Orion Billing Revamp",
    client: "Orion Telecom",
    constitutionVersion: "const. v4.1",
    freezeStatus: "DRAFT",
    blockCount: 1,
    blockLast: 3,
    coveragePct: 92,
    coveredCount: 88,
    totalDims: 96,
    openQuestions: 4,
    assignedCount: 2,
    disciplines: 2,
    lock: null,
    updatedAt: "1h ago",
  },
];

/* ---- KPI / Admin dashboard ---- */

export type Kpi = {
  label: string;
  value: string;
  unit?: string;
  delta: string;
  deltaGood: boolean;
  flag?: boolean;
};

export const kpis: Kpi[] = [
  { label: "Answer rate", value: "68", unit: "%", delta: "+4 pts", deltaGood: true },
  { label: "Closed by disposition", value: "32", unit: "%", delta: "-3 pts", deltaGood: true, flag: true },
  { label: "Partial → Covered", value: "74", unit: "%", delta: "+9 pts", deltaGood: true },
  { label: "Avg time in [BLOCK]", value: "2.4", unit: "d", delta: "-0.6d", deltaGood: true },
  { label: "Freeze-ready", value: "2", unit: "/4", delta: "+1", deltaGood: true },
];

export type CloseSegment = { label: string; count: number; color: string };

// How open items were ultimately closed (the anti-gaming breakdown).
export const closeMix: CloseSegment[] = [
  { label: "Answered", count: 312, color: "var(--covered)" },
  { label: "Assumption", count: 88, color: "var(--partial)" },
  { label: "Deferred / T&M", count: 41, color: "#9aa1ac" },
  { label: "Excluded", count: 29, color: "#cbd0d6" },
];

export type ProjectQuality = {
  name: string;
  answered: number; // %
  dispositioned: number; // %
  flag: boolean;
};

export const projectQuality: ProjectQuality[] = [
  { name: "Atlas Logistics Portal", answered: 96, dispositioned: 4, flag: false },
  { name: "Orion Billing Revamp", answered: 88, dispositioned: 12, flag: false },
  { name: "Northwind Field CRM", answered: 70, dispositioned: 30, flag: false },
  { name: "Vela Patient Intake", answered: 41, dispositioned: 59, flag: true },
];

export type TeamMember = {
  name: string;
  initials: string;
  color: string;
  answered: number;
  dispositioned: number;
  avg: string;
  flag: boolean;
};

export const team: TeamMember[] = [
  { name: "Priya N.", initials: "PN", color: "#2347e5", answered: 106, dispositioned: 19, avg: "5h", flag: false },
  { name: "Aisha B.", initials: "AB", color: "#c2841a", answered: 142, dispositioned: 38, avg: "3h", flag: false },
  { name: "Sam K.", initials: "SK", color: "#1f9d6b", answered: 48, dispositioned: 22, avg: "2h", flag: false },
  { name: "Mateo R.", initials: "MR", color: "#7a5310", answered: 64, dispositioned: 71, avg: "1h", flag: true },
];

/* ---- Clarify: questions grouped by research method ---- */

export type Assignee = { name: string; initials: string; color: string };

export type ClarifyQuestion = {
  id: string;
  tag: "BLOCK" | "PARTIAL" | null;
  text: string;
  kind: Disposition;
  label: string;
};

export type MethodIcon = "interview" | "workshop" | "document" | "session" | "estimate";

export type ResearchMethod = {
  id: string;
  icon: MethodIcon;
  name: string;
  focus: string;
  gathers: string;
  assignee: Assignee | null;
  questions: ClarifyQuestion[];
};

/* ---- Review: scope risk report ---- */

export type Severity = "High" | "Med" | "Low";
export type Finding = {
  id: string;
  severity: Severity;
  title: string;
  refs: string[];
  detail: string;
  status: "open" | "probed";
};

export const findings: Finding[] = [
  {
    id: "R-01",
    severity: "High",
    title: "PII residency unstated — lets scope expand silently post-sign-off",
    refs: ["F2.3", "DAT-07"],
    detail:
      "No residency regime or storage region is committed. The client can later assert in-region storage as 'assumed in', forcing re-architecture that wasn't priced.",
    status: "open",
  },
  {
    id: "R-02",
    severity: "High",
    title: "Offline sync conflict policy undefined — unbounded edge work",
    refs: ["INT-05", "SCO-08"],
    detail:
      "Conflict resolution for offline edits is neither exampled nor dispositioned. Every unhandled conflict class becomes a change request or a silent overrun.",
    status: "open",
  },
  {
    id: "R-03",
    severity: "Med",
    title: "Auth for offline field reps only partially specified",
    refs: ["SEC-03"],
    detail: "Token lifetime and re-auth on reconnect are vague; implementation could swing 2–3x.",
    status: "probed",
  },
  {
    id: "R-04",
    severity: "Med",
    title: "Capacity is an assumption, not a measurement",
    refs: ["NFR-05"],
    detail: "Peak concurrency dispositioned as an assumption. If wrong, NFR rework is uncosted.",
    status: "probed",
  },
  {
    id: "R-05",
    severity: "Med",
    title: "Incident-response SLA missing from security scope",
    refs: ["SEC-08"],
    detail: "Breach-notification obligations could pull in monitoring and on-call work.",
    status: "open",
  },
  {
    id: "R-06",
    severity: "Low",
    title: "Out-of-scope list could be firmer on reporting modules",
    refs: ["SCO-12"],
    detail: "Reporting boundary is stated but not enumerated; minor creep risk.",
    status: "probed",
  },
];

export const reviewLedger = {
  verdict: "FREEZE-BLOCKED" as const,
  reason: "2 High findings open + 1 section un-probed",
  high: 2,
  med: 3,
  low: 1,
  probed: 19,
  totalSections: 20,
  unprobed: ["F3.3 Non-functional requirements"],
};

/* ---- Pack viewer: deliverable documents ---- */

export type PackSection = { id: string; title: string; blocked?: boolean };
export type PackDoc = { n: number; code: string; title: string; sections: PackSection[] };

export const packDocs: PackDoc[] = [
  {
    n: 1,
    code: "F1",
    title: "Executive Summary",
    sections: [
      { id: "F1.1", title: "Engagement context" },
      { id: "F1.2", title: "Objectives & success criteria" },
      { id: "F1.3", title: "Solution approach" },
    ],
  },
  {
    n: 2,
    code: "F2",
    title: "Scope",
    sections: [
      { id: "F2.1", title: "In-scope capabilities" },
      { id: "F2.2", title: "Out-of-scope" },
      { id: "F2.3", title: "Data handling & residency", blocked: true },
      { id: "F2.4", title: "Functional requirements" },
    ],
  },
  {
    n: 3,
    code: "F3",
    title: "Technical Architecture",
    sections: [
      { id: "F3.1", title: "Architecture overview", blocked: true },
      { id: "F3.2", title: "Integrations" },
      { id: "F3.3", title: "Non-functional requirements" },
    ],
  },
  {
    n: 4,
    code: "F4",
    title: "RAID Register",
    sections: [
      { id: "F4.1", title: "Risks" },
      { id: "F4.2", title: "Assumptions" },
      { id: "F4.3", title: "Issues" },
      { id: "F4.4", title: "Dependencies" },
    ],
  },
  {
    n: 5,
    code: "F5",
    title: "Implementation Plan",
    sections: [
      { id: "F5.1", title: "Delivery phases" },
      { id: "F5.2", title: "Milestones & estimate" },
    ],
  },
  {
    n: 6,
    code: "F6",
    title: "Approval & Sign-off",
    sections: [
      { id: "F6.1", title: "Acceptance criteria" },
      { id: "F6.2", title: "Sign-off" },
    ],
  },
];

/* ---- Coverage map: dimensions ---- */

export type Score = "covered" | "partial" | "gap" | "na";

export type Dimension = {
  id: string;
  name: string;
  disciplineId: string;
  score: Score;
};

export const dimensions: Dimension[] = [
  // Scope
  { id: "SCO-01", name: "Primary user roles & journeys", disciplineId: "SCO", score: "covered" },
  { id: "SCO-05", name: "In-scope feature inventory", disciplineId: "SCO", score: "covered" },
  { id: "SCO-08", name: "Scenario coverage (happy/exception/edge)", disciplineId: "SCO", score: "partial" },
  { id: "SCO-12", name: "Explicit out-of-scope list", disciplineId: "SCO", score: "covered" },
  // Data & Privacy
  { id: "DAT-03", name: "Data model & entities", disciplineId: "DAT", score: "covered" },
  { id: "DAT-07", name: "PII storage & data residency", disciplineId: "DAT", score: "gap" },
  { id: "DAT-09", name: "Lawful basis & retention", disciplineId: "DAT", score: "gap" },
  { id: "DAT-11", name: "Data migration & seeding", disciplineId: "DAT", score: "partial" },
  // Architecture
  { id: "ARC-02", name: "Deployment topology", disciplineId: "ARC", score: "covered" },
  { id: "ARC-04", name: "Tenancy & isolation model", disciplineId: "ARC", score: "covered" },
  { id: "ARC-09", name: "Failure & recovery design", disciplineId: "ARC", score: "partial" },
  // Security
  { id: "SEC-03", name: "Authentication & session model", disciplineId: "SEC", score: "partial" },
  { id: "SEC-06", name: "Infosec policy & pen-test cadence", disciplineId: "SEC", score: "covered" },
  { id: "SEC-08", name: "Incident response & breach SLA", disciplineId: "SEC", score: "gap" },
  // Integration
  { id: "INT-02", name: "ERP integration handshake", disciplineId: "INT", score: "covered" },
  { id: "INT-05", name: "Sync & conflict resolution", disciplineId: "INT", score: "partial" },
  // RAID
  { id: "RAID-01", name: "Top delivery risks", disciplineId: "RAID", score: "covered" },
  { id: "RAID-04", name: "External dependencies", disciplineId: "RAID", score: "covered" },
];

export const clarifyMethods: ResearchMethod[] = [
  {
    id: "m1",
    icon: "interview",
    name: "Stakeholder interview",
    focus: "Data & Compliance",
    gathers: "PII handling, residency, retention, lawful basis",
    assignee: { name: "Aisha B.", initials: "AB", color: "#c2841a" },
    questions: [
      { id: "DAT-07", tag: "BLOCK", text: "Where is customer PII stored, and which data-residency regime applies?", kind: "unanswered", label: "Unanswered" },
      { id: "DAT-09", tag: "BLOCK", text: "Lawful basis and retention period per data class?", kind: "unanswered", label: "Unanswered" },
      { id: "SEC-03", tag: "PARTIAL", text: "Auth method for field reps working offline?", kind: "partial", label: "Vague — needs detail" },
    ],
  },
  {
    id: "m2",
    icon: "workshop",
    name: "Technical workshop",
    focus: "Integration & Architecture",
    gathers: "ERP handshake, sync policy, tenancy model",
    assignee: { name: "Mateo R.", initials: "MR", color: "#7a5310" },
    questions: [
      { id: "ARC-04", tag: null, text: "Tenancy model — single vs multi-tenant isolation?", kind: "answered", label: "Answered" },
      { id: "INT-02", tag: null, text: "ERP integration auth handshake — confirm token exchange flow.", kind: "deferred", label: "Deferred · T&M" },
      { id: "INT-05", tag: null, text: "Sync frequency and conflict-resolution policy for offline mode?", kind: "unanswered", label: "Unanswered" },
    ],
  },
  {
    id: "m3",
    icon: "document",
    name: "Document review",
    focus: "Security policies",
    gathers: "Infosec policy, pen-test cadence, IR & breach SLA",
    assignee: { name: "Priya N.", initials: "PN", color: "#2347e5" },
    questions: [
      { id: "SEC-06", tag: null, text: "Existing infosec policy and pen-test cadence?", kind: "answered", label: "Answered" },
      { id: "SEC-08", tag: null, text: "Incident response and breach-notification SLA?", kind: "unanswered", label: "Unanswered" },
    ],
  },
  {
    id: "m4",
    icon: "session",
    name: "Product & scope session",
    focus: "Scope",
    gathers: "Edge scenarios, in/out-of-scope modules",
    assignee: { name: "Aisha B.", initials: "AB", color: "#c2841a" },
    questions: [
      { id: "SCO-08", tag: "PARTIAL", text: "Exception & edge scenarios for offline sync conflicts not exampled.", kind: "partial", label: "Vague — needs example" },
      { id: "SCO-11", tag: null, text: "In-scope vs out-of-scope reporting modules?", kind: "unanswered", label: "Unanswered" },
    ],
  },
  {
    id: "m5",
    icon: "estimate",
    name: "Capacity & NFR estimate",
    focus: "Non-functional",
    gathers: "Peak load, growth, performance budgets",
    assignee: null,
    questions: [
      { id: "NFR-05", tag: null, text: "Peak concurrent users expected at launch and at 12 months?", kind: "assumption", label: "Assumption" },
    ],
  },
];
