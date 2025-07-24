import { Link, useLocation } from "wouter";
import { Shield, Gauge, Search, ShieldQuestion, FileText, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import pwcLogo from "@assets/image_1753346439549.png";

const navigation = [
  { name: "Real-Time Threats", href: "/", icon: Gauge },
  { name: "Anomaly Detection", href: "/anomaly-detection", icon: Search },
  { name: "Fraud Detection", href: "/fraud-detection", icon: ShieldQuestion },
  // { name: "Compliance Reports", href: "/compliance-reports", icon: FileText },
];



export default function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex-shrink-0">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3 mb-4">
          {/* PWC Logo */}
          <div className="w-16 h-12 flex items-center justify-center">
            <img src={pwcLogo} alt="PwC Logo" className="h-8 w-auto" />
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center pwc-button-primary">
            <Shield className="text-white text-xl" size={24} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">TelecomSOC</h1>
            <p className="text-sm text-gray-600">AI Security Platform</p>
          </div>
        </div>
      </div>
      
      <nav className="mt-6">
        <div className="px-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Dashboard</p>
          <ul className="space-y-2">
            {navigation.map((item) => {
              const isActive = location === item.href;
              return (
                <li key={item.name}>
                  <Link href={item.href} className={cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    isActive
                      ? "text-white pwc-button-primary"
                      : "text-gray-700 hover:bg-gray-100"
                  )}>
                    <item.icon className="mr-3" size={18} />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
        

      </nav>
    </aside>
  );
}
