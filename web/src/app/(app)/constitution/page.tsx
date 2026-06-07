import { Lock } from "lucide-react";
import { Markdown } from "@/components/keel/markdown";
import { createClient } from "@/lib/supabase/server";

export default async function ConstitutionPage() {
  let content = "";
  try {
    const res = await fetch(`${process.env.KEEL_SERVICE_URL}/constitution/raw`, { cache: "no-store" });
    if (res.ok) content = await res.text();
  } catch {
    content = "";
  }

  const sb = await createClient();
  const { data: con } = await sb
    .from("constitutions")
    .select("version,label")
    .eq("status", "active")
    .maybeSingle();

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex items-end justify-between border-b border-hairline px-8 py-7">
        <div className="flex flex-col gap-1.5">
          <h1 className="font-display text-[28px] font-semibold tracking-[-0.02em] text-ink">Constitution</h1>
          <p className="text-[13px] text-muted-ink">
            The versioned standard every engagement is gated against{con?.label ? ` · ${con.label}` : ""}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {con?.version && (
            <span className="rounded-md border border-hairline bg-panel px-2.5 py-1 font-mono text-[12px] font-medium text-muted-ink">
              {con.version}
            </span>
          )}
          <span className="flex items-center gap-1.5 rounded-md border border-hairline bg-panel px-2.5 py-1 text-[12px] font-medium text-muted-ink">
            <Lock className="h-3.5 w-3.5" strokeWidth={2} /> Read-only
          </span>
        </div>
      </div>

      <div className="px-8 py-7">
        {content ? (
          <div className="mx-auto max-w-[860px] rounded-[14px] border border-hairline bg-white px-10 py-9">
            <Markdown content={content} />
          </div>
        ) : (
          <div className="rounded-[14px] border border-dashed border-hairline bg-white px-8 py-16 text-center text-[13px] text-muted-ink">
            Couldn&apos;t load the constitution from the service. Check that the Keel service is running and{" "}
            <span className="font-mono">KEEL_SERVICE_URL</span> is set.
          </div>
        )}
      </div>
    </div>
  );
}
