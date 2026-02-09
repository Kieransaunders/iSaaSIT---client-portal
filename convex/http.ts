import { httpRouter } from "convex/server";
import { handleWorkOSWebhook } from "./webhooks/workos";
import { handleWebhook } from "./lemonsqueezy/webhook";

const http = httpRouter();

// WorkOS webhook endpoint
http.route({
  path: "/webhooks/workos",
  method: "POST",
  handler: handleWorkOSWebhook,
});

// Lemon Squeezy webhook endpoint
http.route({
  path: "/lemonsqueezy/webhook",
  method: "POST",
  handler: handleWebhook,
});

export default http;
