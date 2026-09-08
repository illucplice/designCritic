import express from "express";
import cors from "cors";
import helmet from "helmet";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { config, validateConfigOrExit } from "./config/index.js";
import analyzeRoutes from "./routes/analyze.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

validateConfigOrExit();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Required for express-rate-limit (and req.ip in general) to see the real
// client IP rather than the proxy's when deployed behind a reverse proxy /
// load balancer. Off by default in local dev; set TRUST_PROXY=1 (or a
// specific proxy count/CIDR per Express docs) in production behind a proxy.
if (config.trustProxy) {
  app.set("trust proxy", config.trustProxy === "true" ? true : config.trustProxy);
}

app.use(
  helmet({
    // This is an API (and optionally a static SPA host) that's meant to be
    // called cross-origin by the configured CORS_ORIGIN(s); the stricter
    // same-origin CORP default would block those fetches even though CORS
    // already allows them.
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(
  cors({
    origin: config.corsOrigins,
    methods: ["GET", "POST"],
  })
);
app.use(express.json({ limit: "1mb" }));

app.use("/api", analyzeRoutes);

// Optional: if the frontend has been built (npm run build in
// ../designcritic-ai), serve it from the same server so the whole app can
// run behind a single origin/port in production. Harmless no-op in dev.
const frontendDist = path.join(__dirname, "..", "designcritic-ai", "dist");
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(frontendDist, "index.html"));
  });
}

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`DesignCritic AI backend listening on http://localhost:${config.port}`);
});
