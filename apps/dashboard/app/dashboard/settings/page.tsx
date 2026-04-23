import SectionPage from "@/components/SectionPage";

export default function SettingsGeneralPage() {
  return (
    <SectionPage
      title="General"
      description="Manage tracking configuration, integrations, and dashboard behavior in one place."
      primaryMetricLabel="Connected Sources"
      primaryMetricValue={6}
      secondaryMetricLabel="Active Alerts"
      secondaryMetricValue={18}
      tertiaryMetricLabel="Pending Actions"
      tertiaryMetricValue={3}
      chartTitle="Workspace controls"
      chartSubtitle="Configuration health and automation"
      bullets={[
        "Integration status and sync health",
        "Alert rules and notification routing",
        "Access control and workspace preferences",
      ]}
    />
  );
}
