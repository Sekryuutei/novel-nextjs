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

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // 2. Parse dan Validasi Body Request
    const body = await request.json();
    const { title, description } = CreateNovelSchema.parse(body);

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
      return new NextResponse(JSON.stringify(error.issues), { status: 422 });
    }

    // Tangani error umum
    console.error("[NOVELS_POST_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
