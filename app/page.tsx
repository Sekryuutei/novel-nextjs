// app/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { NovelCard } from "@/components/novels/NovelCard";
import HeroSection from "@/components/landing/HeroSection";
import { MotionDiv } from "@/components/providers/MotionProvider";

export default async function HomePage() {
  const [session, featuredNovels, novelCount, purchaseCount] =
    await Promise.all([
      getServerSession(authOptions),
      prisma.novel.findMany({
        where: {
          status: "PUBLISHED",
        },
        include: {
          author: {
            select: {
              name: true,
              id: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 6,
      }),
      prisma.novel.count({
        where: { status: "PUBLISHED" },
      }),
      prisma.purchase.count({
        where: { status: "SUCCESS" },
      }),
    ]);

  const stats = {
    totalNovels: novelCount,
    totalPurchases: purchaseCount,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <HeroSection session={session} />

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {stats.totalNovels}+
              </div>
              <div className="text-gray-600">Novel Terbit</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600 mb-2">
                {stats.totalPurchases}+
              </div>
              <div className="text-gray-600">Pembaca Aktif</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Novels Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Novel Terpopuler
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Jelajahi koleksi novel interaktif dengan cerita menawan dan
              pengalaman membaca yang tak terlupakan
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredNovels.map((novel, index) => (
              <MotionDiv
                key={novel.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <NovelCard novel={novel} />
              </MotionDiv>
            ))}
          </div>

          {featuredNovels.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📚</div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                Belum ada novel
              </h3>
              <p className="text-gray-500 mb-6">
                Jadilah penulis pertama yang menerbitkan novel di platform ini
              </p>
              <Link
                href="/auth/register"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Mulai Menulis Sekarang
              </Link>
            </div>
          )}

          {featuredNovels.length > 0 && (
            <div className="text-center mt-12">
              <Link
                href="/novels"
                className="border-2 border-blue-600 text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-600 hover:text-white transition-colors"
              >
                Lihat Semua Novel
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Mengapa Memilih Platform Kami?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎭</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Cerita Bercabang</h3>
              <p className="text-gray-600">
                Setiap pilihan mengubah alur cerita, menciptakan pengalaman unik
                untuk setiap pembaca
              </p>
            </div>

            <div className="text-center p-6">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎵</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Musik & Suara</h3>
              <p className="text-gray-600">
                Pengalaman immersive dengan musik latar dan efek suara yang
                memperkaya cerita
              </p>
            </div>

            <div className="text-center p-6">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💸</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Monetisasi</h3>
              <p className="text-gray-600">
                Hasilkan pendapatan dari karya Anda melalui sistem premium dan
                pembelian chapter
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
