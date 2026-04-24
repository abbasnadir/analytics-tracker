import { Schema, model } from "mongoose";

type ApiKeyDocument = {
  tenantId: string;
  key: string;
  type: "publishable" | "secret";
  status: "active" | "disabled";
  allowedOrigins: string[];
  createdAt: string;
  updatedAt: string;
};

const apiKeySchema = new Schema<ApiKeyDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    key: { type: String, required: true, unique: true, index: true },
    type: {
      type: String,
      required: true,
      enum: ["publishable", "secret"],
      default: "publishable",
    },
    status: {
      type: String,
      required: true,
      enum: ["active", "disabled"],
      default: "active",
    },
    allowedOrigins: {
      type: [String],
      default: [],
    },
    createdAt: {
      type: String,
      required: true,
      default: () => new Date().toISOString(),
    },
    updatedAt: {
      type: String,
      required: true,
      default: () => new Date().toISOString(),
    },
  },
  {
    timestamps: false,
    collection: "api_keys",
  },
);

export const ApiKeyModel = model<ApiKeyDocument>("ApiKey", apiKeySchema);
