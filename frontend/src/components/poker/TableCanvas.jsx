import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PlayingCard } from "./PlayingCard";
import { Chip } from "./Chip";

function seatPos(i, n) {
  const ang = Math.PI / 2 + (2 * Math.PI * i) / n; // seat 0 bottom-center
  return { x: 50 + 41 * Math.cos(ang), y: 50 + 39 * Math.sin(ang) };
}

export function TableCanvas({ frame, seatCount, testid }) {
  const players = frame?.players || [];
  const board = frame?.board || [];
  return (
    <div data-testid={testid} className="relative w-full rounded-2xl overflow-hidden border border-white/10 card-shadow" style={{ aspectRatio: "16 / 9", background: "#0d0d0d" }}>
      {/* logo */}
      <div className="absolute left-4 top-3 font-display font-extrabold text-white text-sm z-20">PRACTICAL POKER <span className="text-ppp-green">+</span></div>

      {/* felt */}
      <div className="absolute" style={{ left: "8%", top: "12%", right: "8%", bottom: "16%" }}>
        <div className="w-full h-full rounded-[50%]" style={{ background: "radial-gradient(ellipse at center, #0f4022 0%, #082112 70%, #041209 100%)", border: "3px solid #9EE60F", boxShadow: "0 0 40px rgba(158,230,15,0.2), inset 0 0 60px rgba(0,0,0,0.6)" }} />
      </div>

      {/* street + board + pot */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-10 pointer-events-none">
        {frame?.street && <div className="text-ppp-green font-mono text-xs uppercase tracking-[0.3em]">{frame.street}</div>}
        <div className="flex gap-1.5 min-h-[48px] items-center">
          <AnimatePresence>
            {board.map((c, i) => (
              <motion.div key={c + i} initial={{ opacity: 0, y: -14, rotateY: 90 }} animate={{ opacity: 1, y: 0, rotateY: 0 }} transition={{ delay: i * 0.05 }}>
                <PlayingCard card={c} size="sm" />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        {frame?.pot != null && (
          <div className="flex items-center gap-1.5 bg-black/50 rounded-full px-3 py-1">
            <Chip size={16} /> <span className="text-white text-xs font-mono font-bold">POT {frame.pot}</span>
          </div>
        )}
      </div>

      {/* players */}
      {players.map((p) => {
        const { x, y } = seatPos(p.seat, seatCount);
        const toCenterX = 50 - x, toCenterY = 50 - y;
        return (
          <div key={p.seat} className="absolute z-10" style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)" }}>
            {/* hole cards */}
            {!p.folded && (p.cards?.length || p.inHand) && (
              <div className="flex justify-center gap-0.5 mb-1">
                {(p.cards && p.cards.length ? p.cards : ["", ""]).map((c, k) => (
                  <PlayingCard key={k} card={c} faceDown={!p.revealed} size="xs" />
                ))}
              </div>
            )}
            <motion.div animate={p.acting ? { scale: 1.04 } : { scale: 1 }}
              className={`rounded-lg px-2.5 py-1.5 min-w-[92px] text-center border ${p.acting ? "border-ppp-green acting-glow bg-[#141a12]" : "border-white/15 bg-ppp-panel"} ${p.folded ? "opacity-45" : ""}`}>
              <div className="text-white text-[11px] font-semibold truncate">{p.name}</div>
              <div className={`text-[10px] font-mono ${p.folded ? "text-slate-500" : "text-ppp-green"}`}>{p.stack}</div>
            </motion.div>
            {p.dealer && <div className="absolute -right-2 -top-1 w-5 h-5 rounded-full bg-white text-black text-[10px] font-bold flex items-center justify-center border border-black/40">D</div>}
            {p.pos && <div className="absolute -left-1 -bottom-1 text-[8px] font-mono bg-black/70 text-ppp-green px-1 rounded">{p.pos}</div>}
            {/* bet chips toward center */}
            {p.bet ? (
              <div className="absolute z-20" style={{ left: `calc(50% + ${toCenterX * 0.9}px)`, top: `calc(50% + ${toCenterY * 0.9}px)`, transform: "translate(-50%,-50%)" }}>
                <div className="flex items-center gap-1 bg-black/60 rounded-full px-1.5 py-0.5">
                  <Chip size={14} /><span className="text-white text-[10px] font-mono font-bold">{p.bet}</span>
                </div>
              </div>
            ) : null}
          </div>
        );
      })}

      {/* action label */}
      {frame?.label && (
        <div className="absolute left-0 right-0 bottom-0 bg-ppp-panel/95 border-t border-ppp-green/40 px-4 py-2 z-20 flex items-center gap-2">
          <div className="w-1.5 h-4 bg-ppp-green rounded-sm" />
          <span className="text-white text-sm font-medium">{frame.label}</span>
        </div>
      )}
    </div>
  );
}

export default TableCanvas;
