import { Mail, ShieldCheck } from "lucide-react";
import { SectionHeader } from "@/components/SectionHeader";

const policyItems = [
  {
    title: "What Life OS Is",
    body: "Life OS is a personal dashboard app designed to help you organize health, sleep, habits, school goals, finances, and daily reflection in one place."
  },
  {
    title: "Data The App May Collect",
    body: "Life OS may collect WHOOP health and recovery data, habit data, school goal data, and manually entered finance data when you choose to add or connect that information."
  },
  {
    title: "How Data Is Used",
    body: "Your data is used only for personal dashboards, reports, and insights inside Life OS."
  },
  {
    title: "No Sale Or Sharing",
    body: "Your data is not sold, rented, or shared with third parties."
  },
  {
    title: "Controls And Deletion",
    body: "You can disconnect connected services or request deletion of your data."
  }
];

export default function PrivacyPage() {
  return (
    <>
      <SectionHeader eyebrow="Privacy" title="Privacy Policy" />
      <section className="max-w-3xl rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
        <div className="mb-5 flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-md bg-mint text-moss">
            <ShieldCheck className="size-5" />
          </span>
          <div>
            <h2 className="text-lg font-bold text-ink">Life OS privacy basics</h2>
            <p className="text-sm text-ink/60">Version 1 public privacy policy</p>
          </div>
        </div>

        <div className="space-y-5">
          {policyItems.map((item) => (
            <div key={item.title} className="border-t border-ink/10 pt-5 first:border-t-0 first:pt-0">
              <h3 className="text-sm font-bold uppercase tracking-wide text-moss">{item.title}</h3>
              <p className="mt-2 leading-7 text-ink/75">{item.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center gap-3 rounded-md bg-sky p-4 text-sm font-semibold text-ink/75">
          <Mail className="size-4 shrink-0 text-moss" />
          <a className="focus-ring rounded-sm underline decoration-ink/25 underline-offset-4 hover:text-ink" href="mailto:aidan2arthur@gmail.com">
            aidan2arthur@gmail.com
          </a>
        </div>
      </section>
    </>
  );
}
