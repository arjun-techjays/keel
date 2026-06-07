"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Plug, X, Copy, Check, KeyRound, ArrowRight } from "lucide-react";
import { createToken } from "@/app/(app)/settings/actions";

export function ConnectAgent({ mcpUrl }: { mcpUrl: string }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"claude" | "codex">("claude");
  const [state, formAction, pending] = useActionState(createToken, null);
  const [copied, setCopied] = useState(false);

  const token = state?.token ?? "<YOUR_TOKEN>";
  const claude = `claude mcp add keel --transport http ${mcpUrl} --header "Authorization: Bearer ${token}"`;
  const codex = `# ~/.codex/config.toml\n[mcp_servers.keel]\nurl = "${mcpUrl}"\nhttp_headers = { Authorization = "Bearer ${token}" }`;
  const snippet = tab === "claude" ? claude : codex;

  function copy() {
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ backgroundColor: "rgba(20,22,26,0.4)" }}>
          <div className="flex w-full max-w-[560px] flex-col gap-4 rounded-[16px] border border-hairline bg-white p-7 shadow-xl">
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-1">
                <h2 className="font-display text-xl font-semibold tracking-[-0.01em] text-ink">Connect your agent</h2>
                <p className="text-[13px] text-muted-ink">Drive this project from Claude Code or Codex over MCP.</p>
              </div>
              <button onClick={() => setOpen(false)} className="rounded-md p-1 text-faint hover:bg-panel">
                <X className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>

            <div className="flex items-center gap-0.5 self-start rounded-lg border border-hairline bg-white p-0.5">
              {(["claude", "codex"] as const).map((t) => (
                <button key={t} onClick={() => setTab(t)} className={`rounded-md px-3 py-1.5 text-xs font-semibold ${tab === t ? "bg-cobalt-tint text-cobalt" : "text-muted-ink"}`}>
                  {t === "claude" ? "Claude Code" : "Codex"}
                </button>
              ))}
            </div>

            <div className="relative">
              <pre className="overflow-x-auto rounded-[10px] bg-ink px-4 py-3.5 font-mono text-[11.5px] leading-relaxed text-[#e6e8ec]">{snippet}</pre>
              <button onClick={copy} className="absolute right-2 top-2 flex items-center gap-1 rounded-md border border-white/15 bg-white/10 px-2 py-1 text-[11px] font-semibold text-white hover:bg-white/20">
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>

            {state?.token ? (
              <p className="text-[12px] font-medium text-covered">Token generated and filled in above — it won&apos;t be shown again.</p>
            ) : (
              <form action={formAction} className="flex items-center gap-2">
                <input name="name" placeholder="Token name (e.g. my laptop)" className="flex-1 rounded-[9px] border border-hairline px-3 py-2 text-[13px] text-ink outline-none focus:border-cobalt" />
                <button type="submit" disabled={pending} className="flex shrink-0 items-center gap-1.5 rounded-[9px] border border-hairline bg-white px-3.5 py-2 text-[13px] font-semibold text-muted-ink hover:bg-panel disabled:opacity-60">
                  <KeyRound className="h-4 w-4" strokeWidth={2} />
                  {pending ? "Generating…" : "Generate token"}
                </button>
              </form>
            )}
            {state?.error && <p className="text-[12px] font-medium text-gap">{state.error}</p>}

            <Link href="/guide" className="flex items-center gap-1 text-[13px] font-semibold text-cobalt">
              Full guide <ArrowRight className="h-4 w-4" strokeWidth={2} />
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
