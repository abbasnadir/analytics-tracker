import { createApp } from "./app.js";
import { connectToDatabase } from "./config/database.js";
import { env } from "./config/env.js";

async function bootstrap() {
  await connectToDatabase();

  const app = createApp();
  app.listen(env.PORT, () => {
    console.log(`MetricFlow backend listening on http://localhost:${env.PORT}`);
  });
}

bootstrap().catch((error) => {
  console.error("Failed to start backend", error);
  process.exit(1);
});
