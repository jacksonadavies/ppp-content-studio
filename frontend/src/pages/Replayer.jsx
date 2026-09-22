import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft, Play, Pause, SkipBack, SkipForward, RotateCcw, Download, Save, Loader2,
  Plus, Undo2, Spade, Film,
} from "lucide-react";
import api, { apiErr } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { TableCanvas } from "../components/poker/TableCanvas";
import { CardPicker } from "../components/poker/CardPicker";
import { PlayingCard } from "../components/poker/PlayingCard";
import { positionName } from "../lib/cards";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Slider } from "../components/ui/slider";
import { Switch } from "../components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";

const NAMES = ["Hero", "Villain", "Player 3", "Player 4", "Player 5", "Player 6", "Player 7", "Player 8", "Player 9"];
const fmt = (n) => { const r = Math.round(n * 10) / 10; return Number.isInteger(r) ? String(r) : r.toFixed(1); };
const REVEAL = { FLOP: 3, TURN: 4, RIVER: 5 };

function makePlayers(n) {
  return Array.from({ length: n }).map((_, i) => ({
    name: NAMES[i], stack: 100, cards: i === 0 ? [] : [], revealed: i === 0,
  }));
}

function defaultConfig(coachId) {
  return { title: "New Hand Replay", coach_id: coachId, seatCount: 6, buttonSeat: 0,
    sb: 0.5, bb: 1, players: makePlayers(6), board: [], events: [] };
}

function blindSeats(cfg) {
  const n = cfg.seatCount;
  if (n === 2) return { sb: cfg.buttonSeat, bb: (cfg.buttonSeat + 1) % 2 };
  return { sb: (cfg.buttonSeat + 1) % n, bb: (cfg.buttonSeat + 2) % n };
}

function buildFrames(cfg) {
  const n = cfg.seatCount;
  const { sb, bb } = blindSeats(cfg);
  const ps = cfg.players.slice(0, n).map((p, seat) => ({
    seat, name: p.name || `P${seat + 1}`, start: Number(p.stack) || 0, cards: (p.cards || []).filter(Boolean),
    revealed: !!p.revealed, folded: false, paid: 0, street: 0,
  }));
  ps[sb].street = Math.min(cfg.sb, ps[sb].start);
  ps[bb].street = Math.min(cfg.bb, ps[bb].start);

  let street = "PREFLOP";
  let revealed = 0;
  const frames = [];
  const maxBet = () => Math.max(...ps.map((p) => p.street));
  const potNow = () => ps.reduce((a, p) => a + p.paid + p.street, 0);

  const snap = (label, acting) => ({
    street, label, pot: `${fmt(potNow())} BB`,
    board: cfg.board.slice(0, revealed),
    players: ps.map((p) => {
      const remaining = p.start - p.paid - p.street;
      return {
        seat: p.seat, name: p.name, stack: `${fmt(remaining)} BB`,
        cards: p.folded ? [] : (p.cards.length ? p.cards : ["", ""]),
        revealed: p.revealed, hero: p.revealed, folded: p.folded,
        dealer: p.seat === cfg.buttonSeat, pos: positionName(p.seat, n, cfg.buttonSeat),
        bet: p.street ? fmt(p.street) : "", acting: acting === p.seat, inHand: true,
      };
    }),
  });

  frames.push(snap(`Blinds posted — SB ${fmt(cfg.sb)} / BB ${fmt(cfg.bb)}`, null));

  for (const ev of cfg.events) {
    if (ev.type === "street") {
      ps.forEach((p) => { p.paid += p.street; p.street = 0; });
      street = ev.street; revealed = REVEAL[ev.street] || revealed;
      frames.push(snap(`${ev.street}`, null));
    } else {
      const p = ps[ev.seat];
      if (!p) continue;
      const nm = p.name;
      if (ev.action === "fold") { p.folded = true; frames.push(snap(`${nm} folds`, ev.seat)); }
      else if (ev.action === "check") { frames.push(snap(`${nm} checks`, ev.seat)); }
      else if (ev.action === "call") { p.street = maxBet(); frames.push(snap(`${nm} calls ${fmt(p.street)} BB`, ev.seat)); }
      else if (ev.action === "bet") { p.street = Number(ev.amount) || 0; frames.push(snap(`${nm} bets ${fmt(p.street)} BB`, ev.seat)); }
      else if (ev.action === "raise") { p.street = Number(ev.amount) || 0; frames.push(snap(`${nm} raises to ${fmt(p.street)} BB`, ev.seat)); }
    }
  }
  return frames;
}

export default function Replayer() {
  const { replayId } = useParams();
  const { coaches, user } = useAuth();
  const navigate = useNavigate();
  const [cfg, setCfg] = useState(() => defaultConfig(user?.coach_id || "alex-vance"));
  const [cur, setCur] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [fps, setFps] = useState(2);
  const [picker, setPicker] = useState({ open: false });
  const [busy, setBusy] = useState("");
  const timer = useRef(null);

  useEffect(() => {
    if (replayId) {
      api.get(`/replays/${replayId}`).then((r) => setCfg({ ...defaultConfig(user?.coach_id), ...r.data.config, title: r.data.title, coach_id: r.data.coach_id }))
        .catch((e) => { toast.error(apiErr(e)); navigate("/replayer"); });
    }
  }, [replayId]);

  const frames = useMemo(() => buildFrames(cfg), [cfg]);
  useEffect(() => { setCur((c) => Math.min(c, frames.length - 1)); }, [frames.length]);

  useEffect(() => {
    if (playing) {
      timer.current = setInterval(() => {
        setCur((c) => { if (c >= frames.length - 1) { setPlaying(false); return c; } return c + 1; });
      }, 1000 / fps);
    }
    return () => clearInterval(timer.current);
  }, [playing, fps, frames.length]);

  const update = (patch) => setCfg((c) => ({ ...c, ...patch }));
  const updatePlayer = (seat, patch) => setCfg((c) => ({ ...c, players: c.players.map((p, i) => i === seat ? { ...p, ...patch } : p) }));

  const setSeatCount = (nStr) => {
    const n = Number(nStr);
    setCfg((c) => {
      let players = c.players.slice(0, n);
      while (players.length < n) players.push({ name: NAMES[players.length], stack: 100, cards: [], revealed: false });
      return { ...c, seatCount: n, players, buttonSeat: Math.min(c.buttonSeat, n - 1), events: [] };
    });
    setCur(0);
  };

  const allUsed = [...cfg.players.flatMap((p) => p.cards || []), ...cfg.board].filter(Boolean);

  const openPicker = (target, count, initial) => setPicker({ open: true, target, count, initial: initial || [] });
  const onPick = (cards) => {
    const t = picker.target;
    if (t.kind === "player") updatePlayer(t.seat, { cards });
    else update({ board: cards });
  };

  // action builder
  const [aSeat, setASeat] = useState(0);
  const [aType, setAType] = useState("raise");
  const [aAmt, setAAmt] = useState(3);

  const addAction = () => {
    const ev = { type: "action", seat: Number(aSeat), action: aType };
    if (aType === "bet" || aType === "raise") ev.amount = Number(aAmt);
    setCfg((c) => ({ ...c, events: [...c.events, ev] }));
    setTimeout(() => setCur(frames.length), 0);
  };
  const dealStreet = (street) => {
    const need = REVEAL[street];
    if (cfg.board.filter(Boolean).length < need) return toast.error(`Set ${need} board cards first`);
    if (cfg.events.find((e) => e.type === "street" && e.street === street)) return toast.error(`${street} already dealt`);
    setCfg((c) => ({ ...c, events: [...c.events, { type: "street", street }] }));
    setTimeout(() => setCur(frames.length), 0);
  };
  const undo = () => setCfg((c) => ({ ...c, events: c.events.slice(0, -1) }));
  const clearActions = () => setCfg((c) => ({ ...c, events: [] }));

  const save = async () => {
    setBusy("save");
    try {
      const body = { coach_id: cfg.coach_id, title: cfg.title, config: cfg };
      if (replayId) { await api.put(`/replays/${replayId}`, body); toast.success("Replay saved"); }
      else { const { data } = await api.post("/replays", body); toast.success("Replay saved"); navigate(`/replayer/${data.id}`); }
    } catch (e) { toast.error(apiErr(e)); } finally { setBusy(""); }
  };

  const doExport = async (format) => {
    setBusy(format);
    try {
      const res = await api.post("/replays/export", { fmt: format, fps, frames, title: cfg.title }, { responseType: "blob" });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url; a.download = `${cfg.title || "replay"}.${format}`; a.click();
      URL.revokeObjectURL(url);
      toast.success(`${format.toUpperCase()} exported`);
    } catch (e) { toast.error(apiErr(e, "Export failed")); } finally { setBusy(""); }
  };

  return (
    <div className="max-w-[1500px] mx-auto px-5 py-6">
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm"><ArrowLeft className="w-4 h-4" /> Back</button>
        <Input data-testid="replay-title" value={cfg.title} onChange={(e) => update({ title: e.target.value })}
          className="max-w-sm bg-ppp-panel border-white/10 text-white font-display font-bold uppercase focus-visible:ring-ppp-green" />
        <div className="ml-auto flex items-center gap-2">
          <Button data-testid="save-replay-btn" onClick={save} disabled={busy} variant="outline" className="border-white/15 text-white hover:bg-white/5 rounded-full">
            {busy === "save" ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-1.5" /> Save</>}
          </Button>
          <Button data-testid="export-gif-btn" onClick={() => doExport("gif")} disabled={busy} className="bg-ppp-green text-black hover:bg-ppp-greenDim font-semibold rounded-full">
            {busy === "gif" ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Download className="w-4 h-4 mr-1.5" /> GIF</>}
          </Button>
          <Button data-testid="export-mp4-btn" onClick={() => doExport("mp4")} disabled={busy} variant="outline" className="border-ppp-green/50 text-ppp-green hover:bg-ppp-green/10 rounded-full">
            {busy === "mp4" ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Film className="w-4 h-4 mr-1.5" /> MP4</>}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Table + timeline */}
        <div className="lg:col-span-8">
          <TableCanvas testid="poker-table" frame={frames[cur]} seatCount={cfg.seatCount} />

          {/* transport */}
          <div className="mt-4 glass rounded-xl p-4">
            <div className="flex items-center gap-3">
              <button data-testid="rewind-btn" onClick={() => { setPlaying(false); setCur(0); }} className="p-2 rounded-lg hover:bg-white/10 text-white"><RotateCcw className="w-4 h-4" /></button>
              <button data-testid="step-back-btn" onClick={() => { setPlaying(false); setCur((c) => Math.max(0, c - 1)); }} className="p-2 rounded-lg hover:bg-white/10 text-white"><SkipBack className="w-4 h-4" /></button>
              <button data-testid="play-btn" onClick={() => { if (cur >= frames.length - 1) setCur(0); setPlaying((p) => !p); }} className="p-3 rounded-full bg-ppp-green text-black hover:bg-ppp-greenDim">
                {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>
              <button data-testid="step-fwd-btn" onClick={() => { setPlaying(false); setCur((c) => Math.min(frames.length - 1, c + 1)); }} className="p-2 rounded-lg hover:bg-white/10 text-white"><SkipForward className="w-4 h-4" /></button>
              <div className="flex-1 px-2">
                <Slider data-testid="timeline-slider" value={[cur]} min={0} max={Math.max(0, frames.length - 1)} step={1} onValueChange={([v]) => { setPlaying(false); setCur(v); }} />
              </div>
              <span className="text-xs font-mono text-slate-400 w-16 text-right">{cur + 1}/{frames.length}</span>
            </div>
            <div className="flex items-center gap-3 mt-3">
              <span className="text-xs text-slate-500 uppercase tracking-wider font-mono">Speed</span>
              <div className="w-40"><Slider data-testid="speed-slider" value={[fps]} min={1} max={6} step={1} onValueChange={([v]) => setFps(v)} /></div>
              <span className="text-xs font-mono text-ppp-green">{fps} fps</span>
            </div>
          </div>
        </div>

        {/* Control panel */}
        <div className="lg:col-span-4">
          <Tabs defaultValue="setup">
            <TabsList className="bg-ppp-surface border border-white/10 w-full grid grid-cols-3">
              <TabsTrigger value="setup" data-testid="tab-setup" className="data-[state=active]:bg-ppp-green data-[state=active]:text-black">Setup</TabsTrigger>
              <TabsTrigger value="actions" data-testid="tab-actions" className="data-[state=active]:bg-ppp-green data-[state=active]:text-black">Actions</TabsTrigger>
              <TabsTrigger value="board" data-testid="tab-board" className="data-[state=active]:bg-ppp-green data-[state=active]:text-black">Board</TabsTrigger>
            </TabsList>

            {/* Setup */}
            <TabsContent value="setup" className="mt-3">
              <div className="glass rounded-xl p-4 space-y-4 max-h-[62vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-[11px] text-slate-400 uppercase">Coach</Label>
                    <Select value={cfg.coach_id} onValueChange={(v) => update({ coach_id: v })}>
                      <SelectTrigger data-testid="replay-coach" className="mt-1 bg-ppp-surface border-white/10 text-white h-9"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-ppp-panel border-white/10 text-white">{coaches.map((c) => <SelectItem key={c.id} value={c.id}>{c.name.split(" ")[0]}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-[11px] text-slate-400 uppercase">Players</Label>
                    <Select value={String(cfg.seatCount)} onValueChange={setSeatCount}>
                      <SelectTrigger data-testid="seat-count" className="mt-1 bg-ppp-surface border-white/10 text-white h-9"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-ppp-panel border-white/10 text-white">{[2, 3, 4, 5, 6, 7, 8, 9].map((n) => <SelectItem key={n} value={String(n)}>{n} handed</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label className="text-[11px] text-slate-400 uppercase">SB</Label><Input data-testid="sb-input" type="number" value={cfg.sb} onChange={(e) => update({ sb: Number(e.target.value) })} className="mt-1 h-9 bg-ppp-surface border-white/10 text-white" /></div>
                  <div><Label className="text-[11px] text-slate-400 uppercase">BB</Label><Input data-testid="bb-input" type="number" value={cfg.bb} onChange={(e) => update({ bb: Number(e.target.value) })} className="mt-1 h-9 bg-ppp-surface border-white/10 text-white" /></div>
                  <div>
                    <Label className="text-[11px] text-slate-400 uppercase">Button</Label>
                    <Select value={String(cfg.buttonSeat)} onValueChange={(v) => update({ buttonSeat: Number(v) })}>
                      <SelectTrigger data-testid="button-seat" className="mt-1 bg-ppp-surface border-white/10 text-white h-9"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-ppp-panel border-white/10 text-white">{cfg.players.map((p, i) => <SelectItem key={i} value={String(i)}>{p.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  {cfg.players.map((p, i) => (
                    <div key={i} className="flex items-center gap-2 bg-ppp-surface rounded-lg p-2 border border-white/5">
                      <span className="text-[10px] font-mono text-ppp-green w-8">{positionName(i, cfg.seatCount, cfg.buttonSeat)}</span>
                      <Input data-testid={`pname-${i}`} value={p.name} onChange={(e) => updatePlayer(i, { name: e.target.value })} className="h-8 bg-ppp-panel border-white/10 text-white text-xs flex-1" />
                      <Input data-testid={`pstack-${i}`} type="number" value={p.stack} onChange={(e) => updatePlayer(i, { stack: Number(e.target.value) })} className="h-8 w-16 bg-ppp-panel border-white/10 text-white text-xs" />
                      <button data-testid={`pcards-${i}`} onClick={() => openPicker({ kind: "player", seat: i }, 2, p.cards)} className="flex gap-0.5 items-center">
                        {p.cards?.length ? p.cards.map((c, k) => <PlayingCard key={k} card={c} size="xs" />) : <span className="text-[10px] text-slate-500 border border-dashed border-white/20 rounded px-1.5 py-1">Cards</span>}
                      </button>
                      <div className="flex items-center gap-1" title="Reveal">
                        <Switch data-testid={`preveal-${i}`} checked={p.revealed} onCheckedChange={(v) => updatePlayer(i, { revealed: v })} className="data-[state=checked]:bg-ppp-green scale-75" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Actions */}
            <TabsContent value="actions" className="mt-3">
              <div className="glass rounded-xl p-4 space-y-4">
                <div className="flex gap-2">
                  {["FLOP", "TURN", "RIVER"].map((st) => (
                    <Button key={st} data-testid={`deal-${st.toLowerCase()}`} onClick={() => dealStreet(st)} variant="outline" className="flex-1 border-ppp-green/40 text-ppp-green hover:bg-ppp-green/10 text-xs h-9">
                      <Spade className="w-3.5 h-3.5 mr-1" /> {st}
                    </Button>
                  ))}
                </div>
                <div className="border-t border-white/10 pt-3 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <Select value={String(aSeat)} onValueChange={setASeat}>
                      <SelectTrigger data-testid="action-seat" className="bg-ppp-surface border-white/10 text-white h-9"><SelectValue placeholder="Player" /></SelectTrigger>
                      <SelectContent className="bg-ppp-panel border-white/10 text-white">{cfg.players.map((p, i) => <SelectItem key={i} value={String(i)}>{p.name}</SelectItem>)}</SelectContent>
                    </Select>
                    <Select value={aType} onValueChange={setAType}>
                      <SelectTrigger data-testid="action-type" className="bg-ppp-surface border-white/10 text-white h-9"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-ppp-panel border-white/10 text-white">
                        {["fold", "check", "call", "bet", "raise"].map((a) => <SelectItem key={a} value={a} className="capitalize">{a}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  {(aType === "bet" || aType === "raise") && (
                    <div className="flex items-center gap-2">
                      <Label className="text-[11px] text-slate-400 uppercase">Amount (BB)</Label>
                      <Input data-testid="action-amount" type="number" value={aAmt} onChange={(e) => setAAmt(e.target.value)} className="h-9 bg-ppp-surface border-white/10 text-white flex-1" />
                    </div>
                  )}
                  <Button data-testid="add-action-btn" onClick={addAction} className="w-full bg-ppp-green text-black hover:bg-ppp-greenDim font-semibold"><Plus className="w-4 h-4 mr-1" /> Add Action</Button>
                </div>
                <div className="border-t border-white/10 pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs uppercase tracking-wider text-slate-500 font-mono">Timeline ({cfg.events.length})</span>
                    <div className="flex gap-2">
                      <button data-testid="undo-btn" onClick={undo} className="text-xs text-slate-400 hover:text-white flex items-center gap-1"><Undo2 className="w-3.5 h-3.5" /> Undo</button>
                      <button data-testid="clear-actions-btn" onClick={clearActions} className="text-xs text-slate-400 hover:text-red-400">Clear</button>
                    </div>
                  </div>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {cfg.events.map((e, i) => (
                      <div key={i} className="text-xs text-slate-300 bg-ppp-surface rounded px-2 py-1 flex justify-between">
                        <span>{e.type === "street" ? `— ${e.street} —` : `${cfg.players[e.seat]?.name} ${e.action}${e.amount ? ` ${e.amount}` : ""}`}</span>
                        <span className="text-slate-600 font-mono">{i + 1}</span>
                      </div>
                    ))}
                    {cfg.events.length === 0 && <div className="text-xs text-slate-600 text-center py-4">No actions yet. Deal streets & add actions.</div>}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Board */}
            <TabsContent value="board" className="mt-3">
              <div className="glass rounded-xl p-4">
                <Label className="text-[11px] text-slate-400 uppercase">Community cards (up to 5)</Label>
                <button data-testid="board-picker" onClick={() => openPicker({ kind: "board" }, 5, cfg.board)} className="mt-3 flex gap-2 justify-center w-full">
                  {Array.from({ length: 5 }).map((_, i) => cfg.board[i] ? <PlayingCard key={i} card={cfg.board[i]} size="sm" /> : <div key={i} className="w-[34px] h-[48px] rounded-md border border-dashed border-white/20 flex items-center justify-center text-slate-600 text-lg">+</div>)}
                </button>
                <p className="text-[11px] text-slate-500 mt-4 leading-relaxed">Set flop (3), turn (4th) and river (5th). Then use the Actions tab to deal each street and record betting. The runout animates on the timeline.</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <CardPicker
        open={picker.open}
        onOpenChange={(o) => setPicker((p) => ({ ...p, open: o }))}
        count={picker.count || 2}
        used={allUsed}
        initial={picker.initial}
        onConfirm={onPick}
        title={picker.target?.kind === "board" ? "Select board cards" : "Select hole cards"}
      />
    </div>
  );
}
