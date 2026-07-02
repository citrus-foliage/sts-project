import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { FORUM_RULES } from "@/types/forum";

async function requireAdmin(email: string) {
  const { data } = await supabaseAdmin
    .from("admin_users")
    .select("role")
    .eq("user_id", email)
    .maybeSingle();
  return data ?? null;
}

function generateRemovalMessage(
  violatedRules: number[],
  action: "remove" | "warn",
): string {
  const ruleLines = violatedRules
    .map((i) => `• Rule ${i + 1}: ${FORUM_RULES[i]}`)
    .join("\n");

  if (action === "remove") {
    return `Your post has been removed by a moderator for violating the following community rule${violatedRules.length > 1 ? "s" : ""}:\n\n${ruleLines}\n\nFurther violations may result in a timeout or permanent ban.`;
  }

  return `This is a warning regarding your recent post. It was found to violate the following community rule${violatedRules.length > 1 ? "s" : ""}:\n\n${ruleLines}\n\nPlease review the community guidelines. Further violations may result in removal or a ban.`;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = await requireAdmin(session.user.email);
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { postId } = await params;
  const body = await req.json();
  const { action, violated_rules, note } = body;

  if (!action) {
    return NextResponse.json({ error: "action is required" }, { status: 400 });
  }

  // Fetch the post
  const { data: post } = await supabaseAdmin
    .from("forum_posts")
    .select("author_id, title, status")
    .eq("id", postId)
    .maybeSingle();

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  let postUpdate: Record<string, unknown> = {};
  let generatedMessage: string | null = null;

  if (action === "remove") {
    const rules: number[] = violated_rules ?? [];
    generatedMessage =
      rules.length > 0 ? generateRemovalMessage(rules, "remove") : null;
    postUpdate = {
      status: "removed",
      removed_reason: generatedMessage,
      removed_by: session.user.email,
    };
  } else if (action === "restore") {
    postUpdate = {
      status: "active",
      removed_reason: null,
      removed_by: null,
    };
  } else if (action === "pin") {
    postUpdate = { is_pinned: true };
  } else if (action === "unpin") {
    postUpdate = { is_pinned: false };
  } else if (action === "approve") {
    postUpdate = { status: "active" };
  } else if (action === "lock") {
    postUpdate = { is_locked: true };
  } else if (action === "unlock") {
    postUpdate = { is_locked: false };
  } else {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const { error: updateError } = await supabaseAdmin
    .from("forum_posts")
    .update(postUpdate)
    .eq("id", postId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Log the mod action
  await supabaseAdmin.from("mod_actions").insert({
    mod_id: session.user.email,
    target_user_id: post.author_id,
    target_post_id: postId,
    action,
    violated_rules: violated_rules ?? null,
    generated_message: generatedMessage,
    note: note ?? null,
  });

  return NextResponse.json({
    success: true,
    generated_message: generatedMessage,
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = await requireAdmin(session.user.email);
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { postId } = await params;
  const body = await req.json().catch(() => ({}));
  const { note } = body;

  const { data: post } = await supabaseAdmin
    .from("forum_posts")
    .select("author_id")
    .eq("id", postId)
    .maybeSingle();

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const { error } = await supabaseAdmin
    .from("forum_posts")
    .delete()
    .eq("id", postId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabaseAdmin.from("mod_actions").insert({
    mod_id: session.user.email,
    target_user_id: post.author_id,
    target_post_id: null,
    action: "remove",
    note: note ?? null,
  });

  return NextResponse.json({ success: true });
}
