"use client";

import { useCallback, useEffect, useState } from "react";
import type { DailyReport, DailyReportResponse } from "@/lib/daily-report-types";

type DailyReportStatus = "loading" | "ready" | "error";

export function useDailyReport() {
  const [report, setReport] = useState<DailyReport | null>(null);
  const [status, setStatus] = useState<DailyReportStatus>("loading");
  const [error, setError] = useState<string | null>(null);

  const loadReport = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch("/api/reports/daily", { cache: "no-store" });
      const data = (await response.json()) as DailyReportResponse;

      if (!response.ok || !data.ok) {
        setStatus("error");
        setError(data.ok ? "request_failed" : data.error);
        return;
      }

      setReport(data.report);
      setStatus("ready");
    } catch {
      setStatus("error");
      setError("request_failed");
    }
  }, []);

  useEffect(() => {
    void loadReport();
  }, [loadReport]);

  return { report, status, error, loadReport };
}
