import { ArrowUp, ArrowDown, Check, TrendingUp, Ban, AlertTriangle, Gauge } from "lucide-react";
import { cn } from "@/lib/utils";
import ThreatGauge from "@/components/ui/threat-gauge";

interface ThreatStats {
  activeThreats: number;
  riskScore: number;
  blockedIPs: number;
  detectionRate: number;
}

interface ThreatOverviewProps {
  stats: ThreatStats;
  isLoading?: boolean;
}

export default function ThreatOverview({ stats, isLoading }: ThreatOverviewProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="pwc-card p-6 animate-pulse">
            <div className="h-4 bg-slate-600 rounded mb-2"></div>
            <div className="h-8 bg-slate-600 rounded mb-4"></div>
            <div className="h-3 bg-slate-600 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: "Active Threats",
      value: stats.activeThreats.toLocaleString(),
      icon: AlertTriangle,
      iconColor: "text-red-500",
      bgColor: "bg-red-500/20",
      trend: { value: "+12%", direction: "up", color: "text-red-400" },
      subtitle: "from last hour"
    },
    {
      title: "Risk Score",
      value: stats.riskScore.toString(),
      icon: Gauge,
      iconColor: "text-yellow-500",
      bgColor: "bg-yellow-500/20",
      trend: null,
      subtitle: (
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className="bg-yellow-500 h-2 rounded-full transition-all duration-500" 
            style={{ width: `${(stats.riskScore / 10) * 100}%` }}
          ></div>
        </div>
      )
    },
    {
      title: "Blocked IPs",
      value: stats.blockedIPs.toLocaleString(),
      icon: Ban,
      iconColor: "text-blue-400",
      bgColor: "bg-blue-400/20",
      trend: { value: "-5%", direction: "down", color: "text-green-400" },
      subtitle: "from yesterday"
    },
    {
      title: "Detection Rate",
      value: `${stats.detectionRate}%`,
      icon: Check,
      iconColor: "text-green-500",
      bgColor: "bg-green-500/20",
      trend: { value: "Within SLA targets", direction: "check", color: "text-green-400" },
      subtitle: ""
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {statCards.map((stat, index) => (
        <div key={index} className="pwc-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">{stat.title}</p>
              <p className={cn("text-3xl font-bold", stat.iconColor)}>{stat.value}</p>
            </div>
            <div className={cn("w-12 h-12 rounded-full flex items-center justify-center", stat.bgColor)}>
              <stat.icon className={stat.iconColor} size={24} />
            </div>
          </div>
          <div className="mt-4">
            {stat.trend ? (
              <div className={cn("text-sm flex items-center", stat.trend.color)}>
                {stat.trend.direction === "up" && <ArrowUp className="mr-1" size={16} />}
                {stat.trend.direction === "down" && <ArrowDown className="mr-1" size={16} />}
                {stat.trend.direction === "check" && <Check className="mr-1" size={16} />}
                {stat.trend.value} {stat.subtitle}
              </div>
            ) : (
              <div className="text-sm">
                {stat.subtitle}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
