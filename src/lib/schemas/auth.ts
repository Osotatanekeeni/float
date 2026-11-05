import { z } from "zod";

// One schema for the sign-in form and the server action.
export const signInSchema = z.object({
  email: z.string().trim().toLowerCase().max(254).pipe(z.email()),
});

export type SignInInput = z.infer<typeof signInSchema>;
