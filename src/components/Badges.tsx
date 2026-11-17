export function VerifiedBadge({ label = "eLitmus verified" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-leaf-soft px-2.5 py-0.5 text-xs font-bold text-leaf">
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden>
        <path d="M8 1l1.8 1.3 2.2-.1.7 2.1 1.8 1.3-.7 2.1.7 2.1-1.8 1.3-.7 2.1-2.2-.1L8 15l-1.8-1.3-2.2.1-.7-2.1L1.5 10.4l.7-2.1-.7-2.1 1.8-1.3.7-2.1 2.2.1z" fill="currentColor" />
        <path d="M5.3 8.2l1.8 1.8 3.6-3.7" stroke="#fff" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      </svg>
      {label}
    </span>
  );
}

export function PersonaBadge() {
  return (
    <span
      className="inline-flex items-center rounded-full border border-dashed border-dusk/50 px-2 py-0.5 text-xs text-dusk"
      title="Seeded demo profile. It replies automatically so you can try the whole flow."
    >
      Demo persona
    </span>
  );
}
