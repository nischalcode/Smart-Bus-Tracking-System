import mongoose from "mongoose";
import { calculateHaversineDistance } from "./src/utils/haversine.js";
import { enrichTrackingData } from "./src/utils/trackingLogic.js";
import TrackingModel from "./src/modules/tracking/TrackingModel.js";
import StopModel from "./src/modules/stops/StopModel.js";
import RouteModel from "./src/modules/routes/RouteModel.js";

async function check() {
  try {
    await mongoose.connect("mongodb+srv://nischaljoshi369_db_user:hX0EyXipx2k6e2Rj@sbts.i2wm8r3.mongodb.net/nischaljoshi369_db_user?appName=sbts");
    console.log("Connected to MongoDB.");

    const latestTracking = await TrackingModel.findOne().sort({ createdAt: -1 });
    if (!latestTracking) {
      console.log("No tracking data found.");
      process.exit(0);
    }
    
    console.log("\n--- LATEST TRACKING DOCUMENT ---");
    console.log("Bus ID:", latestTracking.busId);
    console.log("Route ID:", latestTracking.routeId);
    console.log("Lat:", latestTracking.latitude, "Lng:", latestTracking.longitude);
    console.log("Current Stop:", latestTracking.currentStop);
    console.log("Next Stop:", latestTracking.nextStop);
    console.log("Is Stopped:", latestTracking.isStopped);
    console.log("Upcoming Stops Data:", JSON.stringify(latestTracking.upcomingStops, null, 2));

    const stopDoc = await StopModel.findOne({ routeId: latestTracking.routeId });
    if (!stopDoc) {
      console.log("\nNO STOP DOC FOUND FOR ROUTE ID:", latestTracking.routeId);
    } else {
      console.log("\n--- STOP MODEL STOPS ---");
      stopDoc.stops.forEach(s => {
        const dist = calculateHaversineDistance(latestTracking.latitude, latestTracking.longitude, s.lat, s.lng);
        console.log(`- ${s.name}: lat=${s.lat}, lng=${s.lng} | Dist to bus = ${dist} km`);
      });
      
      const enrichment = enrichTrackingData(
        latestTracking.latitude,
        latestTracking.longitude,
        20,
        "Coming",
        stopDoc.stops as any
      );
      
      console.log("\n--- ENRICHMENT OUTPUT WITH STOP MODEL ---");
      console.log(JSON.stringify(enrichment, null, 2));
    }

    const routeDoc = await RouteModel.findById(latestTracking.routeId);
    if (!routeDoc) {
      console.log("\nNO ROUTE DOC FOUND FOR ROUTE ID:", latestTracking.routeId);
    } else {
      console.log("\n--- ROUTE MODEL STOPS ---");
      routeDoc.stops.forEach(s => {
        console.log(`- ${s.name}: lat=${s.lat}, lng=${s.lng}`);
      });
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
