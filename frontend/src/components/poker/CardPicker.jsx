import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { RANKS, SUITS, SUIT_SYMBOL, SUIT_FACE_COLOR } from "../../lib/cards";
import { PlayingCard } from "./PlayingCard";

export function CardPicker({ open, onOpenChange, count = 2, used = [], initial = [], onConfirm, title = "Select cards" }) {
  const [sel, setSel] = useState(initial.filter(Boolean));

  React.useEffect(() => { if (open) setSel(initial.filter(Boolean)); }, [open]);

  const toggle = (card) => {
    if (sel.includes(card)) return setSel(sel.filter((c) => c !== card));
    if (sel.length >= count) return;
    setSel([...sel, card]);
  };

  const usedSet = new Set(used.filter((c) => !initial.includes(c)));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-ppp-panel border-white/10 text-white max-w-2xl">
        <DialogHeader><DialogTitle className="font-display uppercase tracking-tight">{title}</DialogTitle></DialogHeader>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-slate-400">Selected:</span>
          <div className="flex gap-1.5">
            {Array.from({ length: count }).map((_, i) => sel[i] ? <PlayingCard key={i} card={sel[i]} size="sm" /> : <div key={i} className="w-[34px] h-[48px] rounded-md border border-dashed border-white/20" />)}
          </div>
          {sel.length > 0 && <button onClick={() => setSel([])} className="ml-auto text-xs text-slate-400 hover:text-red-400">Clear</button>}
        </div>
        <div className="space-y-1.5">
          {SUITS.map((su) => (
            <div key={su} className="flex items-center gap-1.5">
              <span className="w-5 text-center font-bold" style={{ color: SUIT_FACE_COLOR[su] === "#0f172a" ? "#e5e7eb" : SUIT_FACE_COLOR[su] }}>{SUIT_SYMBOL[su]}</span>
              <div className="flex flex-wrap gap-1">
                {RANKS.map((r) => {
                  const card = r + su;
                  const isSel = sel.includes(card);
                  const isUsed = usedSet.has(card);
                  return (
                    <button key={card} data-testid={`pick-${card}`} disabled={isUsed} onClick={() => toggle(card)}
                      className={`w-9 h-9 rounded-md text-xs font-bold font-display transition-all ${isSel ? "ring-2 ring-ppp-green scale-105" : ""} ${isUsed ? "opacity-25 cursor-not-allowed bg-ppp-surface" : "bg-[#f6f7fa] hover:scale-110"}`}
                      style={{ color: isUsed ? "#64748b" : SUIT_FACE_COLOR[su] }}>
                      {r === "T" ? "10" : r}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-slate-300 hover:bg-white/5">Cancel</Button>
          <Button data-testid="cardpicker-confirm" onClick={() => { onConfirm(sel); onOpenChange(false); }} className="bg-ppp-green text-black hover:bg-ppp-greenDim font-semibold">Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default CardPicker;
