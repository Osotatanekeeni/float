import { apiError } from "@/lib/api-error";
import { logger } from "@/lib/logger";

export class UnauthenticatedError extends Error {
  override name = "UnauthenticatedError";
}

type GetSession = () => Promise<{ user?: { id?: string } } | null>;

const defaultSession: GetSession = async () => (await import("@/auth")).auth();

/** The signed-in user's id, or UnauthenticatedError. Authorisation always starts here, on the server. */
export async function requireUserId(getSession: GetSession = defaultSession): Promise<string> {
  const id = (await getSession())?.user?.id;
  if (!id) throw new UnauthenticatedError("Not signed in");
  return id;
}

type Handler = (request: Request, context: { userId: string }) => Promise<Response>;

/** Wraps a route handler: 401 when signed out, a leak-free 500 on unexpected errors. */
export function withAuth(handler: Handler, getSession: GetSession = defaultSession) {
  return async (request: Request): Promise<Response> => {
    const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();
    try {
      const userId = await requireUserId(getSession);
      return await handler(request, { userId });
    } catch (error) {
      if (error instanceof UnauthenticatedError) {
        return apiError(401, "unauthenticated", "Sign in to continue", { requestId });
      }
      // Only the error class and request id are logged: messages can carry user data or credentials.
      logger.error({ requestId, error: error instanceof Error ? error.name : "unknown" }, "route handler failed");
      return apiError(500, "internal", "Something went wrong", { requestId });
    }
  };
}
