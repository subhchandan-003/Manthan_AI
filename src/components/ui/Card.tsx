import clsx from "clsx";

export function Card({
  children,
  className,
  aiGenerated = false,
}: {
  children: React.ReactNode;
  className?: string;
  aiGenerated?: boolean;
}) {
  return (
    <div
      className={clsx(
        "rounded-lg border border-border-subtle bg-bg-secondary p-4",
        aiGenerated && "border-l-2 border-l-accent-cyan",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  action,
  icon,
}: {
  title: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h3 className="flex items-center gap-2 font-display text-[15px] font-semibold text-text-primary">
        {icon}
        {title}
      </h3>
      {action}
    </div>
  );
}
