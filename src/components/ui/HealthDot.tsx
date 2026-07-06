import clsx from "clsx";
import type { HealthStatus } from "@/lib/types";

const colorMap: Record<HealthStatus, string> = {
  healthy: "bg-accent-green",
  warning: "bg-accent-amber",
  critical: "bg-accent-red",
};

export function HealthDot({ status, pulse = false }: { status: HealthStatus; pulse?: boolean }) {
  return (
    <span
      className={clsx(
        "inline-block h-2 w-2 rounded-full shrink-0",
        colorMap[status],
        pulse && status === "critical" && "animate-pulse-glow"
      )}
      title={status}
    />
  );
}
