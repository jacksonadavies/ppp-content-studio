import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Plus, FileStack, Clapperboard, Trash2, Clock, Layers } from "lucide-react";
import api, { apiErr } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";

function coachName(coaches, id) {
  return coaches.find((c) => c.id === id)?.name || "Unknown Coach";
}
function timeAgo(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const mins = Math.round((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.round(mins / 60)}h ago`;
  return d.toLocaleDateString();
}

export default function Dashboard() {
  const { coaches, user } = useAuth();
  const navigate = useNavigate();
  const [decks, setDecks] = useState([]);
  const [replays, setReplays] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [d, r] = await Promise.all([api.get("/decks"), api.get("/replays")]);
      setDecks(d.data);
      setReplays(r.data);
    } catch (e) {
      toast.error(apiErr(e));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const fDecks = useMemo(() => decks.filter((d) => filter === "all" || d.coach_id === filter), [decks, filter]);
  const fReplays = useMemo(() => replays.filter((r) => filter === "all" || r.coach_id === filter), [replays, filter]);

  const delDeck = async (id, e) => {
    e.stopPropagation();
    await api.delete(`/decks/${id}`);
    setDecks((p) => p.filter((x) => x.id !== id));
    toast.success("Deck deleted");
  };
  const delReplay = async (id, e) => {
    e.stopPropagation();
    await api.delete(`/replays/${id}`);
    setReplays((p) => p.filter((x) => x.id !== id));
    toast.success("Replay deleted");
  };

  return (
    <div className="max-w-[1500px] mx-auto px-5 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
        <div>
          <div className="text-ppp-green font-mono text-xs uppercase tracking-[0.3em] mb-2">Welcome back, {user?.name?.split(" ")[0]}</div>
          <h1 className="font-display text-4xl sm:text-5xl font-extrabold uppercase tracking-tight">Studio Dashboard</h1>
        </div>
        <div className="flex items-center gap-3">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger data-testid="coach-filter" className="w-56 bg-ppp-panel border-white/10 text-white">
              <SelectValue placeholder="All coaches" />
            </SelectTrigger>
            <SelectContent className="bg-ppp-panel border-white/10 text-white">
              <SelectItem value="all">All coaches</SelectItem>
              {coaches.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button data-testid="new-deck-btn" onClick={() => navigate("/studio")} className="bg-ppp-green text-black hover:bg-ppp-greenDim font-semibold rounded-full">
            <Plus className="w-4 h-4 mr-1" /> New Deck
          </Button>
          <Button data-testid="new-replay-btn" onClick={() => navigate("/replayer")} variant="outline" className="border-ppp-green/50 text-ppp-green hover:bg-ppp-green/10 rounded-full">
            <Clapperboard className="w-4 h-4 mr-1" /> New Replay
          </Button>
        </div>
      </div>

      {/* Decks */}
      <Section icon={FileStack} title="Lecture Decks" count={fDecks.length} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-14">
        {fDecks.map((d, i) => (
          <motion.button
            key={d.id}
            data-testid={`deck-card-${d.id}`}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
            onClick={() => navigate(`/studio/${d.id}`)}
            className="group text-left rounded-2xl bg-ppp-panel border border-white/8 hover:border-ppp-green/50 p-5 transition-colors card-shadow relative"
          >
            <div className="flex items-start justify-between">
              <div className="w-11 h-11 rounded-xl bg-ppp-green/10 flex items-center justify-center"><FileStack className="w-5 h-5 text-ppp-green" /></div>
              <span onClick={(e) => delDeck(d.id, e)} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-red-500/15 text-slate-500 hover:text-red-400 transition"><Trash2 className="w-4 h-4" /></span>
            </div>
            <div className="font-display font-bold text-lg mt-4 uppercase tracking-tight leading-tight line-clamp-2">{d.title}</div>
            <div className="text-xs text-slate-500 mt-1">{coachName(coaches, d.coach_id)}</div>
            <div className="flex items-center gap-4 mt-4 text-xs text-slate-400">
              <span className="flex items-center gap-1"><Layers className="w-3.5 h-3.5" /> {d.slides_count ?? d.slides?.length ?? "—"} slides</span>
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {timeAgo(d.updated_at)}</span>
            </div>
          </motion.button>
        ))}
        {!loading && fDecks.length === 0 && <Empty label="No decks yet. Create your first branded deck." />}
      </div>

      {/* Replays */}
      <Section icon={Clapperboard} title="Hand Replays" count={fReplays.length} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {fReplays.map((r, i) => (
          <motion.button
            key={r.id}
            data-testid={`replay-card-${r.id}`}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
            onClick={() => navigate(`/replayer/${r.id}`)}
            className="group text-left rounded-2xl overflow-hidden bg-ppp-panel border border-white/8 hover:border-ppp-green/50 transition-colors card-shadow relative"
          >
            <div className="h-28 flex items-center justify-center relative" style={{ background: "radial-gradient(ellipse at center, #0f4022, #041209)" }}>
              <div className="w-40 h-20 rounded-[50%] border-2 border-ppp-green/70" />
              <Clapperboard className="w-6 h-6 text-ppp-green absolute" />
            </div>
            <div className="p-5">
              <div className="flex items-start justify-between">
                <div className="font-display font-bold uppercase tracking-tight leading-tight line-clamp-1">{r.title}</div>
                <span onClick={(e) => delReplay(r.id, e)} className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-red-500/15 text-slate-500 hover:text-red-400 transition"><Trash2 className="w-4 h-4" /></span>
              </div>
              <div className="text-xs text-slate-500 mt-1">{coachName(coaches, r.coach_id)}</div>
              <div className="flex items-center gap-1 mt-3 text-xs text-slate-400"><Clock className="w-3.5 h-3.5" /> {timeAgo(r.updated_at)}</div>
            </div>
          </motion.button>
        ))}
        {!loading && fReplays.length === 0 && <Empty label="No replays yet. Build your first branded hand animation." />}
      </div>
    </div>
  );
}

function Section({ icon: Icon, title, count }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <Icon className="w-5 h-5 text-ppp-green" />
      <h2 className="font-display text-xl font-bold uppercase tracking-wide">{title}</h2>
      <span className="text-xs font-mono text-slate-500 bg-white/5 px-2 py-0.5 rounded-full">{count}</span>
    </div>
  );
}
function Empty({ label }) {
  return <div className="col-span-full text-slate-500 text-sm border border-dashed border-white/10 rounded-2xl py-12 text-center">{label}</div>;
}
