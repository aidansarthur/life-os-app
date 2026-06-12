"use client";

import { useCallback, useEffect, useState } from "react";
import type { WeeklyReport, WeeklyReportResponse } from "@/lib/weekly-report-types";

type WeeklyReportStatus = "loading" | "ready" | "error";

export function useWeeklyReport() {
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [status, setStatus] = useState<WeeklyReportStatus>("loading");
  const [error, setError] = useState<string | null>(null);

  const loadReport = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch("/api/reports/weekly", { cache: "no-store" });
      const data = (await response.json()) as WeeklyReportResponse;

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
