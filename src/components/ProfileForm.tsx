"use client";
import { useActionState, useState } from "react";
import { saveProfile } from "@/app/actions/onboarding";
import { AREAS, AVAILABILITY, CITIES, DATE_STYLES, INTENTS, LANGUAGES, PROMPT_QUESTIONS } from "@/lib/constants";
import type { Profile } from "@/db/schema";
import { SubmitButton } from "./SubmitButton";
import { Avatar } from "./Avatar";

/** Resize in the browser so we store a small JPEG (≈30–80 KB), not the original photo with its metadata. */
async function resizePhoto(file: File): Promise<string> {
  const img = await createImageBitmap(file);
  const size = 480;
  const scale = Math.max(size / img.width, size / img.height);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const w = img.width * scale;
  const h = img.height * scale;
  ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h); // centre crop to a square
  return canvas.toDataURL("image/jpeg", 0.82); // re-encoding also strips EXIF data such as GPS location
}

export function ProfileForm({ initial, submitLabel }: { initial?: Profile | null; submitLabel: string }) {
  const [state, action] = useActionState(saveProfile, undefined);
  const [city, setCity] = useState<string>(initial?.city ?? "Bengaluru");
  const [photo, setPhoto] = useState<string | null>(null);
  const [removed, setRemoved] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const current = removed ? null : photo ?? initial?.photo ?? null;
  const p1 = initial?.prompts?.[0];
  const p2 = initial?.prompts?.[1];

  return (
    <form action={action} className="grid gap-8">
      <Section title="Photo">
        <div className="flex items-center gap-5">
          <Avatar seed={initial?.avatarSeed ?? 3} photo={current} name="You" size={88} />
          <div className="grid gap-2">
            <label className="btn-ghost cursor-pointer">
              {current ? "Change photo" : "Add a photo"}
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  setPhotoError(null);
                  try {
                    setPhoto(await resizePhoto(f));
                    setRemoved(false);
                  } catch {
                    setPhotoError("That file couldn't be read. Try a JPEG or PNG.");
                  }
                }}
              />
            </label>
            {current && (
              <button type="button" className="text-left text-sm text-dusk underline" onClick={() => { setPhoto(null); setRemoved(true); }}>
                Use an illustration instead
              </button>
            )}
            <p className="hint">Optional. Without a photo we show an illustration.</p>
            {photoError && <p className="text-sm text-rose">{photoError}</p>}
          </div>
        </div>
        {photo && <input type="hidden" name="photo" value={photo} />}
        {removed && <input type="hidden" name="removePhoto" value="1" />}
      </Section>

      <Section title="The basics">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First name" htmlFor="name">
            <input id="name" name="name" required maxLength={30} defaultValue={initial?.name} className="field" />
          </Field>
          <Field label="Date of birth" htmlFor="birthDate">
            <input id="birthDate" name="birthDate" type="date" required defaultValue={initial?.birthDate} className="field" />
          </Field>
          <Field label="I am a" htmlFor="gender">
            <select id="gender" name="gender" required defaultValue={initial?.gender ?? ""} className="field">
              <option value="" disabled>Choose</option>
              <option value="woman">Woman</option>
              <option value="man">Man</option>
              <option value="nonbinary">Non-binary person</option>
            </select>
          </Field>
          <fieldset>
            <legend className="label">I'd like to meet</legend>
            <div className="flex flex-wrap gap-2">
              {[["woman", "Women"], ["man", "Men"], ["nonbinary", "Non-binary people"]].map(([v, l]) => (
                <Toggle key={v} name="interestedIn" value={v} label={l} defaultChecked={initial?.interestedIn.includes(v)} />
              ))}
            </div>
          </fieldset>
          <Field label="City" htmlFor="city">
            <select id="city" name="city" value={city} onChange={(e) => setCity(e.target.value)} className="field">
              {CITIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="Area you live or work in" htmlFor="area">
            <select id="area" name="area" key={city} defaultValue={initial?.city === city ? initial?.area : ""} required className="field">
              <option value="" disabled>Choose</option>
              {AREAS[city].map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
          </Field>
          <Field label="Company (optional)" htmlFor="company">
            <input id="company" name="company" maxLength={60} defaultValue={initial?.company ?? ""} className="field" />
          </Field>
          <Field label="Role (optional)" htmlFor="jobTitle">
            <input id="jobTitle" name="jobTitle" maxLength={60} defaultValue={initial?.jobTitle ?? ""} className="field" />
          </Field>
        </div>
        <p className="hint mt-3">People at your company are hidden from you, and you from them. You can change this in Settings.</p>
      </Section>

      <Section title="What you're looking for">
        <div className="grid gap-2">
          {Object.entries(INTENTS).map(([v, l]) => (
            <label key={v} className="flex cursor-pointer items-center gap-3 rounded-xl border border-mist bg-white px-4 py-3 has-[:checked]:border-ink">
              <input type="radio" name="intent" value={v} required defaultChecked={initial?.intent === v} className="h-4 w-4 accent-ink" />
              {l}
            </label>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:max-w-xs">
          <Field label="Age from" htmlFor="ageMin">
            <input id="ageMin" name="ageMin" type="number" min={18} max={60} defaultValue={initial?.ageMin ?? 21} className="field" />
          </Field>
          <Field label="to" htmlFor="ageMax">
            <input id="ageMax" name="ageMax" type="number" min={18} max={60} defaultValue={initial?.ageMax ?? 30} className="field" />
          </Field>
        </div>
      </Section>

      <Section title="In your words">
        <Field label="A line about you (optional)" htmlFor="about">
          <textarea id="about" name="about" rows={2} maxLength={300} defaultValue={initial?.about} className="field" />
        </Field>
        {[{ n: 1, d: p1, fallback: 0 }, { n: 2, d: p2, fallback: 1 }].map(({ n, d, fallback }) => (
          <div key={n} className="mt-4 grid gap-2">
            <label className="sr-only" htmlFor={`prompt${n}q`}>Prompt {n}</label>
            <select id={`prompt${n}q`} name={`prompt${n}q`} defaultValue={d?.q ?? PROMPT_QUESTIONS[fallback]} className="field font-bold">
              {PROMPT_QUESTIONS.map((q) => (
                <option key={q}>{q}</option>
              ))}
            </select>
            <label className="sr-only" htmlFor={`prompt${n}a`}>Your answer</label>
            <input id={`prompt${n}a`} name={`prompt${n}a`} required maxLength={160} defaultValue={d?.a} placeholder="Your answer" className="field" />
          </div>
        ))}
      </Section>

      <Section title="How you like to meet">
        <Group legend="First dates I enjoy">
          {Object.entries(DATE_STYLES).map(([v, l]) => (
            <Toggle key={v} name="dateStyles" value={v} label={l} defaultChecked={initial?.dateStyles.includes(v)} />
          ))}
        </Group>
        <Group legend="Usually free on">
          {Object.entries(AVAILABILITY).map(([v, l]) => (
            <Toggle key={v} name="availability" value={v} label={l} defaultChecked={initial?.availability.includes(v)} />
          ))}
        </Group>
        <Group legend="Languages">
          {LANGUAGES.map((l) => (
            <Toggle key={l} name="languages" value={l} label={l} defaultChecked={initial ? initial.languages.includes(l) : l === "English"} />
          ))}
        </Group>
      </Section>

      {state?.error && <p role="alert" className="font-bold text-rose">{state.error}</p>}
      {state?.ok && <p role="status" className="font-bold text-leaf">{state.message}</p>}
      <div>
        <SubmitButton pendingText="Saving…">{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-4 text-xl font-bold">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label" htmlFor={htmlFor}>{label}</label>
      {children}
    </div>
  );
}

function Group({ legend, children }: { legend: string; children: React.ReactNode }) {
  return (
    <fieldset className="mt-4 first:mt-0">
      <legend className="label">{legend}</legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}

function Toggle({ name, value, label, defaultChecked }: { name: string; value: string; label: string; defaultChecked?: boolean }) {
  return (
    <label className="chip cursor-pointer select-none has-[:checked]:border-ink has-[:checked]:bg-ink has-[:checked]:text-paper has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-marigold">
      <input type="checkbox" name={name} value={value} defaultChecked={defaultChecked} className="sr-only" />
      {label}
    </label>
  );
}
