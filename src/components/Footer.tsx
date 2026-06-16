import { IgIcon, FbIcon, YtIcon, TtIcon } from "./icons";
import { asset } from "../asset";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-coal pt-16">
      <div className="container-x grid gap-12 pb-12 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <a href="#top" className="flex items-center gap-3">
            <img src={asset("/images/logo.png")} alt="Ultimate Fight Academy" className="h-14 w-14 object-contain" />
            <span className="font-display text-xl leading-[0.95] tracking-wide">
              ULTIMATE FIGHT<br />
              <span className="text-ember">ACADEMY</span>
            </span>
          </a>
          <p className="mt-4 max-w-xs text-sm text-ash">
            L'académie de combat où chacun trouve sa discipline et se dépasse, du premier jab au podium.
          </p>
          <div className="mt-6 flex gap-3">
            {[IgIcon, FbIcon, YtIcon, TtIcon].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 text-ash transition-all hover:border-ember hover:text-ember"
              >
                <Icon className="h-5 w-5" />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 className="mb-4 text-xs font-semibold uppercase tracking-widest text-bone">Disciplines</h4>
          <ul className="space-y-2.5 text-sm text-ash">
            {["Jiu-Jitsu (BJJ)", "MMA", "Kickboxing", "Boxe Anglaise", "Kids Academy", "Women Only"].map((x) => (
              <li key={x}><a href="#disciplines" className="transition-colors hover:text-ember">{x}</a></li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-xs font-semibold uppercase tracking-widest text-bone">Le club</h4>
          <ul className="space-y-2.5 text-sm text-ash">
            {[["Coachs", "#coachs"], ["Planning", "#planning"], ["Tarifs", "#tarifs"], ["Galerie", "#galerie"], ["Contact", "#contact"]].map(([x, h]) => (
              <li key={x}><a href={h} className="transition-colors hover:text-ember">{x}</a></li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/5">
        <div className="container-x flex flex-col items-center justify-between gap-3 py-6 text-xs text-ash md:flex-row">
          <p>© {new Date().getFullYear()} Ultimate Fight Academy. Tous droits réservés.</p>
          <p>Conçu pour les combattants · Mentions légales · CGV</p>
        </div>
      </div>
    </footer>
  );
}
