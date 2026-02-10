import { httpAction } from "../_generated/server";
import { processWorkOSWebhook } from "./workosShared";

/**
 * Handle WorkOS webhook events
 * Currently handles: invitation.accepted
 */
export const handleWorkOSWebhook = httpAction(async (ctx, request) => {
  try {
    // Read the raw request body
    const body = await request.text();

    // Get the webhook signature header
    const signature = request.headers.get("workos-signature");

    // Get webhook secret from environment
    const webhookSecret = process.env.WORKOS_WEBHOOK_SECRET;

    const result = await processWorkOSWebhook(
      ctx,
      body,
      signature ?? "",
      webhookSecret ?? ""
    );

    return new Response(result.message, { status: result.status });
  } catch (error) {
    console.error("Webhook processing error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(`Webhook processing failed: ${message}`, { status: 500 });
  }
});
