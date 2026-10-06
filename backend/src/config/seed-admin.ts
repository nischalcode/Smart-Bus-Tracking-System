import dns from "node:dns";
dns.setServers(["1.1.1.1", "8.8.8.8"]);

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import UserModel from "../modules/users/UserModel.js";

dotenv.config();

const MONGODB_URL = process.env.MONGODB_URL!;
const MONGODB_NAME = process.env.MONGODB_NAME!;

async function seedAdmin() {
  try {
    await mongoose.connect(MONGODB_URL, { dbName: MONGODB_NAME });
    console.log("Connected to MongoDB...");

    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || "admin@smartbus.com";
    const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || "admin123";

    const existingAdmin = await UserModel.findOne({ email: superAdminEmail });
    if (existingAdmin) {
      console.log("Super admin user already exists:");
      console.log(`  Email:    ${superAdminEmail}`);
      console.log(`  Password: ${superAdminPassword}`);
      console.log("  Role:    ", existingAdmin.role);
      if (existingAdmin.role !== "super_admin") {
        await UserModel.updateOne({ _id: existingAdmin._id }, { $set: { role: "super_admin" } });
        console.log("  → Updated role to super_admin");
      }
      await mongoose.disconnect();
      return;
    }

    const hashedPassword = await bcrypt.hash(superAdminPassword, 10);
    await UserModel.create({
      name: "Super Admin",
      email: superAdminEmail,
      password: hashedPassword,
      role: "super_admin" as any,
    });

    console.log("Super admin user created successfully!");
    console.log(`  Email:    ${superAdminEmail}`);
    console.log(`  Password: ${superAdminPassword}`);
    console.log("  Role:     super_admin");

    await mongoose.disconnect();
  } catch (error) {
    console.error("Failed to seed admin user:", error);
    process.exit(1);
  }
}

seedAdmin();
