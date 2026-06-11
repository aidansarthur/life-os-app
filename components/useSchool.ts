"use client";

import { useCallback, useEffect, useState } from "react";
import type { SchoolGoalSummary, SchoolResponse } from "@/lib/school-types";

type SchoolStatus = "loading" | "ready" | "error";

type CreateGoalInput = {
  title: string;
  description?: string;
  category?: string;
  priority?: string;
};

type CreateTaskInput = {
  title: string;
  dueDate?: string;
  priority?: string;
};

export function useSchool() {
  const [goals, setGoals] = useState<SchoolGoalSummary[]>([]);
  const [status, setStatus] = useState<SchoolStatus>("loading");
  const [error, setError] = useState<string | null>(null);

  const loadSchool = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch("/api/school", { cache: "no-store" });
      const data = (await response.json()) as SchoolResponse;

      if (!response.ok || !data.ok) {
        setStatus("error");
        setError(data.ok ? "request_failed" : data.error);
        return;
      }

      setGoals(data.goals);
      setStatus("ready");
    } catch {
      setStatus("error");
      setError("request_failed");
    }
  }, []);

  useEffect(() => {
    void loadSchool();
  }, [loadSchool]);

  const createGoal = useCallback(async (input: CreateGoalInput) => {
    const response = await fetch("/api/school", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input)
    });
    const data = (await response.json()) as SchoolResponse;

    if (!response.ok || !data.ok) {
      setStatus("error");
      setError(data.ok ? "request_failed" : data.error);
      return false;
    }

    setGoals(data.goals);
    setStatus("ready");
    setError(null);
    return true;
  }, []);

  const createTask = useCallback(async (goalId: string, input: CreateTaskInput) => {
    const response = await fetch(`/api/school/${goalId}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input)
    });

    if (!response.ok) {
      setStatus("error");
      setError("request_failed");
      return false;
    }

    await loadSchool();
    return true;
  }, [loadSchool]);

  const completeTask = useCallback(async (taskId: string) => {
    const response = await fetch(`/api/school/tasks/${taskId}/complete`, { method: "POST" });

    if (!response.ok) {
      setStatus("error");
      setError("request_failed");
      return false;
    }

    await loadSchool();
    return true;
  }, [loadSchool]);

  const deleteGoal = useCallback(async (goalId: string) => {
    const response = await fetch(`/api/school/${goalId}`, { method: "DELETE" });

    if (!response.ok) {
      setStatus("error");
      setError("request_failed");
      return false;
    }

    setGoals((items) => items.filter((item) => item.id !== goalId));
    return true;
  }, []);

  return { goals, status, error, loadSchool, createGoal, createTask, completeTask, deleteGoal };
}
