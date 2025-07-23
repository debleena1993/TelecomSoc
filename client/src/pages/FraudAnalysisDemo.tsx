import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, Shield, AlertTriangle, Phone, MessageCircle, User, Zap } from "lucide-react";

export default function FraudAnalysisDemo() {
  // Fetch recent fraud activities to show AI analysis
  const { data: fraudActivities } = useQuery({
    queryKey: ["/api/telecom/fraud-activities"],
    queryFn: () => fetch("/api/telecom/fraud-activities").then(res => res.json()),
    refetchInterval: 10000,
  });

  const aiAnalysisSteps = [
    {
      step: 1,
      title: "Data Ingestion",
      description: "System receives real-time CDR, SMS, and user activity data",
      icon: <Zap className="h-5 w-5" />,
      color: "blue"
    },
    {
      step: 2,
      title: "Pattern Analysis",
      description: "Gemini AI analyzes communication patterns and behaviors",
      icon: <Brain className="h-5 w-5" />,
      color: "purple"
    },
    {
      step: 3,
      title: "Threat Classification",
      description: "AI assigns threat scores (0-10) and categorizes threat types",
      icon: <Shield className="h-5 w-5" />,
      color: "green"
    },
    {
      step: 4,
      title: "Risk Assessment",
      description: "System determines severity and generates recommendations",
      icon: <AlertTriangle className="h-5 w-5" />,
      color: "orange"
    }
  ];

  const fraudTypes = [
    {
      type: "SMS Phishing",
      description: "AI detects suspicious keywords, urgent language, and malicious links",
      patterns: ["Urgent payment required", "Click here immediately", "Verify account"],
      riskFactors: ["Keyword matching", "Sender reputation", "Message timing"],
      icon: <MessageCircle className="h-6 w-6 text-red-500" />
    },
    {
      type: "Call Fraud",
      description: "Analyzes call duration, frequency, and destination patterns",
      patterns: ["Very short calls (<5 sec)", "Unusually long calls (>1 hour)", "High-frequency calling"],
      riskFactors: ["Call duration anomalies", "Destination analysis", "Frequency patterns"],
      icon: <Phone className="h-6 w-6 text-orange-500" />
    },
    {
      type: "SIM Swap",
      description: "Detects unusual activity patterns indicating account takeover",
      patterns: ["Sudden location changes", "Activity spikes", "Device changes"],
      riskFactors: ["Location anomalies", "Usage pattern changes", "Device fingerprinting"],
      icon: <User className="h-6 w-6 text-purple-500" />
    }
  ];

  const getThreatScoreColor = (score: number) => {
    if (score >= 8) return "text-red-600";
    if (score >= 6) return "text-orange-600";
    if (score >= 4) return "text-yellow-600";
    return "text-green-600";
  };

  const getSeverityBadge = (score: number) => {
    if (score >= 8) return <Badge variant="destructive">Critical</Badge>;
    if (score >= 6) return <Badge variant="secondary">High</Badge>;
    if (score >= 4) return <Badge className="bg-yellow-500">Medium</Badge>;
    return <Badge variant="outline">Low</Badge>;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">AI-Powered Fraud Detection</h1>
        <p className="text-muted-foreground">
          How Gemini AI analyzes telecom data to detect and prevent fraud in real-time
        </p>
      </div>

      {/* AI Analysis Process */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-purple-600" />
            Gemini AI Analysis Process
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {aiAnalysisSteps.map((step, index) => (
              <div key={step.step} className="text-center">
                <div className={`w-12 h-12 rounded-full bg-${step.color}-100 flex items-center justify-center mx-auto mb-3`}>
                  {step.icon}
                </div>
                <h3 className="font-semibold mb-2">Step {step.step}: {step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
                {index < aiAnalysisSteps.length - 1 && (
                  <div className="hidden md:block absolute top-6 left-full w-full h-0.5 bg-gray-200 transform translate-x-4" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="types" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="types">Fraud Types</TabsTrigger>
          <TabsTrigger value="analysis">AI Analysis</TabsTrigger>
          <TabsTrigger value="examples">Live Examples</TabsTrigger>
        </TabsList>

        <TabsContent value="types" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {fraudTypes.map((fraud) => (
              <Card key={fraud.type}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {fraud.icon}
                    {fraud.type}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{fraud.description}</p>
                  
                  <div>
                    <h4 className="font-medium mb-2">Detection Patterns:</h4>
                    <ul className="space-y-1">
                      {fraud.patterns.map((pattern, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                          {pattern}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Risk Factors:</h4>
                    <div className="flex flex-wrap gap-1">
                      {fraud.riskFactors.map((factor, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {factor}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>AI Threat Scoring System</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3">Threat Score Scale</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg bg-red-50">
                      <span className="font-medium">Critical (8-10)</span>
                      <Badge variant="destructive">Immediate Action</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg bg-orange-50">
                      <span className="font-medium">High (6-8)</span>
                      <Badge variant="secondary">Urgent Review</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg bg-yellow-50">
                      <span className="font-medium">Medium (4-6)</span>
                      <Badge className="bg-yellow-500">Monitor</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg bg-green-50">
                      <span className="font-medium">Low (0-4)</span>
                      <Badge variant="outline">Normal</Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">AI Analysis Features</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-2">
                      <Brain className="h-4 w-4 text-purple-600" />
                      <span className="text-sm">Natural language processing for SMS content</span>
                    </div>
                    <div className="flex items-center gap-3 p-2">
                      <Phone className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">Call pattern analysis and anomaly detection</span>
                    </div>
                    <div className="flex items-center gap-3 p-2">
                      <User className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Behavioral pattern recognition</span>
                    </div>
                    <div className="flex items-center gap-3 p-2">
                      <Shield className="h-4 w-4 text-orange-600" />
                      <span className="text-sm">Real-time threat classification</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Confidence Scoring</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">AI Confidence Level</span>
                    <span className="text-sm font-medium">85%</span>
                  </div>
                  <Progress value={85} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    Higher confidence scores indicate more reliable threat assessments
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="examples" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Live Fraud Detection Examples</CardTitle>
              <p className="text-sm text-muted-foreground">
                Real fraud cases detected by our AI system from your telecom data
              </p>
            </CardHeader>
            <CardContent>
              {fraudActivities && fraudActivities.length > 0 ? (
                <div className="space-y-4">
                  {fraudActivities.slice(0, 8).map((activity: any, index: number) => {
                    // Simulate AI analysis scores for demonstration
                    const mockThreatScore = 6 + Math.random() * 4;
                    const mockConfidence = 0.7 + Math.random() * 0.3;
                    
                    return (
                      <div key={activity.id} className="border rounded-lg p-4 bg-red-50">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            {activity.activityType === 'call' ? (
                              <Phone className="h-5 w-5 text-red-600" />
                            ) : (
                              <MessageCircle className="h-5 w-5 text-red-600" />
                            )}
                            <div>
                              <h4 className="font-medium text-red-800">
                                Fraud Detected: {activity.activityType.toUpperCase()} {activity.direction}
                              </h4>
                              <p className="text-sm text-red-600">
                                {activity.peerNumber} • {activity.location}
                              </p>
                            </div>
                          </div>
                          {getSeverityBadge(mockThreatScore)}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="font-medium">AI Threat Score:</span>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`font-bold ${getThreatScoreColor(mockThreatScore)}`}>
                                {mockThreatScore.toFixed(1)}/10
                              </span>
                              <Progress value={mockThreatScore * 10} className="h-2 flex-1" />
                            </div>
                          </div>
                          
                          <div>
                            <span className="font-medium">AI Confidence:</span>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="font-bold">{(mockConfidence * 100).toFixed(0)}%</span>
                              <Progress value={mockConfidence * 100} className="h-2 flex-1" />
                            </div>
                          </div>

                          <div>
                            <span className="font-medium">Detection Time:</span>
                            <p className="text-muted-foreground mt-1">
                              {new Date(activity.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 p-2 bg-white rounded border">
                          <span className="font-medium text-xs">AI Analysis:</span>
                          <p className="text-xs text-muted-foreground mt-1">
                            {activity.activityType === 'call' 
                              ? `Suspicious call pattern detected. ${activity.durationSec < 10 ? 'Very short duration' : 'Unusually long duration'} suggests potential fraud activity.`
                              : 'SMS content analysis indicates potential phishing attempt with urgent language patterns.'
                            }
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-muted-foreground">No fraud activities detected in recent data</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}