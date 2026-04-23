import { config } from "dotenv";
import { z } from "zod";

config();

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  MONGODB_URI: z.string().min(1),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  DEFAULT_API_KEY: z.string().min(1)
});

export const env = envSchema.parse(process.env);
