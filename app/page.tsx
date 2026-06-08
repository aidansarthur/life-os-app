import { DashboardClient } from "@/components/DashboardClient";
import { SectionHeader } from "@/components/SectionHeader";

export default function DashboardPage() {
  return (
    <>
      <SectionHeader eyebrow="Today" title="Your Life OS dashboard" />
      <DashboardClient />
    </>
  );
}
