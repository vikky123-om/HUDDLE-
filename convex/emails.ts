"use node";

import { internalAction } from "./_generated/server";
import { v } from "convex/values";

/**
 * Sends an email via Resend.
 * Requires RESEND_API_KEY set in Convex environment variables:
 *   npx convex env set RESEND_API_KEY re_xxxx
 *
 * Also update FROM_EMAIL below to your verified sender address.
 */
const FROM_EMAIL = "Huddle <noreply@yourdomain.com>";

export const sendNotificationEmail = internalAction({
  args: {
    toEmail: v.string(),
    toName: v.string(),
    type: v.union(v.literal("accepted"), v.literal("declined")),
    activityTitle: v.string(),
    hostName: v.string(),
  },
  handler: async (_ctx, { toEmail, toName, type, activityTitle, hostName }) => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn("RESEND_API_KEY not set — skipping email notification");
      return;
    }

    const isAccepted = type === "accepted";
    const subject = isAccepted
      ? `You're in! "${activityTitle}" accepted your request`
      : `Update on "${activityTitle}"`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f7ead3; margin: 0; padding: 40px 16px; }
    .card { background: #fdfaf2; border-radius: 12px; max-width: 520px; margin: 0 auto; padding: 36px 32px; border: 1px solid rgba(143,91,47,0.15); box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .logo { font-size: 28px; font-weight: 900; color: #3d2010; margin-bottom: 24px; letter-spacing: -0.5px; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 700; margin-bottom: 16px; ${isAccepted ? "background: #d1fae5; color: #065f46; border: 1px solid #a7f3d0;" : "background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5;"} }
    h1 { color: #3d2010; font-size: 22px; font-weight: 800; margin: 0 0 12px; }
    p { color: #5c4a38; line-height: 1.6; margin: 0 0 16px; }
    .activity { background: rgba(143,91,47,0.06); border: 1px solid rgba(143,91,47,0.12); border-radius: 8px; padding: 14px 16px; margin: 20px 0; }
    .activity-title { font-weight: 700; color: #3d2010; font-size: 16px; }
    .cta { display: inline-block; margin-top: 20px; background: #8f5b2f; color: #fdfaf2; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 14px; }
    .footer { margin-top: 28px; padding-top: 20px; border-top: 1px solid rgba(143,91,47,0.1); font-size: 12px; color: #9c7a5e; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">Huddle</div>
    <div class="badge">${isAccepted ? "✅ Accepted" : "❌ Declined"}</div>
    <h1>${isAccepted ? `You're in, ${toName}!` : `Update on your request`}</h1>
    <p>${isAccepted
      ? `Great news! <strong>${hostName}</strong> has accepted your request to join:`
      : `<strong>${hostName}</strong> has declined your request to join:`
    }</p>
    <div class="activity">
      <div class="activity-title">${activityTitle}</div>
    </div>
    ${isAccepted
      ? `<p>Head over to Huddle to see the full details including the location, and say hi in the chat!</p>
         <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://yourdomain.com"}" class="cta">Open Huddle →</a>`
      : `<p>Don't worry — there are plenty of other huddles to discover and join!</p>
         <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://yourdomain.com"}" class="cta">Browse Huddles →</a>`
    }
    <div class="footer">You received this email because you're a member of Huddle. This is an automated message.</div>
  </div>
</body>
</html>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [toEmail],
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("Resend error:", res.status, body);
    }
  },
});
