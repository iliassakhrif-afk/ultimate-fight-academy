import { Modal } from "./Overlay";
import { useStore } from "../store/StoreProvider";
import { formatDH, formatDateFR, amountInWords } from "../store/format";
import type { Payment } from "../types";
import { Printer } from "lucide-react";
import { asset } from "../../asset";

const METHOD_LABEL: Record<string, string> = { especes: "Espèces", virement: "Virement", cheque: "Chèque", carte: "Carte" };

export default function ReceiptPrintView({ open, onClose, payment }: { open: boolean; onClose: () => void; payment: Payment | null }) {
  const { db } = useStore();
  if (!payment) return null;
  const member = db.members.find((m) => m.id === payment.memberId);
  const s = db.settings;

  return (
    <Modal open={open} onClose={onClose} title="Reçu de paiement" width="max-w-md">
      <style>{`@media print { body * { visibility: hidden !important; } #ufa-receipt, #ufa-receipt * { visibility: visible !important; } #ufa-receipt { position: fixed; inset: 0; margin: 0; padding: 32px; background: #fff; color: #111; } }`}</style>

      <div id="ufa-receipt" className="rounded-xl bg-white p-6 text-ink">
        <div className="flex items-center justify-between border-b border-black/10 pb-4">
          <div className="flex items-center gap-2">
            <img src={asset("/images/logo.png")} alt="UFA" className="h-12 w-12 object-contain" />
            <div>
              <div className="font-display text-lg leading-tight text-ink">{s.name}</div>
              <div className="text-xs text-black/60">{s.address}</div>
              <div className="text-xs text-black/60">{s.phone}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-bold uppercase tracking-wider text-black/50">Reçu</div>
            <div className="font-mono text-sm font-bold">{payment.receiptNo}</div>
          </div>
        </div>

        <div className="mt-4 space-y-1.5 text-sm">
          <Row k="Date" v={formatDateFR(payment.paidAt.slice(0, 10))} />
          <Row k="Reçu de" v={member ? `${member.firstName} ${member.lastName}` : "—"} />
          {member && <Row k="N° membre" v={member.memberNo} />}
          <Row k="Motif" v={payment.type === "inscription" ? "Inscription / abonnement" : payment.type === "abonnement" ? "Abonnement" : payment.type === "boutique" ? "Boutique" : "Autre"} />
          <Row k="Mode de paiement" v={METHOD_LABEL[payment.method] || payment.method} />
          {payment.chequeRef && <Row k="Réf. chèque" v={payment.chequeRef} />}
        </div>

        <div className="mt-4 flex items-end justify-between rounded-lg bg-black/[0.04] p-4">
          <span className="text-sm font-semibold text-black/60">Montant réglé</span>
          <span className="font-display text-3xl text-ink">{formatDH(payment.amountDH)}</span>
        </div>
        <div className="mt-2 text-xs italic text-black/60">Arrêté la présente à la somme de : {amountInWords(payment.amountDH)}.</div>

        <div className="mt-5 border-t border-black/10 pt-3 text-center text-[11px] text-black/50">{s.receiptFooterText}</div>
      </div>

      <button onClick={() => window.print()} className="btn-primary mt-5 w-full">
        <Printer className="h-4 w-4" /> Imprimer / Enregistrer en PDF
      </button>
    </Modal>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-black/50">{k}</span>
      <span className="font-medium text-ink">{v}</span>
    </div>
  );
}
