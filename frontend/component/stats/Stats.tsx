import {
    Bus,
    Route,
    Users,
    Clock3,
  } from "lucide-react";
  
  const stats = [
    {
      value: "120+",
      label: "Active Buses",
      icon: Bus,
    },
    {
      value: "25+",
      label: "Routes",
      icon: Route,
    },
    {
      value: "50K+",
      label: "Happy Users",
      icon: Users,
    },
    {
      value: "98.7%",
      label: "On-time Performance",
      icon: Clock3,
    },
  ];
  
  const Stats = () => {
    return (
      <section className="border-y border-gray-200 bg-white py-10">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-wrap items-center justify-center gap-8 lg:justify-between">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
  
              return (
                <div
                  key={index}
                  className="flex items-center gap-4"
                >
                  {/* Icon */}
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-primary">
                    <Icon className="h-6 w-6" />
                  </div>
  
                  {/* Text */}
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      {stat.value}
                    </h3>
  
                    <p className="text-sm text-gray-500">
                      {stat.label}
                    </p>
                  </div>
  
                  {/* Divider */}
                  {index !== stats.length - 1 && (
                    <div className="ml-6 hidden h-12 w-px bg-gray-200 lg:block"></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    );
  };
  
  export default Stats;