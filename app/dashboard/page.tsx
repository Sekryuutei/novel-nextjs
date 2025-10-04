import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {prisma} from "@/lib/prisma";
import { NovelCard } from "@/components/novels/novelcard";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
    const session = await getServerSession(authOptions);
    if (!session) {
        redirect('/auth/login');
    }

    // Data Fetching di server component
    const userNovels = await prisma.novel.findMany({
        where: {
            authorId: session.user.id
        },
        include: {
            _count: {
                select: { chapters: true }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

const stats = {
    totalNovels: userNovels.length,
    publishedNovels: userNovels.filter(novel => novel.status === 'PUBLISHED').length,
    totalChapters: userNovels.reduce((acc, novel) => acc + novel._count.chapters, 0)
};

return (
    <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-4">Dashboard Penulis</h1>
        {/* State Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"> {/* This div was missing its closing tag */}
          <div className="bg-blue-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-800">
              Total Novel
            </h3>
            <p className="text-3xl font-bold text-blue-600">
              {stats.totalNovels}
            </p>
          </div>
          <div className="bg-green-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-green-800">
              Terbit
            </h3>
            <p className="text-3xl font-bold text-green-600">
              {stats.publishedNovels}
            </p>
          </div>
          <div className="bg-purple-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-purple-800">
              Total Chapter
            </h3>
            <p className="text-3xl font-bold text-purple-600">
              {stats.totalChapters}
            </p>
          </div>
        </div>


        {/* Novels List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userNovels.map((novel) => (
                <NovelCard key={novel.id} novel={novel} />
            ))}
        </div>

            {userNovels.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-gray-500 text-lg">Belum ada novel</p>
                    <Link
                        href="/dashboard/novels/create"
                        className="inline-block mt-4 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
                            Buat Novel
                        </Link>
                </div>
            )}
    </div>
);
}
