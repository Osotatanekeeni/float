import pino from "pino";

// Redact by path so a stray object never leaks credentials; callers must still avoid logging user content.
export const logger = pino({
  level: process.env.NODE_ENV === "test" ? "silent" : "info",
  redact: ["req.headers.authorization", "req.headers.cookie", "*.password", "*.token", "*.apiKey"],
});

export function requestLogger(requestId: string) {
  return logger.child({ requestId });
}
