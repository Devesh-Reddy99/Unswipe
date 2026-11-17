"use client";
import { useActionState } from "react";
import { login, signup } from "@/app/actions/auth";
import { SubmitButton } from "./SubmitButton";

export function LoginForm() {
  const [state, action] = useActionState(login, undefined);
  return (
    <form action={action} className="grid gap-4">
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required className="field" />
      </div>
      <div>
        <label className="label" htmlFor="password">Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="field" />
      </div>
      {state?.error && <p role="alert" className="text-sm font-bold text-rose">{state.error}</p>}
      <SubmitButton pendingText="Signing in…">Sign in</SubmitButton>
    </form>
  );
}

export function DemoLogin({ email, password, label, sub }: { email: string; password: string; label: string; sub: string }) {
  const [state, action] = useActionState(login, undefined);
  return (
    <form action={action}>
      <input type="hidden" name="email" value={email} />
      <input type="hidden" name="password" value={password} />
      <SubmitButton className="btn-ghost w-full justify-between rounded-xl text-left" pendingText="Signing in…">
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
  const [state, action] = useActionState(signup, undefined);
  return (
    <form action={action} className="grid gap-4">
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
      <SubmitButton pendingText="Creating account…">Create account</SubmitButton>
    </form>
  );
}
