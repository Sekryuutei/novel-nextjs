"use client";

import { Chapter } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState, useTransition, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  TUpdateChapterSchema,
  UpdateChapterSchema,
} from "@/lib/validators/chapter";
import {
  Box,
  Button,
  CircularProgress,
  FormControlLabel,
  Paper,
  Switch,
  TextField,
  Typography,
  Alert,
} from "@mui/material";
import TiptapEditor from "@/components/chapters/ChapterEditor";
import { Grid } from "@mui/material";
interface ChapterEditorFormProps {
  novelId: string;
  chapter: Chapter;
}

export default function ChapterEditorForm({
  novelId,
  chapter,
}: ChapterEditorFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // State terpisah untuk konten dari ReactQuill
  const [content, setContent] = useState(chapter.content);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    watch,
  } = useForm<TUpdateChapterSchema>({
    resolver: zodResolver(UpdateChapterSchema),
    defaultValues: {
      title: chapter.title,
      isPremium: chapter.isPremium,
    },
  });

  const isPremium = watch("isPremium");

  // Fungsi untuk menyimpan semua perubahan (pengaturan & konten)
  const handleSaveAll = async (data: TUpdateChapterSchema) => {
    setError(null);
    setSuccess(null);

    const payload = {
      ...data,
      content: content,
    };

    startTransition(async () => {
      try {
        const response = await fetch(
          `/api/novels/${novelId}/chapters/${chapter.id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );

        if (!response.ok) {
          throw new Error("Gagal menyimpan perubahan chapter.");
        }

        setSuccess("Chapter berhasil disimpan!");
        router.refresh(); // Refresh data di server component
      } catch (err: any) {
        setError(err.message);
      }
    });
  };

  const isLoading = isSubmitting || isPending;

  return (
    <Box component="form" onSubmit={handleSubmit(handleSaveAll)} noValidate>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Grid container spacing={4}>
        {/* Kolom Kiri: Editor Konten */}
        <Grid item xs={12} md={8}>
          <TiptapEditor content={content} onChange={setContent} />
        </Grid>

        {/* Kolom Kanan: Pengaturan Chapter */}
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" component="h2" gutterBottom>
              Pengaturan Chapter
            </Typography>
            <TextField
              margin="normal"
              required
              fullWidth
              id="title"
              label="Judul Chapter"
              disabled={isLoading}
              {...register("title")}
              error={!!errors.title}
              helperText={errors.title?.message}
            />
            <FormControlLabel
              control={
                <Switch
                  {...register("isPremium")}
                  checked={isPremium}
                  disabled={isLoading}
                />
              }
              label="Chapter Premium"
              sx={{ mt: 1 }}
            />
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
            >
              Aktifkan jika chapter ini hanya bisa diakses oleh pembaca premium.
            </Typography>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3 }}
              disabled={isLoading}
            >
              {isLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Simpan Chapter"
              )}
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
