import { ReactNode } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import AuthService from "@/services/authService";

export function ProtectedRoute() {
  const location = useLocation();

  if (!AuthService.isAuthenticated()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

export function PublicOnlyRoute({ children }: { children: ReactNode }) {
  if (AuthService.isAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
