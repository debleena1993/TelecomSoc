import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { apiRequest } from "@/lib/queryClient";

interface SystemConfig {
  sms_sensitivity: { configValue: number };
  call_sensitivity: { configValue: number };
  fraud_sensitivity: { configValue: number };
  auto_block_critical: { configValue: boolean };
  auto_block_fraud: { configValue: boolean };
  sim_swap_manual: { configValue: boolean };
}

interface ThreatControlsProps {
  onFiltersChange?: (filters: any) => void;
}

export default function ThreatControls({ onFiltersChange }: ThreatControlsProps) {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    severity: "all",
    type: "all",
    timeRange: "hour"
  });

  const { data: systemConfig, isLoading } = useQuery<SystemConfig>({
    queryKey: ["/api/system-config"],
  });

  const updateConfigMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      const response = await apiRequest("PATCH", `/api/system-config/${key}`, { value });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/system-config"] });
    },
  });

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange?.(newFilters);
  };

  const handleSensitivityChange = (key: string, value: number[]) => {
    updateConfigMutation.mutate({ key, value: value[0] });
  };

  const getSensitivityLevel = (value: number) => {
    if (value > 70) return "High";
    if (value > 40) return "Medium";
    return "Low";
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="pwc-card p-6 animate-pulse">
            <div className="h-4 bg-slate-600 rounded mb-4"></div>
            <div className="space-y-4">
              <div className="h-3 bg-slate-600 rounded"></div>
              <div className="h-3 bg-slate-600 rounded"></div>
              <div className="h-3 bg-slate-600 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Threat Filters */}
      <div className="pwc-card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Threat Filters</h3>
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2">Severity Level</Label>
            <Select value={filters.severity} onValueChange={(value) => handleFilterChange("severity", value)}>
              <SelectTrigger className="w-full bg-slate-700 border-slate-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2">Threat Type</Label>
            <Select value={filters.type} onValueChange={(value) => handleFilterChange("type", value)}>
              <SelectTrigger className="w-full bg-slate-700 border-slate-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="sms_phishing">SMS Phishing</SelectItem>
                <SelectItem value="call_fraud">Call Fraud</SelectItem>
                <SelectItem value="sim_swap">SIM Swap</SelectItem>
                <SelectItem value="anomalous_traffic">Anomalous Traffic</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label className="text-sm font-medium text-gray-300 mb-2">Time Range</Label>
            <Select value={filters.timeRange} onValueChange={(value) => handleFilterChange("timeRange", value)}>
              <SelectTrigger className="w-full bg-slate-700 border-slate-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hour">Last Hour</SelectItem>
                <SelectItem value="6hours">Last 6 Hours</SelectItem>
                <SelectItem value="24hours">Last 24 Hours</SelectItem>
                <SelectItem value="week">Last Week</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Detection Sensitivity */}
      <div className="pwc-card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Detection Sensitivity</h3>
        <div className="space-y-6">
          <div>
            <div className="flex justify-between items-center mb-2">
              <Label className="text-sm font-medium text-gray-300">SMS Analysis</Label>
              <span className="text-sm" style={{ color: "var(--pwc-orange)" }}>
                {getSensitivityLevel(systemConfig?.sms_sensitivity?.configValue || 80)}
              </span>
            </div>
            <Slider
              value={[systemConfig?.sms_sensitivity?.configValue || 80]}
              onValueChange={(value) => handleSensitivityChange("sms_sensitivity", value)}
              max={100}
              step={1}
              className="w-full"
            />
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-2">
              <Label className="text-sm font-medium text-gray-300">Call Pattern</Label>
              <span className="text-sm" style={{ color: "var(--pwc-orange)" }}>
                {getSensitivityLevel(systemConfig?.call_sensitivity?.configValue || 60)}
              </span>
            </div>
            <Slider
              value={[systemConfig?.call_sensitivity?.configValue || 60]}
              onValueChange={(value) => handleSensitivityChange("call_sensitivity", value)}
              max={100}
              step={1}
              className="w-full"
            />
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-2">
              <Label className="text-sm font-medium text-gray-300">Fraud Detection</Label>
              <span className="text-sm" style={{ color: "var(--pwc-orange)" }}>
                {getSensitivityLevel(systemConfig?.fraud_sensitivity?.configValue || 85)}
              </span>
            </div>
            <Slider
              value={[systemConfig?.fraud_sensitivity?.configValue || 85]}
              onValueChange={(value) => handleSensitivityChange("fraud_sensitivity", value)}
              max={100}
              step={1}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* AI Analysis Status */}
      <div className="pwc-card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">AI Analysis Status</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="status-indicator status-online" />
              <span className="text-sm font-medium text-white">Gemini AI</span>
            </div>
            <span className="text-xs text-green-400">Active</span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="status-indicator bg-blue-400" />
              <span className="text-sm font-medium text-white">NLP Engine</span>
            </div>
            <span className="text-xs text-blue-400">Processing</span>
          </div>
          
          <div className="text-sm text-gray-400 mt-4 space-y-1">
            <p><strong>Last Analysis:</strong> 2 minutes ago</p>
            <p><strong>Processed:</strong> 15,847 messages</p>
            <p><strong>Threats Found:</strong> {systemConfig ? "247" : "Loading..."}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
