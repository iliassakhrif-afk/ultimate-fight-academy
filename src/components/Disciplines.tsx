import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { disciplines } from "../data";
import { asset } from "../asset";

export default function Disciplines() {
  return (
    <section id="disciplines" className="py-24 md:py-32">
      <div className="container-x">
        <div className="mb-14 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div>
            <span className="eyebrow mb-4">
              <span className="h-px w-8 bg-ember" /> Nos disciplines
            </span>
            <h2 className="font-display text-5xl leading-[0.9] md:text-7xl">
              CHOISIS TON <br />
              <span className="display-stroke">COMBAT</span>
            </h2>
          </div>
          <p className="max-w-sm text-ash">
            Six disciplines encadrées par des combattants expérimentés. Que tu cherches le cardio,
            la self-défense ou la compétition — il y a ta place sur le tatami.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {disciplines.map((d, i) => (
            <motion.article
              key={d.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: (i % 3) * 0.1 }}
              className="group relative h-[26rem] overflow-hidden rounded-2xl border border-white/10"
            >
              <img
                src={asset(d.img)}
                alt={d.name}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-transparent transition-opacity duration-500 group-hover:from-ink/95" />

              <span className="absolute right-4 top-4 rounded-full border border-white/20 bg-ink/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest backdrop-blur-sm">
                {d.level}
              </span>

              <div className="absolute inset-x-0 bottom-0 p-6">
                <span className="text-xs font-semibold uppercase tracking-[0.25em] text-ember">{d.tag}</span>
                <h3 className="mt-1 font-display text-3xl tracking-wide">{d.name}</h3>
                <p className="mt-2 max-h-0 overflow-hidden text-sm text-ash opacity-0 transition-all duration-500 group-hover:max-h-32 group-hover:opacity-100">
                  {d.desc}
                </p>
                <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-bone">
                  Voir le cours
                  <ArrowUpRight className="h-4 w-4 text-ember transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
