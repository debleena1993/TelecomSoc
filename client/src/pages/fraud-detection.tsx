import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Brain, AlertTriangle, Shield, TrendingUp, Eye, Zap, Activity, MapPin, Clock, RefreshCw, FileText, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import ThreatGauge from "@/components/ui/threat-gauge";

interface FraudAnalysisResult {
  riskScore: number;
  fraudType: string;
  severity: "critical" | "high" | "medium" | "low";
  confidence: number;
  description: string;
  patterns: string[];
  recommendations: string[];
  userPatterns: {
    totalActivities: number;
    fraudRate: number;
    suspiciousPatterns: string[];
    timeAnalysis: string;
    locationAnalysis: string;
  };
}

export default function FraudDetection() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const queryClient = useQueryClient();

  // Get current fraud analysis
  const { data: fraudAnalysis, isLoading: analysisLoading, error } = useQuery<FraudAnalysisResult>({
    queryKey: ["/api/telecom/fraud-analysis"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  interface TelecomStats {
    totalActivities: number;
    fraudRate: number;
    callCount: number;
    smsCount: number;
  }

  const { data: telecomStats } = useQuery<TelecomStats>({
    queryKey: ["/api/telecom/stats"],
    refetchInterval: 10000,
  });

  // Mutation to trigger new analysis
  const analysisMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/telecom/fraud-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });
      if (!response.ok) throw new Error("Analysis failed");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/telecom/fraud-analysis"] });
    }
  });

  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      await analysisMutation.mutateAsync();
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGeneratePDF = async () => {
    if (!fraudAnalysis) return;
    
    try {
      // Dynamically import jsPDF and html2canvas to avoid SSR issues
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import('jspdf'),
        import('html2canvas')
      ]);

      // Create PDF document
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 210;
      const pageHeight = 297;
      let yPosition = 20;

      // Add header
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('TelecomSOC Fraud Detection Report', 20, yPosition);
      
      yPosition += 10;
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 20, yPosition);
      
      yPosition += 15;
      
      // Risk Assessment Section
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Risk Assessment', 20, yPosition);
      yPosition += 10;
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Risk Score: ${fraudAnalysis.riskScore.toFixed(1)}/10`, 20, yPosition);
      yPosition += 6;
      pdf.text(`Severity: ${fraudAnalysis.severity.toUpperCase()}`, 20, yPosition);
      yPosition += 6;
      pdf.text(`Confidence: ${(fraudAnalysis.confidence * 100).toFixed(0)}%`, 20, yPosition);
      yPosition += 6;
      pdf.text(`Fraud Type: ${fraudAnalysis.fraudType.replace(/_/g, ' ')}`, 20, yPosition);
      yPosition += 10;
      
      // Description
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Analysis Description', 20, yPosition);
      yPosition += 8;
      
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      const descriptionLines = pdf.splitTextToSize(fraudAnalysis.description, pageWidth - 40);
      pdf.text(descriptionLines, 20, yPosition);
      yPosition += descriptionLines.length * 4 + 10;
      
      // User Patterns Section
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('User Activity Patterns', 20, yPosition);
      yPosition += 8;
      
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Total Activities Analyzed: ${fraudAnalysis.userPatterns.totalActivities}`, 20, yPosition);
      yPosition += 6;
      pdf.text(`Fraud Rate: ${fraudAnalysis.userPatterns.fraudRate.toFixed(1)}%`, 20, yPosition);
      yPosition += 10;
      
      // Time Analysis
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Time Analysis:', 20, yPosition);
      yPosition += 6;
      pdf.setFont('helvetica', 'normal');
      const timeLines = pdf.splitTextToSize(fraudAnalysis.userPatterns.timeAnalysis, pageWidth - 40);
      pdf.text(timeLines, 20, yPosition);
      yPosition += timeLines.length * 4 + 8;
      
      // Location Analysis
      pdf.setFont('helvetica', 'bold');
      pdf.text('Location Analysis:', 20, yPosition);
      yPosition += 6;
      pdf.setFont('helvetica', 'normal');
      const locationLines = pdf.splitTextToSize(fraudAnalysis.userPatterns.locationAnalysis, pageWidth - 40);
      pdf.text(locationLines, 20, yPosition);
      yPosition += locationLines.length * 4 + 10;
      
      // Check if we need a new page
      if (yPosition > pageHeight - 40) {
        pdf.addPage();
        yPosition = 20;
      }
      
      // Suspicious Patterns Section
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Detected Suspicious Patterns', 20, yPosition);
      yPosition += 10;
      
      fraudAnalysis.patterns.forEach((pattern, index) => {
        if (yPosition > pageHeight - 20) {
          pdf.addPage();
          yPosition = 20;
        }
        
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`${index + 1}. `, 20, yPosition);
        const patternLines = pdf.splitTextToSize(pattern, pageWidth - 50);
        pdf.text(patternLines, 30, yPosition);
        yPosition += patternLines.length * 4 + 3;
      });
      
      yPosition += 10;
      
      // AI Recommendations Section
      if (yPosition > pageHeight - 40) {
        pdf.addPage();
        yPosition = 20;
      }
      
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('AI Recommendations', 20, yPosition);
      yPosition += 10;
      
      fraudAnalysis.recommendations.forEach((recommendation, index) => {
        if (yPosition > pageHeight - 20) {
          pdf.addPage();
          yPosition = 20;
        }
        
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`${index + 1}. `, 20, yPosition);
        const recLines = pdf.splitTextToSize(recommendation, pageWidth - 50);
        pdf.text(recLines, 30, yPosition);
        yPosition += recLines.length * 4 + 3;
      });

      // System Overview
      if (telecomStats) {
        if (yPosition > pageHeight - 60) {
          pdf.addPage();
          yPosition = 20;
        }
        
        yPosition += 10;
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('System Overview', 20, yPosition);
        yPosition += 10;
        
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Total Activities in System: ${telecomStats.totalActivities}`, 20, yPosition);
        yPosition += 6;
        pdf.text(`System-wide Fraud Rate: ${telecomStats.fraudRate}%`, 20, yPosition);
        yPosition += 6;
        pdf.text(`Calls Analyzed: ${telecomStats.callCount}`, 20, yPosition);
        yPosition += 6;
        pdf.text(`SMS Analyzed: ${telecomStats.smsCount}`, 20, yPosition);
      }
      
      // Save the PDF
      const filename = `TelecomSOC_Fraud_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(filename);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF report. Please try again.');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "destructive";
      case "high":
        return "secondary";
      case "medium":
        return "outline";
      default:
        return "default";
    }
  };

  const getSeverityBg = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-500/20 text-red-400";
      case "high":
        return "bg-yellow-500/20 text-yellow-400";
      case "medium":
        return "bg-blue-500/20 text-blue-400";
      default:
        return "bg-green-500/20 text-green-400";
    }
  };

  if (analysisLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Brain className="h-8 w-8 text-purple-500" />
              AI Fraud Detection Analysis
            </h1>
            <p className="text-muted-foreground">
              Gemini-powered fraud pattern analysis and risk assessment
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center h-96">
          <div className="text-center space-y-4">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto" />
            <p className="text-muted-foreground">Loading fraud analysis...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Brain className="h-8 w-8 text-purple-500" />
              AI Fraud Detection Analysis
            </h1>
            <p className="text-muted-foreground">
              Gemini-powered fraud pattern analysis and risk assessment
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              onClick={handleGeneratePDF}
              disabled={!fraudAnalysis}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Generate PDF Report
            </Button>
            <Button 
              onClick={handleRunAnalysis} 
              disabled={isAnalyzing}
              className="flex items-center gap-2"
            >
              {isAnalyzing ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Zap className="h-4 w-4" />
              )}
              {isAnalyzing ? "Analyzing..." : "Run Analysis"}
            </Button>
          </div>
        </div>
        <Card className="border-red-500/20 bg-red-500/5">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertTriangle className="h-8 w-8 text-red-500 mx-auto" />
              <p className="text-red-400">Failed to load fraud analysis</p>
              <p className="text-sm text-muted-foreground">Please try running a new analysis</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8 text-purple-500" />
            AI Fraud Detection Analysis
          </h1>
          <p className="text-muted-foreground">
            Gemini-powered fraud pattern analysis and risk assessment
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={handleGeneratePDF}
            disabled={!fraudAnalysis}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Generate PDF Report
          </Button>
          <Button 
            onClick={handleRunAnalysis} 
            disabled={isAnalyzing}
            className="flex items-center gap-2"
          >
            {isAnalyzing ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Zap className="h-4 w-4" />
            )}
            {isAnalyzing ? "Analyzing..." : "Run New Analysis"}
          </Button>
        </div>
      </div>

      {fraudAnalysis && (
        <>
          {/* Main Risk Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Risk Assessment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <ThreatGauge value={fraudAnalysis.riskScore} />
                  <div className="mt-4 space-y-2">
                    <Badge variant={getSeverityColor(fraudAnalysis.severity)} className="text-sm">
                      {fraudAnalysis.severity.toUpperCase()} RISK
                    </Badge>
                    <p className="text-2xl font-bold">{fraudAnalysis.riskScore.toFixed(1)}/10</p>
                    <p className="text-sm text-muted-foreground">
                      Confidence: {(fraudAnalysis.confidence * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Fraud Type Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className={cn("p-4 rounded-lg", getSeverityBg(fraudAnalysis.severity))}>
                  <h3 className="font-semibold text-lg capitalize">
                    {fraudAnalysis.fraudType.replace(/_/g, ' ')}
                  </h3>
                  <p className="text-sm mt-2">{fraudAnalysis.description}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <Activity className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                    <p className="text-2xl font-bold">{fraudAnalysis.userPatterns.totalActivities}</p>
                    <p className="text-xs text-muted-foreground">Total Activities</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <TrendingUp className="h-6 w-6 mx-auto mb-2 text-red-500" />
                    <p className="text-2xl font-bold">{fraudAnalysis.userPatterns.fraudRate.toFixed(1)}%</p>
                    <p className="text-xs text-muted-foreground">Fraud Rate</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <Eye className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
                    <p className="text-2xl font-bold">{fraudAnalysis.patterns.length}</p>
                    <p className="text-xs text-muted-foreground">Patterns Detected</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Patterns Detected */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Suspicious Patterns
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {fraudAnalysis.patterns.map((pattern, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-yellow-500/10 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm">{pattern}</p>
                  </div>
                ))}
                
                <Separator className="my-4" />
                
                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Time Analysis
                  </h4>
                  <p className="text-sm text-muted-foreground">{fraudAnalysis.userPatterns.timeAnalysis}</p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Location Analysis
                  </h4>
                  <p className="text-sm text-muted-foreground">{fraudAnalysis.userPatterns.locationAnalysis}</p>
                </div>
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  AI Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {fraudAnalysis.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-blue-500/10 rounded-lg">
                    <Brain className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm">{recommendation}</p>
                  </div>
                ))}
                
                <Separator className="my-4" />
                
                <div className="space-y-2">
                  <h4 className="font-semibold">Behavioral Patterns</h4>
                  {fraudAnalysis.userPatterns.suspiciousPatterns.map((pattern, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <div className="h-2 w-2 bg-orange-500 rounded-full" />
                      {pattern}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* System Stats */}
          {telecomStats && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  System Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{telecomStats.totalActivities}</p>
                    <p className="text-xs text-muted-foreground">Total Activities</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{telecomStats.fraudRate}%</p>
                    <p className="text-xs text-muted-foreground">System Fraud Rate</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{telecomStats.callCount}</p>
                    <p className="text-xs text-muted-foreground">Calls Analyzed</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{telecomStats.smsCount}</p>
                    <p className="text-xs text-muted-foreground">SMS Analyzed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}