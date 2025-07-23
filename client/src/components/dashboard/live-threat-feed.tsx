import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Eye, Ban, Check, Unlock, MessageSquare, Phone, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import ThreatGauge from "@/components/ui/threat-gauge";

interface Threat {
  id: number;
  timestamp: string;
  threatType: string;
  source: string;
  severity: "critical" | "high" | "medium" | "low";
  aiScore: number;
  status: string;
  description?: string;
}

interface LiveThreatFeedProps {
  filters?: {
    severity?: string;
    type?: string;
    timeRange?: string;
  };
}

export default function LiveThreatFeed({ filters }: LiveThreatFeedProps) {
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  const buildQueryParams = () => {
    const params = new URLSearchParams();
    if (filters?.severity && filters.severity !== "all") {
      params.append("severity", filters.severity);
    }
    if (filters?.type && filters.type !== "all") {
      params.append("type", filters.type);
    }
    if (filters?.timeRange) {
      params.append("timeRange", filters.timeRange);
    }
    return params.toString() ? `?${params.toString()}` : "";
  };

  const { data: threats, isLoading } = useQuery<Threat[]>({
    queryKey: ["/api/threats", filters],
    refetchInterval: autoRefresh ? 5000 : false,
    refetchIntervalInBackground: true,
  });

  const getThreatIcon = (type: string) => {
    switch (type) {
      case "sms_phishing":
        return MessageSquare;
      case "call_fraud":
        return Phone;
      case "sim_swap":
        return CreditCard;
      default:
        return Ban;
    }
  };

  const getThreatTypeLabel = (type: string) => {
    switch (type) {
      case "sms_phishing":
        return "SMS Phishing";
      case "call_fraud":
        return "Call Fraud";
      case "sim_swap":
        return "SIM Swap";
      case "anomalous_traffic":
        return "Anomalous Traffic";
      default:
        return type;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-500/20 text-red-400";
      case "high":
        return "bg-yellow-500/20 text-yellow-400";
      case "medium":
        return "bg-blue-400/20 text-blue-400";
      case "low":
        return "bg-green-500/20 text-green-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "analyzing":
        return "bg-yellow-500/20 text-yellow-400";
      case "blocked":
        return "bg-red-500/20 text-red-400";
      case "resolved":
        return "bg-green-500/20 text-green-400";
      case "false_positive":
        return "bg-gray-500/20 text-gray-400";
      default:
        return "bg-blue-500/20 text-blue-400";
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="pwc-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Live Threat Feed</h3>
          <div className="flex items-center space-x-2 animate-pulse">
            <div className="w-20 h-8 bg-slate-600 rounded"></div>
            <div className="w-20 h-8 bg-slate-600 rounded"></div>
          </div>
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4 p-4 bg-slate-700/30 rounded-lg animate-pulse">
              <div className="w-16 h-4 bg-slate-600 rounded"></div>
              <div className="w-24 h-4 bg-slate-600 rounded"></div>
              <div className="w-32 h-4 bg-slate-600 rounded"></div>
              <div className="w-20 h-4 bg-slate-600 rounded"></div>
              <div className="w-16 h-4 bg-slate-600 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="pwc-card p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Live Threat Feed</h3>
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant={autoRefresh ? "default" : "outline"}
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? "pwc-button-primary" : "pwc-button-secondary"}
          >
            {autoRefresh ? "Auto-Refresh" : "Paused"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="pwc-button-secondary"
          >
            Pause Feed
          </Button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left py-3 px-4 font-semibold text-gray-300">Time</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-300">Threat Type</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-300">Source</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-300">Severity</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-300">AI Score</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-300">Status</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody className="text-gray-300">
            {threats?.map((threat) => {
              const ThreatIcon = getThreatIcon(threat.threatType);
              
              return (
                <tr key={threat.id} className="border-b border-slate-700 hover:bg-slate-700/30 transition-colors">
                  <td className="py-3 px-4 text-sm font-mono">
                    {formatTime(threat.timestamp)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <ThreatIcon 
                        size={16} 
                        className={cn(
                          threat.severity === "critical" && "text-red-500",
                          threat.severity === "high" && "text-yellow-500",
                          threat.severity === "medium" && "text-blue-400",
                          threat.severity === "low" && "text-green-500"
                        )}
                      />
                      <span>{getThreatTypeLabel(threat.threatType)}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-xs">
                    {threat.source}
                  </td>
                  <td className="py-3 px-4">
                    <Badge className={cn("text-xs", getSeverityColor(threat.severity))}>
                      {threat.severity}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <ThreatGauge value={threat.aiScore} size="sm" showValue={false} />
                      <span className={cn(
                        "font-semibold text-sm",
                        threat.aiScore >= 8.5 && "text-red-400",
                        threat.aiScore >= 7 && threat.aiScore < 8.5 && "text-yellow-400",
                        threat.aiScore >= 5 && threat.aiScore < 7 && "text-blue-400",
                        threat.aiScore < 5 && "text-green-400"
                      )}>
                        {threat.aiScore.toFixed(1)}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <Badge className={cn("text-xs", getStatusColor(threat.status))}>
                      {threat.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className={cn(
                          "h-8 w-8 p-0",
                          threat.status === "blocked" 
                            ? "text-gray-500 cursor-not-allowed" 
                            : "text-red-400 hover:text-red-300"
                        )}
                        disabled={threat.status === "blocked"}
                        title={threat.status === "blocked" ? "Already blocked" : "Block immediately"}
                      >
                        <Ban size={16} />
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-blue-400 hover:text-blue-300"
                        title="View details"
                      >
                        <Eye size={16} />
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        className={cn(
                          "h-8 w-8 p-0",
                          threat.status === "resolved" 
                            ? "text-gray-500 cursor-not-allowed" 
                            : threat.status === "blocked"
                            ? "text-green-400 hover:text-green-300"
                            : "text-green-400 hover:text-green-300"
                        )}
                        title={
                          threat.status === "resolved" 
                            ? "Case closed" 
                            : threat.status === "blocked"
                            ? "Unblock"
                            : "Mark as false positive"
                        }
                        disabled={threat.status === "resolved"}
                      >
                        {threat.status === "blocked" ? <Unlock size={16} /> : <Check size={16} />}
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm text-gray-400">
          Showing latest {threats?.length || 0} threats
        </p>
        <div className="flex items-center space-x-2">
          <Button size="sm" variant="outline" className="pwc-button-secondary">
            Previous
          </Button>
          <span className="text-sm text-gray-400">Page 1 of 1</span>
          <Button size="sm" variant="outline" className="pwc-button-secondary">
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
