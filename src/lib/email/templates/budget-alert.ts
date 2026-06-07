export function budgetAlertEmail({
  name,
  categoryLabel,
  spent,
  allocated,
  percentage,
}: {
  name: string;
  categoryLabel: string;
  spent: number;
  allocated: number;
  percentage: number;
}) {
  return {
    subject: `⚠️ Budget alert — ${categoryLabel} is at ${percentage}%`,
    html: `
      <div style="font-family:'DM Sans',sans-serif;max-width:520px;margin:0 auto;background:#f5f4f0;padding:32px 24px;">
        <div style="background:#fff;border-radius:16px;padding:32px;border:0.5px solid #ebebeb;">
          <div style="width:40px;height:40px;background:#1a1a2e;border-radius:10px;margin-bottom:20px;">
            <span style="color:#fff;font-weight:700;font-size:14px;padding:10px;">SL</span>
          </div>
          <h2 style="font-size:18px;font-weight:700;color:#1a1a2e;margin:0 0 8px;">
            Heads up, ${name}
          </h2>
          <p style="font-size:13px;color:#666;margin:0 0 24px;line-height:1.6;">
            Your <strong>${categoryLabel}</strong> spending is approaching its limit for this month.
          </p>
          <div style="background:#fef9f0;border:0.5px solid rgba(186,117,23,0.3);border-radius:10px;padding:16px 20px;margin-bottom:24px;">
            <div style="display:flex;justify-content:space-between;margin-bottom:10px;">
              <span style="font-size:12px;color:#666;">Spent</span>
              <span style="font-size:13px;font-weight:600;color:#1a1a2e;">₱${spent.toLocaleString()}</span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
              <span style="font-size:12px;color:#666;">Allocated</span>
              <span style="font-size:13px;font-weight:600;color:#1a1a2e;">₱${allocated.toLocaleString()}</span>
            </div>
            <div style="background:#f0eff0;border-radius:4px;height:6px;overflow:hidden;">
              <div style="height:100%;width:${percentage}%;background:#BA7517;border-radius:4px;"></div>
            </div>
            <p style="font-size:11px;color:#BA7517;margin:8px 0 0;font-weight:500;">${percentage}% used</p>
          </div>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/budget"
            style="display:inline-block;padding:10px 20px;background:#1a1a2e;color:#fff;border-radius:8px;font-size:13px;font-weight:500;text-decoration:none;">
            View budget
          </a>
          <p style="font-size:11px;color:#bbb;margin-top:24px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings" style="color:#4f8ef7;">Manage notifications</a>
          </p>
        </div>
      </div>
    `,
  };
}
