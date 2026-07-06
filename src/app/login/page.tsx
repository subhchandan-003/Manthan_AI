"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Gauge } from "lucide-react";
import { useSession } from "@/lib/session";
import type { Role } from "@/lib/types";

const PLANTS = [
  { short: "SIPAT STPP", full: "NTPC Sipat Super Thermal Power Project — Stage-III (1×800 MW)" },
  { short: "Maithon Power", full: "Maithon Power Limited — 2×525 MW (Tata Power / DVC JV), Jharkhand" },
  { short: "NRL Numaligarh", full: "NRL Numaligarh Refinery — Polypropylene Unit Expansion, Assam" },
  { short: "NTPC Unchahar", full: "NTPC Unchahar Thermal Power Station — 2×210 MW, Uttar Pradesh" },
  { short: "TANGEDCO Ennore SEZ", full: "TANGEDCO Ennore SEZ Supercritical TPP, Tamil Nadu" },
];

const ROLES: Role[] = ["Plant Engineer", "Maintenance Engineer", "Safety Officer", "Shift In-Charge"];

const STATS = [
  "15,000+ P&ID symbols recognized",
  "40% faster troubleshooting",
  "Zero-miss safety compliance",
];

export default function LoginPage() {
  const router = useRouter();
  const { login } = useSession();

  const [employeeId, setEmployeeId] = useState("EMP-40217");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [plant, setPlant] = useState(PLANTS[0].short);
  const [role, setRole] = useState<Role>("Plant Engineer");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    login({
      employeeId,
      employeeName: "Subhchandan Das",
      role,
      plantName: PLANTS.find((p) => p.short === plant)?.full ?? plant,
      plantShort: plant,
      unit: "3",
      shift: "B",
    });
    router.push("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-1">
      <div className="relative hidden flex-1 flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#0c1117] to-[#151c25] px-12 lg:flex">
        <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.06]" viewBox="0 0 800 600">
          <path d="M40 80 H300 V200 H600 V80 H760" stroke="white" strokeWidth="2" fill="none" />
          <path d="M40 300 H500 V450 H760" stroke="white" strokeWidth="2" fill="none" />
          <circle cx="300" cy="200" r="18" stroke="white" strokeWidth="2" fill="none" />
          <circle cx="500" cy="450" r="18" stroke="white" strokeWidth="2" fill="none" />
          <rect x="580" y="60" width="40" height="40" stroke="white" strokeWidth="2" fill="none" />
        </svg>
        <div className="relative z-10 flex flex-col items-center gap-4 text-center">
          <div className="flex items-center gap-3">
            <Eye className="h-10 w-10 text-accent-cyan" strokeWidth={1.5} />
            <span className="font-display text-4xl font-bold tracking-wide text-text-primary">
              MANTHAN
            </span>
          </div>
          <p className="max-w-md font-display text-lg font-semibold text-text-primary">
            The Intelligent Eye Across Your Plant
          </p>
          <p className="max-w-sm text-sm text-text-secondary">
            AI-powered operations &amp; maintenance intelligence for Indian heavy industries
          </p>
          <div className="mt-8 flex flex-col gap-3">
            {STATS.map((s) => (
              <div
                key={s}
                className="rounded-lg border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-text-primary backdrop-blur-sm"
              >
                {s}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex w-full flex-col justify-center bg-bg-secondary px-8 py-12 sm:px-16 lg:w-[480px] lg:shrink-0">
        <div className="mb-8 flex items-center gap-2 lg:hidden">
          <Eye className="h-7 w-7 text-accent-cyan" />
          <span className="font-display text-xl font-bold">MANTHAN</span>
        </div>
        <h1 className="font-display text-2xl font-semibold text-text-primary">Sign in</h1>
        <p className="mt-1 text-sm text-text-secondary">Access your plant intelligence workspace</p>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-secondary">Employee ID</label>
            <input
              required
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              placeholder="Enter your Employee ID"
              className="w-full rounded-md border border-border-subtle bg-bg-primary px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-border-active focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-secondary">Password</label>
            <div className="relative">
              <input
                required
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-md border border-border-subtle bg-bg-primary px-3 py-2.5 pr-10 text-sm text-text-primary placeholder:text-text-muted focus:border-border-active focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-secondary">Plant Selection</label>
            <select
              value={plant}
              onChange={(e) => setPlant(e.target.value)}
              className="w-full rounded-md border border-border-subtle bg-bg-primary px-3 py-2.5 text-sm text-text-primary focus:border-border-active focus:outline-none"
            >
              {PLANTS.map((p) => (
                <option key={p.short} value={p.short}>
                  {p.full}
                </option>
              ))}
              <option value="Custom Plant">Custom Plant</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium text-text-secondary">Role</label>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map((r) => (
                <label
                  key={r}
                  className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-xs transition-colors ${
                    role === r
                      ? "border-border-active bg-accent-blue/10 text-text-primary"
                      : "border-border-subtle text-text-secondary hover:bg-bg-tertiary"
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    className="accent-[var(--accent-blue)]"
                    checked={role === r}
                    onChange={() => setRole(r)}
                  />
                  {r}
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="mt-2 flex items-center justify-center gap-2 rounded-md bg-accent-blue px-4 py-2.5 font-display text-sm font-semibold text-white transition-colors hover:bg-[#2f78e6]"
          >
            <Gauge className="h-4 w-4" />
            Log In
          </button>
          <a href="#" className="text-center text-xs text-text-muted hover:text-text-secondary">
            Forgot password?
          </a>
        </form>

        <p className="mt-10 text-center text-xs text-text-muted">
          ET Gen AI Hackathon 2026 · Team Eastern Tigers
        </p>
      </div>
    </div>
  );
}
