import { z } from "zod";

export const CreateChapterSchema = z.object({
  title: z
    .string()
    .min(3, { message: "Judul chapter harus memiliki minimal 3 karakter." })
    .max(100, {
      message: "Judul chapter tidak boleh lebih dari 100 karakter.",
    }),
});

export type TCreateChapterSchema = z.infer<typeof CreateChapterSchema>;

export const UpdateChapterSchema = z.object({
  title: z
    .string()
    .min(3, { message: "Judul chapter harus memiliki minimal 3 karakter." })
    .max(100, { message: "Judul chapter tidak boleh lebih dari 100 karakter." })
    .optional(),
  content: z.string().nullable().optional(),
  isPremium: z.boolean().optional(),
  positionX: z.number().optional(),
  positionY: z.number().optional(),
  price: z.number().optional().nullable(),
  choices: z
    .array(
      z.object({
        id: z.string().optional(), // Hanya untuk key di React
        text: z
          .string()
          .min(1, { message: "Teks pilihan tidak boleh kosong." }),
        nextChapterId: z.string().nullable(),
      })
    )
    .optional(),
});

export type TUpdateChapterSchema = z.infer<typeof UpdateChapterSchema>;
