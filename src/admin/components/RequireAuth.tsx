import { Navigate } from "react-router-dom";
import { auth } from "../store/db";
import type { ReactNode } from "react";

export default function RequireAuth({ children }: { children: ReactNode }) {
  if (!auth.isAuthed()) return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
}
