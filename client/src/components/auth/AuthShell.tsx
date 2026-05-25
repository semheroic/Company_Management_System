import { ReactNode } from "react";
import { Building2, ShieldCheck } from "lucide-react";

interface AuthShellProps {
  eyebrow: string;
  title: string;
  description: string;
  asideTitle: string;
  asideDescription: string;
  highlights: string[];
  footer?: ReactNode;
  children: ReactNode;
}

export function AuthShell({
  eyebrow,
  title,
  description,
  asideTitle,
  asideDescription,
  highlights,
  footer,
  children,
}: AuthShellProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.25),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.18),transparent_30%)]" />
      <div className="relative mx-auto grid min-h-screen max-w-7xl items-center gap-10 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_0.95fr] lg:px-8">
        <section className="hidden rounded-[2rem] border border-white/10 bg-white/5 p-10 text-white shadow-2xl backdrop-blur lg:block">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
              <Building2 className="h-7 w-7 text-sky-300" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-300">Office Manager</p>
              <h1 className="text-3xl font-semibold">{asideTitle}</h1>
            </div>
          </div>

          <p className="mt-6 max-w-xl text-base leading-7 text-slate-300">{asideDescription}</p>

          <div className="mt-10 grid gap-4">
            {highlights.map((highlight) => (
              <div key={highlight} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
                <p className="text-sm leading-6 text-slate-200">{highlight}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="w-full">
          <div className="mx-auto max-w-xl rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-950/15 sm:p-8">
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">{eyebrow}</p>
              <h2 className="mt-3 text-3xl font-semibold text-slate-950">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
            </div>

            {children}

            {footer && <div className="mt-6 border-t border-slate-200 pt-5 text-sm text-slate-600">{footer}</div>}
          </div>
        </section>
      </div>
    </div>
  );
}
