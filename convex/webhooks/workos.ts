import { httpAction } from "../_generated/server";
import { internal } from "../_generated/api";

/**
 * Verify WorkOS webhook signature using HMAC SHA-256
 */
async function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    // WorkOS signature format: "t=timestamp,v1=signature"
    const signatureParts = signature.split(",");
    const timestamp = signatureParts.find((p) => p.startsWith("t="))?.split("=")[1];
    const expectedSig = signatureParts.find((p) => p.startsWith("v1="))?.split("=")[1];

    if (!timestamp || !expectedSig) {
      return false;
    }

    // Construct the signed payload: timestamp + "." + payload
    const signedPayload = `${timestamp}.${payload}`;

    // Compute HMAC SHA-256
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signatureBytes = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(signedPayload)
    );

    // Convert to hex string
    const computedSig = Array.from(new Uint8Array(signatureBytes))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Compare signatures (constant-time comparison would be better, but this is acceptable)
    return computedSig === expectedSig;
  } catch (error) {
    console.error("Signature verification error:", error);
    return false;
  }
}

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

    if (!signature) {
      return new Response("Missing workos-signature header", { status: 400 });
    }

    // Get webhook secret from environment
    const webhookSecret = process.env.WORKOS_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error("WORKOS_WEBHOOK_SECRET not configured");
      return new Response("Webhook secret not configured", { status: 500 });
    }

    // Verify the webhook signature
    const isValid = await verifyWebhookSignature(body, signature, webhookSecret);
    if (!isValid) {
      console.error("Webhook signature verification failed");
      return new Response("Invalid signature", { status: 400 });
    }

    // Parse the webhook event
    const event = JSON.parse(body);

    // Handle invitation.accepted event
    if (event.event === "invitation.accepted") {
      const invitationData = event.data;

      // Look up the pending invitation to get role and customerId
      const pendingInvitation = await ctx.runQuery(
        internal.invitations.internal.getPendingInvitationByWorkosId,
        { workosInvitationId: invitationData.id }
      );

      if (!pendingInvitation) {
        // Invitation not found in our records - may have been manually deleted
        // or this is a duplicate webhook. Log and acknowledge.
        console.warn(`Pending invitation not found for WorkOS ID: ${invitationData.id}`);
        return new Response("OK", { status: 200 });
      }

      // Look up the organization
      const org = await ctx.runQuery(
        internal.orgs.get.getOrgByWorkosOrgId,
        { workosOrgId: invitationData.organization_id }
      );

      if (!org) {
        console.error(`Organization not found for WorkOS ID: ${invitationData.organization_id}`);
        return new Response("Organization not found", { status: 500 });
      }

      // Sync the user to Convex
      await ctx.runMutation(internal.users.sync.syncFromInvitation, {
        workosUserId: invitationData.user_id,
        email: invitationData.email,
        firstName: invitationData.first_name,
        lastName: invitationData.last_name,
        orgId: org._id,
        role: pendingInvitation.role,
        customerId: pendingInvitation.customerId,
      });

      // Delete the pending invitation
      await ctx.runMutation(
        internal.users.sync.deletePendingInvitationByWorkosId,
        { workosInvitationId: invitationData.id }
      );

      console.log(`Successfully synced user ${invitationData.email} from invitation acceptance`);
      return new Response("OK", { status: 200 });
    }

    // Unknown event type - acknowledge but don't process
    console.log(`Received unknown webhook event type: ${event.event}`);
    return new Response("OK", { status: 200 });

  } catch (error) {
    console.error("Webhook processing error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(`Webhook processing failed: ${message}`, { status: 500 });
  }
});
