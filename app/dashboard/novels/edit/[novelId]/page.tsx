"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import {
  Container,
  Paper,
  Typography,
  Alert,
  Skeleton,
  Grid,
  Button,
} from "@mui/material";
import type { Novel, Chapter } from "@prisma/client";
import EditNovelForm from "@/components/novels/EditNovelForm";
import ChapterList from "@/components/chapters/ChapterList";
import Link from "next/link";

type NovelWithChapters = Novel & { chapters: Chapter[] };

interface EditNovelPageProps {
  params: {
    novelId: string;
  };
}
export default function EditNovelPage({ params }: EditNovelPageProps) {
  const { novelId } = use(params);
  const [novelData, setNovelData] = useState<NovelWithChapters | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true); // Tetap gunakan ini

  // Fetch data novel saat komponen dimuat
  useEffect(() => {
    const fetchNovel = async () => {
      setIsLoadingData(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/novels/${novelId}?includeChapters=true`
        );
        if (!response.ok) {
          const result = await response.json();
          throw new Error(
            result.message ||
              "Novel tidak ditemukan atau Anda tidak memiliki akses."
          );
        }
        const data: NovelWithChapters = await response.json();
        setNovelData(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoadingData(false);
      }
    };
    if (novelId) {
      fetchNovel();
    }
  }, [novelId]);

  if (isLoadingData) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Skeleton variant="text" width="60%" height={60} sx={{ mb: 2 }} />
        <Grid container spacing={4}>
          <Grid item xs={12} md={5}>
            <Skeleton variant="rectangular" width="100%" height={400} />
          </Grid>
          <Grid item xs={12} md={7}>
            <Skeleton variant="rectangular" width="100%" height={400} />
          </Grid>
        </Grid>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!novelData) {
    return null; // Atau tampilkan pesan "Tidak ada data"
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <div className="flex justify-between items-center mb-4">
        <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 0 }}>
          Editor Novel: <span className="font-semibold">{novelData.title}</span>
        </Typography>
        <Button
          component={Link}
          href={`/dashboard/novels/edit/${novelId}/iat`}
          variant="outlined"
        >
          Buka Peta Cerita
        </Button>
      </div>
      <Grid container spacing={4}>
        <Grid item xs={12} md={5}>
          <EditNovelForm novel={novelData} />
        </Grid>
        <Grid item xs={12} md={7}>
          <ChapterList
            initialChapters={novelData.chapters}
            novelId={novelData.id}
          />
        </Grid>
      </Grid>
    </Container>
  );
}
