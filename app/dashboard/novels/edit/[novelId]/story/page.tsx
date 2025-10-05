"use client";

import { useState, useEffect, use } from "react";
import {
  Container,
  Typography,
  Button,
  TextField,
  Alert,
  Box,
  CircularProgress,
  Paper,
  Link as MuiLink,
} from "@mui/material";
import Link from "next/link";

interface StoryEditorPageProps {
  params: {
    novelId: string;
  };
}

export default function StoryEditorPage({ params }: StoryEditorPageProps) {
  const { novelId } = use(params);
  const [inkJson, setInkJson] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchStoryContent = async () => {
      setIsFetching(true);
      try {
        // Coba ambil konten yang sudah ada
        const res = await fetch(`/stories/${novelId}.ink.json`);
        if (res.ok) {
          const data = await res.json();
          // Format JSON agar mudah dibaca di editor
          setInkJson(JSON.stringify(data, null, 2));
        }
        // Jika file tidak ada (404), biarkan editor kosong, itu normal.
      } catch (err) {
        // Error selain 404
        console.error("Gagal memuat cerita:", err);
      } finally {
        setIsFetching(false);
      }
    };

    fetchStoryContent();
  }, [novelId]);

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/stories/${novelId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inkJsonContent: inkJson }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Gagal menyimpan cerita.");
      }

      setSuccess(data.message);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Editor Cerita Interaktif (Ink JSON)
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        Tulis cerita Anda menggunakan Ink, lalu ekspor ke JSON dan tempelkan
        kontennya di sini. Anda bisa menggunakan{" "}
        <MuiLink href="https://www.inklestudios.com/ink/" target="_blank">
          Inky Editor
        </MuiLink>{" "}
        untuk menulis.
      </Typography>

      {isFetching ? (
        <CircularProgress />
      ) : (
        <Paper elevation={2} sx={{ p: 2 }}>
          <TextField
            multiline
            fullWidth
            rows={20}
            value={inkJson}
            onChange={(e) => setInkJson(e.target.value)}
            placeholder="Tempelkan konten .ink.json Anda di sini..."
            sx={{ "& .MuiInputBase-input": { fontFamily: "monospace" } }}
          />
        </Paper>
      )}

      <Box sx={{ mt: 3, display: "flex", gap: 2, alignItems: "center" }}>
        <Button variant="contained" onClick={handleSave} disabled={isLoading}>
          {isLoading ? <CircularProgress size={24} /> : "Simpan Cerita"}
        </Button>
        <Button component={Link} href={`/dashboard/novels/edit/${novelId}`}>
          Kembali ke Editor Novel
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}
    </Container>
  );
}
