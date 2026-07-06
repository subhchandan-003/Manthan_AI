export function Gauge({
  value,
  size = 96,
  stroke = 8,
  color = "var(--accent-green)",
  label,
}: {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  label?: string;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--bg-tertiary)"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center px-2 text-center">
        <span className="font-display text-lg font-bold text-text-primary">{value}%</span>
        {label && (
          <span
            className="mt-1 text-[9px] leading-tight text-text-muted"
            style={{ maxWidth: size * 0.62 }}
          >
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
