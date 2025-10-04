"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
} from "@mui/material";
import { CreateNovelSchema, TCreateNovelSchema } from "@/lib/validators/novel";
import type { Novel } from "@prisma/client";

export default function CreateNovelPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TCreateNovelSchema>({
    resolver: zodResolver(CreateNovelSchema),
  });

  const onSubmit = (data: TCreateNovelSchema) => {
    setError(null);
    startTransition(async () => {
      try {
        const response = await fetch("/api/novels/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const result = await response.json();
          throw new Error(result.error || "Gagal membuat novel baru.");
        }

        const newNovel: Novel = await response.json();

        // Redirect ke halaman edit novel yang baru dibuat
        router.push(`/dashboard/novels/edit/${newNovel.id}`);
        // Refresh halaman dashboard untuk menampilkan novel baru di daftar
        router.refresh();
      } catch (error: any) {
        setError(error.message);
      }
    });
  };

  const isLoading = isPending || isSubmitting;

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={2} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Buat Novel Baru
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Mulailah perjalanan menulismu dengan memberikan judul dan deskripsi
          singkat.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ width: "100%", mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <TextField
            margin="normal"
            required
            fullWidth
            id="title"
            label="Judul Novel"
            autoFocus
            disabled={isLoading}
            {...register("title")}
            error={!!errors.title}
            helperText={errors.title?.message}
          />
          <TextField
            margin="normal"
            fullWidth
            id="description"
            label="Deskripsi (Opsional)"
            multiline
            rows={4}
            disabled={isLoading}
            {...register("description")}
            error={!!errors.description}
            helperText={errors.description?.message}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={isLoading}
          >
            {isLoading ? <CircularProgress size={24} /> : "Buat & Lanjutkan"}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}
