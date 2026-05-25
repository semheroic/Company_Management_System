import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActionLoadingStateProps {
  title: string;
  description?: string;
  fullScreen?: boolean;
  className?: string;
}

export default function ActionLoadingState({
  title,
  description,
  fullScreen = false,
  className,
}: ActionLoadingStateProps) {
  return (
    <div
      className={cn(
        fullScreen
          ? "flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10"
          : "flex items-center justify-center rounded-2xl border border-dashed border-blue-200 bg-blue-50/60 px-4 py-10",
        className,
      )}
    >
      <div className="flex max-w-md flex-col items-center gap-3 text-center">
        <div className="rounded-full bg-white p-3 shadow-sm">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
        <div className="space-y-1">
          <p className="text-base font-semibold text-gray-900">{title}</p>
          {description ? <p className="text-sm text-gray-600">{description}</p> : null}
        </div>
      </div>
    </div>
  );
}
