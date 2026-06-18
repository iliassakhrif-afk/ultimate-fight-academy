import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Flame, ArrowRight, ArrowLeft } from "lucide-react";
import { auth } from "../store/db";
import { ADMIN_PIN } from "../constants";
import { asset } from "../../asset";

export default function Login() {
  const nav = useNavigate();
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  const submit = (value: string) => {
    if (auth.login(value, ADMIN_PIN)) nav("/admin");
    else { setError(true); setPin(""); }
  };

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-ink px-4">
      <div className="noise-overlay" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-ember/20 blur-[140px]" />

      <motion.div
        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-sm rounded-3xl border border-white/10 bg-coal/90 p-8 backdrop-blur-xl"
      >
        <div className="mb-7 flex flex-col items-center text-center">
          <img src={asset("/images/logo.png")} alt="UFA" className="mb-3 h-16 w-16 object-contain" />
          <h1 className="font-display text-2xl tracking-wide">ESPACE ADMIN</h1>
          <p className="mt-1 text-sm text-ash">Ultimate Fight Academy · Kénitra</p>
        </div>

        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-ash">Code PIN</label>
        <input
          autoFocus
          value={pin}
          inputMode="numeric"
          maxLength={6}
          onChange={(e) => { setPin(e.target.value.replace(/[^0-9]/g, "")); setError(false); }}
          onKeyDown={(e) => e.key === "Enter" && submit(pin)}
          placeholder="••••"
          className={`w-full rounded-xl border bg-ink px-4 py-3.5 text-center font-display text-2xl tracking-[0.5em] text-bone outline-none transition-colors ${error ? "border-ember" : "border-white/10 focus:border-ember"}`}
        />
        {error && <p className="mt-2 text-center text-xs text-ember">Code incorrect. Astuce démo : 1234</p>}

        <button onClick={() => submit(pin)} className="btn-primary mt-5 w-full">
          Se connecter <ArrowRight className="h-4 w-4" />
        </button>
        <button onClick={() => submit(ADMIN_PIN)} className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-white/15 px-7 py-3 text-sm font-bold uppercase tracking-widest text-ash transition-colors hover:border-gold hover:text-gold">
          <Flame className="h-4 w-4" /> Entrer en mode démo
        </button>

        <Link to="/" className="mt-6 flex items-center justify-center gap-1.5 text-xs text-ash hover:text-bone">
          <ArrowLeft className="h-3.5 w-3.5" /> Retour au site
        </Link>
      </motion.div>
    </div>
  );
}
