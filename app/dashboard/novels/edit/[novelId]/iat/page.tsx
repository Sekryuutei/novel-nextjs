"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import {
  Container,
  Typography,
  Alert,
  Skeleton,
  Breadcrumbs,
  Link as MuiLink,
  Paper,
} from "@mui/material";
import type { Novel, Chapter } from "@prisma/client";
import Link from "next/link";
import StoryTreeView from "@/components/novels/StoryTreeView";

type ChapterWithChoices = Chapter & {
  choicesAsSource: { id: string; text: string; nextChapterId: string }[];
};
type NovelWithChapters = Novel & { chapters: ChapterWithChoices[] };

interface IATPageProps {
  params: {
    novelId: string;
  };
}

export default function IATPage({ params }: IATPageProps) {
  const { novelId } = use(params) as { novelId: string };
  const router = useRouter();
  const [novelData, setNovelData] = useState<NovelWithChapters | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const fetchNovel = async () => {
    setIsLoadingData(true);
    try {
      // Tambahkan cache-busting query param untuk memastikan data baru selalu diambil
      const response = await fetch(
        `/api/novels/${novelId}?includeChapters=true&_=${Date.now()}`
      );
      if (!response.ok) throw new Error("Gagal memuat data novel.");
      const data = await response.json();
      setNovelData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    if (novelId) {
      fetchNovel();
    }
  }, [novelId]);

  if (isLoadingData) {
    return (
      <Container maxWidth={false} sx={{ py: 4 }}>
        <Skeleton variant="text" width="40%" height={60} />
        <Skeleton
          variant="rectangular"
          width="100%"
          height="70vh"
          sx={{ mt: 2 }}
        />
      </Container>
    );
  }

  if (error || !novelData) {
    return <Alert severity="error">{error || "Gagal memuat data."}</Alert>;
  }

  return (
    <Container maxWidth={false} sx={{ py: 4, px: { xs: 2, md: 4 } }}>
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
        <MuiLink
          component={Link}
          underline="hover"
          color="inherit"
          href={`/dashboard/novels/edit/${novelId}`}
        >
          Editor Novel
        </MuiLink>
        <Typography color="text.primary">Peta Cerita Interaktif</Typography>
      </Breadcrumbs>
      <Typography variant="h4" component="h1" gutterBottom>
        Peta Cerita: {novelData.title}
      </Typography>
      <Paper elevation={3} sx={{ overflow: "auto", width: "100%", p: 2 }}>
        <StoryTreeView
          novelId={novelData.id}
          chapters={novelData.chapters}
          onUpdate={fetchNovel} // Ganti onUpdate untuk memanggil fetchNovel secara langsung
        />
      </Paper>
    </Container>
  );
}
