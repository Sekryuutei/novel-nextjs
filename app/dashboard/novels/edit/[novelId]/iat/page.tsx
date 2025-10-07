"use client";

import { useEffect, useState, useCallback, use } from "react";
import {
  Container,
  Typography,
  Alert,
  Skeleton,
  Breadcrumbs,
  Link as MuiLink,
  Paper,
  Box,
} from "@mui/material";
import type { Novel } from "@prisma/client";
import StoryOutlineView from "@/components/novels/StoryOutlineView";

interface IATPageProps {
  params: {
    novelId: string;
  };
}

export default function IATPage({ params }: IATPageProps) {
  const { novelId } = use(params);
  const [novelData, setNovelData] = useState<Novel | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const fetchNovel = useCallback(async () => {
    setIsLoadingData(true);
    try {
      // Ambil data novel, termasuk semua chapternya. Kita perlu menyertakan relasi chapters.
      // Gunakan opsi { cache: 'no-store' } untuk memastikan data selalu segar.
      const response = await fetch(
        `/api/novels/${novelId}?includeChapters=true`,
        {
          // Tambahkan query param
          cache: "no-store",
        }
      );
      if (!response.ok) throw new Error("Gagal memuat data novel.");
      const data = await response.json();
      setNovelData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoadingData(false);
    }
  }, [novelId]);

  useEffect(() => {
    if (novelId) {
      fetchNovel();
    }
  }, [novelId, fetchNovel]);

  if (isLoadingData) {
    return (
      <Container maxWidth={false} sx={{ py: 4 }}>
        <Skeleton variant="text" width="40%" height={60} />
        <Skeleton variant="text" width="60%" height={50} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" width="100%" height="70vh" />
      </Container>
    );
  }

  if (error || !novelData) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">{error || "Gagal memuat data."}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth={false} sx={{ py: 4, px: { xs: 2, md: 4 } }}>
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
        <MuiLink
          component="a" // Gunakan 'a' karena Link dari Next.js akan di-handle oleh StoryMapView
          underline="hover"
          color="inherit"
          href={`/dashboard/novels/edit/${novelId}`}
        >
          Editor Novel
        </MuiLink>
        <Typography color="text.primary">Peta Cerita Interaktif</Typography>
      </Breadcrumbs>
      <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
        <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
          Peta Cerita: {novelData.title}
        </Typography>
      </Box>
      <Paper
        elevation={3}
        sx={{
          width: "100%", // Lebar penuh
          height: "calc(100vh - 220px)", // Sesuaikan tinggi dengan viewport
          position: "relative",
        }}
      >
        <StoryOutlineView
          novel={novelData}
          onUpdate={fetchNovel} // Pass fungsi fetchNovel untuk re-fetch data
        />
      </Paper>
    </Container>
  );
}
