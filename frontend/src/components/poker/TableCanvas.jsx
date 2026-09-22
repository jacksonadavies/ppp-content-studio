import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PlayingCard } from "./PlayingCard";
import { Chip } from "./Chip";

function seatPos(i, n) {
  const ang = Math.PI / 2 + (2 * Math.PI * i) / n; // seat 0 bottom-centre
  return { x: 50 + 40 * Math.cos(ang), y: 47 + 33 * Math.sin(ang) };
}

export function TableCanvas({ frame, seatCount, deck = "fourcolour", testid }) {
  const players = frame?.players || [];
  const board = frame?.board || [];
  return (
    <div
      data-testid={testid}
      className="relative w-full rounded-2xl overflow-hidden card-shadow"
      style={{ aspectRatio: "16 / 9", backgroundImage: "url('/brand/table/table.png')", backgroundSize: "cover", backgroundPosition: "center" }}
    >
      {/* board + pot at felt centre */}
      <div className="absolute left-1/2 z-10 flex flex-col items-center gap-2" style={{ top: "38%", transform: "translate(-50%,-50%)" }}>
        {frame?.street && <div className="font-subhead text-ppp-green text-lg tracking-[0.35em] uppercase" style={{ textShadow: "0 0 10px rgba(143,232,10,0.6)" }}>{frame.street}</div>}
        <div className="flex gap-1.5 min-h-[56px] items-center">
          <AnimatePresence>
            {board.map((c, i) => (
              <motion.div key={c + i} initial={{ opacity: 0, y: -16, rotateY: 90 }} animate={{ opacity: 1, y: 0, rotateY: 0 }} transition={{ delay: i * 0.06 }}>
                <PlayingCard card={c} size="md" deck={deck} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
      {frame?.pot != null && (
        <div className="absolute left-1/2 z-10 flex items-center gap-1.5 bg-black/55 rounded-full px-3 py-1 border border-ppp-green/40" style={{ top: "58%", transform: "translate(-50%,-50%)" }}>
          <Chip size={18} value={100} /> <span className="text-white text-xs font-subhead tracking-wider">POT {frame.pot}</span>
        </div>
      )}

      {/* players */}
      {players.map((p) => {
        const { x, y } = seatPos(p.seat, seatCount);
        const toCx = 50 - x, toCy = 47 - y;
        return (
          <div key={p.seat} className="absolute z-20" style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)" }}>
            <div className={`flex flex-col items-center ${p.folded ? "opacity-40 grayscale" : ""}`}>
              {/* hole cards behind/above avatar */}
              {!p.folded && (p.cards?.length || p.inHand) && (
                <div className="flex justify-center -space-x-2 mb-[-14px] z-0">
                  {(p.cards && p.cards.length ? p.cards : ["", ""]).map((c, k) => (
                    <PlayingCard key={k} card={c} faceDown={!p.revealed} size="xs" deck={deck} className={k === 0 ? "-rotate-6" : "rotate-6"} />
                  ))}
                </div>
              )}
              {/* avatar in PPP circle */}
              <div className="relative z-10">
                <img
                  src={p.avatar || "/brand/avatars/carson.png"}
                  alt=""
                  className={`w-14 h-14 rounded-full object-cover ${p.acting ? "acting-glow" : ""}`}
                  style={{ boxShadow: p.acting ? "0 0 0 2px #8FE80A" : "0 0 0 2px rgba(143,232,10,0.35)" }}
                />
                {p.dealer && <img src="/brand/frames/dealer.png" alt="D" className="absolute -right-3 -bottom-1 w-6 h-6 object-contain" />}
              </div>
              {/* name + stack frame */}
              <div className="relative mt-[-4px]" style={{ width: 128, height: 34 }}>
                <img src="/brand/frames/nameframe.png" alt="" className="absolute inset-0 w-full h-full" style={{ objectFit: "fill" }} />
                <div className="absolute inset-0 flex flex-col justify-center pl-3 pr-2">
                  <div className="text-white font-subhead text-[13px] leading-none tracking-wide truncate">{p.name}</div>
                  <div className={`text-[10px] leading-none font-body ${p.folded ? "text-slate-500" : "text-ppp-green"}`}>{p.stack}</div>
                </div>
                {p.pos && <div className="absolute -top-2 right-1 text-[8px] font-body bg-black/80 text-ppp-green px-1 rounded">{p.pos}</div>}
              </div>
            </div>
            {/* bet chips toward centre */}
            {p.bet ? (
              <div className="absolute z-30" style={{ left: `calc(50% + ${toCx * 1.0}px)`, top: `calc(50% + ${toCy * 1.0}px)`, transform: "translate(-50%,-50%)" }}>
                <div className="flex items-center gap-1 bg-black/60 rounded-full pl-0.5 pr-2 py-0.5">
                  <Chip size={18} value={Number(String(p.bet).replace(/[^0-9.]/g, "")) || 25} />
                  <span className="text-white text-[10px] font-subhead tracking-wide">{p.bet}</span>
                </div>
              </div>
            ) : null}
          </div>
        );
      })}

      {/* action label */}
      {frame?.label && (
        <div className="absolute left-0 right-0 bottom-0 bg-black/85 border-t border-ppp-green/50 px-4 py-2 z-40 flex items-center gap-2">
          <div className="w-1.5 h-4 bg-ppp-green rounded-sm" />
          <span className="text-white text-sm font-body">{frame.label}</span>
        </div>
      )}
    </div>
  );
}

export default TableCanvas;
