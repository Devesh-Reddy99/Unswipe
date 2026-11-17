/*
 * Until a date is confirmed, phone numbers, emails, links and social handles are hidden.
 * Why: most romance scams start by moving the chat to WhatsApp/Telegram quickly.
 * We mask before saving, so we never even store the number.
 */
const PATTERNS: RegExp[] = [
  /(?:\+?91[\s-]?)?[6-9]\d{2}[\s-]?\d{3}[\s-]?\d{4}/g, // Indian mobile numbers
  /\b\d[\d\s-]{8,}\d\b/g, // any other long number
  /[\w.+-]+@[\w-]+\.[\w.]+/g, // emails
  /\bhttps?:\/\/\S+|\bwww\.\S+|\b[\w-]+\.(?:com|in|me|io|link|ly)\/\S*/gi, // links
  /(?:^|\s)@[a-z0-9_.]{3,}/gi, // @handles
  /\b(?:wa\.me|t\.me|telegram|whatsapp\s*(?:me|no|number))\b/gi,
];

export function maskContact(text: string): { text: string; masked: boolean } {
  let out = text;
  for (const p of PATTERNS) out = out.replace(p, (m) => (m.startsWith(" ") ? " " : "") + "[hidden until your date is confirmed]");
  return { text: out, masked: out !== text };
}
