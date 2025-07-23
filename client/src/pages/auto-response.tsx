import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Shield, Settings, Play, Pause, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

interface SystemConfig {
  auto_block_critical: { configValue: boolean };
  auto_block_fraud: { configValue: boolean };
  sim_swap_manual: { configValue: boolean };
}

interface Action {
  id: number;
  timestamp: string;
  threatId?: number;
  actionType: string;
  automated: boolean;
  analyst?: string;
  details: string;
}

export default function AutoResponse() {
  const queryClient = useQueryClient();
  const [newRuleData, setNewRuleData] = useState({
    triggerType: "",
    action: "",
    condition: "",
    enabled: true
  });

  const { data: systemConfig, isLoading: configLoading } = useQuery<SystemConfig>({
    queryKey: ["/api/system-config"],
  });

  const { data: recentActions, isLoading: actionsLoading } = useQuery<Action[]>({
    queryKey: ["/api/actions"],
    refetchInterval: 5000,
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

  const createActionMutation = useMutation({
    mutationFn: async (actionData: any) => {
      const response = await apiRequest("POST", "/api/actions", actionData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/actions"] });
    },
  });

  const responseRules = [
    {
      id: "critical_threats",
      title: "Critical Threat Auto-Block",
      description: "Automatically block IPs/numbers for critical severity threats",
      configKey: "auto_block_critical",
      enabled: systemConfig?.auto_block_critical?.configValue || false,
      triggerCondition: "Threat severity = Critical AND AI score ≥ 8.5",
      action: "Block source + Create incident",
      lastTriggered: "2 minutes ago",
      triggerCount: 247
    },
    {
      id: "fraud_detection",
      title: "Fraud Pattern Response",
      description: "Auto-response for detected fraud patterns and call anomalies",
      configKey: "auto_block_fraud", 
      enabled: systemConfig?.auto_block_fraud?.configValue || false,
      triggerCondition: "Fraud indicators detected OR call pattern anomaly",
      action: "Block + Alert SOC team",
      lastTriggered: "8 minutes ago",
      triggerCount: 83
    },
    {
      id: "sim_swap_protection",
      title: "SIM Swap Protection",
      description: "Require manual verification for suspected SIM swap attempts",
      configKey: "sim_swap_manual",
      enabled: !(systemConfig?.sim_swap_manual?.configValue || false),
      triggerCondition: "SIM swap indicators detected",
      action: "Require manual verification",
      lastTriggered: "1 hour ago", 
      triggerCount: 12
    }
  ];

  const handleToggleRule = (configKey: string, enabled: boolean) => {
    const value = configKey === "sim_swap_manual" ? !enabled : enabled;
    updateConfigMutation.mutate({ key: configKey, value });
  };

  const handleTestRule = (ruleId: string) => {
    createActionMutation.mutate({
      actionType: "test_rule",
      automated: false,
      analyst: "system_test",
      details: `Test execution of rule: ${ruleId}`
    });
  };

  const getActionTypeIcon = (actionType: string) => {
    switch (actionType) {
      case "block_ip":
      case "block_phone":
        return Shield;
      case "create_case":
        return AlertTriangle;
      case "manual_override":
        return Settings;
      default:
        return CheckCircle;
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const actionTime = new Date(timestamp);
    const diffMs = now.getTime() - actionTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  return (
    <>
      {/* Header */}
      <header className="pwc-card border-b p-6 m-0 rounded-none">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Automated Threat Response</h2>
            <p className="text-gray-400">Configure and monitor automated security responses</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="status-indicator status-online" />
              <span className="text-sm text-gray-300">Auto-Response Active</span>
            </div>
            <Button className="pwc-button-primary">
              <Settings className="mr-2" size={16} />
              Global Settings
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Response Rules */}
        <Card className="pwc-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white">Response Rules</CardTitle>
            <p className="text-sm text-gray-400">Configure automated responses to detected threats</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {responseRules.map((rule) => (
                <div key={rule.id} className="border border-slate-700 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-white">{rule.title}</h3>
                        <Badge className={rule.enabled ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"}>
                          {rule.enabled ? "Active" : "Disabled"}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-400 mb-3">{rule.description}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-400 mb-1">Trigger Condition:</p>
                          <p className="text-white font-mono text-xs bg-slate-700/30 p-2 rounded">
                            {rule.triggerCondition}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400 mb-1">Automated Action:</p>
                          <p className="text-white font-mono text-xs bg-slate-700/30 p-2 rounded">
                            {rule.action}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-6 mt-3 text-xs text-gray-400">
                        <div className="flex items-center space-x-1">
                          <Clock size={12} />
                          <span>Last triggered: {rule.lastTriggered}</span>
                        </div>
                        <div>
                          <span>Total triggers: {rule.triggerCount}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleTestRule(rule.id)}
                        className="pwc-button-secondary"
                      >
                        <Play size={14} className="mr-1" />
                        Test
                      </Button>
                      <Switch
                        checked={rule.enabled}
                        onCheckedChange={(checked) => handleToggleRule(rule.configKey, checked)}
                        className="data-[state=checked]:bg-orange-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Create New Rule */}
        <Card className="pwc-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white">Create New Response Rule</CardTitle>
            <p className="text-sm text-gray-400">Define custom automated responses for specific threat patterns</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-300">Trigger Type</Label>
                  <Select value={newRuleData.triggerType} onValueChange={(value) => setNewRuleData({...newRuleData, triggerType: value})}>
                    <SelectTrigger className="w-full bg-slate-700 border-slate-600 text-white">
                      <SelectValue placeholder="Select trigger type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="threat_score">Threat Score Threshold</SelectItem>
                      <SelectItem value="threat_type">Specific Threat Type</SelectItem>
                      <SelectItem value="source_pattern">Source Pattern Match</SelectItem>
                      <SelectItem value="frequency">Frequency Based</SelectItem>
                      <SelectItem value="combined">Combined Conditions</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-300">Automated Action</Label>
                  <Select value={newRuleData.action} onValueChange={(value) => setNewRuleData({...newRuleData, action: value})}>
                    <SelectTrigger className="w-full bg-slate-700 border-slate-600 text-white">
                      <SelectValue placeholder="Select action" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="block_ip">Block IP Address</SelectItem>
                      <SelectItem value="block_phone">Block Phone Number</SelectItem>
                      <SelectItem value="create_case">Create Investigation Case</SelectItem>
                      <SelectItem value="alert_soc">Alert SOC Team</SelectItem>
                      <SelectItem value="quarantine">Quarantine Traffic</SelectItem>
                      <SelectItem value="require_verification">Require Manual Verification</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={newRuleData.enabled}
                    onCheckedChange={(checked) => setNewRuleData({...newRuleData, enabled: checked})}
                    className="data-[state=checked]:bg-orange-500"
                  />
                  <Label className="text-sm text-gray-300">Enable rule immediately</Label>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-300">Condition Logic</Label>
                <Textarea
                  placeholder="Define the conditions for this rule to trigger..."
                  className="mt-2 min-h-[120px] bg-slate-700 border-slate-600 text-white"
                  value={newRuleData.condition}
                  onChange={(e) => setNewRuleData({...newRuleData, condition: e.target.value})}
                />
                <p className="text-xs text-gray-500 mt-2">
                  Use logical expressions like: threat.score &gt; 8 AND threat.type = "sms_phishing"
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <Button variant="outline" className="pwc-button-secondary">
                Validate Rule
              </Button>
              <Button className="pwc-button-primary">
                Create Rule
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Action History */}
        <Card className="pwc-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-white">Recent Automated Actions</CardTitle>
                <p className="text-sm text-gray-400">History of automated responses and manual overrides</p>
              </div>
              <Button size="sm" className="pwc-button-secondary">
                Export Log
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {actionsLoading ? (
              <div className="space-y-3">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4 p-3 bg-slate-700/20 rounded-lg animate-pulse">
                    <div className="w-8 h-8 bg-slate-600 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-slate-600 rounded w-3/4"></div>
                      <div className="h-3 bg-slate-600 rounded w-1/2"></div>
                    </div>
                    <div className="w-20 h-4 bg-slate-600 rounded"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {recentActions?.map((action) => {
                  const ActionIcon = getActionTypeIcon(action.actionType);
                  
                  return (
                    <div key={action.id} className="flex items-start space-x-4 p-3 bg-slate-700/20 rounded-lg hover:bg-slate-700/30 transition-colors">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center",
                        action.automated ? "bg-blue-500/20" : "bg-yellow-500/20"
                      )}>
                        <ActionIcon 
                          size={16} 
                          className={action.automated ? "text-blue-400" : "text-yellow-400"} 
                        />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="text-sm font-medium text-white">
                            {action.actionType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </h4>
                          <Badge className={cn(
                            "text-xs",
                            action.automated 
                              ? "bg-blue-500/20 text-blue-400" 
                              : "bg-yellow-500/20 text-yellow-400"
                          )}>
                            {action.automated ? "Automated" : "Manual"}
                          </Badge>
                          {action.analyst && (
                            <Badge className="text-xs bg-gray-500/20 text-gray-400">
                              {action.analyst}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 line-clamp-2">{action.details}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatTimeAgo(action.timestamp)}
                        </p>
                      </div>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-blue-400 hover:text-blue-300 text-xs"
                      >
                        Details
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
