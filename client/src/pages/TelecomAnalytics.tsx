import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { Phone, MessageCircle, Shield, TrendingUp, MapPin, Wifi, AlertTriangle, Users, RefreshCw } from "lucide-react";
import { queryClient } from "@/lib/queryClient";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

export default function TelecomAnalytics() {
  const [timeRange, setTimeRange] = useState("week");

  // Fetch telecom activity stats (no auto-refresh)
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/telecom/stats", timeRange],
    queryFn: () => 
      fetch(`/api/telecom/stats?timeRange=${timeRange}`)
        .then(res => res.json()),
  });

  // Fetch overall risk analysis (no auto-refresh)
  const { data: riskData, isLoading: riskLoading } = useQuery({
    queryKey: ["/api/telecom/overall-risk"],
    queryFn: () => 
      fetch(`/api/telecom/overall-risk`)
        .then(res => res.json()),
  });

  // Fetch recent activities (no auto-refresh)
  const { data: activities, isLoading: activitiesLoading } = useQuery({
    queryKey: ["/api/telecom/activities"],
    queryFn: () => 
      fetch(`/api/telecom/activities?limit=10`)
        .then(res => res.json()),
  });

  // Fetch fraud activities (no auto-refresh)
  const { data: fraudActivities, isLoading: fraudLoading } = useQuery({
    queryKey: ["/api/telecom/fraud-activities"],
    queryFn: () => 
      fetch(`/api/telecom/fraud-activities`)
        .then(res => res.json()),
  });

  // Manual refresh function
  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/telecom/stats"] });
    queryClient.invalidateQueries({ queryKey: ["/api/telecom/overall-risk"] });
    queryClient.invalidateQueries({ queryKey: ["/api/telecom/activities"] });
    queryClient.invalidateQueries({ queryKey: ["/api/telecom/fraud-activities"] });
  };

  if (statsLoading || riskLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading telecom analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  const getRiskBadgeColor = (score: number) => {
    if (score >= 7) return "destructive";
    if (score >= 4) return "secondary";
    return "default";
  };

  const getRiskLabel = (score: number) => {
    if (score >= 7) return "High Risk";
    if (score >= 4) return "Medium Risk";
    return "Low Risk";
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Real-Time Threat Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time analysis of user communication patterns and fraud detection
          </p>
        </div>
        
        <div className="flex gap-4">
          <Button 
            onClick={handleRefresh}
            className="pwc-button-secondary"
            disabled={statsLoading || riskLoading || activitiesLoading || fraudLoading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${(statsLoading || riskLoading || activitiesLoading || fraudLoading) ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32 bg-muted text-foreground border-muted">
              <SelectValue className="text-foreground font-medium" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hour">1 Hour</SelectItem>
              <SelectItem value="24hours">24 Hours</SelectItem>
              <SelectItem value="week">1 Week</SelectItem>
              <SelectItem value="month">1 Month</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {stats && (
        <>
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalActivities?.toLocaleString() || '0'}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.callCount || 0} calls • {stats?.smsCount || 0} SMS
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Fraud Rate</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats?.fraudRate || 0}%</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.fraudCount || 0} fraud incidents detected
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">User Risk Score</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-bold">{riskData?.riskScore || 0}/10</div>
                  <Badge variant={getRiskBadgeColor(riskData?.riskScore || 0)}>
                    {getRiskLabel(riskData?.riskScore || 0)}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Top Location</CardTitle>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.topLocations?.[0]?.location || "N/A"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats?.topLocations?.[0]?.count || 0} activities
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Dashboard Components */}
          <div className="space-y-6">
            {/* Activity by Location */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Activity by Location
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={stats?.topLocations || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="location" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#0088FE" name="Total Activities" />
                    <Bar dataKey="fraudCount" fill="#FF8042" name="Fraud Incidents" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Recent Activities */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Recent Activities
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activitiesLoading ? (
                  <div className="text-center py-8">Loading activities...</div>
                ) : (
                  <div className="space-y-2">
                    {activities?.slice(0, 10).map((activity: any) => (
                      <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {activity.activityType === 'call' ? (
                            <Phone className="h-4 w-4 text-blue-600" />
                          ) : (
                            <MessageCircle className="h-4 w-4 text-green-600" />
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {activity.activityType.toUpperCase()} {activity.direction}
                              </span>
                              {activity.isSpamOrFraud === 1 && (
                                <Badge variant="destructive">FRAUD</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {activity.peerNumber} • {activity.location} • {activity.networkType}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {new Date(activity.timestamp).toLocaleTimeString()}
                          </div>
                          {activity.activityType === 'call' && (
                            <div className="text-xs text-muted-foreground">
                              {activity.durationSec}s
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Fraud Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  Fraud Detection Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                {fraudLoading ? (
                  <div className="text-center py-8">Loading fraud analysis...</div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-2xl font-bold text-red-600">{Array.isArray(fraudActivities) ? fraudActivities.length : 0}</div>
                          <p className="text-sm text-muted-foreground">Total Fraud Incidents</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-2xl font-bold text-orange-600">
                            {Array.isArray(fraudActivities) ? fraudActivities.filter((a: any) => a.activityType === 'call').length : 0}
                          </div>
                          <p className="text-sm text-muted-foreground">Fraudulent Calls</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-2xl font-bold text-yellow-600">
                            {Array.isArray(fraudActivities) ? fraudActivities.filter((a: any) => a.activityType === 'sms').length : 0}
                          </div>
                          <p className="text-sm text-muted-foreground">Fraudulent SMS</p>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="space-y-2">
                      {Array.isArray(fraudActivities) ? fraudActivities.slice(0, 5).map((activity: any) => (
                        <div key={activity.id} className="flex items-center justify-between p-3 border border-red-200 rounded-lg bg-red-50">
                          <div className="flex items-center gap-3">
                            {activity.activityType === 'call' ? (
                              <Phone className="h-4 w-4 text-red-600" />
                            ) : (
                              <MessageCircle className="h-4 w-4 text-red-600" />
                            )}
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-red-800">
                                  FRAUD: {activity.activityType.toUpperCase()} {activity.direction}
                                </span>
                                <Badge variant="destructive">HIGH RISK</Badge>
                              </div>
                              <p className="text-sm text-red-600">
                                {activity.peerNumber} • {activity.location} • {activity.networkType}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-red-800">
                              {new Date(activity.timestamp).toLocaleString()}
                            </div>
                            {activity.activityType === 'call' && (
                              <div className="text-xs text-red-600">
                                {activity.durationSec}s duration
                              </div>
                            )}
                          </div>
                        </div>
                      )) : []}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}