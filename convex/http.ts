import { httpRouter } from "convex/server";
import { handleWorkOSWebhook } from "./webhooks/workos";

const http = httpRouter();

// WorkOS webhook endpoint
http.route({
  path: "/webhooks/workos",
  method: "POST",
  handler: handleWorkOSWebhook,
});

export default http;
