export function taskReminderEmail({
  name,
  tasks,
}: {
  name: string;
  tasks: { title: string; due_date: string; priority: string }[];
}) {
  const taskList = tasks
    .map(
      (t) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #f0eff0;">
          <span style="font-size:13px;color:#1a1a2e;font-weight:500;">${t.title}</span>
          <span style="font-size:11px;color:#999;margin-left:8px;">${t.priority} priority</span>
        </td>
      </tr>`,
    )
    .join("");

  return {
    subject: `⏰ ${tasks.length} task${tasks.length > 1 ? "s" : ""} due tomorrow`,
    html: `
      <div style="font-family:'DM Sans',sans-serif;max-width:520px;margin:0 auto;background:#f5f4f0;padding:32px 24px;">
        <div style="background:#fff;border-radius:16px;padding:32px;border:0.5px solid #ebebeb;">
          <div style="width:40px;height:40px;background:#1a1a2e;border-radius:10px;display:flex;align-items:center;justify-content:center;margin-bottom:20px;">
            <span style="color:#fff;font-weight:700;font-size:14px;">SL</span>
          </div>
          <h2 style="font-size:18px;font-weight:700;color:#1a1a2e;margin:0 0 8px;">
            Hi ${name}, heads up 👋
          </h2>
          <p style="font-size:13px;color:#666;margin:0 0 24px;line-height:1.6;">
            You have ${tasks.length} task${tasks.length > 1 ? "s" : ""} due tomorrow. 
            Here's a quick reminder so nothing slips through.
          </p>
          <table style="width:100%;border-collapse:collapse;">
            ${taskList}
          </table>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/tasks"
            style="display:inline-block;margin-top:24px;padding:10px 20px;background:#1a1a2e;color:#fff;border-radius:8px;font-size:13px;font-weight:500;text-decoration:none;">
            View tasks
          </a>
          <p style="font-size:11px;color:#bbb;margin-top:24px;">
            You're receiving this because task deadline reminders are enabled.
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings" style="color:#4f8ef7;">Manage notifications</a>
          </p>
        </div>
      </div>
    `,
  };
}
