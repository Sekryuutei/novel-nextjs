import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { UpdateChapterSchema } from "@/lib/validators/chapter";

interface RouteContext {
  params: {
    novelId: string;
    chapterId: string;
  };
}

// Handler untuk GET (mengambil detail satu chapter)
export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { chapterId } = params; // This is correct.

    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
    });

    if (!chapter) {
      return NextResponse.json(
        { message: "Chapter tidak ditemukan" },
        { status: 404 }
      );
    }

    // Anda mungkin ingin menambahkan pengecekan akses di sini jika chapter tidak publik

    return NextResponse.json(chapter);
  } catch (error) {
    console.error("[CHAPTER_GET_ERROR]", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// Handler untuk PATCH (memperbarui chapter)
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    // 1. Verifikasi Sesi
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Akses ditolak" }, { status: 401 });
    }

    // 2. Validasi ID dari URL
    const { novelId, chapterId } = params; // This is also correct.

    // 3. Verifikasi Kepemilikan Chapter
    const chapterToUpdate = await prisma.chapter.findFirst({
      where: {
        id: chapterId,
        novelId: novelId,
        authorId: session.user.id, // Pastikan user yang login adalah pemilik chapter
      },
    });

    if (!chapterToUpdate) {
      return NextResponse.json(
        { message: "Chapter tidak ditemukan atau Anda tidak punya hak akses." },
        { status: 404 }
      );
    }

    // 4. Validasi Body Request
    const body = await request.json();
    const parsedData = UpdateChapterSchema.parse(body);

    // 5. Update Chapter di Database
    const updatedChapter = await prisma.chapter.update({
      where: { id: chapterId },
      data: {
        title: parsedData.title,
        content: parsedData.content,
        isPremium: parsedData.isPremium,
        positionX: parsedData.positionX,
        positionY: parsedData.positionY,
        choices: parsedData.choices || [],
      },
    });

    return NextResponse.json(updatedChapter);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ errors: error.issues }, { status: 422 });
    }

    console.error("[CHAPTER_PATCH_ERROR]", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
