export const RANKS = ["A", "K", "Q", "J", "T", "9", "8", "7", "6", "5", "4", "3", "2"];
export const SUITS = ["s", "h", "d", "c"];

export const SUIT_SYMBOL = { s: "\u2660", h: "\u2665", d: "\u2666", c: "\u2663" };
export const SUIT_COLOR = { s: "#e5e7eb", h: "#ef4444", d: "#3b82f6", c: "#10b981" };
// On white card faces:
export const SUIT_FACE_COLOR = { s: "#0f172a", h: "#dc2626", d: "#2563eb", c: "#10a85a" };

export function fullDeck() {
  const d = [];
  for (const r of RANKS) for (const s of SUITS) d.push(r + s);
  return d;
}

export function rankOf(card) {
  return card ? card.slice(0, -1) : "";
}
export function suitOf(card) {
  return card ? card.slice(-1) : "";
}

export const BLINDS_LABELS = ["SB", "BB"];

// standard 9-max position names by seat count
export function positionName(seatIndex, total, buttonIndex) {
  const rel = (seatIndex - buttonIndex + total) % total;
  const map9 = ["BTN", "SB", "BB", "UTG", "UTG+1", "MP", "MP+1", "HJ", "CO"];
  const map6 = ["BTN", "SB", "BB", "UTG", "HJ", "CO"];
  const map = total <= 6 ? map6 : map9;
  return map[rel] || `P${rel}`;
}
