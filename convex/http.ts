import { httpRouter } from 'convex/server';
import { polar } from './polar';
import { handleWorkOSWebhook } from './webhooks/workos';

const http = httpRouter();

// WorkOS webhook endpoint
http.route({
  path: '/webhooks/workos',
  method: 'POST',
  handler: handleWorkOSWebhook,
});

// Polar webhook endpoint
polar.registerRoutes(http, {
  path: '/polar/events',
});

export default http;
