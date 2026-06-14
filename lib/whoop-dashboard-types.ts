export type WhoopRecoveryTrendPoint = {
  date: string;
  recoveryScore: number;
};

export type WhoopDashboardData = {
  recoveryScore: number | null;
  hrv: number | null;
  restingHeartRate: number | null;
  sleepPerformance: number | null;
  hoursSlept: number | null;
  sleepEfficiency: number | null;
  recoveryTrend: WhoopRecoveryTrendPoint[];
  sleepTrend: { date: string; hoursSlept: number | null; sleepPerformance: number | null }[];
  strain: number | null;
  cycleStrain: number | null;
};

export type WhoopDashboardResponse =
  | { ok: true; metrics: WhoopDashboardData }
  | { ok: false; error: "not_connected" | "unauthorized" | "refresh_failed" | "whoop_request_failed" };

export type WhoopDashboardState =
  | { status: "loading" }
  | { status: "not_connected" }
  | { status: "error"; error?: "unauthorized" | "refresh_failed" | "whoop_request_failed" }
  | { status: "connected"; metrics: WhoopDashboardData };


