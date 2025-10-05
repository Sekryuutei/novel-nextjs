"use client";

import { useEffect, useState, use, useCallback, Fragment } from "react";
import {
  Button,
  Container,
  Paper,
  Typography,
  Stack,
  CircularProgress,
  Alert,
  Box,
} from "@mui/material";
import { notFound } from "next/navigation";
import type { Novel } from "@prisma/client";

interface Choice {
  text: string;
  index: number;
  tags: string[];
}

interface StoryState {
  storyText: string;
  choices: Choice[];
  isEnd: boolean;
  // Kita bisa tambahkan data lain di sini jika perlu, misal: tags chapter
}

// Tipe data novel yang kita butuhkan untuk styling
type NovelDataForRead = Pick<Novel, "id" | "title">;

export default function ReadPage({ params }: { params: { novelId: string } }) {
  const { novelId } = use(params);
  const [novelData, setNovelData] = useState<NovelDataForRead | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdvancing, setIsAdvancing] = useState(false); // State loading khusus untuk pilihan
  const [error, setError] = useState<string | null>(null);

  // State baru untuk mengelola riwayat cerita
  const [history, setHistory] = useState<StoryState[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  // Ambil state saat ini dari riwayat
  const currentStoryState = history[currentIndex];

  const advanceStory = useCallback(
    async (choiceIndex?: number) => {
      setIsAdvancing(true);
      setError(null);
      try {
        // Ganti endpoint ke /api/read/[novelId]/progress
        const res = await fetch(`/api/read/${novelId}/progress`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ choiceIndex }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(
            errorData.message || "Gagal memuat atau melanjutkan cerita."
          );
        }

        const data = await res.json();

        // Logika baru untuk memperbarui riwayat
        setHistory((prevHistory) => {
          // Jika pembaca membuat pilihan baru setelah kembali, potong riwayat masa depan
          const newHistory = prevHistory.slice(0, currentIndex + 1);
          return [...newHistory, data];
        });
        setCurrentIndex((prevIndex) => prevIndex + 1);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsAdvancing(false);
      }
    },
    [novelId, currentIndex]
  );

  // 2. Muat data novel dan cerita awal saat komponen pertama kali dimuat
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Ambil data novel untuk styling
        const novelRes = await fetch(`/api/novels/${novelId}`);
        if (!novelRes.ok) throw new Error("Novel tidak ditemukan.");
        const novel: NovelDataForRead = await novelRes.json();
        setNovelData(novel);

        // Memulai cerita awal (tanpa choiceIndex) - Ganti endpoint
        const storyRes = await fetch(`/api/read/${novelId}/progress`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reset: true }), // Selalu reset saat pertama kali load halaman
        });

        if (!storyRes.ok) {
          const errorData = await storyRes.json();
          throw new Error(errorData.message || "Gagal memuat cerita.");
        }

        const storyData = await storyRes.json();
        // Inisialisasi riwayat dengan state pertama
        setHistory([storyData]);
        setCurrentIndex(0);
      } catch (err: any) {
        console.error("[FRONTEND_ERROR] Fetch initial data failed:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [novelId]);

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  if (!novelData && !isLoading) {
    return notFound();
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        py: 4,
      }}
    >
      <Container maxWidth="md">
        <Typography variant="h4" component="h1" gutterBottom>
          {novelData?.title || "Memuat..."}
        </Typography>
        <Paper
          elevation={2}
          sx={{
            p: 4,
            minHeight: "300px",
            backgroundColor: "rgba(255, 255, 255, 0.85)",
            color: "inherit",
            fontFamily: "inherit",
          }}
        >
          {isLoading ? ( // Tampilkan loading saat data awal dimuat
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
              }}
            >
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : (
            currentStoryState && (
              <Typography
                component="div"
                sx={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }}
                dangerouslySetInnerHTML={{
                  __html: currentStoryState.storyText,
                }}
              />
            )
          )}
        </Paper>

        <Stack spacing={2} sx={{ mt: 4 }}>
          {!isLoading &&
            !error &&
            currentStoryState &&
            currentStoryState.choices.map((choice) => {
              const isPremium = choice.tags?.includes("premium");
              return (
                <Button
                  key={choice.index}
                  variant={isPremium ? "outlined" : "contained"}
                  color={isPremium ? "secondary" : "primary"}
                  onClick={() => {
                    if (isAdvancing) return; // Cegah klik ganda saat loading
                    if (isPremium) {
                      alert(
                        "Ini adalah pilihan premium! Fitur pembelian akan datang."
                      );
                    } else {
                      advanceStory(choice.index);
                    }
                  }}
                  disabled={isAdvancing}
                >
                  {isAdvancing ? <CircularProgress size={24} /> : choice.text}{" "}
                  {isPremium && "💎"}
                </Button>
              );
            })}

          {currentStoryState?.isEnd && (
            <Typography variant="h6" align="center" color="text.secondary">
              - Tamat -
            </Typography>
          )}
        </Stack>

        {/* Tombol Navigasi Baru */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            mt: 4,
            pt: 2,
            borderTop: 1,
            borderColor: "divider",
          }}
        >
          <Button
            onClick={handlePrevious}
            disabled={currentIndex <= 0 || isLoading || isAdvancing}
            fullWidth
          >
            &laquo; Kembali
          </Button>
          <Button
            onClick={() => {
              // Jika kita berada di ujung riwayat, "Selanjutnya" akan memajukan cerita.
              // Jika tidak, ia hanya akan maju dalam riwayat yang sudah ada.
              if (currentIndex >= history.length - 1) {
                advanceStory();
              } else {
                handleNext();
              }
            }}
            disabled={
              (currentIndex >= history.length - 1 &&
                currentStoryState?.isEnd) ||
              currentStoryState?.choices.length > 0 || // Nonaktifkan jika ada pilihan
              isLoading ||
              isAdvancing
            }
            fullWidth
          >
            {isAdvancing && currentIndex >= history.length - 1 ? (
              <CircularProgress size={24} />
            ) : (
              "Selanjutnya"
            )}{" "}
            &raquo;
          </Button>
        </Box>
      </Container>
    </Box>
  );
}
