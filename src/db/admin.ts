import "server-only";
import { sharedDb } from "@/db/shared";

/**
 * The owner connection, which bypasses row-level security. Only Auth.js (which runs before a user
 * exists) and background jobs may use it; request handlers and repositories must not (enforced by an
 * ESLint rule). See ADR 0003.
 */
export const getAdminDb = sharedDb;
