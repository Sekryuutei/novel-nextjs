"use client";

import { Novel } from "@prisma/client";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

interface NovelCardProps {
  novel: Novel & {
    _count?: {
      chapters: number;
      purchases: number;
    };
    author?: {
      name: string;
    };
  };
  showActions?: boolean;
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut",
    },
  },
  hover: {
    y: -4,
    boxShadow:
      "0 10px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04)",
    transition: {
      duration: 0.2,
      ease: "easeInOut",
    },
  },
};

export function NovelCard({ novel, showActions = false }: NovelCardProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isPublished = novel.status === "PUBLISHED";
  const isPremium = novel.isPremium;

  const handleDelete = async () => {
    if (
      !window.confirm(
        `Apakah Anda yakin ingin menghapus novel "${novel.title}"? Aksi ini tidak dapat dibatalkan.`
      )
    ) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/novels/${novel.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Gagal menghapus novel. Silakan coba lagi.");
      }

      // Refresh halaman untuk memperbarui daftar novel
      startTransition(() => {
        router.refresh();
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200"
    >
      {/* Cover Image Section */}
      <div className="aspect-w-16 aspect-h-9 bg-gray-100 relative">
        {novel.coverImage ? (
          <Image
            src={novel.coverImage}
            alt={novel.title}
            width={400}
            height={225}
            className="w-full h-48 object-cover"
          />
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-blue-50 to-purple-100 flex items-center justify-center">
            <span className="text-gray-400 text-lg font-semibold">
              No Cover
            </span>
          </div>
        )}

        {/* Status Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1">
          {isPublished ? (
            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
              Terbit
            </span>
          ) : (
            <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-medium">
              Draft
            </span>
          )}

          {isPremium && (
            <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full font-medium">
              Premium
            </span>
          )}
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 text-lg mb-2 line-clamp-2 leading-tight">
          {novel.title}
        </h3>

        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {novel.description || "Tidak ada deskripsi"}
        </p>

        {/* Author Info */}
        {novel.author && (
          <p className="text-gray-500 text-xs mb-3">oleh {novel.author.name}</p>
        )}

        {/* Stats */}
        <div className="flex justify-between items-center text-xs text-gray-500 mb-4">
          <span>{novel._count?.chapters || 0} Chapter</span>
          <span>{novel._count?.purchases || 0} Pembelian</span>
          {novel.price && (
            <span className="font-semibold text-green-600">
              Rp {novel.price.toLocaleString("id-ID")}
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <Link
            href={`/read/${novel.id}`}
            className="text-blue-600 hover:text-blue-800 font-medium text-sm"
          >
            Baca Novel →
          </Link>

          {showActions && (
            <div className="flex gap-2">
              <Link
                href={`/dashboard/novels/edit/${novel.id}`}
                className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
              >
                Edit
              </Link>
              <button
                onClick={handleDelete}
                disabled={isDeleting || isPending}
                className="text-sm font-medium text-gray-600 hover:text-red-600 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isDeleting ? "Menghapus..." : "Hapus"}
              </button>
            </div>
          )}
        </div>
        {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
      </div>
    </motion.div>
  );
}
