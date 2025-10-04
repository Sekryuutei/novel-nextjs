"use client";

import { Chapter } from "@prisma/client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
} from "@mui/material";
import { Edit, Delete, Add } from "@mui/icons-material";

interface ChapterListProps {
  initialChapters: Chapter[];
  novelId: string;
}

export default function ChapterList({
  initialChapters,
  novelId,
}: ChapterListProps) {
  const router = useRouter();
  const [chapters, setChapters] = useState(initialChapters);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleCreateChapter = async () => {
    setError(null);
    startTransition(async () => {
      try {
        const response = await fetch(`/api/novels/${novelId}/chapters`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: `Chapter Baru #${chapters.length + 1}`,
          }),
        });

        if (!response.ok) {
          throw new Error("Gagal membuat chapter baru.");
        }

        const newChapter: Chapter = await response.json();

        // Redirect ke halaman edit chapter yang baru
        router.push(
          `/dashboard/novels/edit/${novelId}/chapters/${newChapter.id}`
        );
      } catch (err: any) {
        setError(err.message);
      }
    });
  };

  const handleDeleteChapter = async (chapterId: string) => {
    if (
      !window.confirm(
        "Apakah Anda yakin ingin menghapus chapter ini? Aksi ini tidak dapat dibatalkan."
      )
    ) {
      return;
    }

    setDeletingId(chapterId);
    setError(null);

    try {
      const response = await fetch(
        `/api/novels/${novelId}/chapters/${chapterId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Gagal menghapus chapter. Silakan coba lagi.");
      }

      // Update local state for instant UI feedback
      setChapters((prev) => prev.filter((c) => c.id !== chapterId));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Paper elevation={2} sx={{ p: { xs: 2, md: 3 } }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h6" component="h3">
          Daftar Chapter
        </Typography>
        <Button
          variant="contained"
          startIcon={
            isPending ? <CircularProgress size={20} color="inherit" /> : <Add />
          }
          onClick={handleCreateChapter}
          disabled={isPending}
        >
          Chapter Baru
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {chapters.length === 0 ? (
        <Typography color="text.secondary" textAlign="center" py={4}>
          Belum ada chapter. Buat chapter pertamamu!
        </Typography>
      ) : (
        <List disablePadding>
          {chapters.map((chapter) => (
            <ListItem
              key={chapter.id}
              divider
              sx={{
                "&:hover": { bgcolor: "action.hover" },
                transition: "background-color 0.2s",
              }}
            >
              <ListItemText
                primary={`#${chapter.chapterNumber}: ${chapter.title}`}
                secondary={chapter.isPremium ? "Premium" : "Gratis"}
              />
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  aria-label="edit"
                  onClick={() =>
                    router.push(
                      `/dashboard/novels/edit/${novelId}/chapters/${chapter.id}`
                    )
                  }
                >
                  <Edit />
                </IconButton>
                <IconButton
                  edge="end"
                  aria-label="delete"
                  onClick={() => handleDeleteChapter(chapter.id)}
                  disabled={deletingId === chapter.id}
                >
                  {deletingId === chapter.id ? (
                    <CircularProgress size={20} />
                  ) : (
                    <Delete />
                  )}
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      )}
    </Paper>
  );
}
