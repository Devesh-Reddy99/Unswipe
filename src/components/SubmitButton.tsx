"use client";
import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  pendingText,
  pending,
  className = "btn-primary",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { pendingText?: string; pending?: boolean }) {
  // Forms submitted with keepValues() pass `pending` from useActionState; the rest use the form's own status
  const status = useFormStatus();
  const busy = pending ?? status.pending;
  return (
    <button type="submit" disabled={busy} className={className} {...rest}>
      {busy ? pendingText ?? "Saving…" : children}
    </button>
  );
}
