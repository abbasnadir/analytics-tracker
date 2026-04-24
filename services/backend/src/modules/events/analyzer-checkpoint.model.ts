import { Schema, model } from "mongoose";

type AnalyzerCheckpointDocument = {
  tenantId: string;
  lastProcessedAt: string;
  updatedAt: string;
  createdAt: Date;
  modifiedAt: Date;
};

const analyzerCheckpointSchema = new Schema<AnalyzerCheckpointDocument>(
  {
    tenantId: { type: String, required: true, unique: true, index: true },
    lastProcessedAt: { type: String, required: true },
    updatedAt: { type: String, required: true },
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: "modifiedAt" },
    collection: "analyzer_checkpoints",
  },
);

export const AnalyzerCheckpointModel = model<AnalyzerCheckpointDocument>(
  "AnalyzerCheckpoint",
  analyzerCheckpointSchema,
);
