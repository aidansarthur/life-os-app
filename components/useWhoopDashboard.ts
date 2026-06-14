"use client";

import { useEffect, useState } from "react";
import type { WhoopDashboardResponse, WhoopDashboardState } from "@/lib/whoop-dashboard-types";

export function useWhoopDashboard() {
  const [state, setState] = useState<WhoopDashboardState>({ status: "loading" });

  useEffect(() => {
    let isMounted = true;

    async function loadWhoopDashboard() {
      try {
        const response = await fetch("/api/whoop/dashboard", { cache: "no-store" });
        const body = (await response.json()) as WhoopDashboardResponse;

        if (!isMounted) return;

        if (body.ok) {
          setState({ status: "connected", metrics: body.metrics });
        } else if (body.error === "not_connected") {
          setState({ status: "not_connected" });
        } else {
          setState({ status: "error" });
        }
      } catch {
        if (isMounted) {
          setState({ status: "error" });
        }
      }
    }

    loadWhoopDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  return state;
}

