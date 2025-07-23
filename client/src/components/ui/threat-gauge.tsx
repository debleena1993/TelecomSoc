import { cn } from "@/lib/utils";

interface ThreatGaugeProps {
  value: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  className?: string;
}

export default function ThreatGauge({ 
  value, 
  max = 10, 
  size = "md", 
  showValue = true,
  className 
}: ThreatGaugeProps) {
  const percentage = Math.min((value / max) * 100, 100);
  
  const getSeverityColor = () => {
    if (percentage >= 85) return "text-red-500 stroke-red-500";
    if (percentage >= 70) return "text-yellow-500 stroke-yellow-500";
    if (percentage >= 50) return "text-blue-400 stroke-blue-400";
    return "text-green-500 stroke-green-500";
  };

  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-32 h-32"
  };

  const textSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base"
  };

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className={cn("threat-gauge", sizeClasses[size], className)}>
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        {/* Background circle */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-slate-700"
        />
        
        {/* Progress circle */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          className={getSeverityColor()}
          style={{
            strokeDasharray,
            strokeDashoffset,
            transition: "stroke-dashoffset 0.5s ease-in-out",
          }}
        />
      </svg>
      
      {showValue && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("font-bold", getSeverityColor(), textSizes[size])}>
            {value.toFixed(1)}
          </span>
        </div>
      )}
    </div>
  );
}
