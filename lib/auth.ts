// lib/auth.ts
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "./prisma";
import bcrypt from "bcryptjs";
import { LoginFormData } from "@/types";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials): Promise<any> {
        try {
          if (!credentials?.email || !credentials?.password) {
            throw new Error("Email dan password harus diisi");
          }

          // Cari user di database
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email.toLowerCase(),
            },
          });

          if (!user) {
            throw new Error("User tidak ditemukan");
          }

          if (!user.password) {
            throw new Error("User belum setup password");
          }

          // Verifikasi password
          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isPasswordValid) {
            throw new Error("Password salah");
          }

          // Return user data tanpa password
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          };
        } catch (error) {
          console.error("Auth error:", error);
          throw error;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Tambahkan data user ke token saat sign in
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }

      // Update token saat session di-update
      if (trigger === "update" && session) {
        token.name = session.name;
        token.email = session.email;
      }

      return token;
    },
    async session({ token, session }) {
      // Tambahkan data dari token ke session
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
      }

      return session;
    },
    async redirect({ url, baseUrl }) {
      // Redirect ke dashboard setelah login sukses
      if (url.startsWith("/dashboard")) return url;
      if (url.startsWith(baseUrl)) return url;
      return baseUrl + "/dashboard";
    }
  },
  pages: {
    signIn: "/auth/login",
    signUp: "/auth/register",
    error: "/auth/error",
  },
  events: {
    async signIn({ user, isNewUser }) {
      console.log(`User ${user.email} berhasil login`);
    },
    async signOut({ token }) {
      console.log(`User ${token.email} berhasil logout`);
    }
  },
  debug: process.env.NODE_ENV === "development",
};