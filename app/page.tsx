import { DashboardClient } from "@/components/DashboardClient";
import { SectionHeader } from "@/components/SectionHeader";
import { WhoopDashboardWidget } from "@/components/WhoopDashboardWidget";

export default function DashboardPage() {
  return (
    <>
      <SectionHeader eyebrow="Today" title="Your Life OS dashboard" />
      <DashboardClient />
      <div className="mt-6">
        <WhoopDashboardWidget />
      </div>
    </>
  );
}
