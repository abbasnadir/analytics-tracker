import SectionPage from "@/components/SectionPage";

export default function PagesPage() {
  return (
    <SectionPage
      title="Pages"
      description="Review top content, landing pages, and page-level engagement performance."
      primaryMetricLabel="Indexed Pages"
      primaryMetricValue={342}
      secondaryMetricLabel="Avg. Time"
      secondaryMetricValue={384}
      tertiaryMetricLabel="Exit Rate"
      tertiaryMetricValue={27}
      chartTitle="Page performance"
      chartSubtitle="Traffic and engagement signals"
      bullets={[
        "Top pages by views and exits",
        "Landing page conversion ranking",
        "Content freshness and trend changes",
      ]}
    />
  );
}
