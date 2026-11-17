/*
 * Illustrated avatar, generated from a number.
 * Seeded demo profiles use these instead of photos of real people (privacy + consent).
 * Real users can upload a photo, which then replaces the illustration.
 */
const BG = ["#F6D8A8", "#D8E7F5", "#E1F1EC", "#FBE6EC", "#E8E0F5", "#F3E5D0", "#DCEFD9"];
const SKIN = ["#8D5524", "#A0673E", "#C68642", "#B97A57", "#E0AC69", "#7A4A2A"];
const HAIR = ["#1E1A1A", "#2B1D14", "#3B2416", "#4A3426", "#151515"];

export function Avatar({
  seed,
  photo,
  name,
  size = 56,
  className = "",
}: {
  seed: number;
  photo?: string | null;
  name: string;
  size?: number;
  className?: string;
}) {
  if (photo) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={photo}
        alt={`Photo of ${name}`}
        width={size}
        height={size}
        className={`shrink-0 rounded-full object-cover ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }
  const r = (n: number) => Math.abs(Math.floor(Math.sin(seed * 9301 + n * 49297) * 233280)) ;
  const bg = BG[r(1) % BG.length];
  const skin = SKIN[r(2) % SKIN.length];
  const hair = HAIR[r(3) % HAIR.length];
  const style = r(4) % 4; // 0 short, 1 long, 2 bun, 3 curly
  const glasses = r(5) % 4 === 0;
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      role="img"
      aria-label={`Illustrated avatar for ${name}`}
      className={`shrink-0 rounded-full ${className}`}
    >
      <rect width="64" height="64" fill={bg} />
      {style === 1 && <path d="M14 30c0-14 8-20 18-20s18 6 18 20v26H14z" fill={hair} />}
      <path d="M12 64c2-11 10-16 20-16s18 5 20 16z" fill={skin} opacity="0.9" />
      <path d="M12 64c2-11 10-16 20-16s18 5 20 16z" fill="#221B33" opacity="0.15" />
      <circle cx="32" cy="30" r="13" fill={skin} />
      {style === 0 && <path d="M19 28c0-9 6-13 13-13s13 4 13 13c-3-5-8-7-13-7s-10 2-13 7z" fill={hair} />}
      {style === 1 && <path d="M19 29c1-9 6-13 13-13s12 4 13 13c-4-6-9-8-13-8s-10 2-13 8z" fill={hair} />}
      {style === 2 && (
        <>
          <circle cx="32" cy="13" r="6" fill={hair} />
          <path d="M19 28c0-9 6-12 13-12s13 3 13 12c-3-4-8-6-13-6s-10 2-13 6z" fill={hair} />
        </>
      )}
      {style === 3 && (
        <g fill={hair}>
          <circle cx="22" cy="21" r="5" />
          <circle cx="29" cy="17" r="5.5" />
          <circle cx="36" cy="17" r="5.5" />
          <circle cx="42" cy="21" r="5" />
          <circle cx="45" cy="27" r="3.5" />
          <circle cx="19" cy="27" r="3.5" />
        </g>
      )}
      <circle cx="27" cy="31" r="1.5" fill="#221B33" />
      <circle cx="37" cy="31" r="1.5" fill="#221B33" />
      <path d="M27.5 36.5c2.5 2.2 6.5 2.2 9 0" stroke="#221B33" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      {glasses && (
        <g stroke="#221B33" strokeWidth="1.3" fill="none">
          <circle cx="27" cy="31" r="4" />
          <circle cx="37" cy="31" r="4" />
          <path d="M31 31h2" />
        </g>
      )}
    </svg>
  );
}
