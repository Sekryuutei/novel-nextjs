"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import {
  Container,
  Typography,
  Paper,
  Box,
  Button,
  Breadcrumbs,
  Link as MuiLink,
  Skeleton,
  Alert,
  Stack,
} from "@mui/material";
import Link from "next/link";
import type { Chapter, Novel } from "@prisma/client";
import { ArrowBack, ArrowForward } from "@mui/icons-material";

type ChapterWithNovel = Chapter & {
  novel: { title: string };
  choicesAsSource: { id: string; text: string; nextChapterId: string }[];
};

interface ReadingProgress {
  path: string[];
  currentChapterId: string;
}

interface ReadChapterPageProps {
  params: {
    novelId: string;
    chapterId: string;
  };
}

export default function ReadChapterPage({ params }: ReadChapterPageProps) {
  const { novelId, chapterId } = use(params);
  const router = useRouter();

  const [chapter, setChapter] = useState<ChapterWithNovel | null>(null);
  const [progress, setProgress] = useState<ReadingProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // 1. Update dan ambil progres membaca
        const progressRes = await fetch("/api/read/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ novelId, chapterId }),
        });
        if (!progressRes.ok) throw new Error("Gagal memuat progres membaca.");
        const progressData: ReadingProgress = await progressRes.json();
        setProgress(progressData);

        // 2. Ambil data chapter saat ini
        const chapterRes = await fetch(
          `/api/novels/${novelId}/chapters/${chapterId}`
        );
        if (!chapterRes.ok) throw new Error("Gagal memuat data chapter.");
        const chapterData: ChapterWithNovel = await chapterRes.json();
        setChapter(chapterData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [novelId, chapterId]);

  const handleNavigate = (targetChapterId: string) => {
    router.push(`/read/${novelId}/${targetChapterId}`);
  };

  const previousChapterId =
    progress && progress.path.length > 1
      ? progress.path[progress.path.indexOf(chapterId) - 1]
      : null;

  if (isLoading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Skeleton variant="text" width="40%" height={30} />
        <Skeleton variant="text" width="80%" height={60} sx={{ mt: 2 }} />
        <Skeleton
          variant="rectangular"
          width="100%"
          height={400}
          sx={{ mt: 4 }}
        />
      </Container>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!chapter) {
    return <Alert severity="info">Chapter tidak ditemukan.</Alert>;
  }

  const choices = chapter.choicesAsSource;

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
        <MuiLink component={Link} underline="hover" color="inherit" href="/">
          Home
        </MuiLink>
        <Typography color="text.primary">{chapter.novel.title}</Typography>
      </Breadcrumbs>

      <Typography variant="h4" component="h1" gutterBottom align="center">
        {chapter.title}
      </Typography>
      <Typography
        variant="subtitle1"
        align="center"
        color="text.secondary"
        sx={{ mb: 4 }}
      >
        Chapter {chapter.chapterNumber}
      </Typography>

      <Paper
        elevation={2}
        sx={{ p: { xs: 2, sm: 4 }, mt: 2, lineHeight: 1.8, fontSize: "1.1rem" }}
      >
        <div dangerouslySetInnerHTML={{ __html: chapter.content || "" }} />
      </Paper>

      <Box sx={{ mt: 4 }}>
        {/* Tombol Pilihan (jika ada) */}
        {choices.length > 0 && (
          <Stack spacing={2} sx={{ mb: 4 }}>
            {choices.length > 1 && (
              <Typography variant="h6" align="center">
                Buat Pilihanmu:
              </Typography>
            )}
            {choices.map((choice) => (
              <Button
                key={choice.id}
                variant="contained"
                size="large"
                fullWidth
                onClick={() => handleNavigate(choice.nextChapterId)}
              >
                {choice.text || "Lanjutkan Cerita"}
              </Button>
            ))}
          </Stack>
        )}

        {/* Tombol Navigasi Kembali/Selanjutnya */}
        <Stack
          direction="row"
          spacing={2}
          justifyContent={previousChapterId ? "space-between" : "flex-end"}
        >
          {previousChapterId && (
            <Button
              variant="outlined"
              startIcon={<ArrowBack />}
              onClick={() => handleNavigate(previousChapterId)}
            >
              Kembali
            </Button>
          )}
          {choices.length === 0 && (
            <Typography variant="h6" align="center" color="text.secondary">
              - Tamat -
            </Typography>
          )}
        </Stack>
      </Box>
    </Container>
  );
}
