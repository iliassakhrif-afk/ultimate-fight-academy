import { useState, useEffect } from "react";
import { Modal } from "./Overlay";
import { useStore } from "../store/StoreProvider";
import { memberBalanceDH } from "../store/selectors";
import { formatDH } from "../store/format";
import type { PayMethod } from "../types";
import { Check } from "lucide-react";

const METHODS: { id: PayMethod; label: string }[] = [
  { id: "especes", label: "Espèces" },
  { id: "virement", label: "Virement" },
  { id: "cheque", label: "Chèque" },
  { id: "carte", label: "Carte" },
];

export default function CollectPaymentModal({
  open, onClose, memberId, installmentId = null, defaultAmount,
}: {
  open: boolean; onClose: () => void; memberId: string; installmentId?: string | null; defaultAmount?: number;
}) {
  const { db, collectPayment } = useStore();
  const member = db.members.find((m) => m.id === memberId);
  const balance = memberBalanceDH(db, memberId);
  const [amount, setAmount] = useState(defaultAmount ?? balance);
  const [method, setMethod] = useState<PayMethod>(member?.preferredPaymentMethod ?? "especes");
  const [done, setDone] = useState<string | null>(null);

  // Resynchronise à chaque ouverture (le composant est monté en permanence chez les appelants).
  useEffect(() => {
    if (open) {
      setAmount(defaultAmount ?? balance);
      setMethod(member?.preferredPaymentMethod ?? "especes");
      setDone(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultAmount, memberId]);

  if (!member) return null;

  const confirm = () => {
    if (amount <= 0) return;
    const receipt = collectPayment({ memberId, installmentId, amount, method });
    setDone(receipt);
  };

  const close = () => { setDone(null); setAmount(defaultAmount ?? balance); onClose(); };

  return (
    <Modal open={open} onClose={close} title="Encaisser un paiement">
      {done ? (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-[#3ddc84]/15 text-[#3ddc84]"><Check className="h-7 w-7" /></span>
          <p className="font-display text-2xl">{formatDH(amount)} encaissés</p>
          <p className="text-sm text-ash">Reçu <span className="font-mono text-bone">{done}</span> · {member.firstName} {member.lastName}</p>
          <button onClick={close} className="btn-primary mt-2">Terminer</button>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="rounded-xl border border-white/10 bg-ink p-4">
            <div className="text-sm text-ash">Membre</div>
            <div className="font-semibold text-bone">{member.firstName} {member.lastName} · {member.memberNo}</div>
            {balance > 0 && <div className="mt-1 text-sm text-ember">Solde dû : {formatDH(balance)}</div>}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ash">Montant (DH)</label>
            <input type="number" value={amount} onChange={(e) => { const v = Number(e.target.value); setAmount(Number.isFinite(v) && v >= 0 ? v : 0); }}
              className="w-full rounded-xl border border-white/10 bg-ink px-4 py-3 font-display text-2xl text-bone outline-none focus:border-ember" />
            {balance > 0 && (
              <div className="mt-2 flex gap-2">
                <button onClick={() => setAmount(balance)} className="rounded-full bg-white/5 px-3 py-1 text-xs text-ash hover:text-bone">Solde total {formatDH(balance)}</button>
                <button onClick={() => setAmount(Math.round(balance / 2))} className="rounded-full bg-white/5 px-3 py-1 text-xs text-ash hover:text-bone">Moitié</button>
              </div>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ash">Méthode</label>
            <div className="grid grid-cols-4 gap-2">
              {METHODS.map((m) => (
                <button key={m.id} onClick={() => setMethod(m.id)}
                  className={`rounded-xl border px-2 py-2.5 text-xs font-semibold transition-colors ${method === m.id ? "border-ember bg-ember/15 text-ember" : "border-white/10 text-ash hover:text-bone"}`}>
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <button onClick={confirm} className="btn-primary w-full">Valider l'encaissement</button>
        </div>
      )}
    </Modal>
  );
}
