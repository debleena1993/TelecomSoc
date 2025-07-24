import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import AnomalyDetection from "@/pages/anomaly-detection";
import FraudDetection from "@/pages/fraud-detection";
import ComplianceReports from "@/pages/compliance-reports";
import TelecomAnalytics from "@/pages/TelecomAnalytics";
import FraudAnalysisDemo from "@/pages/FraudAnalysisDemo";
import Sidebar from "@/components/layout/sidebar";

function Router() {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Switch>
          <Route path="/" component={TelecomAnalytics} />
          <Route path="/anomaly-detection" component={AnomalyDetection} />
          <Route path="/fraud-detection" component={FraudDetection} />
          {/* <Route path="/compliance-reports" component={ComplianceReports} />
           */}
          <Route path="/fraud-analysis-demo" component={FraudAnalysisDemo} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
