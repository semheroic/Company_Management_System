import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Loader2, LockKeyhole, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import AuthService from "@/services/authService";
import { AuthShell } from "@/components/auth/AuthShell";

export default function Login() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectTo = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || "/";

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await AuthService.login({ email, password });
      navigate(redirectTo, { replace: true });
    } catch (error: unknown) {
      console.error("Login failed:", error);
      toast({
        title: "Login Failed",
        description:
          typeof error === "object" &&
          error !== null &&
          "response" in error &&
          typeof (error as { response?: { data?: { error?: string } } }).response?.data?.error === "string"
            ? (error as { response?: { data?: { error?: string } } }).response?.data?.error || "Could not sign you in."
            : "Could not sign you in.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Secure Access"
      title="Sign in to your workspace"
      description="Access company operations, accounting books, registers, and compliance dashboards from one controlled workspace."
      asideTitle="Compliance operations, centralized"
      asideDescription="Manage Rwanda-focused company records, ledgers, payroll, and governance workflows through one authenticated control panel."
      highlights={[
        "Session checks run before protected routes load so access stays aligned with the current user profile.",
        "Company switching, accounting books, and reporting modules all work from the same signed-in workspace.",
        "Responsive layouts keep the dashboard and operational pages usable across laptops, tablets, and phones.",
      ]}
      footer={
        <>
          Need an account?{" "}
          <Link to="/signup" className="font-semibold text-sky-700 transition-colors hover:text-sky-600">
            Create one
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-slate-700">
            Email
          </Label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-12 rounded-xl border-slate-200 pl-11"
              placeholder="name@company.com"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-slate-700">
            Password
          </Label>
          <div className="relative">
            <LockKeyhole className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-12 rounded-xl border-slate-200 pl-11"
              placeholder="Enter your password"
              required
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          Sign in to continue into your assigned company workspace and open the protected operational modules.
        </div>

        <Button type="submit" className="h-12 w-full rounded-xl bg-slate-950 text-white hover:bg-slate-800" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in
            </>
          ) : (
            "Sign In"
          )}
        </Button>
      </form>
    </AuthShell>
  );
}
