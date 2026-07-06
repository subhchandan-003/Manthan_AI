import clsx from "clsx";

type BadgeTone = "blue" | "amber" | "red" | "green" | "cyan" | "purple" | "neutral";

const toneClasses: Record<BadgeTone, string> = {
  blue: "bg-accent-blue/15 text-accent-blue border-accent-blue/30",
  amber: "bg-accent-amber/15 text-accent-amber border-accent-amber/30",
  red: "bg-accent-red/15 text-accent-red border-accent-red/30",
  green: "bg-accent-green/15 text-accent-green border-accent-green/30",
  cyan: "bg-accent-cyan/15 text-accent-cyan border-accent-cyan/30",
  purple: "bg-accent-purple/15 text-accent-purple border-accent-purple/30",
  neutral: "bg-bg-tertiary text-text-secondary border-border-subtle",
};

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-mono text-[11px] font-medium whitespace-nowrap",
        toneClasses[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
