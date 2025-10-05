"use client";

import { Chapter } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState, useTransition, useEffect } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
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
  Grid,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import TiptapEditor from "@/components/chapters/ChapterEditor";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
interface ChapterEditorFormProps {
  novelId: string;
  chapter: Chapter;
  allChapters: { id: string; title: string; chapterNumber: number }[];
}

export default function ChapterEditorForm({
  novelId,
  chapter,
  allChapters,
}: ChapterEditorFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // State terpisah untuk konten dari ReactQuill
  const [content, setContent] = useState(chapter.content || "");

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting, isDirty },
    watch,
  } = useForm<TUpdateChapterSchema>({
    resolver: zodResolver(UpdateChapterSchema),
    defaultValues: {
      title: chapter.title,
      isPremium: chapter.isPremium,
      price: chapter.price ?? 0,
      choices: (chapter.choicesAsSource as any) || [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "choices",
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
            method: "PATCH",
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

      <Grid
        container
        spacing={4}
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
        }}
      >
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
            {isPremium && (
              <TextField
                margin="normal"
                fullWidth
                type="number"
                label="Harga Chapter (Rp)"
                disabled={isLoading}
                {...register("price", { valueAsNumber: true })}
                error={!!errors.price}
                helperText={errors.price?.message}
              />
            )}
            <Typography variant="h6" component="h3" sx={{ mt: 4, mb: 1 }}>
              Pilihan Cerita
            </Typography>

            {fields.map((field, index) => (
              <Paper
                key={field.id}
                variant="outlined"
                sx={{ p: 2, mb: 2, position: "relative" }}
              >
                <TextField
                  fullWidth
                  label={`Teks Pilihan #${index + 1}`}
                  {...register(`choices.${index}.text`)}
                  error={!!errors.choices?.[index]?.text}
                  helperText={errors.choices?.[index]?.text?.message}
                  sx={{ mb: 2 }}
                />
                <FormControl fullWidth>
                  <InputLabel id={`next-chapter-label-${index}`}>
                    Lanjut ke Chapter
                  </InputLabel>
                  <Controller
                    name={`choices.${index}.nextChapterId`}
                    control={control}
                    render={({ field: controllerField }) => (
                      <Select
                        labelId={`next-chapter-label-${index}`}
                        label="Lanjut ke Chapter"
                        {...controllerField}
                        value={controllerField.value || ""}
                      >
                        <MenuItem value="">
                          <em>Akhiri Cerita di Sini</em>
                        </MenuItem>
                        {allChapters
                          .filter((c) => c.id !== chapter.id)
                          .map((c) => (
                            <MenuItem key={c.id} value={c.id}>
                              #{c.chapterNumber}: {c.title}
                            </MenuItem>
                          ))}
                      </Select>
                    )}
                  />
                </FormControl>
                <IconButton
                  aria-label="delete choice"
                  onClick={() => remove(index)}
                  sx={{ position: "absolute", top: 8, right: 8 }}
                >
                  <DeleteIcon />
                </IconButton>
              </Paper>
            ))}

            <Button
              fullWidth
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() =>
                append({
                  text: "",
                  nextChapterId: "",
                })
              }
              sx={{ mt: 1 }}
            >
              Tambah Pilihan
            </Button>

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
