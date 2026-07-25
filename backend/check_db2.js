import mongoose from "mongoose";

async function check() {
  await mongoose.connect("mongodb://127.0.0.1:27017/smart-bus");
  const Tracking = mongoose.connection.collection("trackings");
  const docs = await Tracking.find({}).toArray();
  console.log("Trackings:");
  docs.forEach(d => {
    console.log(`Bus: ${d.bus}, Route: ${d.route}, routeId: ${d.routeId}, Stops Length: ${d.upcomingStops?.length}, ETA: ${d.eta}`);
  });
  
  const Routes = mongoose.connection.collection("routes");
  const r = await Routes.findOne({});
  console.log("Sample route stops length:", r?.stops?.length);
  process.exit(0);
}
check().catch(console.error);
