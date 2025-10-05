"use client";

import { useEffect, useState, use, Fragment } from "react";
import {
  Container,
  Typography,
  Alert,
  Skeleton,
  Breadcrumbs,
  Link as MuiLink,
} from "@mui/material";
import type { Chapter } from "@prisma/client";
import Link from "next/link"; // Tetap gunakan Link dari next/link
import ChapterEditorForm from "@/components/chapters/ChapterEditorForm";

interface EditChapterPageProps {
  params: {
    novelId: string;
    chapterId: string;
  };
}

type ChapterSummary = { id: string; title: string; chapterNumber: number };

export default function EditChapterPage({ params }: EditChapterPageProps) {
  const { novelId, chapterId } = use(params);
  const [error, setError] = useState<string | null>(null);
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [allChapters, setAllChapters] = useState<ChapterSummary[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    const fetchChapterData = async () => {
      setIsLoadingData(true);
      try {
        // Ambil data chapter yang sedang diedit dan daftar semua chapter sekaligus
        const [chapterRes, allChaptersRes] = await Promise.all([
          fetch(`/api/novels/${novelId}/chapters/${chapterId}`),
          fetch(`/api/novels/${novelId}/chapters`),
        ]);

        if (!chapterRes.ok) {
          throw new Error(
            "Chapter tidak ditemukan atau Anda tidak punya akses."
          );
        }
        if (!allChaptersRes.ok) {
          throw new Error("Gagal memuat daftar chapter.");
        }

        const chapterData: Chapter = await chapterRes.json();
        const allChaptersData: ChapterSummary[] = await allChaptersRes.json();

        setChapter(chapterData);
        setAllChapters(allChaptersData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoadingData(false);
      }
    };
    fetchChapterData();
  }, [novelId, chapterId]);

  if (isLoadingData) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Skeleton variant="text" width="60%" height={40} />
        <Skeleton
          variant="rectangular"
          width="100%"
          height={500}
          sx={{ mt: 2 }}
        />
      </Container>
    );
  }

  if (error && !chapter) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
        <MuiLink
          component={Link}
          underline="hover"
          color="inherit"
          href={`/dashboard/novels/edit/${novelId}`}
        >
          Editor Novel
        </MuiLink>
        <Typography color="text.primary">
          Chapter #{chapter?.chapterNumber}
        </Typography>
      </Breadcrumbs>

      {chapter && allChapters.length > 0 && (
        <Fragment>
          <ChapterEditorForm
            key={chapter.id} // Tambahkan key unik di sini
            novelId={novelId}
            chapter={chapter}
            allChapters={allChapters}
          />
        </Fragment>
      )}
    </Container>
  );
}
