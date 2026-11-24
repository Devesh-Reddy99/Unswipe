"use client";
import { useActionState } from "react";
import { keepValues } from "@/lib/keep-values";
import { login, signup } from "@/app/actions/auth";
import { SubmitButton } from "./SubmitButton";

export function LoginForm({ portal = "member" }: { portal?: "member" | "admin" }) {
  const [state, action, pending] = useActionState(login, undefined);
  return (
    <form onSubmit={keepValues(action)} className="grid gap-4">
      <input type="hidden" name="portal" value={portal} />
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required className="field" />
      </div>
      <div>
        <label className="label" htmlFor="password">Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="field" />
      </div>
      {state?.error && <p role="alert" className="text-sm font-bold text-rose">{state.error}</p>}
      <SubmitButton pending={pending} pendingText="Signing in…">Sign in</SubmitButton>
    </form>
  );
}

export function DemoLogin({
  email,
  password,
  label,
  sub,
  portal = "member",
}: {
  email: string;
  password: string;
  label: string;
  sub: string;
  portal?: "member" | "admin";
}) {
  const [state, action, pending] = useActionState(login, undefined);
  return (
    <form onSubmit={keepValues(action)}>
      <input type="hidden" name="portal" value={portal} />
      <input type="hidden" name="email" value={email} />
      <input type="hidden" name="password" value={password} />
      <SubmitButton pending={pending} className="btn-ghost w-full justify-between rounded-xl text-left" pendingText="Signing in…">
        <span>
          <span className="block">{label}</span>
          <span className="block text-xs font-normal text-dusk">{email} / {password}</span>
        </span>
        <span className="text-sm font-normal text-dusk">{sub}</span>
      </SubmitButton>
      {state?.error && <p className="mt-1 text-sm text-rose">{state.error}</p>}
    </form>
  );
}

export function SignupForm() {
  const [state, action, pending] = useActionState(signup, undefined);
  return (
    <form onSubmit={keepValues(action)} className="grid gap-4">
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required className="field" />
        <p className="hint mt-1">Use any email. Your eLitmus account is linked in the next step.</p>
      </div>
      <div>
        <label className="label" htmlFor="password">Password</label>
        <input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required className="field" />
      </div>
      {state?.error && <p role="alert" className="text-sm font-bold text-rose">{state.error}</p>}
      <SubmitButton pending={pending} pendingText="Creating account…">Create account</SubmitButton>
    </form>
  );
}
