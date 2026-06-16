import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { ArrowDown, Play } from "lucide-react";
import { asset } from "../asset";

export default function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "35%"]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section ref={ref} id="top" className="relative h-[100svh] min-h-[640px] w-full overflow-hidden">
      {/* Parallax background */}
      <motion.div style={{ y, scale }} className="absolute inset-0">
        <img
          src={asset("/images/hero-1.jpg")}
          alt="Combattant Ultimate Fight Academy"
          className="h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-ink/70" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/80 via-transparent to-transparent" />
      </motion.div>

      {/* Content */}
      <motion.div style={{ opacity }} className="container-x relative z-10 flex h-full flex-col justify-end pb-24 md:pb-28">
        <motion.span
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="eyebrow mb-5"
        >
          <span className="h-px w-8 bg-ember" /> Salle de combat · Depuis 2013
        </motion.span>

        <h1 className="max-w-5xl font-display text-[15vw] leading-[0.82] tracking-tight md:text-[10vw] lg:text-[8.5rem]">
          <motion.span
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="block"
          >
            FORGE TON
          </motion.span>
          <motion.span
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.25 }}
            className="block text-gradient-ember"
          >
            INSTINCT
          </motion.span>
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6 max-w-xl text-lg text-ash"
        >
          BJJ, MMA, Kickboxing, Boxe. Une académie de combat où enfants, débutants et compétiteurs
          repoussent leurs limites. Premier cours offert.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          className="mt-9 flex flex-wrap items-center gap-4"
        >
          <a href="#tarifs" className="btn-primary">
            Commencer maintenant
          </a>
          <a href="#disciplines" className="btn-ghost">
            <Play className="h-4 w-4" /> Découvrir
          </a>
        </motion.div>
      </motion.div>

      {/* Scroll cue */}
      <motion.div
        style={{ opacity }}
        className="absolute bottom-7 left-1/2 z-10 -translate-x-1/2"
      >
        <div className="flex flex-col items-center gap-2 text-ash">
          <span className="text-[10px] font-semibold uppercase tracking-[0.3em]">Scroll</span>
          <ArrowDown className="h-4 w-4 animate-floaty" />
        </div>
      </motion.div>
    </section>
  );
}
