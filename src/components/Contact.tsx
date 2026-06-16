import { motion } from "framer-motion";
import { MapPin, Phone, Mail, Clock } from "lucide-react";

const infos = [
  { icon: MapPin, label: "Adresse", value: "Av. Mohamed V, Kénitra, Maroc" },
  { icon: Phone, label: "Téléphone", value: "+212 6 12 34 56 78" },
  { icon: Mail, label: "Email", value: "contact@ultimatefight.ma" },
  { icon: Clock, label: "Horaires", value: "Lun–Sam · 9h – 22h" },
];

export default function Contact() {
  return (
    <section id="contact" className="relative overflow-hidden py-24 md:py-32">
      <div className="pointer-events-none absolute right-0 top-0 h-[28rem] w-[28rem] rounded-full bg-ember/15 blur-[140px]" />
      <div className="container-x relative grid gap-12 lg:grid-cols-2">
        <div>
          <span className="eyebrow mb-4">
            <span className="h-px w-8 bg-ember" /> Premier cours offert
          </span>
          <h2 className="font-display text-5xl leading-[0.9] md:text-7xl">
            PRÊT À <br /> <span className="text-gradient-ember">MONTER SUR</span> <br /> LE RING ?
          </h2>
          <p className="mt-6 max-w-md text-ash">
            Réserve ta séance d'essai gratuite. Pas besoin d'expérience, juste l'envie de te dépasser.
            On s'occupe du reste.
          </p>

          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {infos.map((info) => (
              <div key={info.label} className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-ember/15">
                  <info.icon className="h-5 w-5 text-ember" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-ash">{info.label}</p>
                  <p className="mt-0.5 text-sm font-medium text-bone">{info.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <motion.form
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          onSubmit={(e) => {
            e.preventDefault();
            alert("Merci ! On te recontacte très vite pour ta séance d'essai. 🥊");
          }}
          className="rounded-3xl border border-white/10 bg-coal p-8"
        >
          <h3 className="font-display text-2xl tracking-wide">Réserve ton essai</h3>
          <div className="mt-6 space-y-4">
            <input required placeholder="Ton prénom" className="field" />
            <input required type="tel" placeholder="Ton téléphone" className="field" />
            <input required type="email" placeholder="Ton email" className="field" />
            <select className="field text-ash">
              <option>Discipline souhaitée</option>
              <option>Jiu-Jitsu Brésilien (BJJ)</option>
              <option>MMA</option>
              <option>Kickboxing</option>
              <option>Boxe Anglaise</option>
              <option>Kids Academy</option>
              <option>Women Only</option>
            </select>
            <button type="submit" className="btn-primary w-full">Je réserve mon cours gratuit</button>
          </div>
        </motion.form>
      </div>
    </section>
  );
}
