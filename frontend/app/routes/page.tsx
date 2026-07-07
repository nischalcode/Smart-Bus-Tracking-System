import Feature from "@/component/features/Feature";
import BusSearchHeader from "@/component/head/BusSearchHeader"
import MapView from "@/component/LiveTracking/MapView";
import RouteSidebar from "@/component/LiveTracking/RouteSidebar"
import Stats from "@/component/stats/Stats";
import TrackLayout from "@/component/track-layout/TrackLayout"

const routes = [
    {
      number: "12A",
      route: "City Center → Airport",
      frequency: "Every 10 min",
      status: "Live",
      color: "bg-primary text-white",
      active: true,
    },
    {
      number: "7B",
      route: "Central Park → Tech Hub",
      frequency: "Every 12 min",
      status: "Live",
      color: "bg-blue-100 text-blue-600",
      active: false,
    },
    {
      number: "9C",
      route: "Railway Station → City Center",
      frequency: "Every 15 min",
      status: "Live",
      color: "bg-purple-100 text-purple-600",
      active: false,
    },
    {
      number: "4D",
      route: "University → Market Street",
      frequency: "Every 20 min",
      status: "Live",
      color: "bg-yellow-100 text-yellow-600",
      active: false,
    },
  ];
const page = () => {
  return (
    <TrackLayout>
   <BusSearchHeader 
   tileFirst="Filter by Areas"
   firstOption="All Areas"
   titleSecond="Sort by"
   secondOption="Route Number"/>
   <div className="flex gap-2 p-5 ">
   <RouteSidebar routes={routes}
        title="Available Routes"
        description=""
        showSearch={false}
      />
      <MapView/>

   </div>
   <Stats/>
    </TrackLayout>
  )
}

export default page