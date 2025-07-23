import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

interface TimelineData {
  timestamp: string;
  critical: number;
  high: number;
  medium: number;
  low: number;
  total: number;
}

export default function ThreatTimeline() {
  const { data: timelineData, isLoading } = useQuery<TimelineData[]>({
    queryKey: ["/api/threats/timeline"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle className="text-orange-400 flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Threat Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <div className="text-slate-400">Loading timeline data...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxTotal = Math.max(...(timelineData || []).map(d => d.total), 1);

  return (
    <Card className="bg-slate-900 border-slate-700">
      <CardHeader>
        <CardTitle className="text-orange-400 flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Threat Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 h-64 overflow-y-auto">
          {(timelineData || []).map((item, index) => {
            const time = new Date(item.timestamp).toLocaleTimeString('en-US', { 
              hour12: false, 
              hour: '2-digit', 
              minute: '2-digit' 
            });
            
            return (
              <div key={index} className="flex items-center gap-4 p-2 border border-slate-700 rounded">
                <div className="text-slate-400 text-sm w-16">{time}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {item.critical > 0 && (
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <span className="text-red-400 text-sm">{item.critical}</span>
                      </div>
                    )}
                    {item.high > 0 && (
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <span className="text-yellow-400 text-sm">{item.high}</span>
                      </div>
                    )}
                    {item.medium > 0 && (
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        <span className="text-blue-400 text-sm">{item.medium}</span>
                      </div>
                    )}
                    {item.low > 0 && (
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-green-400 text-sm">{item.low}</span>
                      </div>
                    )}
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2 mt-1">
                    <div 
                      className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-2 rounded-full"
                      style={{ width: `${(item.total / maxTotal) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div className="text-slate-300 text-sm font-mono">
                  {item.total}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex justify-between text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span>Critical</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span>High</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span>Medium</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Low</span>
            </div>
          </div>
          <div>Last 24 hours</div>
        </div>
      </CardContent>
    </Card>
  );
}