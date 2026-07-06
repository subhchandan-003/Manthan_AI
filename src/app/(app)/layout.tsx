"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ShieldOff } from "lucide-react";
import { useSession } from "@/lib/session";
import { getRoleAccess, routeToNavKey } from "@/lib/roles";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { StatusBar } from "@/components/layout/StatusBar";

function Gate({ children }: { children: React.ReactNode }) {
  const { session, ready } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (ready && !session) router.replace("/login");
  }, [ready, session, router]);

  if (!ready || !session) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-text-muted">
        Loading MANTHAN…
      </div>
    );
  }

  const access = getRoleAccess(session.role);
  const navKey = routeToNavKey(pathname);
  const isRestricted = navKey !== null && !access.nav.includes(navKey);

  return (
    <div className="flex h-screen flex-col">
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />
          <main className="min-h-0 flex-1 overflow-y-auto bg-bg-primary">
            {isRestricted ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
                <ShieldOff className="h-8 w-8 text-text-muted" strokeWidth={1.5} />
                <h1 className="font-display text-lg font-semibold text-text-primary">
                  Not part of the {session.role} workspace
                </h1>
                <p className="max-w-sm text-sm text-text-secondary">
                  This section isn&apos;t relevant to your role and has been hidden to keep your
                  workspace focused. Switch to a role that covers this area to view it.
                </p>
                <button
                  onClick={() => router.replace("/dashboard")}
                  className="mt-2 rounded-md bg-accent-blue px-4 py-2 text-sm font-semibold text-white hover:brightness-90 transition"
                >
                  Back to Dashboard
                </button>
              </div>
            ) : (
              children
            )}
          </main>
        </div>
      </div>
      <StatusBar />
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <Gate>{children}</Gate>;
}
