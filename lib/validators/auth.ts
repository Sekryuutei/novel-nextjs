import { z } from "zod";

export const RegisterSchema = z
  .object({
    name: z
      .string()
      .min(3, { message: "Nama harus memiliki minimal 3 karakter." }),
    email: z.string().email({ message: "Format email tidak valid." }),
    password: z
      .string()
      .min(6, { message: "Password harus memiliki minimal 6 karakter." }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Konfirmasi password tidak cocok.",
    path: ["confirmPassword"], // Menetapkan error pada field confirmPassword
  });

export type TRegisterSchema = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: z.string().email({ message: "Format email tidak valid." }),
  password: z.string().min(1, { message: "Password tidak boleh kosong." }),
});

export type TLoginSchema = z.infer<typeof LoginSchema>;
