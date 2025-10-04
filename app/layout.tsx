// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // Pastikan path ini benar
import SessionProvider from "@/components/providers/SessionProvider";
import ThemeRegistry from "@/components/themeregistry/ThemeRegistry";
import "./globals.css"; // Impor file CSS global
import Navbar from "@/components/layout/Navbar";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Novel Interaktif - Platform Baca Cerita Digital",
    template: "%s | Novel Interaktif",
  },
  description:
    "Platform novel interaktif dengan cerita bercabang, musik latar, dan pengalaman membaca yang immersive.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="id">
      <body className={`${inter.className} bg-gray-50 text-gray-900`}>
        <ThemeRegistry options={{ key: "mui" }}>
          <SessionProvider session={session}>
            <Navbar />
            <main>{children}</main>
          </SessionProvider>
        </ThemeRegistry>
      </body>
    </html>
  );
}
