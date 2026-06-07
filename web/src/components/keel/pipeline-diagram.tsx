// The Keel pipeline as a real diagram: a single column of phases with down-arrows,
// plus two loop-back arrows that actually return to the Map and Clarify boxes.

const INK = "#14161a";
const MUTED = "#6b7280";
const COBALT = "#2347e5";
const HAIR = "#e6e8ec";

function Box({ y, label }: { y: number; label: string }) {
  return (
    <g>
      <rect x={160} y={y} width={150} height={46} rx={9} fill="#fff" stroke={INK} strokeWidth={1.5} />
      <text x={235} y={y + 23} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={600} fill={INK}>
        {label}
      </text>
    </g>
  );
}

export function PipelineDiagram() {
  return (
    <svg viewBox="0 0 480 460" className="mx-auto block w-full max-w-[440px]" role="img" aria-label="Keel pipeline with two loops">
      <defs>
        <marker id="ar" markerWidth="9" markerHeight="9" refX="6.5" refY="3" orient="auto">
          <path d="M0,0 L7,3 L0,6 Z" fill={MUTED} />
        </marker>
        <marker id="arc" markerWidth="9" markerHeight="9" refX="6.5" refY="3" orient="auto">
          <path d="M0,0 L7,3 L0,6 Z" fill={COBALT} />
        </marker>
      </defs>

      {/* boxes */}
      <Box y={24} label="Map" />
      <Box y={114} label="Clarify" />
      <Box y={204} label="Generate" />
      <Box y={294} label="Review" />
      <Box y={384} label="Freeze" />

      {/* down arrows */}
      <line x1={235} y1={70} x2={235} y2={112} stroke={MUTED} strokeWidth={1.5} markerEnd="url(#ar)" />
      <line x1={235} y1={160} x2={235} y2={202} stroke={MUTED} strokeWidth={1.5} markerEnd="url(#ar)" />
      <line x1={235} y1={250} x2={235} y2={292} stroke={MUTED} strokeWidth={1.5} markerEnd="url(#ar)" />
      <line x1={235} y1={340} x2={235} y2={382} stroke={MUTED} strokeWidth={1.5} markerEnd="url(#ar)" />

      {/* down-arrow labels */}
      <text x={244} y={92} fontSize={11} fill={MUTED}>questions ⇄ answers</text>
      <text x={244} y={182} fontSize={11} fill={MUTED}>[BLOCK] = 0</text>
      <text x={244} y={272} fontSize={11} fill={MUTED}>pack</text>
      <text x={244} y={362} fontSize={11} fill={MUTED}>clean + signed</text>

      {/* Loop 1 — Clarify back up to Map (left) */}
      <path d="M160,137 H92 V47 H158" fill="none" stroke={COBALT} strokeWidth={1.5} markerEnd="url(#arc)" />
      <text x={84} y={96} fontSize={10.5} fontWeight={600} fill={COBALT} transform="rotate(-90 84 96)">
        Loop 1 · re-map
      </text>

      {/* Loop 2 — Review back up to Clarify (right) */}
      <path d="M310,317 H392 V137 H312" fill="none" stroke={COBALT} strokeWidth={1.5} markerEnd="url(#arc)" />
      <text x={408} y={232} fontSize={10.5} fontWeight={600} fill={COBALT} transform="rotate(-90 408 232)">
        Loop 2 · findings
      </text>

      {/* baseline tick under freeze for balance */}
      <line x1={160} y1={446} x2={310} y2={446} stroke={HAIR} strokeWidth={1} />
    </svg>
  );
}
