"use client";

import { Chapter } from "@prisma/client";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  CallSplit,
  AddCircleOutline,
  DeleteOutline,
} from "@mui/icons-material";
import {
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Button,
} from "@mui/material";
import { useState, useTransition, Fragment } from "react";
import { Alert } from "@mui/material";

type ChapterWithChoices = Chapter & {
  choicesAsSource: {
    id: string;
    text: string;
    nextChapterId: string;
  }[];
};

interface StoryTreeViewProps {
  novelId: string;
  chapters: ChapterWithChoices[];
  onUpdate: () => void; // Callback untuk refresh data
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 },
};

function ChapterNode({
  chapter,
  allChapters,
  novelId,
  onUpdate,
  level = 0,
}: {
  chapter: ChapterWithChoices;
  allChapters: Map<string, ChapterWithChoices>;
  novelId: string;
  onUpdate: () => void;
  level?: number;
}) {
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newChoiceText, setNewChoiceText] = useState("");
  const [newChapterTitle, setNewChapterTitle] = useState("");

  const handleOpenDialog = () => {
    setNewChoiceText("");
    setNewChapterTitle("");
    setDialogOpen(true);
  };

  const handleCreateBranch = async () => {
    startTransition(async () => {
      try {
        const response = await fetch(
          `/api/novels/${novelId}/chapters/${chapter.id}/branch`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ newChoiceText, newChapterTitle }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.message || "Gagal membuat cabang cerita baru."
          );
        }

        setDialogOpen(false);
        onUpdate(); // Panggil callback untuk refresh data
      } catch (err: any) {
        alert(`Error: ${err.message}`); // Simple alert for now
      }
    });
  };

  const handleDeleteChapter = () => {
    if (
      !window.confirm(
        `Yakin ingin menghapus "${chapter.title}"? Ini akan menghapus semua pilihan yang mengarah ke chapter ini.`
      )
    )
      return;

    startTransition(async () => {
      await fetch(`/api/novels/${novelId}/chapters/${chapter.id}`, {
        method: "DELETE",
      });
      onUpdate(); // Panggil callback untuk refresh data
    });
  };

  const choices = chapter.choicesAsSource || [];

  return (
    <motion.div
      variants={itemVariants}
      className="group relative flex flex-col items-start"
    >
      {/* Chapter Box */}
      <Link href={`/dashboard/novels/edit/${novelId}/chapters/${chapter.id}`}>
        <div className="mb-2 flex items-center gap-2 rounded-lg border border-gray-300 bg-white p-3 shadow-sm transition-all hover:border-blue-500 hover:shadow-md">
          <span className="font-mono text-sm text-gray-500">
            #{chapter.chapterNumber}
          </span>
          <span className="font-medium text-gray-800">{chapter.title}</span>
        </div>
      </Link>
      {/* Action Buttons */}
      <div className="absolute -right-2 top-1/2 -translate-y-1/2 transform opacity-0 transition-opacity group-hover:opacity-100">
        <IconButton
          size="small"
          onClick={handleOpenDialog}
          title="Tambah Cabang Baru"
        >
          <AddCircleOutline fontSize="small" />
        </IconButton>
        {chapter.chapterNumber !== 1 && (
          <IconButton
            size="small"
            onClick={handleDeleteChapter}
            title="Hapus Chapter"
            disabled={isPending}
          >
            <DeleteOutline fontSize="small" color="error" />
          </IconButton>
        )}
      </div>

      {/* Choices and connecting lines */}
      {choices.length > 0 && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="relative ml-8 flex flex-col gap-4 border-l-2 border-dashed border-gray-300 pl-8"
        >
          <AnimatePresence>
            {choices.map((choice) => {
              const nextChapter = allChapters.get(choice.nextChapterId);
              if (!nextChapter) return null;

              return (
                <div key={choice.id} className="relative">
                  {/* Choice Label */}
                  <div className="absolute -left-8 top-1/2 -translate-y-1/2 -translate-x-full transform">
                    <div className="flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800">
                      <CallSplit style={{ fontSize: 14 }} />
                      <span>{choice.text}</span>
                    </div>
                  </div>
                  <ChapterNode
                    chapter={nextChapter}
                    allChapters={allChapters}
                    novelId={novelId}
                    onUpdate={onUpdate}
                    level={level + 1}
                  />
                </div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Buat Cabang Cerita Baru</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Teks Pilihan (e.g., 'Pergi ke kiri')"
            fullWidth
            variant="standard"
            value={newChoiceText}
            onChange={(e) => setNewChoiceText(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Judul Chapter Baru"
            fullWidth
            variant="standard"
            value={newChapterTitle}
            onChange={(e) => setNewChapterTitle(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Batal</Button>
          <Button
            onClick={handleCreateBranch}
            disabled={isPending || !newChoiceText || !newChapterTitle}
          >
            {isPending ? "Membuat..." : "Buat"}
          </Button>
        </DialogActions>
      </Dialog>
    </motion.div>
  );
}

export default function StoryTreeView({
  novelId,
  chapters,
  onUpdate,
}: StoryTreeViewProps) {
  if (!chapters || chapters.length === 0) {
    return <p className="p-4 text-center text-gray-500">Belum ada chapter.</p>;
  }

  const chapterMap = new Map(chapters.map((c) => [c.id, c]));
  const startNode = chapters.find((c) => c.chapterNumber === 1);

  if (!startNode) {
    return (
      <p className="p-4 text-center text-red-500">
        Chapter awal (Chapter 1) tidak ditemukan.
      </p>
    );
  }

  return (
    <div className="p-6">
      <ChapterNode
        chapter={startNode}
        allChapters={chapterMap}
        novelId={novelId}
        onUpdate={onUpdate}
      />
    </div>
  );
}
