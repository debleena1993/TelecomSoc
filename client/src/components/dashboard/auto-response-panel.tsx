import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";

interface Action {
  id: number;
  timestamp: string;
  threatId?: number;
  actionType: string;
  automated: boolean;
  analyst?: string;
  details: string;
}

interface SystemConfig {
  auto_block_critical: { configValue: boolean };
  auto_block_fraud: { configValue: boolean };
  sim_swap_manual: { configValue: boolean };
}

export default function AutoResponsePanel() {
  const queryClient = useQueryClient();

  const { data: systemConfig, isLoading: configLoading } = useQuery<SystemConfig>({
    queryKey: ["/api/system-config"],
  });

  const { data: recentActions, isLoading: actionsLoading } = useQuery<Action[]>({
    queryKey: ["/api/actions"],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const updateConfigMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: boolean }) => {
      const response = await apiRequest("PATCH", `/api/system-config/${key}`, { value });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/system-config"] });
    },
  });

  const handleToggleChange = (key: string, value: boolean) => {
    updateConfigMutation.mutate({ key, value });
  };

  const getActionTypeLabel = (actionType: string) => {
    switch (actionType) {
      case "block_ip":
        return "Blocked IP";
      case "block_phone":
        return "Blocked Phone";
      case "manual_override":
        return "Manual Override";
      case "create_case":
        return "Created Case";
      default:
        return actionType;
    }
  };

  const getActionColor = (actionType: string, automated: boolean) => {
    if (automated) {
      switch (actionType) {
        case "block_ip":
        case "block_phone":
          return "text-red-500";
        case "create_case":
          return "text-blue-400";
        default:
          return "text-gray-400";
      }
    } else {
      return "text-yellow-500";
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const actionTime = new Date(timestamp);
    const diffMs = now.getTime() - actionTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minutes ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hours ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} days ago`;
  };

  if (configLoading || actionsLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="pwc-card p-6 animate-pulse">
            <div className="h-6 bg-slate-600 rounded mb-4"></div>
            <div className="space-y-4">
              <div className="h-4 bg-slate-600 rounded"></div>
              <div className="h-4 bg-slate-600 rounded"></div>
              <div className="h-4 bg-slate-600 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const autoResponseRules = [
    {
      id: "critical_sms",
      title: "Critical SMS Phishing",
      description: "Auto-block sender + notify SOC",
      configKey: "auto_block_critical",
      enabled: systemConfig?.auto_block_critical?.configValue || false,
    },
    {
      id: "fraud_pattern",
      title: "Fraud Pattern Detection",
      description: "Block IP + create case",
      configKey: "auto_block_fraud",
      enabled: systemConfig?.auto_block_fraud?.configValue || false,
    },
    {
      id: "sim_swap",
      title: "SIM Swap Attempt",
      description: "Require manual verification",
      configKey: "sim_swap_manual",
      enabled: !(systemConfig?.sim_swap_manual?.configValue || false),
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Automated Response Rules */}
      <div className="pwc-card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Automated Response Rules</h3>
        <div className="space-y-4">
          {autoResponseRules.map((rule) => (
            <div key={rule.id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
              <div>
                <p className="font-medium text-white">{rule.title}</p>
                <p className="text-sm text-gray-400">{rule.description}</p>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={rule.enabled}
                  onCheckedChange={(checked) => {
                    const value = rule.configKey === "sim_swap_manual" ? !checked : checked;
                    handleToggleChange(rule.configKey, value);
                  }}
                  className="data-[state=checked]:bg-orange-500"
                />
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 pt-4 border-t border-slate-700">
          <Button className="w-full pwc-button-primary">
            Configure New Rule
          </Button>
        </div>
      </div>

      {/* Recent Actions */}
      <div className="pwc-card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Actions</h3>
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {recentActions?.slice(0, 10).map((action) => (
            <div key={action.id} className="flex items-start space-x-3 p-3 bg-slate-700/20 rounded-lg">
              <div 
                className={cn(
                  "w-2 h-2 rounded-full mt-2",
                  getActionColor(action.actionType, action.automated)
                )}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">
                  {getActionTypeLabel(action.actionType)}
                </p>
                <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                  {action.details}
                </p>
                <div className="flex items-center space-x-2 mt-2">
                  <p className="text-xs text-gray-500">
                    {formatTimeAgo(action.timestamp)}
                  </p>
                  {action.automated ? (
                    <Badge className="text-xs bg-blue-500/20 text-blue-400">
                      Auto
                    </Badge>
                  ) : (
                    <Badge className="text-xs bg-yellow-500/20 text-yellow-400">
                      Manual
                    </Badge>
                  )}
                  {action.analyst && (
                    <Badge className="text-xs bg-gray-500/20 text-gray-400">
                      {action.analyst}
                    </Badge>
                  )}
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="text-blue-400 hover:text-blue-300 text-xs"
              >
                Details
              </Button>
            </div>
          )) || (
            <div className="text-center py-8 text-gray-400">
              <p>No recent actions</p>
            </div>
          )}
        </div>
        
        <div className="mt-4 pt-4 border-t border-slate-700">
          <Button className="w-full pwc-button-secondary">
            View All Actions
          </Button>
        </div>
      </div>
    </div>
  );
}
