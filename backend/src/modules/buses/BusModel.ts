import { Schema, model } from "mongoose";

const busSchema = new Schema(
  {
    busNumber: { type: String, required: true, unique: true },
    location: {
      lat: Number,
      lng: Number,
      updatedAt: {
        type: Date,
        default: Date.now,
      }
    },
    modelName: { type: String },
    capacity: { type: Number },
    // status: {
    //   type: String,
    //   enum: ["Active", "Maintenance", "Inactive"],
    //   default: "Active",
    // },
    driver: { type: Schema.Types.ObjectId, ref: "User" },
    assignedDriver: {
      type: Schema.Types.ObjectId,
      ref: "Driver",
      default: null,
    },

    assignedRoute: {
      type: Schema.Types.ObjectId,
      ref: "Route",
      default: null,
    },

    status: {
      type: String,
      enum: [
        "active",
        "inactive",
        "maintenance",
        "offline"
      ],
      default: "inactive",
    },
  },
  { timestamps: true }
);

export const BusModel = model("Bus", busSchema);
export default BusModel;
