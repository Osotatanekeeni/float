import { isDevLoginEnabled } from "@/server/auth/dev-login";
import { Button } from "@/components/ui/button";
import { devSignInAction } from "./actions";

/** A local-development shortcut. It renders nothing unless running under `next dev`. */
export function DevSignIn() {
  if (!isDevLoginEnabled(process.env)) return null;
  return (
    <form action={devSignInAction} className="mt-4 flex flex-col gap-2 border-t border-line pt-4">
      <Button type="submit" variant="outline">
        Continue as dev user
      </Button>
      <p className="text-[0.8125rem] text-ink-muted">
        Development only. Skips the email link; this button does not exist in production.
      </p>
    </form>
  );
}
