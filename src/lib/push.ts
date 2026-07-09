import webpush from "web-push";
import { supabaseAdmin } from "@/lib/supabase/admin";

webpush.setVapidDetails(
  `mailto:${process.env.VAPID_EMAIL ?? "admin@ciit.edu.ph"}`,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

type PushPayload = {
  title: string;
  body: string;
  link?: string;
};

/**
 * Sends a web push notification to a specific user.
 * Silently fails if the user has no push subscription — not all users
 * grant push permission, and that's fine.
 */
export async function sendPushToUser(
  userId: string,
  payload: PushPayload,
): Promise<void> {
  const { data: subscriptions } = await supabaseAdmin
    .from("push_subscriptions")
    .select("subscription")
    .eq("user_id", userId);

  if (!subscriptions || subscriptions.length === 0) return;

  const message = JSON.stringify(payload);

  await Promise.allSettled(
    subscriptions.map(async (row) => {
      try {
        await webpush.sendNotification(row.subscription, message);
      } catch (err: unknown) {
        // 410 Gone = subscription expired/revoked — remove it
        if (
          err &&
          typeof err === "object" &&
          "statusCode" in err &&
          (err as { statusCode: number }).statusCode === 410
        ) {
          await supabaseAdmin
            .from("push_subscriptions")
            .delete()
            .eq("user_id", userId)
            .eq("subscription->>endpoint", row.subscription.endpoint);
        }
      }
    }),
  );
}

/**
 * Sends a broadcast push to ALL users who have subscribed.
 * Used for admin announcements.
 */
export async function sendPushBroadcast(payload: PushPayload): Promise<void> {
  const { data: subscriptions } = await supabaseAdmin
    .from("push_subscriptions")
    .select("user_id, subscription");

  if (!subscriptions || subscriptions.length === 0) return;

  const message = JSON.stringify(payload);

  await Promise.allSettled(
    subscriptions.map(async (row) => {
      try {
        await webpush.sendNotification(row.subscription, message);
      } catch (err: unknown) {
        if (
          err &&
          typeof err === "object" &&
          "statusCode" in err &&
          (err as { statusCode: number }).statusCode === 410
        ) {
          await supabaseAdmin
            .from("push_subscriptions")
            .delete()
            .eq("user_id", row.user_id)
            .eq("subscription->>endpoint", row.subscription.endpoint);
        }
      }
    }),
  );
}
