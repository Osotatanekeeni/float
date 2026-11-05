import "server-only";
import { sharedDb } from "@/db/shared";

/** The database for request code. Always query it through withUser(), never directly. */
export const getAppDb = sharedDb;
