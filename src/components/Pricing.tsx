import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Star } from "lucide-react";
import { memberships, durations, type Duration } from "../data";

export default function Pricing() {
  const [duration, setDuration] = useState<Duration>("1 an");

  return (
    <section id="tarifs" className="py-24 md:py-32">
      <div className="container-x">
        <div className="mb-10 text-center">
          <span className="eyebrow mb-4 justify-center">
            <span className="h-px w-8 bg-ember" /> Abonnements 2025–2026 <span className="h-px w-8 bg-ember" />
          </span>
          <h2 className="font-display text-5xl leading-[0.9] md:text-7xl">
            REJOINS LA <span className="text-gradient-ember">MEUTE</span>
          </h2>
          <p className="mx-auto mt-5 max-w-md text-ash">
            Choisis ta formule. Frais d'inscription inclus, et 2 mois offerts sur l'engagement annuel.
          </p>
        </div>

        {/* Duration toggle */}
        <div className="mb-12 flex justify-center">
          <div className="inline-flex rounded-full border border-white/10 bg-coal p-1.5">
            {durations.map((d) => (
              <button
                key={d}
                onClick={() => setDuration(d)}
                className={`relative rounded-full px-6 py-2.5 text-sm font-bold uppercase tracking-wider transition-colors ${
                  duration === d ? "text-white" : "text-ash hover:text-bone"
                }`}
              >
                {duration === d && (
                  <motion.span
                    layoutId="pill"
                    className="absolute inset-0 rounded-full bg-ember"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                <span className="relative flex items-center gap-2">
                  {d}
                  {d === "1 an" && (
                    <span className={`rounded-full px-2 py-0.5 text-[10px] ${duration === d ? "bg-white/20" : "bg-ember/20 text-ember"}`}>
                      -2 mois
                    </span>
                  )}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Cards */}
        <div className="grid items-stretch gap-6 md:grid-cols-3">
          {memberships.map((m, i) => {
            const offer = m.offers[duration];
            return (
              <motion.div
                key={m.name}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`relative flex flex-col rounded-3xl border p-8 ${
                  m.featured
                    ? "border-ember bg-gradient-to-b from-ember/15 to-coal shadow-[0_0_60px_-20px_rgba(255,61,46,0.6)]"
                    : "border-white/10 bg-coal"
                }`}
              >
                {m.featured && (
                  <span className="absolute -top-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-ember px-4 py-1 text-[11px] font-bold uppercase tracking-widest text-white">
                    <Star className="h-3 w-3 fill-white" /> Le + complet
                  </span>
                )}

                <h3 className="font-display text-2xl tracking-wide">{m.name}</h3>
                <p className="mt-1 text-sm text-ash">{m.sub}</p>

                <div className="mt-6 flex items-end gap-2">
                  <AnimatePresence mode="popLayout">
                    <motion.span
                      key={offer.price}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                      className="font-display text-5xl"
                    >
                      {offer.price}
                    </motion.span>
                  </AnimatePresence>
                  <span className="mb-1.5 font-display text-2xl text-ember">DH</span>
                  <span className="mb-2 text-sm text-ash">/ {duration}</span>
                </div>

                <ul className="mt-7 flex-1 space-y-4">
                  {offer.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm text-bone/90">
                      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-ember/15">
                        <Check className="h-3 w-3 text-ember" strokeWidth={3} />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>

                <a href="#contact" className={`mt-8 ${m.featured ? "btn-primary" : "btn-ghost"} w-full`}>
                  Rejoindre maintenant
                </a>
              </motion.div>
            );
          })}
        </div>

        <p className="mt-8 text-center text-xs text-ash">
          Tous les tarifs sont en dirhams (DH). Possibilité de paiement en plusieurs fois — contacte-nous.
        </p>
      </div>
    </section>
  );
}
