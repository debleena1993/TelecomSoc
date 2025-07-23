import { Link, useLocation } from "wouter";
import { Shield, Gauge, Search, Bot, ShieldQuestion, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Real-Time Threats", href: "/", icon: Gauge },
  { name: "Anomaly Detection", href: "/anomaly-detection", icon: Search },
  { name: "Auto Response", href: "/auto-response", icon: Bot },
  { name: "Fraud Detection", href: "/fraud-detection", icon: ShieldQuestion },
  { name: "Compliance Reports", href: "/compliance-reports", icon: FileText },
];

const systemStatus = [
  { name: "Gemini AI", status: "online" },
  { name: "Detection Engine", status: "online" },
  { name: "Auto Response", status: "warning" },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-64 pwc-sidebar flex-shrink-0">
      <div className="p-6 border-b" style={{ borderColor: "var(--border-gray)" }}>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center pwc-button-primary">
            <Shield className="text-white text-xl" size={24} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">TelecomSOC</h1>
            <p className="text-sm text-gray-400">AI Security Platform</p>
          </div>
        </div>
      </div>
      
      <nav className="mt-6">
        <div className="px-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Dashboard</p>
          <ul className="space-y-2">
            {navigation.map((item) => {
              const isActive = location === item.href;
              return (
                <li key={item.name}>
                  <Link href={item.href}>
                    <a
                      className={cn(
                        "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                        isActive
                          ? "text-white pwc-button-primary"
                          : "text-gray-300 hover:bg-slate-700"
                      )}
                    >
                      <item.icon className="mr-3" size={18} />
                      {item.name}
                    </a>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
        
        <div className="px-4 mt-8">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">System Status</p>
          <div className="space-y-3">
            {systemStatus.map((system) => (
              <div key={system.name} className="flex items-center justify-between">
                <span className="text-sm text-gray-300">{system.name}</span>
                <span 
                  className={cn(
                    "status-indicator",
                    system.status === "online" && "status-online",
                    system.status === "warning" && "status-warning",
                    system.status === "offline" && "status-offline"
                  )}
                />
              </div>
            ))}
          </div>
        </div>
      </nav>
    </aside>
  );
}
