"use client";

import { useEffect, useState, use, useCallback } from "react";
import {
  Button,
  Container,
  Paper,
  Typography,
  Stack,
  CircularProgress,
  Alert,
} from "@mui/material";

interface Choice {
  text: string;
  index: number;
  tags: string[];
}

export default function ReadPage({ params }: { params: { novelId: string } }) {
  const { novelId } = use(params);
  const [storyText, setStoryText] = useState("");
  const [choices, setChoices] = useState<Choice[]>([]);
  const [isEnd, setIsEnd] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fungsi untuk memuat/melanjutkan cerita
  const advanceStory = useCallback(
    async (choiceIndex?: number) => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/read/${novelId}/progress`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ choiceIndex }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Gagal melanjutkan cerita.");
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

  // Muat cerita saat pertama kali halaman dibuka
  useEffect(() => {
    advanceStory();
  }, [advanceStory]);

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={2} sx={{ p: 4, minHeight: "300px" }}>
        {isLoading ? (
          <CircularProgress />
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <Typography sx={{ whiteSpace: "pre-wrap" }}>{storyText}</Typography>
        )}
      </Paper>

      <Stack spacing={2} sx={{ mt: 4 }}>
        {!isLoading &&
          !error &&
          choices.map((choice) => {
            const isPremium = choice.tags?.includes("premium");
            return (
              <Button
                key={choice.index}
                variant={isPremium ? "outlined" : "contained"}
                color={isPremium ? "secondary" : "primary"}
                onClick={() => {
                  if (isPremium) {
                    // TODO: Tampilkan dialog pembelian
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
  );
}
