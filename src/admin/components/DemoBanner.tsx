import { Info } from "lucide-react";
import { useStore } from "../store/StoreProvider";
import { formatDateFR } from "../store/format";

export default function DemoBanner() {
  const { db } = useStore();
  return (
    <div className="flex items-center justify-center gap-2 border-b border-white/5 bg-gold/[0.06] px-4 py-1.5 text-center text-[11px] text-gold/90">
      <Info className="h-3.5 w-3.5" />
      Mode démo — données 100% locales (localStorage), horloge figée au {formatDateFR(db.settings.demoClock)}. Rien n'est envoyé en ligne.
    </div>
  );
}
