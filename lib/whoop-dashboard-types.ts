export type WhoopDashboardData = {
  recoveryScore: number | null;
  hrv: number | null;
  restingHeartRate: number | null;
  sleepPerformance: number | null;
  hoursSlept: number | null;
  sleepEfficiency: number | null;
};

export type WhoopDashboardResponse =
  | { ok: true; metrics: WhoopDashboardData }
  | { ok: false; error: "not_connected" | "unauthorized" | "whoop_request_failed" };

export type WhoopDashboardState =
  | { status: "loading" }
  | { status: "not_connected" }
  | { status: "error" }
  | { status: "connected"; metrics: WhoopDashboardData };
