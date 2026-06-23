import { useState } from "react";
import { Copy, Check, MessageCircle } from "lucide-react";
import type { Member } from "../types";
import { waLink, interpolate, formatDH, formatDateFR } from "../store/format";

export const TEMPLATES: Record<string, string> = {
  paiement: "Bonjour {prenom} 👋 Petit rappel amical : il reste {montant} à régler pour ton abonnement à l'Ultimate Fight Academy (échéance du {echeance}). Merci de passer à l'accueil 🥋",
  expiration: "Salut {prenom} ! Ton abonnement à l'Ultimate Fight Academy se termine le {echeance}. Renouvelle dès maintenant pour ne pas perdre ta place sur le tatami 💪",
  decrochage: "Hey {prenom}, ça fait un moment qu'on ne t'a pas vu à la salle ! On garde ta place au chaud 🔥 Reviens t'entraîner avec nous à l'Ultimate Fight Academy.",
  bienvenue: "Bienvenue {prenom} dans la famille Ultimate Fight Academy ! 🥋 On a hâte de te voir progresser. À très vite sur le tatami.",
};

export default function WhatsAppReminder({
  member, type = "paiement", amount, dueDate, compact = false, onSend,
}: {
  member: Member; type?: keyof typeof TEMPLATES; amount?: number; dueDate?: string; compact?: boolean; onSend?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const msg = interpolate(TEMPLATES[type], {
    prenom: member.firstName,
    montant: amount != null ? formatDH(amount) : "",
    echeance: dueDate ? formatDateFR(dueDate) : "",
  });
  const link = waLink(member.whatsapp || member.phone, msg);

  const copy = () => { navigator.clipboard?.writeText(msg); setCopied(true); setTimeout(() => setCopied(false), 1600); };

  if (compact) {
    return (
      <a href={link} target="_blank" rel="noopener noreferrer" onClick={(e) => { e.stopPropagation(); onSend?.(); }}
        className="inline-flex items-center gap-1.5 rounded-full bg-[#25D366]/15 px-3 py-1.5 text-xs font-semibold text-[#25D366] hover:bg-[#25D366]/25">
        <MessageCircle className="h-3.5 w-3.5" /> Relancer
      </a>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-white/10 bg-ink p-4 text-sm text-bone/90">{msg}</div>
      <div className="flex gap-2">
        <a href={link} target="_blank" rel="noopener noreferrer" onClick={() => onSend?.()} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-sm font-bold text-white transition-transform hover:scale-[1.02]">
          <MessageCircle className="h-4 w-4" /> Ouvrir WhatsApp
        </a>
        <button onClick={copy} className="flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-ash hover:text-bone">
          {copied ? <Check className="h-4 w-4 text-[#3ddc84]" /> : <Copy className="h-4 w-4" />} {copied ? "Copié" : "Copier"}
        </button>
      </div>
    </div>
  );
}
