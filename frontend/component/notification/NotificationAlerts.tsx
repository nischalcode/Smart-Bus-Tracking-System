import Link from "next/link";
import { TriangleAlert, Construction, CloudRain } from "lucide-react";

const alerts = [
  {
    title: "Delay on Route 9C",
    description: "15 min delay",
    time: "5 min ago",
    icon: TriangleAlert,
    iconBg: "bg-red-100",
    iconColor: "text-red-600",
  },
  {
    title: "Road Closure on Airport Road",
    description: "Jun 2 - Jun 4",
    time: "1 hour ago",
    icon: Construction,
    iconBg: "bg-orange-100",
    iconColor: "text-orange-600",
  },
  {
    title: "Heavy Rain Alert",
    description: "Carry umbrella and be safe",
    time: "2 hours ago",
    icon: CloudRain,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
];

const NotificationAlerts = () => {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
 
  <div className="mb-4 flex items-center justify-between">
    <h3 className="font-bold">Active Alerts</h3>

    <Link
      href="/notifications"
      className="text-sm font-medium text-primary hover:underline"
    >
      View All
    </Link>
  </div>

 
  <div className="space-y-4">
    {alerts.map((alert, index) => {
      const Icon = alert.icon;

      return (
        <div key={index} className="flex items-start gap-3">
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${alert.iconBg} ${alert.iconColor}`}
          >
            <Icon className="h-4 w-4" />
          </div>

          <div className="flex-1">
            <h4 className="text-sm font-semibold">
              {alert.title}
            </h4>

            <div className="mt-1 flex justify-between gap-4 text-xs text-gray-500">
              <span>{alert.description}</span>

              <span>{alert.time}</span>
            </div>
          </div>
        </div>
      );
    })}
  </div>

  
  <button className="mt-4 w-full rounded-lg border border-red-200 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50">
    View All Alerts
  </button>
</div>
  )
}

export default NotificationAlerts