"use client";

import { useSearchParams } from "next/navigation";

// Auth.js sends people back to /sign-in?error=<type>. Only known types get specific wording and the raw
// query value is never shown.
export function SignInNotice() {
  const error = useSearchParams().get("error");
  if (!error) return null;
  const message =
    error === "Verification"
      ? "That sign-in link has expired or was already used. Request a new one below."
      : "We could not sign you in. Try again, or request a new link.";
  return (
    <p role="alert" className="mb-4 rounded-input bg-status-caution px-3 py-2 text-[0.8125rem] text-status-caution-ink">
      {message}
    </p>
  );
}
