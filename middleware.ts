// middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // You can add additional middleware logic here if needed
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;

        // Proteksi routes dashboard
        if (pathname.startsWith("/dashboard")) {
          return !!token;
        }
        
        // Proteksi routes admin
        if (pathname.startsWith("/admin")) {
          return token?.role === "ADMIN";
        }
        
        // Allow public routes
        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/api/novels/:path*",
    "/api/chapters/:path*",
    "/api/payment/:path*",
  ],
};