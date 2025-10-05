// c:\Users\anggi\Documents\Project\novel-nextjs\components\iat\ChapterNode.tsx
"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Handle, Position, NodeProps } from "reactflow";
import { memo, useState } from "react";
import { IconButton } from "@mui/material";
import { DeleteOutline } from "@mui/icons-material";

type ChapterNodeData = {
  label: string;
  chapterNumber: number;
  novelId: string;
  chapterId: string;
  onUpdate: () => void;
};

function ChapterNode({ data }: NodeProps<ChapterNodeData>) {
  const { onUpdate } = data;
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Mencegah navigasi saat mengklik tombol hapus
    e.preventDefault();

    if (!window.confirm(`Yakin ingin menghapus chapter "${data.label}"?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      await fetch(`/api/novels/${data.novelId}/chapters/${data.chapterId}`, {
        method: "DELETE",
      });
      onUpdate(); // Memicu refresh data di halaman IAT
    } catch (error) {
      console.error("Gagal menghapus chapter:", error);
      alert("Gagal menghapus chapter.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="relative group">
      <Link
        href={`/dashboard/novels/edit/${data.novelId}/chapters/${data.chapterId}`}
      >
        <div className="flex-shrink-0 flex items-center gap-2 rounded-lg border border-gray-300 bg-white p-3 shadow-sm transition-all hover:border-blue-500 hover:shadow-md w-[200px] h-[60px] justify-center">
          <span className="font-mono text-sm text-gray-500">
            #{data.chapterNumber}
          </span>
          <span className="font-medium text-gray-800 truncate">
            {data.label}
          </span>
        </div>
      </Link>
      {data.chapterNumber > 1 && (
        <IconButton
          size="small"
          onClick={handleDelete}
          disabled={isDeleting}
          className="!absolute -top-3 -right-3 bg-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity !p-1"
        >
          <DeleteOutline fontSize="small" color="error" />
        </IconButton>
      )}
      <Handle type="target" position={Position.Left} className="!bg-gray-400" />
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-gray-400"
      />
    </div>
  );
}

export default memo(ChapterNode);
