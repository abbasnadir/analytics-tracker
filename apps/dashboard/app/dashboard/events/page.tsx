import SectionPage from "@/components/SectionPage";

export default function EventsPage() {
  return (
    <SectionPage
      title="Events"
      description="Track event volume, categories, and user interactions across the dashboard."
      primaryMetricLabel="Tracked Events"
      primaryMetricValue={18240}
      secondaryMetricLabel="Unique Actions"
      secondaryMetricValue={128}
      tertiaryMetricLabel="Event Errors"
      tertiaryMetricValue={14}
      chartTitle="Event stream"
      chartSubtitle="Recent activity and event health"
      bullets={[
        "Event name breakdown by volume",
        "Error-rate trend by release",
        "Realtime feed of high-value actions",
      ]}
    />
  );
}
