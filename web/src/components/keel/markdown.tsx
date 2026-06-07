"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function Markdown({ content }: { content: string }) {
  return (
    <div
      className="prose prose-sm max-w-none text-ink
        prose-headings:font-display prose-headings:tracking-[-0.01em] prose-headings:text-ink
        prose-p:text-muted-ink prose-li:text-muted-ink
        prose-strong:text-ink prose-a:text-cobalt
        prose-table:text-[12.5px] prose-th:text-ink prose-td:text-muted-ink
        prose-hr:border-hairline"
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
