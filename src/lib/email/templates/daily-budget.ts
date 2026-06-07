export function dailyBudgetEmail({
  name,
  dailyAllowance,
  remainingBalance,
  daysLeft,
}: {
  name: string;
  dailyAllowance: number;
  remainingBalance: number;
  daysLeft: number;
}) {
  const status =
    dailyAllowance < 100
      ? { label: "Very tight today", color: "#A32D2D" }
      : dailyAllowance < 200
        ? { label: "Spend carefully", color: "#BA7517" }
        : { label: "You're on track", color: "#639922" };

  return {
    subject: `📊 Your daily budget for today — ₱${dailyAllowance.toFixed(0)}`,
    html: `
      <div style="font-family:'DM Sans',sans-serif;max-width:520px;margin:0 auto;background:#f5f4f0;padding:32px 24px;">
        <div style="background:#fff;border-radius:16px;padding:32px;border:0.5px solid #ebebeb;">
          <div style="width:40px;height:40px;background:#1a1a2e;border-radius:10px;margin-bottom:20px;">
            <span style="color:#fff;font-weight:700;font-size:14px;padding:10px;">SL</span>
          </div>
          <h2 style="font-size:18px;font-weight:700;color:#1a1a2e;margin:0 0 8px;">
            Good morning, ${name} ☀️
          </h2>
          <p style="font-size:13px;color:#666;margin:0 0 24px;line-height:1.6;">
            Here's your daily budget summary to start the day.
          </p>
          <div style="background:#f5f4f0;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
            <p style="font-size:36px;font-weight:700;color:${status.color};margin:0;font-family:monospace;">
              ₱${dailyAllowance.toFixed(2)}
            </p>
            <p style="font-size:12px;color:#999;margin:6px 0 0;">recommended daily spend</p>
            <span style="display:inline-block;margin-top:10px;padding:4px 12px;background:${status.color}18;color:${status.color};border-radius:10px;font-size:11px;font-weight:500;">
              ${status.label}
            </span>
          </div>
          <div style="display:flex;gap:12px;margin-bottom:24px;">
            <div style="flex:1;background:#f5f4f0;border-radius:8px;padding:12px;text-align:center;">
              <p style="font-size:14px;font-weight:600;color:#1a1a2e;margin:0;font-family:monospace;">₱${remainingBalance.toLocaleString()}</p>
              <p style="font-size:10px;color:#999;margin:4px 0 0;">available balance</p>
            </div>
            <div style="flex:1;background:#f5f4f0;border-radius:8px;padding:12px;text-align:center;">
              <p style="font-size:14px;font-weight:600;color:#1a1a2e;margin:0;font-family:monospace;">${daysLeft}d</p>
              <p style="font-size:10px;color:#999;margin:4px 0 0;">until next cycle</p>
            </div>
          </div>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/survival"
            style="display:inline-block;padding:10px 20px;background:#1a1a2e;color:#fff;border-radius:8px;font-size:13px;font-weight:500;text-decoration:none;">
            View daily budget
          </a>
          <p style="font-size:11px;color:#bbb;margin-top:24px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings" style="color:#4f8ef7;">Manage notifications</a>
          </p>
        </div>
      </div>
    `,
  };
}
