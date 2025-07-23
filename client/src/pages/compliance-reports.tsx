import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { FileText, Download, Calendar, BarChart3, Shield, AlertTriangle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";

interface ComplianceReport {
  id: number;
  reportType: string;
  generatedAt: string;
  startDate: string;
  endDate: string;
  summary: string;
  filePath?: string;
}

export default function ComplianceReports() {
  const [reportType, setReportType] = useState("incident_summary");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [customSummary, setCustomSummary] = useState("");

  const { data: reports, isLoading: reportsLoading } = useQuery<ComplianceReport[]>({
    queryKey: ["/api/compliance-reports"],
    refetchInterval: 30000,
  });

  const { data: systemStats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    refetchInterval: 10000,
  });

  const generateReportMutation = useMutation({
    mutationFn: async (reportData: any) => {
      const response = await apiRequest("POST", "/api/compliance-reports", reportData);
      return response.json();
    },
    onSuccess: () => {
      // Refresh reports list
      window.location.reload();
    },
  });

  const handleGenerateReport = () => {
    if (!dateRange?.from || !dateRange?.to) {
      alert("Please select a date range");
      return;
    }

    generateReportMutation.mutate({
      reportType,
      startDate: dateRange.from.toISOString(),
      endDate: dateRange.to.toISOString(),
    });
  };

  const getReportTypeLabel = (type: string) => {
    switch (type) {
      case "incident_summary":
        return "Incident Summary";
      case "threat_analysis":
        return "Threat Analysis";
      case "response_audit":
        return "Response Audit";
      default:
        return type;
    }
  };

  const getReportIcon = (type: string) => {
    switch (type) {
      case "incident_summary":
        return AlertTriangle;
      case "threat_analysis":
        return BarChart3;
      case "response_audit":
        return Shield;
      default:
        return FileText;
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const reportTime = new Date(timestamp);
    const diffMs = now.getTime() - reportTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  const reportTemplates = [
    {
      type: "incident_summary",
      title: "Security Incident Summary",
      description: "Comprehensive overview of security incidents, response actions, and outcomes",
      frequency: "Weekly/Monthly",
      stakeholders: "CISO, Security Team, Compliance"
    },
    {
      type: "threat_analysis",
      title: "Threat Landscape Analysis", 
      description: "AI-powered analysis of threat patterns, trends, and emerging risks",
      frequency: "Monthly/Quarterly",
      stakeholders: "Security Team, Risk Management"
    },
    {
      type: "response_audit",
      title: "Response Effectiveness Audit",
      description: "Audit of automated responses, manual interventions, and system performance",
      frequency: "Quarterly",
      stakeholders: "Audit Team, Management"
    }
  ];

  const complianceMetrics = [
    {
      title: "Reports Generated",
      value: reports?.length.toString() || "0",
      icon: FileText,
      color: "text-blue-400",
      bg: "bg-blue-400/20"
    },
    {
      title: "Incidents Documented",
      value: (systemStats as any)?.activeThreats?.toString() || "0",
      icon: AlertTriangle,
      color: "text-red-500",
      bg: "bg-red-500/20"
    },
    {
      title: "Response Rate",
      value: `${(systemStats as any)?.detectionRate || 0}%`,
      icon: Shield,
      color: "text-green-500",
      bg: "bg-green-500/20"
    },
    {
      title: "Avg Response Time",
      value: "2.3m",
      icon: Clock,
      color: "text-yellow-500",
      bg: "bg-yellow-500/20"
    }
  ];

  return (
    <>
      {/* Header */}
      <header className="pwc-card border-b p-6 m-0 rounded-none">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Compliance Reports</h2>
            <p className="text-gray-400">Generate and manage cybersecurity compliance documentation</p>
          </div>
          <div className="flex items-center space-x-4">
            <Button className="pwc-button-secondary">
              <Calendar className="mr-2" size={16} />
              Schedule Report
            </Button>
            <Button className="pwc-button-primary">
              <BarChart3 className="mr-2" size={16} />
              Analytics Dashboard
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Compliance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {complianceMetrics.map((metric, index) => (
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

        {/* Report Generation */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="pwc-card">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-white">Generate New Report</CardTitle>
              <p className="text-sm text-gray-400">Create compliance reports using AI-powered analysis</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-300 mb-2">Report Type</Label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger className="w-full bg-slate-700 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="incident_summary">Security Incident Summary</SelectItem>
                    <SelectItem value="threat_analysis">Threat Landscape Analysis</SelectItem>
                    <SelectItem value="response_audit">Response Effectiveness Audit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-300 mb-2">Date Range</Label>
                <DatePickerWithRange
                  date={dateRange}
                  onDateChange={setDateRange}
                  className="w-full bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-300 mb-2">Custom Instructions (Optional)</Label>
                <Textarea
                  placeholder="Add specific requirements or focus areas for this report..."
                  value={customSummary}
                  onChange={(e) => setCustomSummary(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                  rows={3}
                />
              </div>

              <Button 
                onClick={handleGenerateReport}
                disabled={generateReportMutation.isPending}
                className="w-full pwc-button-primary"
              >
                {generateReportMutation.isPending ? "Generating..." : "Generate Report"}
              </Button>
            </CardContent>
          </Card>

          <Card className="pwc-card">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-white">Report Templates</CardTitle>
              <p className="text-sm text-gray-400">Pre-configured compliance report formats</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportTemplates.map((template) => {
                  const TemplateIcon = getReportIcon(template.type);
                  
                  return (
                    <div key={template.type} className="border border-slate-700 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-slate-700/50 rounded-lg flex items-center justify-center">
                          <TemplateIcon size={20} className="text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-white mb-1">{template.title}</h4>
                          <p className="text-xs text-gray-400 mb-2">{template.description}</p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>Frequency: {template.frequency}</span>
                            <span>•</span>
                            <span>For: {template.stakeholders}</span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setReportType(template.type)}
                          className="pwc-button-secondary text-xs"
                        >
                          Use Template
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Reports */}
        <Card className="pwc-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-white">Recent Reports</CardTitle>
                <p className="text-sm text-gray-400">Generated compliance documentation</p>
              </div>
              <Button size="sm" className="pwc-button-secondary">
                <Download className="mr-2" size={16} />
                Export All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {reportsLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4 p-4 bg-slate-700/20 rounded-lg animate-pulse">
                    <div className="w-12 h-12 bg-slate-600 rounded-lg"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-slate-600 rounded w-3/4"></div>
                      <div className="h-3 bg-slate-600 rounded w-1/2"></div>
                    </div>
                    <div className="w-20 h-4 bg-slate-600 rounded"></div>
                  </div>
                ))}
              </div>
            ) : reports?.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <FileText size={48} className="mx-auto mb-4 text-gray-500" />
                <p>No reports generated yet</p>
                <p className="text-sm">Generate your first compliance report above</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reports?.map((report) => {
                  const ReportIcon = getReportIcon(report.reportType);
                  
                  return (
                    <div key={report.id} className="flex items-start space-x-4 p-4 bg-slate-700/20 rounded-lg hover:bg-slate-700/30 transition-colors">
                      <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                        <ReportIcon size={24} className="text-blue-400" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="text-sm font-medium text-white">
                            {getReportTypeLabel(report.reportType)}
                          </h4>
                          <Badge className="text-xs bg-green-500/20 text-green-400">
                            Generated
                          </Badge>
                        </div>
                        
                        <p className="text-xs text-gray-400 mb-2 line-clamp-2">
                          {report.summary || "AI-generated compliance report with threat analysis and response metrics."}
                        </p>
                        
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>
                            Period: {new Date(report.startDate).toLocaleDateString()} - {new Date(report.endDate).toLocaleDateString()}
                          </span>
                          <span>•</span>
                          <span>Generated {formatTimeAgo(report.generatedAt)}</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col space-y-1">
                        <Button size="sm" variant="ghost" className="text-blue-400 hover:text-blue-300 h-8 px-2">
                          <FileText size={14} className="mr-1" />
                          View
                        </Button>
                        <Button size="sm" variant="ghost" className="text-green-400 hover:text-green-300 h-8 px-2">
                          <Download size={14} className="mr-1" />
                          Download
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
    </>
  );
}
