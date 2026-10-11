import { onRequest } from "firebase-functions/v2/https";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isAfricaRegion, AFRICA_COUNTRY_NAMES } from "./africa-regions.js";
import { renderBlockedPage } from "./blocked-template.js";
import { companionMiddleware } from "./companion.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const companionApi = companionMiddleware(process.env);
export const companion = onRequest(
  { region: "asia-southeast1", invoker: "public", maxInstances: 1, concurrency: 20, timeoutSeconds: 60 },
  (req, res) => companionApi(req, res, () => {
    res.status(404).json({ error: "unknown companion route" });
  }),
);

/**
 * Cloud Function gatekeeper: Inspects the client's location and blocks African regions.
 * In Firebase Hosting / Google Cloud, Google Front End (GFE) injects the `x-appengine-country` header.
 */
export const geoGatekeeper = onRequest(
  {
    region: "asia-southeast1",
    cors: true,
  },
  (req, res) => {
    // 1. Locate detected country from GFE header (with dev/query fallbacks for testing)
    const detectedCountry = (
      req.headers["x-appengine-country"] ||
      req.query.test_country ||
      req.query.country ||
      req.headers["x-mock-country"] ||
      ""
    )
      .toString()
      .trim()
      .toUpperCase();

    // 2. Check if the region belongs to Africa
    if (isAfricaRegion(detectedCountry)) {
      const countryName = AFRICA_COUNTRY_NAMES[detectedCountry] || "Africa";

      res.set({
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
        "Content-Type": "text/html; charset=utf-8",
        "X-Geo-Blocked": "true",
        "X-Geo-Country": detectedCountry,
      });

      res.status(403).send(renderBlockedPage(detectedCountry, countryName));
      return;
    }

    // 3. Allowed region: Serve index.html
    const candidatePaths = [
      path.resolve(__dirname, "../dist/index.html"),
      path.resolve(__dirname, "./dist/index.html"),
      path.resolve(__dirname, "./index.html"),
    ];

    const indexPath = candidatePaths.find((p) => fs.existsSync(p));

    if (indexPath) {
      const html = fs.readFileSync(indexPath, "utf-8");
      res.set({
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
        "Content-Type": "text/html; charset=utf-8",
        "X-Geo-Blocked": "false",
        "X-Geo-Country": detectedCountry || "ALLOWED",
      });
      res.status(200).send(html);
    } else {
      res
        .status(500)
        .type("text/plain")
        .send(
          "500 Internal Error: Dist index.html not found. Run `pnpm build` before running the server."
        );
    }
  }
);

/**
 * Simple JSON health check & geo-inspection API endpoint
 */
export const geoCheck = onRequest(
  {
    region: "asia-southeast1",
    cors: true,
  },
  (req, res) => {
    const country = (
      req.headers["x-appengine-country"] ||
      req.query.test_country ||
      req.query.country ||
      req.headers["x-mock-country"] ||
      ""
    )
      .toString()
      .trim()
      .toUpperCase();

    const blocked = isAfricaRegion(country);

    res.json({
      country: country || "UNKNOWN",
      countryName: AFRICA_COUNTRY_NAMES[country] || null,
      isAfrica: blocked,
      blocked,
      message: blocked
        ? "your regions doesn't has flood this website isn't useful for your regions"
        : "Region allowed",
    });
  }
);
