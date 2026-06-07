import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const email = token?.email || "";
    const allowedDomain = process.env.ALLOWED_EMAIL_DOMAIN || "ciit.edu.ph";

    if (!email.endsWith(`@${allowedDomain}`)) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  },
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/tasks/:path*",
    "/budget/:path*",
    "/survival/:path*",
    "/forum/:path*",
    "/resources/:path*",
  ],
};
