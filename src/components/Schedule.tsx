import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarClock } from "lucide-react";
import { program } from "../data";

export default function Schedule() {
  const [active, setActive] = useState(program[0].id);
  const current = program.find((p) => p.id === active)!;

  return (
    <section id="planning" className="border-y border-white/5 bg-coal py-24 md:py-32">
      <div className="container-x">
        <div className="mb-10 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div>
            <span className="eyebrow mb-4">
              <span className="h-px w-8 bg-ember" /> Planning hebdo
            </span>
            <h2 className="font-display text-5xl leading-[0.9] md:text-7xl">
              LE PROGRAMME <br /> DE LA <span className="text-gradient-ember">SEMAINE</span>
            </h2>
          </div>
          <p className="max-w-xs text-ash">
            Choisis ta discipline pour voir les horaires exacts. Cours enfants et adultes, tous niveaux.
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-8 flex flex-wrap gap-2.5">
          {program.map((p) => (
            <button
              key={p.id}
              onClick={() => setActive(p.id)}
              className={`rounded-full border px-5 py-2.5 text-sm font-bold uppercase tracking-wider transition-all duration-300 ${
                active === p.id
                  ? "border-ember bg-ember text-white"
                  : "border-white/10 text-ash hover:border-white/30 hover:text-bone"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Schedule body */}
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {current.days.length === 0 ? (
              <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-white/15 bg-ink px-6 py-20 text-center">
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-ember/15">
                  <CalendarClock className="h-7 w-7 text-ember" />
                </span>
                <h3 className="font-display text-3xl tracking-wide">Bientôt disponible</h3>
                <p className="max-w-md text-ash">{current.note}</p>
                <a href="#contact" className="btn-primary mt-2">Être prévenu·e</a>
              </div>
            ) : (
              <div className="space-y-3">
                {current.days.map((d, i) => (
                  <motion.div
                    key={d.day}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-ink p-3 sm:flex-row sm:items-stretch"
                  >
                    <div className="flex shrink-0 items-center justify-center rounded-xl bg-steel px-6 py-4 font-display text-2xl tracking-wide sm:w-32">
                      {d.day}
                    </div>
                    <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {d.slots.map((s, j) => (
                        <div
                          key={j}
                          className="group flex flex-col justify-center rounded-xl border border-white/5 bg-coal px-5 py-4 transition-colors hover:border-ember/40"
                        >
                          <div className="flex items-baseline gap-2">
                            <span className="font-display text-lg tracking-wide text-bone">{s.name}</span>
                            {s.sub && (
                              <span className="text-xs font-semibold uppercase tracking-widest text-ember">{s.sub}</span>
                            )}
                          </div>
                          <span className="mt-1 font-mono text-sm text-ash">{s.time}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <p className="mt-6 text-xs text-ash">
          * Horaires susceptibles d'évoluer. Contacte-nous pour confirmer ta première séance.
        </p>
      </div>
    </section>
  );
}
