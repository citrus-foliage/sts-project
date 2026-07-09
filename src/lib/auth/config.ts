import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { supabaseAdmin } from "@/lib/supabase/admin";

const ALLOWED_DOMAIN = process.env.ALLOWED_EMAIL_DOMAIN || "ciit.edu.ph";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: [
            "openid",
            "email",
            "profile",
            "https://www.googleapis.com/auth/calendar.readonly",
          ].join(" "),
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],

  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.accessTokenExpires = account.expires_at;
      }
      return token;
    },

    async session({ session, token }) {
      session.accessToken = token.accessToken;

      if (session.user?.email) {
        const userId = session.user.email;
        const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

        // Fetch existing settings
        const { data: existing } = await supabaseAdmin
          .from("user_settings")
          .select("current_streak, longest_streak, last_login_date")
          .eq("user_id", userId)
          .maybeSingle();

        let newStreak = 1;
        let longestStreak = existing?.longest_streak ?? 0;

        if (existing?.last_login_date) {
          const last = new Date(existing.last_login_date);
          const todayDate = new Date(today);
          const diffDays = Math.round(
            (todayDate.getTime() - last.getTime()) / (1000 * 60 * 60 * 24),
          );

          if (diffDays === 0) {
            // Same day login — keep current streak, no update needed
            newStreak = existing.current_streak ?? 1;
          } else if (diffDays === 1) {
            // Consecutive day — increment streak
            newStreak = (existing.current_streak ?? 0) + 1;
          } else {
            // Streak broken — reset to 1
            newStreak = 1;
          }
        }

        longestStreak = Math.max(longestStreak, newStreak);

        // Upsert user_settings with streak + create row if first login
        await supabaseAdmin.from("user_settings").upsert(
          {
            user_id: userId,
            current_streak: newStreak,
            longest_streak: longestStreak,
            last_login_date: today,
          },
          { onConflict: "user_id" },
        );
      }

      return session;
    },

    async signIn({ profile }) {
      const email = profile?.email || "";
      if (!email.endsWith(`@${ALLOWED_DOMAIN}`)) {
        return false;
      }
      return true;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  session: {
    strategy: "jwt",
  },
};
