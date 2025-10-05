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

// Tipe data novel yang kita butuhkan untuk styling
type NovelDataForRead = Pick<
  Novel,
  "id" | "title" | "fontFamily" | "fontColor" | "backgroundColor"
>;

export default function ReadPage({ params }: { params: { novelId: string } }) {
  const { novelId } = params;
  const [novelData, setNovelData] = useState<NovelDataForRead | null>(null);
  const [storyText, setStoryText] = useState("");
  const [choices, setChoices] = useState<Choice[]>([]);
  const [isEnd, setIsEnd] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const advanceStory = useCallback(
    async (choiceIndex?: number) => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/stories/${novelId}`, {
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
        setStoryText(data.storyText);
        setChoices(data.choices);
        setIsEnd(data.isEnd);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    },
    [novelId]
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

        // Memulai cerita awal (tanpa choiceIndex)
        const storyRes = await fetch(`/api/stories/${novelId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}), // Body kosong untuk memulai cerita
        });

        if (!storyRes.ok) {
          const errorData = await storyRes.json();
          throw new Error(errorData.message || "Gagal memuat cerita.");
        }

        const storyData = await storyRes.json();
        setStoryText(storyData.storyText);
        setChoices(storyData.choices);
        setIsEnd(storyData.isEnd);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [novelId]);

  if (!novelData && !isLoading) {
    return notFound();
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        py: 4,
        backgroundColor: novelData?.backgroundColor || "#FFFFFF",
        color: novelData?.fontColor || "#000000",
        fontFamily: novelData?.fontFamily || "Inter, sans-serif",
        transition: "background-color 0.3s, color 0.3s",
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
          {isLoading && !storyText ? ( // Tampilkan loading hanya jika belum ada teks
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
            <Typography sx={{ whiteSpace: "pre-wrap" }}>{storyText}</Typography>
          )}
        </Paper>

        <Stack spacing={2} sx={{ mt: 4 }}>
          {!error &&
            choices.map((choice) => {
              const isPremium = choice.tags?.includes("premium");
              return (
                <Button
                  key={choice.index}
                  variant={isPremium ? "outlined" : "contained"}
                  color={isPremium ? "secondary" : "primary"}
                  onClick={() => {
                    if (isPremium) {
                      alert(
                        "Ini adalah pilihan premium! Fitur pembelian akan datang."
                      );
                    } else {
                      advanceStory(choice.index);
                    }
                  }}
                >
                  {choice.text} {isPremium && "💎"}
                </Button>
              );
            })}

          {!isLoading && !error && choices.length === 0 && !isEnd && (
            <Button variant="contained" onClick={() => advanceStory()}>
              Lanjutkan
            </Button>
          )}

          {isEnd && (
            <Typography variant="h6" align="center" color="text.secondary">
              - Tamat -
            </Typography>
          )}
        </Stack>
      </Container>
    </Box>
  );
}
