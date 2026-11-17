const STEPS = ["Verify", "Consent", "Profile", "Values"];

export function Steps({ current }: { current: number }) {
  return (
    <ol className="mb-8 flex gap-2" aria-label="Sign-up progress">
      {STEPS.map((s, i) => (
        <li key={s} className="flex-1" aria-current={i === current ? "step" : undefined}>
          <span className={`block h-1.5 rounded-full ${i <= current ? "bg-ink" : "bg-mist"}`} />
          <span className={`mt-1.5 block text-xs ${i === current ? "font-bold text-ink" : "text-dusk"}`}>{s}</span>
        </li>
      ))}
    </ol>
  );
}
