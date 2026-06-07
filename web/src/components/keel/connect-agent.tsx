"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Plug, X, Copy, Check, KeyRound, ArrowRight } from "lucide-react";
import { createToken } from "@/app/(app)/settings/actions";

const REPO = "https://github.com/arjun-techjays/keel.git";

function CmdBlock({
  id,
  text,
  copiedKey,
  onCopy,
}: {
  id: string;
  text: string;
  copiedKey: string | null;
  onCopy: (k: string, t: string) => void;
}) {
  return (
    <div className="relative">
      <pre className="overflow-x-auto rounded-[10px] bg-ink px-4 py-3.5 font-mono text-[11.5px] leading-relaxed text-[#e6e8ec]">{text}</pre>
      <button onClick={() => onCopy(id, text)} className="absolute right-2 top-2 flex items-center gap-1 rounded-md border border-white/15 bg-white/10 px-2 py-1 text-[11px] font-semibold text-white hover:bg-white/20">
        {copiedKey === id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}

export function ConnectAgent({
  mcpUrl,
  existingTokenCount,
}: {
  mcpUrl: string;
  existingTokenCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"claude" | "codex">("claude");
  const [state, formAction, pending] = useActionState(createToken, null);
  const [copied, setCopied] = useState<string | null>(null);

  const generated = !!state?.token;
  const token = state?.token ?? "<YOUR_TOKEN>";

  const gitCmd = `git clone ${REPO}
cp -r keel/skills/keel-* .claude/skills/ && cp keel/constitution.md . && cp -r keel/checks .`;
  const mcpCmd =
    tab === "claude"
      ? `claude mcp add keel --transport http ${mcpUrl} --header "Authorization: Bearer ${token}"`
      : `# ~/.codex/config.toml
[mcp_servers.keel]
url = "${mcpUrl}"
http_headers = { Authorization = "Bearer ${token}" }`;

  function copy(key: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-[9px] bg-cobalt px-4 py-2 text-[13px] font-semibold text-white"
      >
        <Plug className="h-[15px] w-[15px]" strokeWidth={2} />
        Connect agent
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-6" style={{ backgroundColor: "rgba(20,22,26,0.4)" }}>
          <div className="flex w-full max-w-[580px] flex-col gap-5 rounded-[16px] border border-hairline bg-white p-7 shadow-xl">
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-1">
                <h2 className="font-display text-xl font-semibold tracking-[-0.01em] text-ink">Connect your agent</h2>
                <p className="text-[13px] text-muted-ink">Drive this project from Claude Code or Codex.</p>
              </div>
              <button onClick={() => setOpen(false)} className="rounded-md p-1 text-faint hover:bg-panel">
                <X className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>

            {/* Step 1 — skills via git */}
            <div className="flex flex-col gap-2.5">
              <span className="text-[12px] font-semibold text-ink">1 · Install the Keel skills</span>
              <CmdBlock id="git" text={gitCmd} copiedKey={copied} onCopy={copy} />
            </div>

            {/* Step 2 — MCP */}
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-semibold text-ink">2 · Connect the MCP server</span>
                <div className="flex items-center gap-0.5 rounded-lg border border-hairline bg-white p-0.5">
                  {(["claude", "codex"] as const).map((t) => (
                    <button key={t} onClick={() => setTab(t)} className={`rounded-md px-2.5 py-1 text-xs font-semibold ${tab === t ? "bg-cobalt-tint text-cobalt" : "text-muted-ink"}`}>
                      {t === "claude" ? "Claude Code" : "Codex"}
                    </button>
                  ))}
                </div>
              </div>
              <CmdBlock id="mcp" text={mcpCmd} copiedKey={copied} onCopy={copy} />

              {/* token slot */}
              {generated ? (
                <p className="flex items-center gap-1.5 text-[12px] font-semibold text-covered">
                  <Check className="h-4 w-4" strokeWidth={2.5} /> Token filled in above — copy now, it won&apos;t be shown again.
                </p>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[12px] text-muted-ink">
                    Replace <code className="font-mono text-ink">&lt;YOUR_TOKEN&gt;</code> with a token —
                  </span>
                  <form action={formAction}>
                    <button type="submit" disabled={pending} className="flex shrink-0 items-center gap-1.5 rounded-[8px] bg-cobalt px-3 py-1.5 text-[12px] font-semibold text-white disabled:opacity-60">
                      <KeyRound className="h-3.5 w-3.5" strokeWidth={2} />
                      {pending ? "Generating…" : "Generate token"}
                    </button>
                  </form>
                  {existingTokenCount > 0 && (
                    <span className="text-[12px] text-faint">or paste one you saved.</span>
                  )}
                </div>
              )}
              {state?.error && <p className="text-[12px] font-medium text-gap">{state.error}</p>}
            </div>

            <div className="flex items-center justify-between border-t border-hairline pt-4">
              <Link href="/settings" className="text-[13px] font-medium text-muted-ink hover:text-ink">Manage tokens</Link>
              <Link href="/guide" className="flex items-center gap-1 text-[13px] font-semibold text-cobalt">
                Full guide <ArrowRight className="h-4 w-4" strokeWidth={2} />
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
