import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { Phone, MessageCircle, Shield, TrendingUp, MapPin, Wifi, AlertTriangle, Users } from "lucide-react";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

export default function TelecomAnalytics() {
  const [selectedUserId, setSelectedUserId] = useState("U001");
  const [timeRange, setTimeRange] = useState("week");

  // Fetch telecom activity stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/telecom/stats", selectedUserId, timeRange],
    queryFn: () => 
      fetch(`/api/telecom/stats?userId=${selectedUserId}&timeRange=${timeRange}`)
        .then(res => res.json()),
    refetchInterval: 10000,
  });

  // Fetch user risk score
  const { data: riskData, isLoading: riskLoading } = useQuery({
    queryKey: ["/api/telecom/user-risk", selectedUserId],
    queryFn: () => 
      fetch(`/api/telecom/user-risk/${selectedUserId}`)
        .then(res => res.json()),
    refetchInterval: 30000,
  });

  // Fetch recent activities
  const { data: activities, isLoading: activitiesLoading } = useQuery({
    queryKey: ["/api/telecom/activities", selectedUserId],
    queryFn: () => 
      fetch(`/api/telecom/activities?userId=${selectedUserId}&limit=10`)
        .then(res => res.json()),
    refetchInterval: 5000,
  });

  // Fetch fraud activities
  const { data: fraudActivities, isLoading: fraudLoading } = useQuery({
    queryKey: ["/api/telecom/fraud-activities", selectedUserId],
    queryFn: () => 
      fetch(`/api/telecom/fraud-activities?userId=${selectedUserId}`)
        .then(res => res.json()),
    refetchInterval: 10000,
  });

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
          <h1 className="text-3xl font-bold">Telecom User Analytics</h1>
          <p className="text-muted-foreground">
            Real-time analysis of user communication patterns and fraud detection
          </p>
        </div>
        
        <div className="flex gap-4">
          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="U001">User U001</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
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
                <div className="text-2xl font-bold">{stats.totalActivities.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.callCount} calls • {stats.smsCount} SMS
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Fraud Rate</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.fraudRate}%</div>
                <p className="text-xs text-muted-foreground">
                  {stats.fraudCount} fraud incidents detected
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
                  {stats.topLocations[0]?.location || "N/A"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.topLocations[0]?.count || 0} activities
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
                  <BarChart data={stats.topLocations}>
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
                          <div className="text-2xl font-bold text-red-600">{fraudActivities?.length || 0}</div>
                          <p className="text-sm text-muted-foreground">Total Fraud Incidents</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-2xl font-bold text-orange-600">
                            {fraudActivities?.filter((a: any) => a.activityType === 'call').length || 0}
                          </div>
                          <p className="text-sm text-muted-foreground">Fraudulent Calls</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-2xl font-bold text-yellow-600">
                            {fraudActivities?.filter((a: any) => a.activityType === 'sms').length || 0}
                          </div>
                          <p className="text-sm text-muted-foreground">Fraudulent SMS</p>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="space-y-2">
                      {fraudActivities?.slice(0, 5).map((activity: any) => (
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
                      ))}
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