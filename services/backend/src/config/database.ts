import mongoose from "mongoose";
import { env } from "./env.js";

export async function connectToDatabase() {
  await mongoose.connect(env.MONGODB_URI);
}

export async function pingDatabase() {
  const start = Date.now();
  await mongoose.connection.db?.admin().ping();
  return Date.now() - start;
}

export function isDatabaseConnected() {
  return mongoose.connection.readyState === 1;
}
