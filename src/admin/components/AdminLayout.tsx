import { useState } from "react";
import { Outlet } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AdminStoreProvider } from "../store/StoreProvider";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import DemoBanner from "./DemoBanner";

export default function AdminLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <AdminStoreProvider>
      <div className="flex h-screen overflow-hidden bg-ink text-bone">
        {/* Sidebar desktop */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>

        {/* Sidebar mobile */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div className="fixed inset-0 z-50 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="absolute inset-0 bg-ink/70 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
              <motion.div initial={{ x: -260 }} animate={{ x: 0 }} exit={{ x: -260 }} transition={{ type: "spring", stiffness: 320, damping: 32 }} className="absolute left-0 top-0 h-full">
                <Sidebar onNavigate={() => setMenuOpen(false)} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex min-w-0 flex-1 flex-col">
          <DemoBanner />
          <Topbar onOpenMenu={() => setMenuOpen(true)} />
          <main className="flex-1 overflow-y-auto px-4 py-6 md:px-6 lg:px-8">
            <Outlet />
          </main>
        </div>
      </div>
    </AdminStoreProvider>
  );
}
