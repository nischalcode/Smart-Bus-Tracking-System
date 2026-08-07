"use client";
import { Smartphone, Users, Earth, ShieldCheck, Bell } from "lucide-react";
import { useEffect } from "react";
import { Marker, Polyline, Popup, TileLayer, MapContainer } from "react-leaflet";
import L from "leaflet";
import { useLanguage } from "@/context/LanguageContext";

import { initLeafletIcons } from "@/utils/leaflet";

const features = [
  {
    title: "why_choose.save_time.title",
    description: "why_choose.save_time.description",
    icon: Smartphone,
  },
  {
    title: "why_choose.travel_smart.title",
    description: "why_choose.travel_smart.description",
    icon: Users,
  },
  {
    title: "why_choose.eco_friendly.title",
    description: "why_choose.eco_friendly.description",
    icon: Earth,
  },
  {
    title: "why_choose.secure_reliable.title",
    description: "why_choose.secure_reliable.description",
    icon: ShieldCheck,
  },
];

const WhyChoose = () => {
  const { t } = useLanguage();

  useEffect(() => {
    initLeafletIcons();
  }, []);
  return (
    <section className="py-20 px-6 lg:px-16 bg-background text-foreground relative transition-colors">
      <div className="mx-auto flex flex-col lg:flex-row items-center gap-16">
       
        <div className="w-full lg:w-1/2 p-4 sm:p-10">
          <h2 className="text-3xl lg:text-4xl font-bold mb-2 text-foreground">
            {t("why_choose.title")}
          </h2>

          <div className="w-16 h-1 bg-primary mb-10"></div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-10">
            {features.map((feature, index) => {
              const Icon = feature.icon;

              return (
                <div key={index} className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <Icon className="w-6 h-6" />
                  </div>

                  <div>
                    <h4 className="text-sm font-bold mb-2 text-foreground">
                      {t(feature.title)}
                    </h4>

                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {t(feature.description)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

       
        <div className="w-full lg:w-1/2 flex justify-center items-center relative py-10 lg:py-0">
          <div className="relative w-[280px] sm:w-[320px] aspect-[9/19] shrink-0">
           
            <div className="absolute inset-0 bg-background rounded-[40px] border-[6px] sm:border-8 border-sidebar shadow-2xl overflow-hidden">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 sm:w-32 h-5 sm:h-6 bg-sidebar rounded-b-2xl z-50"></div>

              <div className="relative h-full w-full bg-muted">
              
                <MapContainer
                  center={[27.7172, 85.324]}
                  zoom={14}
                  zoomControl={false}
                  dragging={false}
                  scrollWheelZoom={false}
                  doubleClickZoom={false}
                  touchZoom={false}
                  keyboard={false}
                  attributionControl={false}
                  className="h-full w-full z-0"
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                  <Polyline
                    positions={[
                      [27.7172, 85.324],
                      [27.7205, 85.329],
                      [27.724, 85.334],
                    ]}
                    pathOptions={{
                      color: "#22c55e", 
                      weight: 5,
                    }}
                  />

                  <Marker position={[27.724, 85.334]}>
                    <Popup>Bus 12A</Popup>
                  </Marker>
                </MapContainer>

                <div className="absolute top-12 left-4 right-4 z-20 rounded-xl border border-border bg-card p-4 shadow-md">
                  <h3 className="text-xl font-bold text-foreground">12A</h3>

                  <p className="text-xs text-muted-foreground border-b border-border pb-3 mb-3">
                    City Center → Airport
                  </p>

                  <p className="text-[10px] text-muted-foreground">Next Stop</p>

                  <h4 className="text-sm font-bold text-foreground">Green Street</h4>

                  <p className="text-primary text-xs font-semibold">
                    2 min away
                  </p>
                </div>
              </div>
            </div>

           
            <div className="absolute top-24 -right-4 sm:-right-6 z-50 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-xl">
              <Bell className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyChoose;
