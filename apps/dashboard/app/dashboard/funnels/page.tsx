import SectionPage from "@/components/SectionPage";

export default function FunnelsPage() {
  return (
    <SectionPage
      title="Funnels"
      description="Monitor step conversion, drop-offs, and bottlenecks across critical user journeys."
      primaryMetricLabel="Active Funnels"
      primaryMetricValue={12}
      secondaryMetricLabel="Best Conversion"
      secondaryMetricValue={68}
      tertiaryMetricLabel="Largest Drop-off"
      tertiaryMetricValue={21}
      chartTitle="Journey conversion"
      chartSubtitle="Step completion and abandonment"
      bullets={[
        "Conversion by funnel step",
        "Segment comparison by traffic source",
        "Drop-off alerts for sudden regressions",
      ]}
    />
  );
}
