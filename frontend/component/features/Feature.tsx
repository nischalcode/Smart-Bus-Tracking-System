import {
    MapPin,
    Route,
    Clock3,
    Bell,
    ShieldCheck,
  } from "lucide-react";
  
  const features = [
    {
      title: "Live Tracking",
      description: "Track buses in real-time on the map.",
      icon: MapPin,
    },
    {
      title: "Route Information",
      description: "View available routes and stops instantly.",
      icon: Route,
    },
    {
      title: "Bus Schedule",
      description: "Check arrival and departure times easily.",
      icon: Clock3,
    },
    {
      title: "Notifications",
      description: "Receive delay and arrival alerts in real time.",
      icon: Bell,
    },
    {
      title: "Safe & Reliable",
      description: "Travel with confidence using accurate tracking.",
      icon: ShieldCheck,
    },
  ];
  
  const Feature = () => {
    return (
        <section className="max-w-7xl mx-auto px-2">
<section className="w-full py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
  
            return (
              <div
                key={index}
                className="flex gap-4 p-5 bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300"
              >
                <div className="bg-blue-100 p-3 rounded-lg h-fit">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
  
                <div>
                  <h3 className="text-lg font-semibold">{feature.title}</h3>
                  <p className="text-gray-500 text-sm mt-1">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
      </section>
    );
  };
  
  export default Feature;