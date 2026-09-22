import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Loader2, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { apiErr } from "../lib/api";
import { Logo } from "../components/brand/Logo";
import { PlayingCard } from "../components/poker/PlayingCard";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

export default function Login() {
  const { user, coaches, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate("/");
  }, [user, navigate]);

  const submit = async (e, creds) => {
    e?.preventDefault?.();
    setLoading(true);
    try {
      const em = creds?.email || email;
      const pw = creds?.password || password;
      await login(em, pw);
      toast.success("Welcome back to the studio");
      navigate("/");
    } catch (err) {
      toast.error(apiErr(err, "Login failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hex-bg min-h-screen grid lg:grid-cols-2">
      {/* Left brand panel */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden">
        <div className="absolute -right-16 top-24 rotate-12 opacity-90">
          <div className="flex gap-3">
            <PlayingCard card="As" size="lg" />
            <PlayingCard card="Ah" size="lg" className="-ml-6 rotate-6" />
            <PlayingCard faceDown size="lg" className="-ml-6 rotate-12" />
          </div>
        </div>
        <Logo height={72} />
        <div>
          <div className="text-ppp-green font-mono text-xs uppercase tracking-[0.3em] mb-4">Brand Content Studio</div>
          <h1 className="font-display text-5xl font-extrabold leading-[0.95] uppercase max-w-md">
            Raw lecture in.<br />
            <span className="text-ppp-green neon-text">Branded</span> deck out.
          </h1>
          <p className="text-slate-400 mt-5 max-w-sm leading-relaxed">
            Auto lay-up lecture material into the Practical Poker Plus template — and build animated hand replays with our branded table, chips & cards.
          </p>
        </div>
        <div className="text-slate-600 text-xs font-mono">© Practical Poker Plus — Internal Coach Tools</div>
      </div>

      {/* Right form */}
      <div className="flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md glass rounded-2xl p-8 card-shadow"
        >
          <div className="lg:hidden mb-6"><Logo height={40} /></div>
          <h2 className="font-display text-2xl font-bold uppercase tracking-tight">Coach Sign In</h2>
          <p className="text-slate-400 text-sm mt-1">Access your decks and replay projects.</p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <Label className="text-slate-300 text-xs uppercase tracking-wider">Email</Label>
              <Input
                data-testid="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@practicalpokerplus.com"
                className="mt-1.5 bg-ppp-surface border-white/10 focus-visible:ring-ppp-green text-white"
              />
            </div>
            <div>
              <Label className="text-slate-300 text-xs uppercase tracking-wider">Password</Label>
              <Input
                data-testid="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1.5 bg-ppp-surface border-white/10 focus-visible:ring-ppp-green text-white"
              />
            </div>
            <Button
              data-testid="login-submit"
              type="submit"
              disabled={loading}
              className="w-full bg-ppp-green text-black hover:bg-ppp-greenDim font-semibold rounded-full h-11 transition-colors"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Sign In <ArrowRight className="w-4 h-4 ml-1" /></>}
            </Button>
          </form>

          <div className="mt-6">
            <div className="text-[11px] text-slate-500 uppercase tracking-wider mb-2.5 font-mono">Quick demo login</div>
            <div className="grid grid-cols-2 gap-2">
              {coaches.map((c) => (
                <button
                  key={c.id}
                  data-testid={`quick-login-${c.id}`}
                  onClick={(e) => submit(e, { email: c.email, password: "coach1234" })}
                  disabled={loading}
                  className="flex items-center gap-2 p-2 rounded-lg bg-ppp-surface hover:bg-ppp-elevated border border-white/5 hover:border-ppp-green/40 transition-colors text-left"
                >
                  <img src={c.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                  <div className="min-w-0">
                    <div className="text-xs font-semibold truncate">{c.name.split(" ")[0]}</div>
                    <div className="text-[10px] text-slate-500 truncate">{c.role.split(" ").slice(0, 2).join(" ")}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
