import { Schema, model } from "mongoose";

const userSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true, minlength: [6, "Password must be at least 6 characters"] },
    role: {
      type: String,
      required: true,
      enum: ["passenger", "driver", "admin"],
      default: "passenger",
    },
  },
  { timestamps: true }
);

export const UserModel = model("User", userSchema);
export default UserModel;
