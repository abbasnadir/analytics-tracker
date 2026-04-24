import { config } from "dotenv";
import { z } from "zod";

config();

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  MONGODB_URI: z.string().min(1),
  CORS_ORIGIN: z.string().default("*"),
  DEFAULT_API_KEY: z.string().min(1),
  JSON_BODY_LIMIT: z.string().default("256kb"),
  MAX_ANALYZER_EVENTS: z.coerce.number().int().positive().default(5000),
  EVENTS_TTL_DAYS: z.coerce.number().int().positive().default(90),
});

export const env = envSchema.parse(process.env);
