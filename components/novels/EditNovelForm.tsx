"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
} from "@mui/material";
import { UpdateNovelSchema, TUpdateNovelSchema } from "@/lib/validators/novel";
import type { Novel } from "@prisma/client";

interface EditNovelFormProps {
  novel: Novel;
}

export default function EditNovelForm({ novel }: EditNovelFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<TUpdateNovelSchema>({
    resolver: zodResolver(UpdateNovelSchema),
    defaultValues: {
      title: novel.title,
      description: novel.description || "",
    },
  });

  const onSubmit = (data: TUpdateNovelSchema) => {
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      try {
        const response = await fetch(`/api/novels/${novel.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const result = await response.json();
          throw new Error(result.message || "Gagal memperbarui novel.");
        }

        setSuccess("Novel berhasil diperbarui!");
        router.refresh(); // Refresh data di server
      } catch (err: any) {
        setError(err.message);
      }
    });
  };

  const isLoading = isPending || isSubmitting;

  return (
    <Paper elevation={2} sx={{ p: 4 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        Edit Detail Novel
      </Typography>

      {error && (
        <Alert severity="error" sx={{ width: "100%", mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ width: "100%", mb: 2 }}>
          {success}
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
          label="Deskripsi"
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
          disabled={isLoading || !isDirty}
        >
          {isLoading ? <CircularProgress size={24} /> : "Simpan Perubahan"}
        </Button>
      </Box>
    </Paper>
  );
}
