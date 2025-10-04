import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
        default: "Novel Interaktif - Mengalami Narasi",
        template: "%s | Novel Interaktif",
  }, 
  description: "Platform novel interaktif dengan cerita bercabang, musik latar, dan pengalaman membaca yang immersive. Baca cerita menjadi mengalami narasi.",
  keywords: ["novel interaktif", "cerita bercabang", "musik latar", "pengalaman membaca", "narasi immersive"],
  authors: [{ name: "Novel Interaktif Team"}],
  creator: "Novel Interaktif",
  publisher: "Novel Interaktif",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://novel-interaktif.vercel.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "https://novel-interaktif.vercel.app",
    title: "Novel Interaktif - Mengalami Narasi",
    description: "Platform novel interaktif dengan cerita bercabang, musik latar, dan pengalaman membaca yang immersive. Baca cerita menjadi mengalami narasi.",
    siteName: "Novel Interaktif", // Removed creator as it's not a valid property for OpenGraphMetadata | OpenGraphWebsite
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={inter.className}>
      <body
        className="min-h-screen bg-white"
      >
        {children}
      </body>
    </html>
  );
}
