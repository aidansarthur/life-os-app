"use client";

import { useCallback, useEffect, useState } from "react";
import type { HabitsResponse, HabitSummary } from "@/lib/habit-types";

type HabitsStatus = "loading" | "ready" | "error";

type CreateHabitInput = {
  title: string;
  description?: string;
  targetFrequency?: string;
};

export function useHabits() {
  const [habits, setHabits] = useState<HabitSummary[]>([]);
  const [status, setStatus] = useState<HabitsStatus>("loading");
  const [error, setError] = useState<string | null>(null);

  const loadHabits = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch("/api/habits", { cache: "no-store" });
      const data = (await response.json()) as HabitsResponse;

      if (!response.ok || !data.ok) {
        setStatus("error");
        setError(data.ok ? "request_failed" : data.error);
        return;
      }

      setHabits(data.habits);
      setStatus("ready");
    } catch {
      setStatus("error");
      setError("request_failed");
    }
  }, []);

  useEffect(() => {
    void loadHabits();
  }, [loadHabits]);

  const createHabit = useCallback(async (input: CreateHabitInput) => {
    const response = await fetch("/api/habits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input)
    });
    const data = (await response.json()) as HabitsResponse;

    if (!response.ok || !data.ok) {
      setStatus("error");
      setError(data.ok ? "request_failed" : data.error);
      return false;
    }

    setHabits(data.habits);
    setStatus("ready");
    setError(null);
    return true;
  }, []);

  const completeHabit = useCallback(async (id: string) => {
    const response = await fetch(`/api/habits/${id}/complete`, { method: "POST" });

    if (!response.ok) {
      setStatus("error");
      setError("request_failed");
      return false;
    }

    await loadHabits();
    return true;
  }, [loadHabits]);

  const deleteHabit = useCallback(async (id: string) => {
    const response = await fetch(`/api/habits/${id}`, { method: "DELETE" });

    if (!response.ok) {
      setStatus("error");
      setError("request_failed");
      return false;
    }

    setHabits((items) => items.filter((item) => item.id !== id));
    return true;
  }, []);

  return { habits, status, error, loadHabits, createHabit, completeHabit, deleteHabit };
}
