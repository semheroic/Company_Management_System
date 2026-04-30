import { ReactNode, useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import AuthService from "@/services/authService";
import { Loader2 } from "lucide-react";

function RouteLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100">
      <div className="flex items-center gap-3 rounded-xl border bg-white px-5 py-4 shadow-sm">
        <Loader2 className="h-5 w-5 animate-spin text-slate-600" />
        <span className="text-sm font-medium text-slate-700">Checking your session...</span>
      </div>
    </div>
  );
}

export function ProtectedRoute() {
  const location = useLocation();
  const [status, setStatus] = useState<"loading" | "authenticated" | "guest">("loading");

  useEffect(() => {
    let active = true;

    const validateSession = async () => {
      try {
        await AuthService.getProfile();
        if (active) {
          setStatus("authenticated");
        }
      } catch {
        AuthService.clearCachedUser();
        if (active) {
          setStatus("guest");
        }
      }
    };

    void validateSession();

    return () => {
      active = false;
    };
  }, []);

  if (status === "loading") {
    return <RouteLoader />;
  }

  if (status !== "authenticated") {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

export function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<"loading" | "authenticated" | "guest">("loading");

  useEffect(() => {
    let active = true;

    const checkSession = async () => {
      try {
        await AuthService.getProfile();
        if (active) {
          setStatus("authenticated");
        }
      } catch {
        AuthService.clearCachedUser();
        if (active) {
          setStatus("guest");
        }
      }
    };

    void checkSession();

    return () => {
      active = false;
    };
  }, []);

  if (status === "loading") {
    return <RouteLoader />;
  }

  if (status === "authenticated") {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
