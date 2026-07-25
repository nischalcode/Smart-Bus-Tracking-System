import { Schema, model } from "mongoose";

const trackingSchema = new Schema(
  {
    driverId: { type: String, required: true },
    driverName: { type: String, required: true },
    busId: { type: Schema.Types.ObjectId, ref: "Bus", required: true },
    busNo: { type: String, required: true },
    routeId: { type: Schema.Types.ObjectId, ref: "Route", default: null },
    routeName: { type: String, required: true },
    direction: { type: String, enum: ["Going", "Coming"], default: "Going" },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    accuracy: { type: Number, default: 0 },
    speed: { type: Number, default: 0 }, // Speed in km/h calculated via Haversine formula
    timestamp: { type: Date, default: Date.now },
    // Backwards-compatible reference aliases
    bus: { type: Schema.Types.ObjectId, ref: "Bus" },
    route: { type: Schema.Types.ObjectId, ref: "Route" },
    status: { type: String, enum: ["Live", "Inactive", "Stopped"], default: "Live" },
    
    // Geofence & Stop tracking
    currentStopIndex: { type: Number, default: -1 }, // Index in route stops array
    currentStopName: { type: String, default: null }, // Human-readable current stop name
    nextStopIndex: { type: Number, default: 0 }, // Index of next stop
    nextStopName: { type: String, default: null }, // Human-readable next stop name
    previousStopIndex: { type: Number, default: -1 }, // Index of previous stop
    previousStopName: { type: String, default: null }, // Human-readable previous stop name
    
    // Distance & ETA calculations
    distanceToNextStop: { type: Number, default: null }, // Distance in meters
    etaToNextStop: { type: Number, default: null }, // ETA in minutes

    // Simulator state
    currentIndex: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Index for fast lookups by bus and route
trackingSchema.index({ busId: 1, createdAt: -1 });
trackingSchema.index({ busNo: 1, createdAt: -1 });
trackingSchema.index({ routeId: 1, createdAt: -1 });
trackingSchema.index({ status: 1 }); // New index for filtering by status

export const TrackingModel = model("Tracking", trackingSchema);
export default TrackingModel;
