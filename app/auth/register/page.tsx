// app/(auth)/register/page.tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import Link from "next/link";
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Link as MuiLink,
  CircularProgress,
} from "@mui/material"; // Removed unused import 'zodResolver'
import { zodResolver } from "@hookform/resolvers/zod";
import { RegisterSchema, TRegisterSchema } from "@/lib/validators/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TRegisterSchema>({
    resolver: zodResolver(RegisterSchema),
  });

  const onSubmit = (data: TRegisterSchema) => {
    setError("");
    startTransition(async () => {
      try {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Terjadi kesalahan saat mendaftar");
        }

        router.push(
          "/auth/login?message=" +
            encodeURIComponent("Registrasi berhasil! Silakan login.")
        );
      } catch (error: any) {
        setError(error.message);
      }
    });
  };

  return (
    <Container
      component="main"
      maxWidth="sm"
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        py: 4,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          padding: 4,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
          maxWidth: 400,
        }}
      >
        <Box sx={{ textAlign: "center", mb: 3 }}>
          <Typography component="h1" variant="h4" gutterBottom>
            Daftar Akun
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Buat akun baru untuk mulai menulis
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ width: "100%", mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box
          component="form"
          onSubmit={handleSubmit(onSubmit)}
          sx={{ mt: 1, width: "100%" }}
        >
          <TextField
            margin="normal"
            required
            fullWidth
            id="name"
            label="Nama Lengkap"
            name="name"
            autoComplete="name"
            autoFocus
            disabled={isPending || isSubmitting}
            {...register("name")}
            error={!!errors.name}
            helperText={errors.name?.message}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Alamat Email"
            name="email"
            autoComplete="email"
            disabled={isPending || isSubmitting}
            {...register("email")}
            error={!!errors.email}
            helperText={errors.email?.message}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="new-password"
            disabled={isPending || isSubmitting}
            {...register("password")}
            error={!!errors.password}
            helperText={errors.password?.message}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="confirmPassword"
            label="Konfirmasi Password"
            type="password"
            id="confirmPassword"
            disabled={isPending || isSubmitting}
            {...register("confirmPassword")}
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword?.message}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={isPending || isSubmitting}
          >
            {isPending || isSubmitting ? (
              <CircularProgress size={24} />
            ) : (
              "Daftar"
            )}
          </Button>

          <Box sx={{ textAlign: "center" }}>
            <Typography variant="body2">
              Sudah punya akun?{" "}
              <MuiLink component={Link} href="/auth/login" underline="hover">
                Masuk di sini
              </MuiLink>
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}
