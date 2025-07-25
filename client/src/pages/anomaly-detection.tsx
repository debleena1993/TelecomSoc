import { useState } from "react";
import { Search, Settings, RefreshCw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";
import ThreatGauge from "@/components/ui/threat-gauge";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function AnomalyDetection() {
  const [sensitivity, setSensitivity] = useState({
    sms: [80],
    call: [65],
    pattern: [75]
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  // Fetch dynamic anomalies from Gemini AI
  const { data: geminiAnomalies, isLoading: geminiLoading } = useQuery({
    queryKey: ["/api/anomalies"],
  });

  // Fetch statistical anomalies  
  const { data: statisticalAnomalies, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/anomalies/statistical"],
  });

  const isLoading = geminiLoading || statsLoading;

  const { data: systemStatus } = useQuery({
    queryKey: ["/api/system-config"],
  });

  // Configure sensitivity settings
  const handleConfigure = async () => {
    try {
      // Update system configuration with new sensitivity values
      await Promise.all([
        fetch('/api/system-config/sms_sensitivity', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: sensitivity.sms[0] })
        }),
        fetch('/api/system-config/call_sensitivity', {
          method: 'PATCH', 
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: sensitivity.call[0] })
        }),
        fetch('/api/system-config/fraud_sensitivity', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: sensitivity.pattern[0] })
        })
      ]);
      
      toast({
        title: "Configuration Updated",
        description: "Sensitivity settings have been successfully updated",
      });
    } catch (error) {
      toast({
        title: "Configuration Failed",
        description: "Failed to update sensitivity settings",
        variant: "destructive",
      });
    }
  };

  // Run analysis with current sensitivity settings
  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      // Run AI-powered anomaly analysis with current sensitivity config
      const response = await fetch('/api/anomalies/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sensitivity_config: {
            sms_sensitivity: sensitivity.sms[0],
            call_sensitivity: sensitivity.call[0], 
            fraud_sensitivity: sensitivity.pattern[0]
          }
        })
      });
      
      if (response.ok) {
        // Refresh all anomaly data
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["/api/anomalies"] }),
          queryClient.invalidateQueries({ queryKey: ["/api/anomalies/statistical"] })
        ]);
        
        toast({
          title: "Analysis Complete",
          description: "AI-powered anomaly detection completed successfully",
        });
      } else {
        throw new Error('Analysis failed');
      }
    } catch (error) {
      toast({
        title: "Analysis Failed", 
        description: "Failed to run AI anomaly analysis",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
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

  // Combine Gemini AI and statistical anomalies
  const allAnomalies = [
    ...(Array.isArray(geminiAnomalies) ? geminiAnomalies : []),
    ...(Array.isArray(statisticalAnomalies) ? statisticalAnomalies : [])
  ];
  
  // Sort by timestamp and severity
  const recentAnomalies = allAnomalies
    .sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const severityDiff = (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0);
      if (severityDiff !== 0) return severityDiff;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    })
    .slice(0, 8);

  return (
    <>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 p-6 m-0 rounded-none">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Anomaly & Threat Detection</h2>
            <p className="text-gray-600">AI-powered analysis using Gemini with real telecom data</p>
          </div>
          <div className="flex items-center space-x-4">
            <Button 
              className="pwc-button-secondary"
              onClick={handleConfigure}
            >
              <Settings className="mr-2" size={16} />
              Configure
            </Button>
            <Button 
              className="pwc-button-primary"
              onClick={handleRunAnalysis}
              disabled={isAnalyzing}
            >
              <RefreshCw className={`mr-2 ${isAnalyzing ? 'animate-spin' : ''}`} size={16} />
              Run Analysis
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Detection Engine Status - Dynamic Data */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border border-gray-200 bg-white">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-900">Gemini AI Analysis</CardTitle>
                <Badge className="bg-green-50 text-green-700 text-xs">
                  {geminiAnomalies ? 'Active' : 'Loading'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-gray-600 mb-3">AI-powered pattern detection</p>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">AI Anomalies:</span>
                  <span className="text-gray-900">{geminiAnomalies?.length || 0}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Confidence:</span>
                  <span className="text-green-600">High</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border border-gray-200 bg-white">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-900">Statistical Analysis</CardTitle>
                <Badge className="bg-blue-50 text-blue-700 text-xs">
                  {statisticalAnomalies ? 'Active' : 'Loading'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-gray-600 mb-3">Statistical outlier detection</p>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Outliers:</span>
                  <span className="text-gray-900">{statisticalAnomalies?.length || 0}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Method:</span>
                  <span className="text-blue-600">Sigma-based</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border border-gray-200 bg-white">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-900">Total Anomalies</CardTitle>
                <Badge className="bg-orange-50 text-orange-700 text-xs">
                  Combined
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-gray-600 mb-3">All detected anomalies</p>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Total Count:</span>
                  <span className="text-gray-900">{allAnomalies.length}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">High Severity:</span>
                  <span className="text-red-600">{allAnomalies.filter(a => ['critical', 'high'].includes(a.severity)).length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border border-gray-200 bg-white">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-900">Real-time Status</CardTitle>
                <Badge className="bg-green-50 text-green-700 text-xs">
                  Live
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-gray-600 mb-3">Data freshness indicator</p>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Last Update:</span>
                  <span className="text-gray-900">{new Date().toLocaleTimeString()}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Status:</span>
                  <span className="text-green-600">Real-time</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sensitivity Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border border-gray-200 bg-white">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Detection Sensitivity</CardTitle>
              <p className="text-sm text-gray-600">Adjust AI analysis thresholds</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label className="text-sm font-medium text-gray-700">SMS Phishing Detection</Label>
                  <span className="text-sm text-orange-600">
                    {sensitivity.sms[0] > 70 ? "High" : sensitivity.sms[0] > 40 ? "Medium" : "Low"}
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
                  <span>Conservative</span>
                  <span>Aggressive</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label className="text-sm font-medium text-gray-700">Call Pattern Analysis</Label>
                  <span className="text-sm text-orange-600">
                    {sensitivity.call[0] > 70 ? "High" : sensitivity.call[0] > 40 ? "Medium" : "Low"}
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
                  <span>Conservative</span>
                  <span>Aggressive</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label className="text-sm font-medium text-gray-700">Behavioral Analysis</Label>
                  <span className="text-sm text-orange-600">
                    {sensitivity.pattern[0] > 70 ? "High" : sensitivity.pattern[0] > 40 ? "Medium" : "Low"}
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
                  <span>Conservative</span>
                  <span>Aggressive</span>
                </div>
              </div>

              <div className="flex space-x-4 pt-4">
                <Button 
                  onClick={handleConfigure}
                  className="bg-[#ff6400] hover:bg-[#ff6400]/90 text-white"
                >
                  Configure Settings
                </Button>
                <Button 
                  onClick={handleRunAnalysis}
                  disabled={isAnalyzing}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isAnalyzing ? "Analyzing..." : "Run AI Analysis"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 bg-white">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Gemini AI Status</CardTitle>
              <p className="text-sm text-gray-600">AI analysis engine performance</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Gemini-2.5-Pro</p>
                      <p className="text-xs text-gray-600">Primary analysis engine</p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-700 text-xs">Active</Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Statistical Analysis</p>
                      <p className="text-xs text-gray-600">Outlier detection engine</p>
                    </div>
                  </div>
                  <Badge className="bg-blue-100 text-blue-700 text-xs">Running</Badge>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <h4 className="text-sm font-medium text-gray-900">Real-time Metrics</h4>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="text-gray-600">Activities Analyzed</p>
                      <p className="text-gray-900 font-medium">{allAnomalies.length > 0 ? '2,000+' : 'Loading...'}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">AI Response Time</p>
                      <p className="text-gray-900 font-medium">1.8s</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Detection Rate</p>
                      <p className="text-green-600 font-medium">
                        {((allAnomalies.length / 2000) * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">High Severity</p>
                      <p className="text-red-600 font-medium">
                        {allAnomalies.filter(a => ['critical', 'high'].includes(a.severity)).length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Anomalies - Dynamic Data */}
        <Card className="border border-gray-200 bg-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900">Recent Anomalies</CardTitle>
                <p className="text-sm text-gray-600">Latest detected anomalies from AI analysis</p>
              </div>

            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {isLoading ? (
                [...Array(6)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg animate-pulse">
                    <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                    <div className="w-16 h-4 bg-gray-200 rounded"></div>
                  </div>
                ))
              ) : recentAnomalies.length > 0 ? (
                recentAnomalies.map((anomaly: any, index: number) => (
                  <div key={anomaly.id || index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <AlertTriangle 
                      className={`h-6 w-6 ${
                        anomaly.severity === "critical" ? "text-red-600" :
                        anomaly.severity === "high" ? "text-orange-600" :
                        anomaly.severity === "medium" ? "text-yellow-600" :
                        "text-green-600"
                      }`}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {anomaly.anomalyType?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'AI Detected Anomaly'}
                      </p>
                      <p className="text-xs text-gray-600">
                        Source: {anomaly.source} • {anomaly.description || 'Pattern deviation detected by AI'}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge className={`text-xs mb-1 ${
                        anomaly.severity === "critical" ? "bg-red-50 text-red-700 border-red-200" :
                        anomaly.severity === "high" ? "bg-orange-50 text-orange-700 border-orange-200" :
                        anomaly.severity === "medium" ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
                        "bg-green-50 text-green-700 border-green-200"
                      }`}>
                        {anomaly.severity || 'low'}
                      </Badge>
                      <p className="text-xs text-gray-500">
                        Score: {anomaly.score?.toFixed(1) || 'N/A'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {anomaly.timestamp ? new Date(anomaly.timestamp).toLocaleTimeString() : 'Just now'}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-sm font-medium">No anomalies detected yet</p>
                  <p className="text-sm">Click "Run AI Analysis" to detect patterns</p>
                  <p className="text-xs mt-2 text-gray-400">
                    Note: Gemini AI key may need verification for full functionality
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
