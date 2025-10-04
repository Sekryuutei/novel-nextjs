import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { CreateNovelSchema } from "@/lib/validators/novel";
import { z } from "zod";

export async function POST(request: NextRequest) {
  try {
    // 1. Verifikasi Sesi Pengguna
    const session = await getServerSession(authOptions);

    // Pengecekan yang lebih spesifik untuk memastikan user dan ID-nya ada
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Akses ditolak. Anda harus login untuk membuat novel." },
        { status: 401 }
      );
    }

    // 2. Parse dan Validasi Body Request
    const body = await request.json();
    const { title, description } = CreateNovelSchema.parse(body);

    // Validasi tambahan: Pastikan user dari sesi benar-benar ada di DB
    const author = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!author) {
      // Ini menangani kasus di mana sesi valid tetapi user telah dihapus dari DB.
      return NextResponse.json(
        { message: "User tidak ditemukan. Silakan login kembali." },
        { status: 404 }
      );
    }

    // 3. Buat Novel di Database
    const newNovel = await prisma.novel.create({
      data: {
        title,
        description,
        authorId: session.user.id,
        // Field lain akan menggunakan nilai default dari schema.prisma
        // seperti status: 'DRAFT', isPremium: false, dll.
      },
    });

    // 4. Kirim Respons Sukses
    return NextResponse.json(newNovel, { status: 201 });
  } catch (error) {
    // Tangani error validasi dari Zod
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Input tidak valid.", errors: error.issues },
        { status: 422 }
      );
    }

    // Tangani error umum
    console.error("[NOVELS_POST_ERROR]", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan di server. Silakan coba lagi nanti." },
      { status: 500 }
    );
  }
}
