import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import SiteVitrine from "./pages/SiteVitrine";
import RequireAuth from "./admin/components/RequireAuth";

const AdminLayout = lazy(() => import("./admin/components/AdminLayout"));
const Login = lazy(() => import("./admin/pages/Login"));
const Dashboard = lazy(() => import("./admin/pages/Dashboard"));
const Members = lazy(() => import("./admin/pages/Members"));
const MemberDetail = lazy(() => import("./admin/pages/MemberDetail"));
const MemberWizard = lazy(() => import("./admin/pages/MemberWizard"));
const Attendance = lazy(() => import("./admin/pages/Attendance"));
const Techniques = lazy(() => import("./admin/pages/Techniques"));
const Schedule = lazy(() => import("./admin/pages/Schedule"));
const Payments = lazy(() => import("./admin/pages/Payments"));
const DuesReminders = lazy(() => import("./admin/pages/DuesReminders"));
const Subscriptions = lazy(() => import("./admin/pages/Subscriptions"));
const Belts = lazy(() => import("./admin/pages/Belts"));
const Analytics = lazy(() => import("./admin/pages/Analytics"));
const Settings = lazy(() => import("./admin/pages/Settings"));

function AdminFallback() {
  return (
    <div className="grid min-h-screen place-items-center bg-ink text-ash">
      <div className="flex flex-col items-center gap-3">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-ember" />
        <span className="text-sm">Chargement de l'espace admin…</span>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Suspense fallback={<AdminFallback />}>
        <Routes>
          <Route path="/" element={<SiteVitrine />} />
          <Route path="/admin/login" element={<Login />} />
          <Route path="/admin" element={<RequireAuth><AdminLayout /></RequireAuth>}>
            <Route index element={<Dashboard />} />
            <Route path="membres" element={<Members />} />
            <Route path="membres/nouveau" element={<MemberWizard />} />
            <Route path="membres/:id" element={<MemberDetail />} />
            <Route path="presences" element={<Attendance />} />
            <Route path="techniques" element={<Techniques />} />
            <Route path="planning" element={<Schedule />} />
            <Route path="paiements" element={<Payments />} />
            <Route path="echeances" element={<DuesReminders />} />
            <Route path="abonnements" element={<Subscriptions />} />
            <Route path="grades" element={<Belts />} />
            <Route path="statistiques" element={<Analytics />} />
            <Route path="reglages" element={<Settings />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
