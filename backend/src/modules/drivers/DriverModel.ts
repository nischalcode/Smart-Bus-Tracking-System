import { Schema, model } from "mongoose";

const driverSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    licenseNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    licenseExpiry: {
      type: Date,
      required: true,
    },

    citizenshipNumber: {
      type: String,
      required: true,
      trim: true,
    },

    address: {
      type: String,
      default: "",
    },

    dateOfBirth: {
      type: Date,
    },

    experienceYears: {
      type: Number,
      default: 0,
    },

    emergencyContact: {
      type: String,
      default: "",
    },

    profileImage: {
      type: String,
      default: "",
    },

    licenseImage: {
      type: String,
      default: "",
    },

    citizenshipImage: {
      type: String,
      default: "",
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    verifiedAt: {
      type: Date,
      default: null,
    },

    rejectionReason: {
      type: String,
      default: "",
    },

    assignedBus: {
      type: Schema.Types.ObjectId,
      ref: "Bus",
      default: null,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "verified",
        "on_trip",
        "available",
        "inactive",
        "suspended",
      ],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

export default model("Driver", driverSchema);