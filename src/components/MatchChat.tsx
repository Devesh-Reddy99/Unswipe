"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { sendMessage } from "@/app/actions/dating";
import { fmtTime } from "@/lib/time";

type Msg = { id: string; senderId: string | null; body: string; masked: boolean; createdAt: string | Date };

export function MatchChat({
  matchId,
  meId,
  otherName,
  initial,
  initialStatus,
  initialPlanKey,
  closed,
  unlocked,
}: {
  matchId: string;
  meId: string;
  otherName: string;
  initial: Msg[];
  initialStatus: string;
  initialPlanKey: string;
  closed: boolean;
  unlocked: boolean;
}) {
  const router = useRouter();
  const [msgs, setMsgs] = useState<Msg[]>(initial);
  const [text, setText] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const bottom = useRef<HTMLDivElement>(null);
  const keys = useRef({ status: initialStatus, plan: initialPlanKey });

  // Poll for new messages; refresh the page when the match or date plan changes.
  useEffect(() => {
    if (closed) return;
    let alive = true;
    const tick = async () => {
      try {
        const r = await fetch(`/api/matches/${matchId}/messages`, { cache: "no-store" });
        if (!r.ok || !alive) return;
        const data = await r.json();
        setMsgs(data.messages);
        if (data.status !== keys.current.status || data.planKey !== keys.current.plan) {
          keys.current = { status: data.status, plan: data.planKey };
          router.refresh();
        }
      } catch {
        /* network hiccup; try again next tick */
      }
    };
    const id = setInterval(tick, 3000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [matchId, closed, router]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" });
  }, [msgs.length]);

  const send = () =>
    start(async () => {
      const body = text;
      setText("");
      const r = await sendMessage(matchId, body);
      if (r?.error) setNote(r.error);
      else if (r?.masked) setNote("We hid a number or link in your message. Contact details unlock once your date is confirmed.");
      else setNote(null);
      const res = await fetch(`/api/matches/${matchId}/messages`, { cache: "no-store" });
      if (res.ok) setMsgs((await res.json()).messages);
    });

  return (
    <section aria-label={`Chat with ${otherName}`} className="mt-6">
      <ol className="grid gap-2">
        {msgs.map((m) =>
          m.senderId === null ? (
            <li key={m.id} className="mx-auto max-w-[90%] py-1 text-center text-sm text-dusk">
              {m.body}
            </li>
          ) : (
            <li key={m.id} className={`flex ${m.senderId === meId ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                  m.senderId === meId ? "rounded-br-md bg-ink text-paper" : "rounded-bl-md border border-mist bg-white"
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{m.body}</p>
                <p className={`mt-0.5 text-right text-[11px] ${m.senderId === meId ? "text-paper/60" : "text-dusk"}`}>{fmtTime(m.createdAt)}</p>
              </div>
            </li>
          ),
        )}
      </ol>
      <div ref={bottom} />

      {!closed && (
        <div className="sticky bottom-[68px] mt-4 bg-paper pb-2 pt-2">
          {note && <p className="mb-2 rounded-xl bg-marigold/15 px-3 py-2 text-sm text-ink">{note}</p>}
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (text.trim()) send();
            }}
          >
            <label htmlFor="msg" className="sr-only">Message {otherName}</label>
            <input
              id="msg"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`Message ${otherName}`}
              maxLength={1000}
              autoComplete="off"
              className="field rounded-full"
            />
            <button className="btn-dark" disabled={pending || !text.trim()}>Send</button>
          </form>
          {!unlocked && <p className="mt-1.5 px-2 text-xs text-dusk">Numbers and links stay hidden until a date is confirmed.</p>}
        </div>
      )}
    </section>
  );
}
