"use client";

import clsx from "clsx";
import { motion } from "framer-motion";

export function Card({
  children,
  className,
  aiGenerated = false,
  noMotion = false,
}: {
  children: React.ReactNode;
  className?: string;
  aiGenerated?: boolean;
  noMotion?: boolean;
}) {
  const classes = clsx(
    "rounded-xl border border-border-subtle bg-bg-secondary p-5 md:p-6",
    aiGenerated && "border-l-2 border-l-accent-cyan",
    className
  );

  if (noMotion) return <div className={classes}>{children}</div>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={classes}
    >
      {children}
    </motion.div>
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
    <div className="mb-4 flex items-center justify-between gap-3">
      <h3 className="flex items-center gap-2 font-display text-base font-semibold text-text-primary">
        {icon}
        {title}
      </h3>
      {action}
    </div>
  );
}
