import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { asset } from "../asset";

const links = [
  ["Disciplines", "#disciplines"],
  ["Coachs", "#coachs"],
  ["Planning", "#planning"],
  ["Tarifs", "#tarifs"],
  ["Galerie", "#galerie"],
  ["Contact", "#contact"],
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled ? "bg-ink/85 backdrop-blur-xl border-b border-white/5 py-3" : "py-5"
      }`}
    >
      <nav className="container-x flex items-center justify-between">
        <a href="#top" className="flex items-center gap-3">
          <img
            src={asset("/images/logo.png")}
            alt="Ultimate Fight Academy"
            className="h-11 w-11 object-contain drop-shadow-[0_2px_8px_rgba(255,61,46,0.35)]"
          />
          <span className="hidden font-display text-base leading-[0.95] tracking-wide sm:block">
            ULTIMATE FIGHT<br />
            <span className="text-ember">ACADEMY</span>
          </span>
        </a>

        <ul className="hidden items-center gap-8 lg:flex">
          {links.map(([label, href]) => (
            <li key={href}>
              <a
                href={href}
                className="group relative text-sm font-medium text-ash transition-colors hover:text-bone"
              >
                {label}
                <span className="absolute -bottom-1.5 left-0 h-px w-0 bg-ember transition-all duration-300 group-hover:w-full" />
              </a>
            </li>
          ))}
        </ul>

        <a href="#tarifs" className="btn-primary hidden lg:inline-flex !py-2.5 !px-5">
          Essai gratuit
        </a>

        <button
          className="grid h-10 w-10 place-items-center rounded-lg border border-white/10 lg:hidden"
          onClick={() => setOpen(true)}
          aria-label="Ouvrir le menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-ink/95 backdrop-blur-xl lg:hidden"
          >
            <div className="container-x flex items-center justify-between py-5">
              <img src={asset("/images/logo.png")} alt="Ultimate Fight Academy" className="h-10 w-10 object-contain" />
              <button
                className="grid h-10 w-10 place-items-center rounded-lg border border-white/10"
                onClick={() => setOpen(false)}
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <ul className="container-x mt-10 flex flex-col gap-2">
              {links.map(([label, href], i) => (
                <motion.li
                  key={href}
                  initial={{ x: 40, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.05 * i }}
                >
                  <a
                    href={href}
                    onClick={() => setOpen(false)}
                    className="block border-b border-white/5 py-5 font-display text-3xl tracking-wide hover:text-ember"
                  >
                    {label}
                  </a>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
