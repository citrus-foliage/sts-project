export function forumReplyEmail({
  name,
  postTitle,
  postId,
  commenterCode,
  commentBody,
}: {
  name: string;
  postTitle: string;
  postId: string;
  commenterCode: string;
  commentBody: string;
}) {
  return {
    subject: `💬 Someone replied to your post`,
    html: `
      <div style="font-family:'DM Sans',sans-serif;max-width:520px;margin:0 auto;background:#f5f4f0;padding:32px 24px;">
        <div style="background:#fff;border-radius:16px;padding:32px;border:0.5px solid #ebebeb;">
          <div style="width:40px;height:40px;background:#1a1a2e;border-radius:10px;margin-bottom:20px;">
            <span style="color:#fff;font-weight:700;font-size:14px;padding:10px;">SL</span>
          </div>
          <h2 style="font-size:18px;font-weight:700;color:#1a1a2e;margin:0 0 8px;">
            New reply on your post
          </h2>
          <p style="font-size:13px;color:#666;margin:0 0 20px;line-height:1.6;">
            ${name}, someone replied to <strong>"${postTitle}"</strong>.
          </p>
          <div style="background:#f5f4f0;border-radius:10px;padding:16px;margin-bottom:24px;border-left:3px solid #534AB7;">
            <p style="font-size:11px;color:#534AB7;margin:0 0 8px;font-weight:500;">
              Anonymous ${commenterCode}
            </p>
            <p style="font-size:13px;color:#1a1a2e;margin:0;line-height:1.6;">
              ${commentBody.length > 200 ? commentBody.slice(0, 200) + "..." : commentBody}
            </p>
          </div>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/forum/${postId}"
            style="display:inline-block;padding:10px 20px;background:#1a1a2e;color:#fff;border-radius:8px;font-size:13px;font-weight:500;text-decoration:none;">
            View reply
          </a>
          <p style="font-size:11px;color:#bbb;margin-top:24px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings" style="color:#4f8ef7;">Manage notifications</a>
          </p>
        </div>
      </div>
    `,
  };
}
