// The constitution's discipline prefixes (Part D, v1.2+ stable IDs) + RAID.
export const DISCIPLINE_NAMES: Record<string, string> = {
  SCO: "Scope Hygiene",
  PRD: "Product",
  UXD: "UX / Design",
  ENG: "Engineering",
  DAT: "Data / ML",
  SEC: "Security & Compliance",
  QAT: "QA / Test",
  OPS: "Ops / Support",
  CHG: "Change / Adoption",
  COM: "Commercial / Governance",
  DEL: "Delivery / Planning",
  RAID: "RAID Register",
};

export const DISCIPLINE_ORDER = [
  "SCO", "PRD", "UXD", "ENG", "DAT", "SEC",
  "QAT", "OPS", "CHG", "COM", "DEL", "RAID",
];

export function disciplineName(id: string): string {
  return DISCIPLINE_NAMES[id] ?? id;
}
