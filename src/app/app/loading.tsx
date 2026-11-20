// Shown the moment you tap a tab, while the page's data loads.
export default function Loading() {
  return (
    <main className="px-5" aria-busy="true" aria-label="Loading">
      <div className="h-9 w-40 rounded-lg bg-mist motion-safe:animate-pulse" />
      <div className="mt-3 h-4 w-64 rounded bg-mist/70 motion-safe:animate-pulse" />
      <div className="mt-6 grid gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="panel flex items-center gap-4 p-4">
            <div className="h-14 w-14 shrink-0 rounded-full bg-mist motion-safe:animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/3 rounded bg-mist motion-safe:animate-pulse" />
              <div className="h-3 w-2/3 rounded bg-mist/70 motion-safe:animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
