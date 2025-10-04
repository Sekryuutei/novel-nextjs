"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { Session } from "next-auth";

interface HeroSectionProps {
  session: Session | null;
}

export default function HeroSection({ session }: HeroSectionProps) {
  return (
    <section className="relative bg-white py-20 md:py-32">
      <div className="container mx-auto px-6 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-5xl md:text-6xl font-bold mb-6 text-gray-900"
        >
          Baca Cerita Menjadi
          <span className="block text-blue-600">Mengalami Narasi</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-xl md:text-2xl mb-8 text-gray-600 max-w-2xl mx-auto"
        >
          Platform novel interaktif dengan cerita bercabang, musik latar, dan
          pengalaman membaca yang immersive
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          {session ? (
            <Link
              href="/dashboard"
              className="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors"
            >
              Dashboard Saya
            </Link>
          ) : (
            <>
              <Link
                href="/auth/register"
                className="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors"
              >
                Mulai Menulis
              </Link>
              <Link
                href="/auth/login"
                className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors"
              >
                Masuk
              </Link>
            </>
          )}
        </motion.div>
      </div>
    </section>
  );
}
