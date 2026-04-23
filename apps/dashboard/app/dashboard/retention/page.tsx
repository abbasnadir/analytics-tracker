import SectionPage from "@/components/SectionPage";

export default function RetentionPage() {
  return (
    <SectionPage
      title="Retention"
      description="Understand returning users, cohort stickiness, and repeat engagement over time."
      primaryMetricLabel="Returning Users"
      primaryMetricValue={4910}
      secondaryMetricLabel="7-Day Retention"
      secondaryMetricValue={42}
      tertiaryMetricLabel="Churn Risk"
      tertiaryMetricValue={9}
      chartTitle="Cohort retention"
      chartSubtitle="Repeat behavior across time windows"
      bullets={[
        "Weekly cohort performance",
        "User return frequency distribution",
        "Retention changes after product launches",
      ]}
    />
  );
}
