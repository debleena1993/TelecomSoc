import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, TrendingUp, AlertCircle, User, Shield, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import ThreatGauge from "@/components/ui/threat-gauge";

interface FraudCase {
  id: number;
  userId: string;
  riskScore: number;
  indicators: string[];
  status: string;
  timestamp: string;
}

export default function FraudDetection() {
  const [searchUserId, setSearchUserId] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: fraudCases, isLoading: casesLoading } = useQuery<FraudCase[]>({
    queryKey: ["/api/fraud-cases"],
    refetchInterval: 15000,
  });

  const { data: systemStats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    refetchInterval: 10000,
  });

  // Filter fraud cases based on search and status
  const filteredCases = fraudCases?.filter(fraudCase => {
    const matchesSearch = !searchUserId || fraudCase.userId.toLowerCase().includes(searchUserId.toLowerCase());
    const matchesStatus = statusFilter === "all" || fraudCase.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const getRiskLevel = (score: number) => {
    if (score >= 8) return { level: "Critical", color: "text-red-500", bg: "bg-red-500/20" };
    if (score >= 6) return { level: "High", color: "text-yellow-500", bg: "bg-yellow-500/20" };
    if (score >= 4) return { level: "Medium", color: "text-blue-400", bg: "bg-blue-400/20" };
    return { level: "Low", color: "text-green-500", bg: "bg-green-500/20" };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "investigating":
        return "bg-yellow-500/20 text-yellow-400";
      case "confirmed":
        return "bg-red-500/20 text-red-400";
      case "false_positive":
        return "bg-green-500/20 text-green-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const caseTime = new Date(timestamp);
    const diffMs = now.getTime() - caseTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  // Calculate fraud detection metrics
  const totalCases = fraudCases?.length || 0;
  const confirmedFraud = fraudCases?.filter(c => c.status === "confirmed").length || 0;
  const investigating = fraudCases?.filter(c => c.status === "investigating").length || 0;
  const avgRiskScore = fraudCases?.length 
    ? (fraudCases.reduce((sum, c) => sum + c.riskScore, 0) / fraudCases.length).toFixed(1)
    : "0.0";

  const fraudMetrics = [
    {
      title: "Total Cases",
      value: totalCases.toString(),
      icon: AlertCircle,
      color: "text-blue-400",
      bg: "bg-blue-400/20"
    },
    {
      title: "Confirmed Fraud",
      value: confirmedFraud.toString(),
      icon: Shield,
      color: "text-red-500",
      bg: "bg-red-500/20"
    },
    {
      title: "Under Investigation",
      value: investigating.toString(),
      icon: Search,
      color: "text-yellow-500",
      bg: "bg-yellow-500/20"
    },
    {
      title: "Avg Risk Score",
      value: avgRiskScore,
      icon: TrendingUp,
      color: "text-green-500",
      bg: "bg-green-500/20"
    }
  ];

  const commonIndicators = [
    "Multiple login locations",
    "Device fingerprint change",
    "Unusual call patterns",
    "SIM swap attempt",
    "Account takeover signals",
    "Location anomaly",
    "Time-based irregularities",
    "Behavioral deviation"
  ];

  return (
    <>
      {/* Header */}
      <header className="pwc-card border-b p-6 m-0 rounded-none">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Fraud Detection</h2>
            <p className="text-gray-400">AI-powered user behavior analysis and fraud prevention</p>
          </div>
          <div className="flex items-center space-x-4">
            <Button className="pwc-button-secondary">
              <TrendingUp className="mr-2" size={16} />
              Analytics
            </Button>
            <Button className="pwc-button-primary">
              <Search className="mr-2" size={16} />
              Manual Investigation
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Fraud Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {fraudMetrics.map((metric, index) => (
            <Card key={index} className="pwc-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">{metric.title}</p>
                    <p className={cn("text-3xl font-bold", metric.color)}>{metric.value}</p>
                  </div>
                  <div className={cn("w-12 h-12 rounded-full flex items-center justify-center", metric.bg)}>
                    <metric.icon className={metric.color} size={24} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search and Filters */}
        <Card className="pwc-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white">Search & Filter Cases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-300 mb-2">Search User ID</Label>
                <Input
                  placeholder="Enter user ID..."
                  value={searchUserId}
                  onChange={(e) => setSearchUserId(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-300 mb-2">Case Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full bg-slate-700 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="investigating">Investigating</SelectItem>
                    <SelectItem value="confirmed">Confirmed Fraud</SelectItem>
                    <SelectItem value="false_positive">False Positive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button className="w-full pwc-button-primary">
                  <Search className="mr-2" size={16} />
                  Search Cases
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fraud Cases */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cases List */}
          <div className="lg:col-span-2">
            <Card className="pwc-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-white">Active Fraud Cases</CardTitle>
                  <Badge className="bg-yellow-500/20 text-yellow-400">
                    {filteredCases.length} cases
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {casesLoading ? (
                  <div className="space-y-4">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-4 p-4 bg-slate-700/20 rounded-lg animate-pulse">
                        <div className="w-12 h-12 bg-slate-600 rounded-full"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-slate-600 rounded w-3/4"></div>
                          <div className="h-3 bg-slate-600 rounded w-1/2"></div>
                        </div>
                        <div className="w-20 h-4 bg-slate-600 rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : filteredCases.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <AlertCircle size={48} className="mx-auto mb-4 text-gray-500" />
                    <p>No fraud cases found</p>
                    <p className="text-sm">Try adjusting your search criteria</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {filteredCases.map((fraudCase) => {
                      const risk = getRiskLevel(fraudCase.riskScore);
                      
                      return (
                        <div key={fraudCase.id} className="flex items-start space-x-4 p-4 bg-slate-700/20 rounded-lg hover:bg-slate-700/30 transition-colors">
                          <div className="flex flex-col items-center space-y-2">
                            <ThreatGauge value={fraudCase.riskScore} size="sm" />
                            <Badge className={cn("text-xs", risk.bg, risk.color)}>
                              {risk.level}
                            </Badge>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-2">
                              <User size={16} className="text-gray-400" />
                              <h4 className="text-sm font-medium text-white">{fraudCase.userId}</h4>
                              <Badge className={cn("text-xs", getStatusColor(fraudCase.status))}>
                                {fraudCase.status.replace(/_/g, ' ')}
                              </Badge>
                            </div>
                            
                            <div className="mb-2">
                              <p className="text-xs text-gray-400 mb-1">Risk Indicators:</p>
                              <div className="flex flex-wrap gap-1">
                                {fraudCase.indicators?.slice(0, 3).map((indicator, idx) => (
                                  <Badge key={idx} className="text-xs bg-slate-600/50 text-gray-300">
                                    {indicator}
                                  </Badge>
                                ))}
                                {fraudCase.indicators?.length > 3 && (
                                  <Badge className="text-xs bg-slate-600/50 text-gray-300">
                                    +{fraudCase.indicators.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                            
                            <p className="text-xs text-gray-500">
                              Detected {formatTimeAgo(fraudCase.timestamp)}
                            </p>
                          </div>
                          
                          <div className="flex flex-col space-y-1">
                            <Button size="sm" variant="ghost" className="text-blue-400 hover:text-blue-300 h-8 px-2">
                              <Eye size={14} className="mr-1" />
                              Details
                            </Button>
                            <Button size="sm" variant="ghost" className="text-orange-400 hover:text-orange-300 h-8 px-2">
                              Investigate
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Fraud Indicators */}
          <div>
            <Card className="pwc-card">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-white">Common Fraud Indicators</CardTitle>
                <p className="text-sm text-gray-400">Patterns detected by AI analysis</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {commonIndicators.map((indicator, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-slate-700/30 rounded-lg">
                      <span className="text-sm text-gray-300">{indicator}</span>
                      <Badge className="text-xs bg-blue-500/20 text-blue-400">
                        {Math.floor(Math.random() * 50) + 10}%
                      </Badge>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 pt-4 border-t border-slate-700">
                  <h4 className="text-sm font-medium text-white mb-3">Detection Accuracy</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">True Positives</span>
                      <span className="text-green-400">94.2%</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">False Positives</span>
                      <span className="text-yellow-400">5.8%</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Model Confidence</span>
                      <span className="text-blue-400">97.1%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
