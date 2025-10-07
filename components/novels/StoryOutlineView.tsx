"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
} from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import { ChapterRow } from "./ChapterRow";
import type { Novel, Chapter } from "@prisma/client";

interface StoryOutlineViewProps {
  novel: Novel & { chapters: Chapter[] };
  onUpdate: () => void;
}

export type ChapterWithChoices = Chapter & {
  choicesAsSource: { id: string; text: string; nextChapterId: string }[];
};

export default function StoryOutlineView({
  novel,
  onUpdate,
}: StoryOutlineViewProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleCreateNewChapter = () => {
    const title = prompt("Masukkan judul untuk chapter baru:", "Chapter Baru");
    if (!title) return;

    startTransition(async () => {
      try {
        const res = await fetch(`/api/novels/${novel.id}/chapters`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title }), // Hanya kirim judul
        });
        if (!res.ok) throw new Error("Gagal membuat chapter baru.");
        onUpdate();
      } catch (err) {
        setError((err as Error).message);
      }
    });
  };
  const handleCreateFirstChapter = () => {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/novels/${novel.id}/chapters`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: "Awal Cerita",
            isStart: true,
          }),
        });
        if (!res.ok) throw new Error("Gagal membuat chapter pertama.");
        onUpdate();
      } catch (err) {
        setError((err as Error).message);
      }
    });
  };

  if (!novel.chapters || novel.chapters.length === 0) {
    return (
      <Box textAlign="center" p={4}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Cerita ini belum memiliki chapter.
        </Typography>
        <Button
          variant="contained"
          onClick={handleCreateFirstChapter}
          disabled={isPending}
          startIcon={
            isPending ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              <AddCircleOutlineIcon />
            )
          }
        >
          Buat Chapter Awal
        </Button>
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </Box>
    );
  }

  // Build a map for quick lookups and find the starting node.
  // Ini akan dihitung ulang setiap kali 'novel' berubah.
  const chapterMap = new Map<string, ChapterWithChoices>(
    novel.chapters.map((c) => [c.id, c as ChapterWithChoices])
  );
  const startNode = novel.chapters.find((c) => c.isStart);

  if (!startNode) {
    return (
      <Alert severity="error">
        Chapter awal (isStart: true) tidak ditemukan. Harap perbaiki data novel
        ini.
      </Alert>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, overflowX: "auto" }}>
      <Box sx={{ mb: 2, display: "flex", justifyContent: "flex-end" }}>
        <Button
          variant="outlined"
          onClick={handleCreateNewChapter}
          disabled={isPending}
        >
          Tambah Chapter Baru
        </Button>
      </Box>
      <ChapterRow
        chapter={startNode as ChapterWithChoices}
        allChapters={chapterMap}
        novelId={novel.id}
        onUpdate={onUpdate}
      />
    </Box>
  );
}
