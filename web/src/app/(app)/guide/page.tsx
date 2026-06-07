import { readFile } from "node:fs/promises";
import path from "node:path";
import { Markdown } from "@/components/keel/markdown";
import { PipelineDiagram } from "@/components/keel/pipeline-diagram";

export default async function GuidePage() {
  let md = "";
  try {
    md = await readFile(path.join(process.cwd(), "src/content/user-guide.md"), "utf8");
  } catch {
    md = "# Guide\n\nThe guide could not be loaded.";
  }

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex items-end justify-between border-b border-hairline px-8 py-7">
        <div className="flex flex-col gap-1.5">
          <h1 className="font-display text-[28px] font-semibold tracking-[-0.02em] text-ink">Guide</h1>
          <p className="text-[13px] text-muted-ink">How to use Keel — in the app and from your own agent.</p>
        </div>
      </div>
      <div className="mx-auto flex w-full max-w-[820px] flex-col gap-7 px-8 py-7">
        <div className="rounded-[14px] border border-hairline bg-white px-8 py-7">
          <span className="text-[11px] font-semibold uppercase tracking-[0.07em] text-faint">The pipeline at a glance</span>
          <div className="pt-4">
            <PipelineDiagram />
          </div>
        </div>
        <div className="rounded-[14px] border border-hairline bg-white px-10 py-9">
          <Markdown content={md} />
        </div>
      </div>
    </div>
  );
}
