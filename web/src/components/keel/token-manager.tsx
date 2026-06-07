"use client";

import { useActionState, useState, useTransition } from "react";
import { KeyRound, Copy, Check, Trash2 } from "lucide-react";
import { createToken, revokeToken } from "@/app/(app)/settings/actions";

type Token = {
  id: string;
  name: string | null;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
};

function fmt(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function TokenManager({ tokens, mcpUrl }: { tokens: Token[]; mcpUrl: string }) {
  const [state, formAction, pending] = useActionState(createToken, null);
  const [copied, setCopied] = useState<string | null>(null);
  const [, startRevoke] = useTransition();

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  }

  const cmd = state?.token
    ? `claude mcp add keel --transport http ${mcpUrl} --header "Authorization: Bearer ${state.token}"`
    : "";

  return (
    <div className="flex flex-col gap-6">
      {/* create */}
      <div className="rounded-[14px] border border-hairline bg-white p-6">
        <form action={formAction} className="flex items-center justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-[13px] font-semibold text-ink">New access token</span>
            <span className="text-[12px] text-muted-ink">Generate a token to connect Claude Code or Codex.</span>
          </div>
          <button
            type="submit"
            disabled={pending}
            className="flex shrink-0 items-center gap-2 rounded-[9px] bg-cobalt px-4 py-2.5 text-[13px] font-semibold text-white disabled:opacity-60"
          >
            <KeyRound className="h-4 w-4" strokeWidth={2} />
            {pending ? "Generating…" : "Generate token"}
          </button>
        </form>

        {state?.error && <p className="pt-3 text-[13px] font-medium text-gap">{state.error}</p>}

        {state?.token && (
          <div className="mt-5 flex flex-col gap-3 rounded-[10px] border px-4 py-4" style={{ backgroundColor: "var(--covered-tint)", borderColor: "#bfe3d2" }}>
            <span className="text-[12px] font-semibold text-ink">
              Copy this now — it won&apos;t be shown again.
            </span>
            <div className="flex items-center gap-2">
              <code className="flex-1 truncate rounded-md bg-white px-3 py-2 font-mono text-[12px] text-ink">{state.token}</code>
              <button onClick={() => copy(state.token!, "tok")} className="flex shrink-0 items-center gap-1.5 rounded-md border border-hairline bg-white px-2.5 py-2 text-xs font-semibold text-muted-ink hover:bg-panel">
                {copied === "tok" ? <Check className="h-3.5 w-3.5 text-covered" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
            <span className="text-[12px] font-semibold text-ink">Connect Claude Code:</span>
            <div className="flex items-start gap-2">
              <pre className="flex-1 overflow-x-auto rounded-md bg-ink px-3 py-2 font-mono text-[11.5px] leading-relaxed text-[#e6e8ec]">{cmd}</pre>
              <button onClick={() => copy(cmd, "cmd")} className="flex shrink-0 items-center gap-1.5 rounded-md border border-hairline bg-white px-2.5 py-2 text-xs font-semibold text-muted-ink hover:bg-panel">
                {copied === "cmd" ? <Check className="h-3.5 w-3.5 text-covered" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* list */}
      <div className="overflow-hidden rounded-[14px] border border-hairline bg-white">
        <div className="flex items-center gap-4 border-b border-hairline bg-panel px-5 py-3">
          <span className="flex-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-faint">Token</span>
          <span className="w-28 text-[11px] font-semibold uppercase tracking-[0.06em] text-faint">Created</span>
          <span className="w-28 text-[11px] font-semibold uppercase tracking-[0.06em] text-faint">Last used</span>
          <span className="w-24" />
        </div>
        {tokens.length === 0 ? (
          <p className="px-5 py-8 text-center text-[13px] text-faint">No tokens yet.</p>
        ) : (
          tokens.map((t, i) => (
            <div key={t.id} className="flex items-center gap-4 px-5 py-3.5" style={{ borderBottom: i < tokens.length - 1 ? "1px solid var(--hairline-soft)" : undefined }}>
              <div className="flex flex-1 items-center gap-2">
                <KeyRound className="h-4 w-4 text-faint" strokeWidth={2} />
                <span className="text-[13px] font-medium text-ink">{t.name}</span>
                {t.revoked_at && <span className="rounded bg-gap-tint px-1.5 py-0.5 text-[10px] font-semibold text-gap">revoked</span>}
              </div>
              <span className="w-28 text-xs text-muted-ink">{fmt(t.created_at)}</span>
              <span className="w-28 text-xs text-muted-ink">{fmt(t.last_used_at)}</span>
              <div className="flex w-24 justify-end">
                {!t.revoked_at && (
                  <button
                    onClick={() => startRevoke(() => revokeToken(t.id))}
                    className="flex items-center gap-1.5 rounded-md border border-hairline bg-white px-2.5 py-1.5 text-xs font-semibold text-gap hover:bg-panel"
                  >
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={2} /> Revoke
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
