import { Lock } from "lucide-react";
import { Wordmark } from "@/components/keel/wordmark";
import { LoginButton } from "@/components/keel/login-button";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const message =
    error === "domain"
      ? "Use your techjays.com account — other domains aren't allowed."
      : error === "auth"
        ? "Sign-in failed. Please try again."
        : null;

  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-panel px-6">
      <div className="flex w-full max-w-[400px] flex-col items-center">
        <div className="flex w-full flex-col items-center gap-8 rounded-[18px] border border-hairline bg-white px-10 py-12">
          <div className="flex flex-col items-center gap-5">
            <Wordmark size={40} className="items-center" />
            <div className="flex flex-col items-center gap-1.5">
              <h1 className="font-display text-[22px] font-semibold tracking-[-0.01em] text-ink">
                Sign in to Keel
              </h1>
              <p className="text-[13px] text-muted-ink">Scope-creep-proof discovery, gated.</p>
            </div>
          </div>

          {message && (
            <div className="w-full rounded-[10px] px-4 py-2.5 text-center text-[13px] font-medium text-gap" style={{ backgroundColor: "var(--gap-tint)" }}>
              {message}
            </div>
          )}

          <LoginButton />

          <div className="flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5 text-faint" strokeWidth={2} />
            <span className="text-xs text-faint">
              Restricted to <span className="font-medium text-muted-ink">techjays.com</span> accounts
            </span>
          </div>
        </div>
        <p className="pt-6 text-[11px] text-faint">Internal tool · Keel v1.3</p>
      </div>
    </div>
  );
}
