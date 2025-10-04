"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import {
  Container,
  Paper,
  Typography,
  Alert,
  Skeleton,
  Box,
  Tabs,
  Tab,
} from "@mui/material";
import type { Novel, Chapter } from "@prisma/client";
import EditNovelForm from "@/components/novels/EditNovelForm";
import ChapterList from "@/components/chapters/ChapterList";
import StoryMapView from "@/components/novels/StoryMapView";
import { ReactFlowProvider } from "reactflow";

type NovelWithChapters = Novel & { chapters: Chapter[] };

interface EditNovelPageProps {
  params: {
    novelId: string;
  };
}
export default function EditNovelPage({ params }: EditNovelPageProps) {
  const { novelId } = use(params) as { novelId: string };
  // const router = useRouter(); // Tidak digunakan, bisa dihapus
  const [novelData, setNovelData] = useState<NovelWithChapters | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [currentTab, setCurrentTab] = useState(0);

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
        <Skeleton variant="text" width="40%" height={60} sx={{ mb: 4 }} />
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            gap: 4,
          }}
        >
          <Box sx={{ flex: { md: 5 }, width: "100%" }}>
            <Skeleton variant="rectangular" width="100%" height={400} />
          </Box>
          <Box sx={{ flex: { md: 7 }, width: "100%" }}>
            <Skeleton variant="rectangular" width="100%" height={400} />
          </Box>
        </Box>
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
      <Typography variant="h4" component="h1" gutterBottom>
        Interactive Authoring Tool
      </Typography>
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: 2,
        }}
      >
        <Box sx={{ flex: { md: 5 }, width: "100%" }}>
          <EditNovelForm novel={novelData} />
        </Box>
        <Box
          sx={{
            flex: { md: 7 },
            width: "100%",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Paper elevation={2}>
            <Tabs
              value={currentTab}
              onChange={(_, newValue) => setCurrentTab(newValue)}
              aria-label="Tampilan Chapter"
              variant="fullWidth"
            >
              <Tab label="Daftar Chapter" />
              <Tab label="Peta Cerita" />
            </Tabs>
            {currentTab === 0 && (
              <ChapterList
                initialChapters={novelData.chapters}
                novelId={novelData.id}
              />
            )}
            {currentTab === 1 && (
              <ReactFlowProvider>
                <StoryMapView
                  novelId={novelData.id}
                  chapters={novelData.chapters}
                />
              </ReactFlowProvider>
            )}
          </Paper>
        </Box>
      </Box>
    </Container>
  );
}
