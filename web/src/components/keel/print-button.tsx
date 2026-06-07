"use client";

import { Download } from "lucide-react";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="flex items-center gap-2 rounded-[9px] border border-hairline bg-white px-3.5 py-2.5 text-[13px] font-semibold text-muted-ink hover:bg-panel"
    >
      <Download className="h-[15px] w-[15px]" strokeWidth={2} />
      Export PDF
    </button>
  );
}
