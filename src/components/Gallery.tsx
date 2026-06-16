import { motion } from "framer-motion";
import { gallery } from "../data";
import { asset } from "../asset";

export default function Gallery() {
  return (
    <section id="galerie" className="py-24 md:py-32">
      <div className="container-x">
        <div className="mb-12 text-center">
          <span className="eyebrow mb-4 justify-center">
            <span className="h-px w-8 bg-ember" /> Dans la cage <span className="h-px w-8 bg-ember" />
          </span>
          <h2 className="font-display text-5xl leading-[0.9] md:text-7xl">L'ESPRIT DU CLUB</h2>
        </div>

        <div className="grid auto-rows-[200px] grid-cols-2 gap-4 md:grid-cols-4">
          {gallery.map((src, i) => (
            <motion.div
              key={src}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: (i % 4) * 0.08 }}
              className={`group relative overflow-hidden rounded-2xl border border-white/10 ${
                i === 0 ? "col-span-2 row-span-2" : i === 3 ? "row-span-2" : ""
              }`}
            >
              <img
                src={asset(src)}
                alt="Entraînement"
                className="h-full w-full object-cover grayscale transition-all duration-700 group-hover:grayscale-0 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-ember/0 transition-colors duration-500 group-hover:bg-ember/10" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
