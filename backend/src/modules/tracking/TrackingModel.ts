import { Schema, model } from "mongoose";

const trackingSchema = new Schema(
  {
    bus: { type: Schema.Types.ObjectId, ref: "Bus", required: true, unique: true },
    route: { type: Schema.Types.ObjectId, ref: "Route", required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    speed: { type: Number, default: 0 }, // in km/h
    nextStop: { type: String },
    eta: { type: String, default: "On Time" },
    status: { type: String, default: "Live" },
    currentIndex: { type: Number, default: 0 }, // Used for simulated movement along coordinate array
  },
  { timestamps: true }
);

export const TrackingModel = model("Tracking", trackingSchema);
export default TrackingModel;
