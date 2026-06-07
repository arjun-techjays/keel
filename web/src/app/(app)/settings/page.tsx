import { getTokens } from "@/lib/queries";
import { TokenManager } from "@/components/keel/token-manager";

type Token = {
  id: string;
  name: string | null;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
};

export default async function SettingsPage() {
  const tokens = (await getTokens()) as Token[];
  // Trailing slash required — server serves at "/mcp/"; "/mcp" 307-redirects and
  // the streamable client won't re-POST a body across it (large pushes hang).
  const mcpUrl = `${process.env.KEEL_SERVICE_URL ?? ""}/mcp/`;

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex flex-col gap-1.5 border-b border-hairline px-8 py-7">
        <h1 className="font-display text-[28px] font-semibold tracking-[-0.02em] text-ink">Settings</h1>
        <p className="text-[13px] text-muted-ink">
          Personal access tokens let Claude Code or Codex act as you over the Keel MCP server.
        </p>
      </div>
      <div className="mx-auto w-full max-w-[760px] px-8 py-7">
        <TokenManager tokens={tokens} mcpUrl={mcpUrl} />
      </div>
    </div>
  );
}
