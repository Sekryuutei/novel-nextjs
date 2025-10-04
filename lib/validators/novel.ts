import { z } from "zod";

export const CreateNovelSchema = z.object({
  title: z
    .string()
    .min(3, { message: "Judul harus memiliki minimal 3 karakter." })
    .max(100, { message: "Judul tidak boleh lebih dari 100 karakter." }),
  description: z.string().optional(),
});

export type TCreateNovelSchema = z.infer<typeof CreateNovelSchema>;

export const UpdateNovelSchema = z.object({
  title: z
    .string()
    .min(3, { message: "Judul harus memiliki minimal 3 karakter." })
    .max(100, { message: "Judul tidak boleh lebih dari 100 karakter." }),
  description: z.string().optional(),
});

export type TUpdateNovelSchema = z.infer<typeof UpdateNovelSchema>;
