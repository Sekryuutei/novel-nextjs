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
    const chapter = await prisma.chapter.findUnique({
      where: { id: params.chapterId },
      include: {
        choicesAsSource: true, // Ambil semua pilihan yang berasal dari chapter ini
      },
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

    // 3. Verifikasi Kepemilikan Chapter
    const chapterToUpdate = await prisma.chapter.findFirst({
      where: {
        id: params.chapterId,
        novelId: params.novelId,
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
      where: { id: params.chapterId },
      data: {
        title: parsedData.title,
        content: parsedData.content,
        isPremium: parsedData.isPremium,
        positionX: parsedData.positionX,
        positionY: parsedData.positionY,
        // Handle 'choices' update using nested writes on the correct relation field
        ...(parsedData.choices && {
          choicesAsSource: {
            // 1. Hapus semua pilihan yang ada untuk chapter ini
            deleteMany: {},
            // 2. Buat kembali semua pilihan dari data yang dikirim
            create: parsedData.choices
              .filter((choice) => choice.nextChapterId) // Hanya buat choice yang punya tujuan
              .map((choice) => ({
                text: choice.text,
                // Pastikan nextChapterId tidak null
                nextChapterId: choice.nextChapterId!,
              })),
          },
        }),
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

// Handler untuk DELETE (menghapus chapter)
export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    // 1. Verifikasi Sesi
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Akses ditolak" }, { status: 401 });
    }

    // 2. Validasi ID dari URL
    const { novelId, chapterId } = params;

    // 3. Verifikasi Kepemilikan Chapter
    const chapterToDelete = await prisma.chapter.findFirst({
      where: {
        id: chapterId,
        novelId: novelId,
        authorId: session.user.id,
      },
    });

    if (!chapterToDelete) {
      return NextResponse.json(
        { message: "Chapter tidak ditemukan atau Anda tidak punya hak akses." },
        { status: 404 }
      );
    }

    // Hapus semua 'Choice' yang menunjuk ke chapter ini terlebih dahulu
    await prisma.choice.deleteMany({
      where: {
        nextChapterId: chapterId,
      },
    });

    // 4. Hapus Chapter dari Database
    // Karena kita punya `onDelete: Cascade` pada relasi Choice,
    // semua pilihan yang berasal dari chapter ini akan ikut terhapus.
    await prisma.chapter.delete({
      where: { id: chapterId },
    });

    return NextResponse.json({ message: "Chapter berhasil dihapus" });
  } catch (error) {
    console.error("[CHAPTER_DELETE_ERROR]", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
