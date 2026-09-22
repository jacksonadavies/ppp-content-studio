import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Sparkles, Upload, FileText, Loader2, ArrowLeft, Download, Layers, Wand2, Save, Plus, Trash2,
} from "lucide-react";
import api, { API, apiErr } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { SlideFrame, SlideBody, LAYOUTS, layoutLabel } from "../components/slides/SlideView";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";

const SAMPLE = `Continuation betting (c-betting) on the flop.
When you raise preflop and get called, you often want to keep the pressure with a c-bet.
Bet small (about 33% pot) on dry, static boards like K-7-2 rainbow — you can bet your whole range cheaply.
Bet big (66-75% pot) on wet, dynamic boards like 9-8-7 two-tone where equities run close.
Pot odds: if you bet 5 into a pot of 10, villain must call 5 to win 15, needing 25% equity to continue.
Tight players over-fold to c-bets; loose players float too much. Adjust your sizing to the opponent.
Key takeaway: your c-bet size should be a function of board texture and opponent tendencies, not a fixed habit.`;

export default function ContentStudio() {
  const { deckId } = useParams();
  if (deckId) return <DeckEditor deckId={deckId} />;
  return <DeckCreator />;
}

/* ---------------- Creator ---------------- */
function DeckCreator() {
  const { coaches, user } = useAuth();
  const navigate = useNavigate();
  const [coach, setCoach] = useState(user?.coach_id || (coaches[0] && coaches[0].id) || "");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => { if (!coach && user?.coach_id) setCoach(user.coach_id); }, [user, coach]);

  const genFromText = async () => {
    if (!text.trim()) return toast.error("Paste some lecture content first");
    setBusy(true);
    try {
      const { data } = await api.post("/decks/generate", { coach_id: coach, title, raw_text: text });
      toast.success("Branded deck generated");
      navigate(`/studio/${data.id}`);
    } catch (e) { toast.error(apiErr(e, "Generation failed")); } finally { setBusy(false); }
  };

  const genFromFile = async () => {
    if (!file) return toast.error("Choose a .pptx, .docx or .txt file");
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("coach_id", coach);
      fd.append("title", title);
      fd.append("file", file);
      const { data } = await api.post("/decks/upload", fd);
      toast.success("Branded deck generated");
      navigate(`/studio/${data.id}`);
    } catch (e) { toast.error(apiErr(e, "Upload failed")); } finally { setBusy(false); }
  };

  return (
    <div className="max-w-4xl mx-auto px-5 py-12">
      <button onClick={() => navigate("/")} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-6"><ArrowLeft className="w-4 h-4" /> Dashboard</button>
      <div className="flex items-center gap-3 mb-2"><Wand2 className="w-6 h-6 text-ppp-green" /><h1 className="font-display text-4xl font-extrabold uppercase tracking-tight">Content Studio</h1></div>
      <p className="text-slate-400 mb-8">Drop in raw lecture material — AI lays it into the Practical Poker Plus branded template.</p>

      <div className="glass rounded-2xl p-6 card-shadow">
        <div className="grid sm:grid-cols-2 gap-4 mb-5">
          <div>
            <Label className="text-slate-300 text-xs uppercase tracking-wider">Assign to coach</Label>
            <Select value={coach} onValueChange={setCoach}>
              <SelectTrigger data-testid="creator-coach" className="mt-1.5 bg-ppp-surface border-white/10 text-white"><SelectValue placeholder="Select coach" /></SelectTrigger>
              <SelectContent className="bg-ppp-panel border-white/10 text-white">
                {coaches.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-slate-300 text-xs uppercase tracking-wider">Deck title (optional)</Label>
            <Input data-testid="creator-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Flop C-Betting Masterclass" className="mt-1.5 bg-ppp-surface border-white/10 text-white focus-visible:ring-ppp-green" />
          </div>
        </div>

        <Tabs defaultValue="paste">
          <TabsList className="bg-ppp-surface border border-white/10">
            <TabsTrigger value="paste" data-testid="tab-paste" className="data-[state=active]:bg-ppp-green data-[state=active]:text-black"><FileText className="w-4 h-4 mr-1.5" /> Paste Text</TabsTrigger>
            <TabsTrigger value="upload" data-testid="tab-upload" className="data-[state=active]:bg-ppp-green data-[state=active]:text-black"><Upload className="w-4 h-4 mr-1.5" /> Upload File</TabsTrigger>
          </TabsList>

          <TabsContent value="paste" className="mt-4">
            <Textarea data-testid="raw-text" value={text} onChange={(e) => setText(e.target.value)} rows={12}
              placeholder="Paste your raw lecture notes, script or outline here…"
              className="bg-ppp-surface border-white/10 text-white focus-visible:ring-ppp-green resize-none font-mono text-sm" />
            <div className="flex items-center justify-between mt-3">
              <button onClick={() => setText(SAMPLE)} className="text-xs text-ppp-green hover:underline">Load sample lecture</button>
              <Button data-testid="generate-text-btn" onClick={genFromText} disabled={busy} className="bg-ppp-green text-black hover:bg-ppp-greenDim font-semibold rounded-full px-6">
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Sparkles className="w-4 h-4 mr-1.5" /> Generate Deck</>}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="upload" className="mt-4">
            <div onClick={() => fileRef.current?.click()} className="cursor-pointer border-2 border-dashed border-white/15 hover:border-ppp-green/50 rounded-xl p-12 text-center transition-colors">
              <input ref={fileRef} type="file" data-testid="file-input" accept=".pptx,.docx,.txt,.md" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              <Upload className="w-8 h-8 text-ppp-green mx-auto mb-3" />
              <div className="text-white font-medium">{file ? file.name : "Click to choose a file"}</div>
              <div className="text-xs text-slate-500 mt-1">Supports .pptx, .docx and .txt</div>
            </div>
            <div className="flex justify-end mt-3">
              <Button data-testid="generate-file-btn" onClick={genFromFile} disabled={busy} className="bg-ppp-green text-black hover:bg-ppp-greenDim font-semibold rounded-full px-6">
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Sparkles className="w-4 h-4 mr-1.5" /> Generate Deck</>}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      {busy && <div className="text-center text-slate-400 text-sm mt-6 animate-pulse">Analyzing content & choosing branded layouts…</div>}
    </div>
  );
}

/* ---------------- Editor ---------------- */
const EDIT_FIELDS = {
  title: [["title", "Title"], ["subtitle", "Subtitle"]],
  section: [["label", "Label"], ["title", "Title"]],
  bullets: [["title", "Title"], ["bullets", "Bullets (one per line)", "list"]],
  takeaways: [["title", "Title"], ["points", "Points (one per line)", "list"]],
  two_column: [["title", "Title"], ["leftHeading", "Left heading"], ["leftBody", "Left body", "area"], ["rightHeading", "Right heading"], ["rightBody", "Right body", "area"]],
  subheader_box: [["title", "Title"], ["subHeader", "Sub-header"], ["body", "Body", "area"]],
  table_felt: [["title", "Title"], ["body", "Body", "area"]],
  image_text: [["title", "Title"], ["body", "Body", "area"], ["motif", "Motif (chips/cards)"]],
  stats: [["title", "Title"], ["stats", "Stats (value | label per line)", "stats"]],
  quote: [["quote", "Quote", "area"], ["author", "Author"]],
};

function DeckEditor({ deckId }) {
  const navigate = useNavigate();
  const [deck, setDeck] = useState(null);
  const [idx, setIdx] = useState(0);
  const [exporting, setExporting] = useState("");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get(`/decks/${deckId}`).then((r) => setDeck(r.data)).catch((e) => { toast.error(apiErr(e)); navigate("/"); });
  }, [deckId]);

  if (!deck) return <div className="flex items-center justify-center py-40"><Loader2 className="w-6 h-6 animate-spin text-ppp-green" /></div>;

  const slide = deck.slides[idx];

  const setSlideField = (field, value) => {
    setDeck((d) => {
      const slides = d.slides.map((s, i) => (i === idx ? { ...s, [field]: value } : s));
      return { ...d, slides };
    });
    setDirty(true);
  };

  const switchLayout = async (layout) => {
    setDeck((d) => ({ ...d, slides: d.slides.map((s, i) => (i === idx ? { ...s, layout } : s)) }));
    try {
      await api.patch(`/decks/${deckId}/slides/${slide.id}/layout`, { layout });
      toast.success(`Layout → ${layoutLabel(layout)}`);
    } catch (e) { toast.error(apiErr(e)); }
  };

  const save = async () => {
    setSaving(true);
    try {
      const { data } = await api.patch(`/decks/${deckId}`, { title: deck.title, slides: deck.slides });
      setDeck(data); setDirty(false);
      toast.success("Saved");
    } catch (e) { toast.error(apiErr(e)); } finally { setSaving(false); }
  };

  const doExport = async (fmt) => {
    setExporting(fmt);
    try {
      const res = await api.get(`/decks/${deckId}/export?format=${fmt}`, { responseType: "blob" });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url; a.download = `${deck.title || "deck"}.${fmt}`; a.click();
      URL.revokeObjectURL(url);
      toast.success(`${fmt.toUpperCase()} exported`);
    } catch (e) { toast.error(apiErr(e, "Export failed")); } finally { setExporting(""); }
  };

  const addSlide = () => {
    const blank = { id: undefined, layout: "bullets", title: "New Slide", subtitle: "", bullets: ["Point one", "Point two"], points: [], stats: [], leftHeading: "", leftBody: "", rightHeading: "", rightBody: "", subHeader: "", body: "", label: "", motif: "chips", quote: "", author: "" };
    setDeck((d) => ({ ...d, slides: [...d.slides, blank] }));
    setIdx(deck.slides.length);
    setDirty(true);
  };
  const delSlide = (i) => {
    if (deck.slides.length <= 1) return toast.error("Deck needs at least one slide");
    setDeck((d) => ({ ...d, slides: d.slides.filter((_, k) => k !== i) }));
    setIdx((p) => Math.max(0, Math.min(p, deck.slides.length - 2)));
    setDirty(true);
  };

  return (
    <div className="max-w-[1500px] mx-auto px-5 py-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm"><ArrowLeft className="w-4 h-4" /> Back</button>
        <Input data-testid="deck-title" value={deck.title} onChange={(e) => { setDeck({ ...deck, title: e.target.value }); setDirty(true); }}
          className="max-w-md bg-ppp-panel border-white/10 text-white font-display font-bold uppercase focus-visible:ring-ppp-green" />
        <span className="text-xs text-slate-500 flex items-center gap-1"><Layers className="w-3.5 h-3.5" /> {deck.slides.length} slides</span>
        <div className="ml-auto flex items-center gap-2">
          <Button data-testid="save-deck-btn" onClick={save} disabled={saving || !dirty} variant="outline" className="border-white/15 text-white hover:bg-white/5 rounded-full">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-1.5" /> {dirty ? "Save" : "Saved"}</>}
          </Button>
          <Button data-testid="export-pptx-btn" onClick={() => doExport("pptx")} disabled={exporting} className="bg-ppp-green text-black hover:bg-ppp-greenDim font-semibold rounded-full">
            {exporting === "pptx" ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Download className="w-4 h-4 mr-1.5" /> PPTX</>}
          </Button>
          <Button data-testid="export-pdf-btn" onClick={() => doExport("pdf")} disabled={exporting} variant="outline" className="border-ppp-green/50 text-ppp-green hover:bg-ppp-green/10 rounded-full">
            {exporting === "pdf" ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Download className="w-4 h-4 mr-1.5" /> PDF</>}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Thumbnails */}
        <div className="lg:col-span-2 order-2 lg:order-1">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs uppercase tracking-wider text-slate-500 font-mono">Slides</div>
            <button data-testid="add-slide-btn" onClick={addSlide} className="text-ppp-green hover:text-white"><Plus className="w-4 h-4" /></button>
          </div>
          <div className="space-y-3 lg:max-h-[70vh] overflow-y-auto pr-1">
            {deck.slides.map((s, i) => (
              <div key={i} className="relative group">
                <button data-testid={`thumb-${i}`} onClick={() => setIdx(i)}
                  className={`w-full rounded-lg overflow-hidden border-2 transition-colors ${i === idx ? "border-ppp-green" : "border-white/10 hover:border-white/30"}`}>
                  <SlideFrame><SlideBody slide={s} /></SlideFrame>
                </button>
                <span className="absolute top-1 left-1.5 text-[10px] font-mono bg-black/70 px-1.5 rounded text-slate-300">{i + 1}</span>
                <button onClick={() => delSlide(i)} className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-1 rounded bg-black/70 text-slate-400 hover:text-red-400"><Trash2 className="w-3 h-3" /></button>
              </div>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="lg:col-span-7 order-1 lg:order-2">
          <motion.div key={idx} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.25 }}
            className="rounded-2xl overflow-hidden border border-white/10 card-shadow">
            <SlideFrame testid="slide-preview"><SlideBody slide={slide} /></SlideFrame>
          </motion.div>

          {/* Layout switcher */}
          <div className="mt-5">
            <div className="text-xs uppercase tracking-wider text-slate-500 font-mono mb-2.5">Switch layout</div>
            <div className="flex flex-wrap gap-2">
              {LAYOUTS.map((l) => (
                <button key={l.id} data-testid={`layout-${l.id}`} onClick={() => switchLayout(l.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${slide.layout === l.id ? "bg-ppp-green text-black border-ppp-green" : "bg-ppp-panel text-slate-300 border-white/10 hover:border-ppp-green/50"}`}>
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Edit panel */}
        <div className="lg:col-span-3 order-3">
          <div className="text-xs uppercase tracking-wider text-slate-500 font-mono mb-2.5">Edit content</div>
          <div className="glass rounded-2xl p-4 space-y-3">
            {(EDIT_FIELDS[slide.layout] || EDIT_FIELDS.bullets).map(([field, label, type]) => (
              <div key={field}>
                <Label className="text-[11px] text-slate-400 uppercase tracking-wider">{label}</Label>
                {type === "list" ? (
                  <Textarea data-testid={`edit-${field}`} rows={5} value={(slide[field] || []).join("\n")} onChange={(e) => setSlideField(field, e.target.value.split("\n").filter((x) => x !== ""))}
                    className="mt-1 bg-ppp-surface border-white/10 text-white text-sm focus-visible:ring-ppp-green resize-none" />
                ) : type === "stats" ? (
                  <Textarea data-testid={`edit-${field}`} rows={4} value={(slide.stats || []).map((s) => `${s.value} | ${s.label}`).join("\n")}
                    onChange={(e) => setSlideField("stats", e.target.value.split("\n").filter(Boolean).map((ln) => { const [v, ...r] = ln.split("|"); return { value: (v || "").trim(), label: r.join("|").trim() }; }))}
                    className="mt-1 bg-ppp-surface border-white/10 text-white text-sm focus-visible:ring-ppp-green resize-none" />
                ) : type === "area" ? (
                  <Textarea data-testid={`edit-${field}`} rows={4} value={slide[field] || ""} onChange={(e) => setSlideField(field, e.target.value)}
                    className="mt-1 bg-ppp-surface border-white/10 text-white text-sm focus-visible:ring-ppp-green resize-none" />
                ) : (
                  <Input data-testid={`edit-${field}`} value={slide[field] || ""} onChange={(e) => setSlideField(field, e.target.value)}
                    className="mt-1 bg-ppp-surface border-white/10 text-white text-sm focus-visible:ring-ppp-green" />
                )}
              </div>
            ))}
            <div className="text-[11px] text-slate-500 pt-1">Tip: changes are live in preview. Hit <span className="text-ppp-green">Save</span> to persist &amp; keep in exports.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
