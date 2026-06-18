import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import type { ReactNode } from "react";

export function Modal({ open, onClose, title, children, width = "max-w-lg" }: { open: boolean; onClose: () => void; title?: string; children: ReactNode; width?: string }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[100] flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-ink/80 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ scale: 0.94, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.94, y: 20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className={`relative w-full ${width} rounded-2xl border border-white/10 bg-coal shadow-2xl`}
          >
            {title && (
              <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
                <h3 className="font-display text-xl tracking-wide">{title}</h3>
                <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-ash hover:bg-white/5 hover:text-bone"><X className="h-4 w-4" /></button>
              </div>
            )}
            <div className="p-6">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Drawer({ open, onClose, title, children, width = "max-w-md" }: { open: boolean; onClose: () => void; title?: string; children: ReactNode; width?: string }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[100]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-ink/80 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className={`absolute right-0 top-0 h-full w-full ${width} overflow-y-auto border-l border-white/10 bg-coal shadow-2xl`}
          >
            {title && (
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-coal px-6 py-4">
                <h3 className="font-display text-xl tracking-wide">{title}</h3>
                <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-ash hover:bg-white/5 hover:text-bone"><X className="h-4 w-4" /></button>
              </div>
            )}
            <div className="p-6">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
