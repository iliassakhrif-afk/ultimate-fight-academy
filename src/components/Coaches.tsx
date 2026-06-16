import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { IgIcon } from "./icons";
import { coaches } from "../data";
import { asset } from "../asset";

export default function Coaches() {
  const featured = coaches[0];

  return (
    <section id="coachs" className="relative overflow-hidden py-24 md:py-32">
      <div className="pointer-events-none absolute -left-40 top-1/3 h-96 w-96 rounded-full bg-ember/10 blur-[120px]" />
      <div className="container-x relative">
        <div className="mb-14 text-center">
          <span className="eyebrow mb-4 justify-center">
            <span className="h-px w-8 bg-ember" /> Le staff <span className="h-px w-8 bg-ember" />
          </span>
          <h2 className="font-display text-5xl leading-[0.9] md:text-7xl">
            FORMÉ PAR DES <span className="text-gradient-ember">CHAMPIONS</span>
          </h2>
        </div>

        {/* Featured coach */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto grid max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-coal md:grid-cols-2"
        >
          <div className="relative h-80 md:h-auto">
            <img src={asset(featured.img)} alt={featured.name} className="h-full w-full object-cover object-top" />
            <div className="absolute inset-0 bg-gradient-to-t from-coal/80 via-transparent to-transparent md:bg-gradient-to-r" />
            <span className="absolute left-5 top-5 rounded-full bg-ember px-4 py-1.5 font-display text-sm tracking-wide text-white">
              {featured.record}
            </span>
          </div>

          <div className="flex flex-col justify-center p-8 md:p-12">
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-ember">{featured.role}</span>
            <h3 className="mt-2 font-display text-4xl tracking-wide md:text-5xl">{featured.name}</h3>
            <p className="mt-5 text-ash">{featured.bio}</p>
            <a
              href={featured.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost mt-8 w-fit"
            >
              <IgIcon className="h-4 w-4" /> @rachidi_zine_official
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
        </motion.div>

        <p className="mt-8 text-center text-sm text-ash">
          🥋 D'autres coachs rejoignent bientôt l'équipe — restez connectés.
        </p>
      </div>
    </section>
  );
}
