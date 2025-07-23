import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRealTimeStats } from "@/hooks/use-real-time";
import ThreatOverview from "@/components/dashboard/threat-overview";
import ThreatControls from "@/components/dashboard/threat-controls";
import ThreatTimeline from "@/components/dashboard/threat-timeline";
import LiveThreatFeed from "@/components/dashboard/live-threat-feed";
import AutoResponsePanel from "@/components/dashboard/auto-response-panel";

export default function Dashboard() {
  const [filters, setFilters] = useState({
    severity: "all",
    type: "all",
    timeRange: "hour"
  });

  const { data: stats, isLoading: statsLoading } = useRealTimeStats();

  const handleExportCSV = async () => {
    try {
      const response = await fetch("/api/export/threats");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `threats-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export CSV:", error);
    }
  };

  return (
    <>
      {/* Header */}
      <header className="pwc-card border-b p-6 m-0 rounded-none">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Real-Time Threat Dashboard</h2>
            <p className="text-gray-400">Monitoring telecom network security in real-time</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="status-indicator status-online" />
              <span className="text-sm text-gray-300">Live Feed Active</span>
            </div>
            <Button onClick={handleExportCSV} className="pwc-button-primary">
              <Download className="mr-2" size={16} />
              Export CSV
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Threat Overview */}
        <ThreatOverview stats={stats as any} isLoading={statsLoading} />

        {/* Threat Controls */}
        <ThreatControls onFiltersChange={setFilters} />

        {/* Threat Timeline */}
        <ThreatTimeline />

        {/* Live Threat Feed */}
        <LiveThreatFeed filters={filters} />

        {/* Auto Response Panel */}
        <AutoResponsePanel />
      </div>
    </>
  );
}
