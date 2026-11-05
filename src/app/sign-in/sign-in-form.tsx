"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInSchema, type SignInInput } from "@/lib/schemas/auth";
import { requestMagicLink } from "./actions";

export function SignInForm() {
  const [pending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SignInInput>({ resolver: zodResolver(signInSchema), defaultValues: { email: "" } });

  const onSubmit = handleSubmit((values) => {
    setFormError(null);
    startTransition(async () => {
      const result = await requestMagicLink(values);
      if (result.ok) return;
      if (result.error === "invalid") setError("email", { message: result.fields.email });
      else if (result.error === "rate_limited") {
        const minutes = Math.max(1, Math.ceil(result.retryAfterSeconds / 60));
        setFormError(`Too many sign-in attempts. Try again in ${minutes} ${minutes === 1 ? "minute" : "minutes"}.`);
      } else setFormError("We could not send the link. Check your connection and try again.");
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email address</Label>
        <Input
          id="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoFocus
          aria-invalid={errors.email ? "true" : undefined}
          aria-describedby={errors.email ? "email-error" : undefined}
          {...register("email")}
        />
        {errors.email ? (
          <p id="email-error" className="text-[0.8125rem] text-status-shortfall-ink">
            {errors.email.message}
          </p>
        ) : null}
      </div>
      {formError ? (
        <p role="alert" className="rounded-input bg-status-caution px-3 py-2 text-[0.8125rem] text-status-caution-ink">
          {formError}
        </p>
      ) : null}
      <Button type="submit" size="lg" loading={pending}>
        Email me a sign-in link
      </Button>
    </form>
  );
}
