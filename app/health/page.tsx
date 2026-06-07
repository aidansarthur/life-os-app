import { Activity, HeartPulse, Moon, Timer, Waves } from "lucide-react";
import { MiniBarChart } from "@/components/MiniBarChart";
import { SectionHeader } from "@/components/SectionHeader";
import { StatCard } from "@/components/StatCard";
import { latestMetric } from "@/lib/calculations";
import { whoopMetrics } from "@/lib/mock-data";

export default function HealthPage() {
  const metric = latestMetric(whoopMetrics);

  return (
    <>
      <SectionHeader eyebrow="Health / WHOOP" title="Recovery and sleep trends" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Sleep duration" value={`${metric.sleepHours}h`} detail="Mock WHOOP sleep" icon={Moon} />
        <StatCard label="Recovery" value={`${metric.recoveryScore}%`} detail="Placeholder score" icon={HeartPulse} tone="sky" />
        <StatCard label="HRV" value={`${metric.hrv} ms`} detail="Mock daily average" icon={Waves} tone="gold" />
        <StatCard label="Resting HR" value={`${metric.restingHeartRate}`} detail="Beats per minute" icon={Timer} tone="clay" />
        <StatCard label="Strain" value={`${metric.strain}`} detail="Daily training load" icon={Activity} />
      </div>
      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <MiniBarChart data={whoopMetrics} valueKey="sleepHours" label="Sleep duration by day" max={10} />
        <MiniBarChart data={whoopMetrics} valueKey="strain" label="Strain by day" max={21} />
        <MiniBarChart data={whoopMetrics} valueKey="hrv" label="HRV trend" />
        <MiniBarChart data={whoopMetrics} valueKey="restingHeartRate" label="Resting heart rate" max={90} />
      </div>
    </>
  );
}
