import { Schema, model, type Document, type Types } from "mongoose";

export interface ITracking extends Document {
  bus: Types.ObjectId;
  route: Types.ObjectId;
  latitude: number;
  longitude: number;
  speed: number;
  speedHistory: number[];
  heading: number;
  distanceTraveled: number;
  nextStop?: string;
  nextStopEtaSeconds: number;
  eta: string;
  status: string;
  currentIndex: number;
  createdAt: Date;
  updatedAt: Date;
}

const trackingSchema = new Schema<ITracking>(
  {
    bus: { type: Schema.Types.ObjectId, ref: "Bus", required: true, unique: true },
    route: { type: Schema.Types.ObjectId, ref: "Route", required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    speed: { type: Number, default: 0 }, // in km/h
    speedHistory: { type: [Number], default: [] },
    heading: { type: Number, default: 0 },
    distanceTraveled: { type: Number, default: 0 },
    nextStop: { type: String },
    nextStopEtaSeconds: { type: Number, default: 0 },
    eta: { type: String, default: "On Time" },
    status: { type: String, default: "Live" },
    currentIndex: { type: Number, default: 0 }, // nearest segment index on the route path
  },
  { timestamps: true }
);

export const TrackingModel = model<ITracking>("Tracking", trackingSchema);
export default TrackingModel;
