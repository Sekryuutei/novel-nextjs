import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NovelCard } from "@/components/novels/NovelCard";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@mui/material";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/auth/login");
  }

  // Data Fetching di server component
  const userNovels = await prisma.novel.findMany({
    where: {
      authorId: session.user.id,
    },
    include: {
      _count: {
        select: { chapters: true },
      },
      author: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const stats = {
    totalNovels: userNovels.length,
    publishedNovels: userNovels.filter((novel) => novel.status === "PUBLISHED")
      .length,
    totalChapters: userNovels.reduce(
      (acc, novel) => acc + novel._count.chapters,
      0
    ),
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Dashboard Penulis</h1>
        <Button
          component={Link}
          href="/dashboard/novels/create"
          variant="contained"
          color="primary"
        >
          Buat Novel Baru
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-700">Total Novel</h3>
          <p className="text-3xl font-bold text-gray-900">
            {stats.totalNovels}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-700">Terbit</h3>
          <p className="text-3xl font-bold text-gray-900">
            {stats.publishedNovels}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-700">Total Chapter</h3>
          <p className="text-3xl font-bold text-gray-900">
            {stats.totalChapters}
          </p>
        </div>
      </div>

      {/* Novels List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {userNovels.length > 0 &&
          userNovels.map((novel) => (
            <NovelCard key={novel.id} novel={novel} showActions={true} />
          ))}
      </div>

      {userNovels.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg mb-4">
            Anda belum memiliki novel. Mulai karya pertamamu sekarang!
          </p>
          <Link
            href="/dashboard/novels/create"
            className="inline-block mt-4 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            Buat Novel
          </Link>
        </div>
      )}
    </div>
  );
}
