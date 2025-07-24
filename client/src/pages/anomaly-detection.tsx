import { useState } from "react";
import { Search, Settings, RefreshCw, Play, Pause, RotateCcw, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import ThreatGauge from "@/components/ui/threat-gauge";
import { apiRequest } from "@/lib/queryClient";

export default function AnomalyDetection() {
  const [sensitivity, setSensitivity] = useState({
    sms: [80],
    call: [65],
    pattern: [75]
  });
  const [showSettings, setShowSettings] = useState(false);
  const [isAnalysisRunning, setIsAnalysisRunning] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: threats, isLoading, refetch: refetchThreats } = useQuery({
    queryKey: ["/api/threats"],
    refetchInterval: 10000,
  });

  const { data: systemStatus } = useQuery({
    queryKey: ["/api/system-config"],
  });

  // Save sensitivity settings
  const saveSensitivityMutation = useMutation({
    mutationFn: async (settings: any) => {
      return apiRequest("/api/system-config", {
        method: "POST",
        body: JSON.stringify({
          sms_sensitivity: settings.sms[0],
          call_sensitivity: settings.call[0],
          pattern_sensitivity: settings.pattern[0]
        })
      });
    },
    onSuccess: () => {
      toast({
        title: "Settings saved",
        description: "Detection sensitivity settings have been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/system-config"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save sensitivity settings. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Manual analysis trigger
  const runAnalysisMutation = useMutation({
    mutationFn: async () => {
      setIsAnalysisRunning(true);
      return apiRequest("/api/threats/analyze", {
        method: "POST",
        body: JSON.stringify({ triggerType: "manual" })
      });
    },
    onSuccess: () => {
      toast({
        title: "Analysis started",
        description: "AI threat analysis is now running on latest data.",
      });
      setTimeout(() => {
        refetchThreats();
        queryClient.invalidateQueries({ queryKey: ["/api/threats"] });
        setIsAnalysisRunning(false);
      }, 3000);
    },
    onError: () => {
      toast({
        title: "Analysis failed",
        description: "Could not start threat analysis. Please check system status.",
        variant: "destructive",
      });
      setIsAnalysisRunning(false);
    }
  });

  const handleSaveSettings = () => {
    saveSensitivityMutation.mutate(sensitivity);
  };

  const handleRunAnalysis = () => {
    runAnalysisMutation.mutate();
  };

  const handleResetSettings = () => {
    setSensitivity({
      sms: [80],
      call: [65],
      pattern: [75]
    });
    toast({
      title: "Settings reset",
      description: "Detection sensitivity has been reset to default values.",
    });
  };

  const handleViewAllThreats = () => {
    try {
      // Navigate to main dashboard safely
      window.location.pathname = "/";
    } catch (error) {
      console.error("Navigation error:", error);
      // Fallback - refresh to home page
      window.location.reload();
    }
  };

  const anomalyTypes = [
    {
      type: "SMS Pattern Analysis",
      description: "Analyzing message content for phishing indicators",
      processed: "2,847",
      anomalies: "23",
      lastRun: "2 minutes ago",
      status: "active"
    },
    {
      type: "Call Duration Analysis", 
      description: "Detecting unusual call patterns and durations",
      processed: "1,523",
      anomalies: "7",
      lastRun: "1 minute ago",
      status: "active"
    },
    {
      type: "Traffic Flow Analysis",
      description: "Monitoring network traffic for anomalous patterns",
      processed: "15,247",
      anomalies: "12",
      lastRun: "30 seconds ago",
      status: "active"
    },
    {
      type: "User Behavior Analysis",
      description: "Detecting unusual user activity patterns",
      processed: "847",
      anomalies: "4",
      lastRun: "5 minutes ago", 
      status: "warning"
    }
  ];

  const recentAnomalies = Array.isArray(threats) ? threats.slice(0, 8) : [];

  return (
    <>
      {/* Header */}
      <header className="pwc-card border-b p-6 m-0 rounded-none">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Anomaly & Threat Detection</h2>
            <p className="text-gray-400">AI-powered analysis of CDR and SMS data using Gemini</p>
          </div>
          <div className="flex items-center space-x-4">
            <Button 
              className="pwc-button-secondary" 
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="mr-2" size={16} />
              {showSettings ? 'Hide Settings' : 'Configure'}
            </Button>
            <Button 
              className="pwc-button-primary" 
              onClick={handleRunAnalysis}
              disabled={isAnalysisRunning || runAnalysisMutation.isPending}
            >
              {isAnalysisRunning ? (
                <RefreshCw className="mr-2 animate-spin" size={16} />
              ) : (
                <RefreshCw className="mr-2" size={16} />
              )}
              {isAnalysisRunning ? 'Analyzing...' : 'Run Analysis'}
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Detection Engine Status */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {anomalyTypes.map((engine, index) => (
            <Card key={index} className="pwc-card">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-white">{engine.type}</CardTitle>
                  <Badge className={`text-xs ${
                    engine.status === "active" 
                      ? "bg-green-500/20 text-green-400" 
                      : "bg-yellow-500/20 text-yellow-400"
                  }`}>
                    {engine.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-400 mb-3">{engine.description}</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Processed:</span>
                    <span className="text-white">{engine.processed}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Anomalies:</span>
                    <span className="text-red-400">{engine.anomalies}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Last Run:</span>
                    <span className="text-gray-300">{engine.lastRun}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Sensitivity Controls - Show/Hide based on settings toggle */}
        {showSettings && (
          <Card className="pwc-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold text-white">Detection Settings</CardTitle>
                  <p className="text-sm text-gray-400">Configure AI analysis sensitivity and save changes</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handleResetSettings}
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    <RotateCcw className="mr-2" size={14} />
                    Reset
                  </Button>
                  <Button 
                    size="sm" 
                    className="pwc-button-primary"
                    onClick={handleSaveSettings}
                    disabled={saveSensitivityMutation.isPending}
                  >
                    <Save className="mr-2" size={14} />
                    {saveSensitivityMutation.isPending ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label className="text-sm font-medium text-gray-300">SMS Phishing Detection</Label>
                  <span className="text-sm text-orange-400">
                    {sensitivity.sms[0] > 70 ? "High" : sensitivity.sms[0] > 40 ? "Medium" : "Low"} ({sensitivity.sms[0]}%)
                  </span>
                </div>
                <Slider
                  value={sensitivity.sms}
                  onValueChange={(value) => setSensitivity({...sensitivity, sms: value})}
                  max={100}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Conservative (fewer alerts)</span>
                  <span>Aggressive (more alerts)</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label className="text-sm font-medium text-gray-300">Call Pattern Analysis</Label>
                  <span className="text-sm text-orange-400">
                    {sensitivity.call[0] > 70 ? "High" : sensitivity.call[0] > 40 ? "Medium" : "Low"} ({sensitivity.call[0]}%)
                  </span>
                </div>
                <Slider
                  value={sensitivity.call}
                  onValueChange={(value) => setSensitivity({...sensitivity, call: value})}
                  max={100}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Conservative (fewer alerts)</span>
                  <span>Aggressive (more alerts)</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label className="text-sm font-medium text-gray-300">Behavioral Analysis</Label>
                  <span className="text-sm text-orange-400">
                    {sensitivity.pattern[0] > 70 ? "High" : sensitivity.pattern[0] > 40 ? "Medium" : "Low"} ({sensitivity.pattern[0]}%)
                  </span>
                </div>
                <Slider
                  value={sensitivity.pattern}
                  onValueChange={(value) => setSensitivity({...sensitivity, pattern: value})}
                  max={100}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Conservative (fewer alerts)</span>
                  <span>Aggressive (more alerts)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* System Status */}
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">

          <Card className="pwc-card">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-white">Gemini AI Status</CardTitle>
              <p className="text-sm text-gray-400">AI analysis engine performance</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="status-indicator status-online" />
                    <div>
                      <p className="text-sm font-medium text-white">Gemini-2.5-Flash</p>
                      <p className="text-xs text-gray-400">Primary analysis engine</p>
                    </div>
                  </div>
                  <Badge className="bg-green-500/20 text-green-400 text-xs">Active</Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="status-indicator bg-blue-400" />
                    <div>
                      <p className="text-sm font-medium text-white">NLP Processing</p>
                      <p className="text-xs text-gray-400">Message content analysis</p>
                    </div>
                  </div>
                  <Badge className="bg-blue-400/20 text-blue-400 text-xs">Running</Badge>
                </div>

                <div className="bg-slate-700/20 p-4 rounded-lg space-y-2">
                  <h4 className="text-sm font-medium text-white">Analysis Metrics</h4>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="text-gray-400">Messages Analyzed</p>
                      <p className="text-white font-medium">15,247</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Avg Response Time</p>
                      <p className="text-white font-medium">1.2s</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Accuracy Rate</p>
                      <p className="text-green-400 font-medium">97.8%</p>
                    </div>
                    <div>
                      <p className="text-gray-400">False Positives</p>
                      <p className="text-yellow-400 font-medium">2.2%</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Anomalies */}
        <Card className="pwc-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-white">Recent Anomalies</CardTitle>
                <p className="text-sm text-gray-400">Latest detected anomalies from AI analysis</p>
              </div>
              <Button 
                size="sm" 
                className="pwc-button-secondary"
                onClick={handleViewAllThreats}
              >
                <Search className="mr-2" size={16} />
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {isLoading ? (
                [...Array(6)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4 p-3 bg-slate-700/20 rounded-lg animate-pulse">
                    <div className="w-8 h-8 bg-slate-600 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-slate-600 rounded w-3/4"></div>
                      <div className="h-3 bg-slate-600 rounded w-1/2"></div>
                    </div>
                    <div className="w-16 h-4 bg-slate-600 rounded"></div>
                  </div>
                ))
              ) : (
                recentAnomalies.map((threat: any, index: number) => (
                  <div key={threat.id || index} className="flex items-center space-x-4 p-3 bg-slate-700/20 rounded-lg hover:bg-slate-700/30 transition-colors">
                    <ThreatGauge value={threat.aiScore || 0} size="sm" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">
                        {threat.threatType?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'Unknown Threat'}
                      </p>
                      <p className="text-xs text-gray-400">
                        Source: {threat.source} • {threat.description || 'AI detected anomalous pattern'}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge className={`text-xs mb-1 ${
                        threat.severity === "critical" ? "bg-red-500/20 text-red-400" :
                        threat.severity === "high" ? "bg-yellow-500/20 text-yellow-400" :
                        threat.severity === "medium" ? "bg-blue-400/20 text-blue-400" :
                        "bg-green-500/20 text-green-400"
                      }`}>
                        {threat.severity || 'low'}
                      </Badge>
                      <p className="text-xs text-gray-500">
                        {threat.timestamp ? new Date(threat.timestamp).toLocaleTimeString() : 'Unknown time'}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
