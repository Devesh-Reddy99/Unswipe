"use client";
import { startTransition, type FormEvent } from "react";

/**
 * React 19 clears a form after every server-action submit, even when the action
 * returns an error, so people lose what they typed. Submitting through onSubmit
 * instead keeps the fields as they are; the page still moves on after a success.
 */
export function keepValues(dispatch: (form: FormData) => void) {
  return (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const submitter = (e.nativeEvent as SubmitEvent).submitter;
    const form = new FormData(e.currentTarget, submitter instanceof HTMLElement ? submitter : null);
    startTransition(() => dispatch(form));
  };
}
