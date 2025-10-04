import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Authentication - Novel Interaktif",
  description:
    "Login atau Register untuk mengakses fitur lengkap Novel Interaktif.",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to to-purple-100">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Novel Interaktif
        </h1>
        <p className="text-gray-600 text-lg">
          Platform cerita digital Interaktif terbaik di Indonesia.
        </p>
      </div>
      {/* Content Area */}
      <div className="flex justify-center">{children}</div>
      {/* Footer */}
      <div className="text-center mt-12">
        <p className="text-gray-500 text-sm">
          &copy; 2024 Novel Interaktif. All rights reserved.
        </p>
      </div>
    </div>
  );
}
