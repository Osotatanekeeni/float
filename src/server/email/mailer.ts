export interface MagicLink {
  to: string;
  url: string;
  expires: Date;
}

export interface Mailer {
  sendMagicLink(link: MagicLink): Promise<void>;
}

/** Development stand-in until Resend is configured: prints the link instead of emailing it. */
export function createConsoleMailer(write: (line: string) => void = (line) => console.info(line)): Mailer {
  return {
    async sendMagicLink({ to, url, expires }) {
      write(`[float] Email not sent (development transport). Sign-in link for ${to}, valid until ${expires.toISOString()}:`);
      write(url);
    },
  };
}

// The link is a credential, so the console transport must never run where logs are retained.
export function getMailer(env: { NODE_ENV?: string }): Mailer {
  if (env.NODE_ENV === "production") {
    throw new Error("No email transport is configured for production (the console transport is development only)");
  }
  return createConsoleMailer();
}

/** Picks the transport when a link is sent, not when the auth config is built, so sessions keep working
 * even where no transport is configured; only requesting a sign-in link fails. */
export function createLazyMailer(env: { NODE_ENV?: string }): Mailer {
  return { sendMagicLink: async (link) => getMailer(env).sendMagicLink(link) };
}
