import { Schema, model } from "mongoose";

const stopSchema = new Schema({
  name: { type: String, required: true },
  timeOffset: { type: Number }, // offset in minutes from start
  type: { type: String, enum: ["start", "stop", "end"], default: "stop" },
});

const routeSchema = new Schema(
  {
    routeNo: { type: String, required: true, unique: true },
    from: { type: String, required: true },
    to: { type: String, required: true },
    via: { type: String },
    frequency: { type: String, required: true },
    status: { type: String, default: "On Time" },
    color: { type: String, default: "bg-green-600 text-white" },
    active: { type: Boolean, default: true },
    stops: [stopSchema],
    pathCoordinates: {
      type: [[Number]], // Array of [lat, lng] arrays
      required: true,
      validate: {
        validator: function (coords: unknown) {
          if (!Array.isArray(coords) || coords.length < 2) return false;
          return coords.every((coord) => {
            if (!Array.isArray(coord) || coord.length < 2) return false;
            const [lat, lng] = coord;
            return (
              typeof lat === "number" &&
              typeof lng === "number" &&
              Math.abs(lat) <= 90 &&
              Math.abs(lng) <= 180
            );
          });
        },
        message: "pathCoordinates must contain at least 2 valid [lat, lng] pairs",
      },
    },
  },
  { timestamps: true }
);

export const RouteModel = model("Route", routeSchema);
export default RouteModel;
