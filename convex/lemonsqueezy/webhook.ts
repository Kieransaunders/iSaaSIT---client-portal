/**
 * Lemon Squeezy Webhook Handler
 *
 * HTTP action that receives and processes Lemon Squeezy webhook events.
 * Verifies HMAC-SHA256 signatures before processing subscription lifecycle events.
 */

import { httpAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { verifySignature } from "./signature";

/**
 * Handle incoming Lemon Squeezy webhook requests
 *
 * POST /lemonsqueezy/webhook
 *
 * Flow:
 * 1. Read raw body (must be text, not JSON, for signature verification)
 * 2. Verify HMAC-SHA256 signature from X-Signature header
 * 3. Parse event and extract subscription data
 * 4. Call internal mutation to update org state
 * 5. Always return 200 (even for unhandled events to prevent LS retries)
 */
export const handleWebhook = httpAction(async (ctx, request) => {
  // Read raw body for signature verification
  // IMPORTANT: Must use request.text() first, not request.json()
  const rawBody = await request.text();

  // Get signature from header
  const signature = request.headers.get("X-Signature");
  if (!signature) {
    console.error("Missing X-Signature header");
    return new Response("Missing signature", { status: 401 });
  }

  // Get webhook secret from environment
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret) {
    console.error("LEMONSQUEEZY_WEBHOOK_SECRET not configured");
    return new Response("Webhook secret not configured", { status: 500 });
  }

  // Verify signature
  const isValid = await verifySignature(signature, rawBody, secret);
  if (!isValid) {
    console.error("Invalid webhook signature");
    return new Response("Invalid signature", { status: 401 });
  }

  // Parse webhook payload
  const payload = JSON.parse(rawBody);

  // Extract event name
  const eventName = payload.meta?.event_name;
  if (!eventName) {
    console.warn("Webhook missing event_name");
    return new Response(null, { status: 200 });
  }

  // Only process subscription events
  if (!eventName.startsWith("subscription_")) {
    // Not a subscription event - acknowledge and ignore
    return new Response(null, { status: 200 });
  }

  // Extract subscription data
  const subscriptionData = payload.data;
  const attributes = subscriptionData.attributes;
  const customData = payload.meta?.custom_data;

  // Extract org Convex ID from custom data (set during checkout)
  const orgConvexId = customData?.org_convex_id;

  // Extract subscription fields
  const subscriptionId = subscriptionData.id;
  const variantId = attributes.variant_id?.toString();
  const status = attributes.status;
  const customerId = attributes.customer_id?.toString();
  const trialEndsAt = attributes.trial_ends_at; // ISO string or null
  const endsAt = attributes.ends_at; // ISO string or null

  // Call internal mutation to process the event
  await ctx.runMutation(internal.lemonsqueezy.sync.processSubscriptionEvent, {
    eventName,
    customerId,
    subscriptionId,
    variantId,
    status,
    orgConvexId,
    trialEndsAt,
    endsAt,
  });

  // Always return 200 to acknowledge receipt
  return new Response(null, { status: 200 });
});
