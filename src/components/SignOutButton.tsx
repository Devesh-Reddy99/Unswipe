"use client";
import { useTransition } from "react";
import { logout } from "@/app/actions/auth";

/**
 * Signs out, then loads the home page fresh: it opens at the top, and no pages
 * from the signed-in session stay in the browser's memory for the next person.
 */
export function SignOutButton({ className = "btn-ghost" }: { className?: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      className={className}
      disabled={pending}
      onClick={() =>
        start(async () => {
          await logout();
          window.location.assign("/");
        })
      }
    >
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
