import { getAppDb } from "@/db/app";
import { withUser } from "@/db/client";
import { apiError } from "@/lib/api-error";
import { withAuth } from "@/server/auth/guard";
import { getProfile } from "@/server/users";

export const GET = withAuth(async (_request, { userId }) => {
  const profile = await withUser(getAppDb(), userId, (tx) => getProfile(tx, userId));
  if (!profile) return apiError(404, "not_found", "Profile not found");
  return Response.json(profile, { headers: { "cache-control": "no-store" } });
});
