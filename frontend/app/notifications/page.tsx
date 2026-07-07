import ScheduleHeader from "@/component/head/ScheduleHeader";
import NotificationAlerts from "@/component/notification/NotificationAlerts";
import NotificationBanner from "@/component/notification/NotificationBanner";
import NotificationItems from "@/component/notification/NotificationItems";
import NotificationSettings from "@/component/settings/NotificationSettings";
import TrackLayout from "@/component/track-layout/TrackLayout";
import { TriangleAlert, CircleX, BusFront, Megaphone, Gift, Construction } from "lucide-react";

const page = () => {
  return (
    <TrackLayout>
      <div className="p-5 flex gap-15 ">
        <div className="flex flex-col gap-3">
          <div>
            <ScheduleHeader />
          </div>
          <div>
            <NotificationItems
              icon={TriangleAlert}
              title="Delay on Route 9C"
              description="Bus on Route 9C (Railway Station → City Center) is delayed by 15 minutes due to heavy traffic."
              badge="Alert"
              time="5 min ago"
            />

            <NotificationItems
              icon={BusFront}
              title="Bus Arriving Soon"
              description="Bus 12A will arrive aat green Street stop in 2 mins"
              badge="Service Update"
              time="8 min ago"
              iconBg="bg-blue-100"
              iconColor="text-blue-500"
              badgeBg="bg-green-100"
              badgeColor="text-green-600"
            />

            <NotificationItems
              icon={CircleX}
              title="Road Closure on Airport Road"
              description="AIrport Road is closed for minantenance from Jun 2 - Jun 4. BUssed may take alternative routes"
              badge="Alert"
              time="1 hr ago"
              iconBg="bg-green-100"
              iconColor="text-red-500"
              badgeBg="bg-red-100"
              badgeColor="text-red-600"
            />
            <NotificationItems
            icon={Megaphone}
            title="New Schedule Released"
            description="New weekend schedule for Route 7B (Central Park to Tech Hub) is now available."
            badge="Service Update"
            time="3 hours ago"
            iconBg="bg-purple-200"
            iconColor="text-purple-500"
            badgeBg="bg-blue-100"
            badgeColor="text-blue-600"
            />
            <NotificationItems
            icon={Gift}
            title="Student Discount Offer"
            description="Get 20% off on monthly passes for students. Offer vaild till JUn 30, 2025"
            badge="Promotion"
            time="1 day ago"
            iconBg="bg-green-100"
            iconColor="text-green-500"
            badgeBg="bg-purple-100"
            badgeColor="text-purple-500"
           

            />
            <NotificationItems
            icon={Construction}
            title="System Maintenence"
            description="Our system will be under maintenance on Jun 5 from 01:00 to 03:00 AM."
            badge="General"
            time="1 day ago"
            iconBg="bg-yellow-100"
            iconColor="text-yellow-500"
            badgeBg="bg-gray-100"
            badgeColor="text-gray-500"

            />

            <div className="p-4 border-t border-brand-lightgray text-center">
              <button className="text-brand-darkgreen font-medium text-sm hover:underline flex items-center justify-center gap-2 mx-auto">
                Load More <i className="fa-solid fa-chevron-down text-xs"></i>
              </button>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col gap-3">
          <div>
           <NotificationAlerts/>
          </div>
          <div>
            <NotificationSettings/>
          </div>
          <div>
            <NotificationBanner/>
          </div>
        </div>
      </div>
    </TrackLayout>
  );
};

export default page;
