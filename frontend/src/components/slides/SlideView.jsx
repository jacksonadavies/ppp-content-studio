import React, { useEffect, useRef, useState } from "react";
import { Check, Quote as QuoteIcon } from "lucide-react";
import { PlayingCard } from "../poker/PlayingCard";
import { Chip } from "../poker/Chip";

export const LAYOUTS = [
  { id: "title", label: "Title Slide" },
  { id: "section", label: "Section Header" },
  { id: "bullets", label: "Bullet Points" },
  { id: "two_column", label: "Two Column" },
  { id: "subheader_box", label: "Sub-Header Box" },
  { id: "table_felt", label: "Table Felt" },
  { id: "image_text", label: "Image + Text" },
  { id: "stats", label: "Stats Highlight" },
  { id: "takeaways", label: "Key Takeaways" },
  { id: "quote", label: "Pro Tip / Quote" },
];
export const layoutLabel = (id) => LAYOUTS.find((l) => l.id === id)?.label || id;

const BW = 1280, BH = 720;

// Scales a fixed 1280x720 slide to fit its parent width.
export function SlideFrame({ children, className = "", testid }) {
  const ref = useRef(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setScale(el.clientWidth / BW));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={ref} data-testid={testid} className={`relative w-full ${className}`} style={{ aspectRatio: "16 / 9" }}>
      <div style={{ width: BW, height: BH, transform: `scale(${scale})`, transformOrigin: "top left", position: "absolute", top: 0, left: 0 }}>
        {children}
      </div>
    </div>
  );
}

function Logo() {
  return (
    <div className="absolute left-14 bottom-12 font-display font-extrabold text-white" style={{ fontSize: 22 }}>
      PRACTICAL POKER <span className="text-ppp-green">+</span>
    </div>
  );
}

const bg = { width: BW, height: BH, backgroundColor: "#0d0d0d", position: "relative", overflow: "hidden" };
const hex = {
  position: "absolute", inset: 0, opacity: 0.5,
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg width='56' height='100' viewBox='0 0 56 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M28 0l28 16v33L28 65 0 49V16z' fill='none' stroke='%23ffffff' stroke-opacity='0.05' stroke-width='1.5'/%3E%3Cpath d='M28 66l28 16v33L28 131 0 115V82z' fill='none' stroke='%23ffffff' stroke-opacity='0.05' stroke-width='1.5'/%3E%3C/svg%3E\")",
  backgroundSize: "56px 100px",
};

export function SlideBody({ slide }) {
  const s = slide || {};
  const layout = s.layout || "bullets";
  const Title = ({ size = 64, mb = 0 }) => (
    <div className="font-display font-extrabold uppercase text-white leading-[0.95]" style={{ fontSize: size, marginBottom: mb }}>
      {s.title}
    </div>
  );

  return (
    <div style={bg}>
      <div style={hex} />
      <div style={{ position: "absolute", top: 0, right: 0, width: 520, height: 520, background: "radial-gradient(circle at 70% 20%, rgba(158,230,15,0.10), transparent 60%)" }} />

      {layout === "title" && (
        <div className="absolute inset-0 flex flex-col justify-center px-20">
          <Title size={92} />
          {s.subtitle && <div className="text-ppp-green font-display font-bold uppercase mt-4" style={{ fontSize: 36 }}>{s.subtitle}</div>}
          <div className="absolute right-16 bottom-24 rotate-6">
            <div className="flex">
              <PlayingCard card={s?.motif === "cards" ? "Ah" : "As"} size="lg" className="scale-[1.8] origin-bottom" />
            </div>
          </div>
        </div>
      )}

      {layout === "section" && (
        <div className="absolute inset-0 flex flex-col justify-center px-20">
          {s.label && <div className="text-ppp-green font-mono uppercase tracking-[0.3em] mb-4" style={{ fontSize: 20 }}>{s.label}</div>}
          <Title size={76} />
          <div className="h-1.5 w-40 bg-ppp-green mt-8 rounded-full" />
        </div>
      )}

      {(layout === "bullets" || layout === "takeaways") && (
        <div className="absolute inset-0 px-20 pt-24">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-2.5 h-14 bg-ppp-green rounded-sm" />
            <Title size={52} />
          </div>
          <ul className="space-y-5">
            {(layout === "bullets" ? s.bullets : s.points || []).map((b, i) => (
              <li key={i} className="flex items-start gap-4 text-white" style={{ fontSize: 30 }}>
                {layout === "takeaways" ? (
                  <span className="mt-1 shrink-0 w-8 h-8 rounded-full bg-ppp-green flex items-center justify-center"><Check className="w-5 h-5 text-black" /></span>
                ) : (
                  <span className="text-ppp-green mt-0.5">▸</span>
                )}
                <span className="leading-snug">{b}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {layout === "two_column" && (
        <div className="absolute inset-0 px-20 pt-24">
          <div className="flex items-center gap-4 mb-10"><div className="w-2.5 h-14 bg-ppp-green rounded-sm" /><Title size={52} /></div>
          <div className="grid grid-cols-2 gap-8">
            {[["leftHeading", "leftBody"], ["rightHeading", "rightBody"]].map(([h, b], i) => (
              <div key={i} className="rounded-2xl p-8 neon-border" style={{ background: "#14161d", minHeight: 360 }}>
                <div className="text-ppp-green font-display font-bold uppercase mb-4" style={{ fontSize: 30 }}>{s[h]}</div>
                <div className="text-slate-200 leading-relaxed" style={{ fontSize: 24 }}>{s[b]}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {layout === "subheader_box" && (
        <div className="absolute inset-0 px-20 pt-24">
          <Title size={52} mb={28} />
          <div className="bg-ppp-green text-black font-display font-extrabold uppercase rounded-xl px-8 py-5 inline-block" style={{ fontSize: 32 }}>{s.subHeader}</div>
          <div className="text-slate-200 leading-relaxed mt-8 max-w-5xl" style={{ fontSize: 28 }}>{s.body}</div>
        </div>
      )}

      {layout === "table_felt" && (
        <div className="absolute inset-0 px-16 pt-20 flex flex-col items-center">
          <Title size={48} />
          <div className="mt-8 flex items-center justify-center" style={{ width: 980, height: 440, borderRadius: "50%", background: "radial-gradient(ellipse at center, #0f4022 0%, #082112 70%, #041209 100%)", border: "4px solid #9EE60F", boxShadow: "0 0 40px rgba(158,230,15,0.25)" }}>
            <div className="text-white text-center leading-relaxed px-24" style={{ fontSize: 30 }}>{s.body}</div>
          </div>
        </div>
      )}

      {layout === "image_text" && (
        <div className="absolute inset-0 px-20 pt-24 grid grid-cols-[1.4fr_1fr] gap-10 items-center">
          <div>
            <div className="flex items-center gap-4 mb-8"><div className="w-2.5 h-14 bg-ppp-green rounded-sm" /><Title size={52} /></div>
            <div className="text-slate-200 leading-relaxed" style={{ fontSize: 28 }}>{s.body}</div>
          </div>
          <div className="flex items-center justify-center rounded-2xl neon-border" style={{ background: "#14161d", height: 420 }}>
            {s.motif === "cards" ? (
              <div className="flex -space-x-6 rotate-6 scale-150">
                <PlayingCard card="As" size="lg" /><PlayingCard card="Ks" size="lg" className="rotate-6" />
              </div>
            ) : (
              <div className="flex flex-col items-center -space-y-4 scale-150">
                <Chip size={70} label="25" /><Chip size={70} label="25" /><Chip size={70} label="25" />
              </div>
            )}
          </div>
        </div>
      )}

      {layout === "stats" && (
        <div className="absolute inset-0 px-20 pt-24">
          <div className="flex items-center gap-4 mb-12"><div className="w-2.5 h-14 bg-ppp-green rounded-sm" /><Title size={52} /></div>
          <div className="flex gap-6 justify-center">
            {(s.stats || []).map((st, i) => (
              <div key={i} className="rounded-2xl neon-border px-8 py-10 text-center flex-1" style={{ background: "#14161d", maxWidth: 300 }}>
                <div className="text-ppp-green font-display font-extrabold neon-text" style={{ fontSize: 64 }}>{st.value}</div>
                <div className="text-slate-300 uppercase tracking-wider mt-3" style={{ fontSize: 20 }}>{st.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {layout === "quote" && (
        <div className="absolute inset-0 flex flex-col justify-center px-24">
          <QuoteIcon className="text-ppp-green mb-6" style={{ width: 64, height: 64 }} />
          <div className="text-white font-display font-bold leading-tight" style={{ fontSize: 52 }}>{s.quote}</div>
          {s.author && <div className="text-ppp-green uppercase tracking-wider mt-8 font-mono" style={{ fontSize: 26 }}>— {s.author}</div>}
        </div>
      )}

      <Logo />
    </div>
  );
}
