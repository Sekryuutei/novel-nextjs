import {Novel} from "@prisma/client";
import Link from "next/link";

interface NovelCardProps {
    novel: Novel;
}

export function NovelCard({novel}: NovelCardProps) {
    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {novel.title}
                </h3>
                <p className="text-gray-600 mb-4 line-clamp-3">{novel.description||"Tidak ada deskripsi"}</p>
                <div className="flex justify-between items-center">
                    <span className={'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${novel.status === "PUBLISHED" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}'}>
                    {novel.status === 'PUBLISHED' ? 'Terbit' : 'Draft'}
                    </span>
                    <Link href={`/novels/${novel.id}`}
                          className="text-blue-600 hover:text-blue-800 font-medium">
                        Baca
                    </Link>
                </div>
            </div>
        </div>
    );
}