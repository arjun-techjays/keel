export const DISCIPLINE_NAMES: Record<string, string> = {
  SCO: "Scope",
  DAT: "Data & Privacy",
  ARC: "Architecture",
  SEC: "Security",
  INT: "Integration",
  NFR: "Non-functional",
  RAID: "RAID Register",
  OPS: "Operations",
};

export const DISCIPLINE_ORDER = ["SCO", "DAT", "ARC", "SEC", "INT", "NFR", "RAID", "OPS"];

export function disciplineName(id: string): string {
  return DISCIPLINE_NAMES[id] ?? id;
}
