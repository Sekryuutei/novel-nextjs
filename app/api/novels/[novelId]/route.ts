import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { UpdateNovelSchema } from "@/lib/validators/novel";

interface RouteContext {
  params: {
    novelId: string;
  };
}

// Handler untuk GET (mengambil detail satu novel)
export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { searchParams } = new URL(request.url);
    const includeChapters = searchParams.get("includeChapters") === "true";
    const { novelId } = params;

    const novel = await prisma.novel.findUnique({
      where: { id: novelId },
      include: {
        chapters: includeChapters
          ? {
              orderBy: { chapterNumber: "asc" },
            }
          : false,
      },
    });

    if (!novel) {
      return NextResponse.json(
        { message: "Novel tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json(novel);
  } catch (error) {
    console.error("[NOVEL_GET_ERROR]", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// Handler untuk PATCH (memperbarui novel)
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    // 1. Verifikasi Sesi
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Akses ditolak" }, { status: 401 });
    }

    // 2. Validasi ID Novel dari URL
    const { novelId } = params;

    // 3. Verifikasi Kepemilikan Novel
    const novelToUpdate = await prisma.novel.findFirst({
      where: {
        id: novelId,
        authorId: session.user.id, // Pastikan user yang login adalah pemilik novel
      },
    });

    if (!novelToUpdate) {
      return NextResponse.json(
        { message: "Novel tidak ditemukan atau Anda tidak punya hak akses." },
        { status: 404 }
      );
    }

    // 4. Validasi Body Request
    const body = await request.json();
    const { title, description } = UpdateNovelSchema.parse(body);

    // 5. Update Novel di Database
    const updatedNovel = await prisma.novel.update({
      where: { id: novelId },
      data: {
        title,
        description,
      },
    });

    return NextResponse.json(updatedNovel);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Input tidak valid", errors: error.issues },
        { status: 422 }
      );
    }

    console.error("[NOVEL_PATCH_ERROR]", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
