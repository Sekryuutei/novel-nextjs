import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
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
    const { chapterId } = await params;
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: {
        choicesAsSource: true, // Ambil semua pilihan yang berasal dari chapter ini
        novel: true, // Tambahkan ini untuk menyertakan data novel
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
    const { novelId, chapterId } = await params;
    // 1. Verifikasi Sesi
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Akses ditolak" }, { status: 401 });
    }

    // 2. Validasi ID dari URL

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

    // 5. Lakukan pembaruan dalam satu transaksi untuk memastikan konsistensi data
    const updatedChapter = await prisma.$transaction(async (tx) => {
      // a. Hapus semua pilihan (choices) yang ada dari chapter ini
      await tx.choice.deleteMany({
        where: {
          chapterId: chapterId,
        },
      });

      // b. Buat ulang pilihan berdasarkan data baru
      if (parsedData.choices && parsedData.choices.length > 0) {
        await tx.choice.createMany({
          data: parsedData.choices
            .filter((c) => c.text && c.nextChapterId) // Pastikan data valid
            .map((choice) => ({
              text: choice.text || "",
              chapterId: chapterId,
              nextChapterId: choice.nextChapterId!,
            })),
        });
      }

      // c. Update data chapter itu sendiri
      const chapter = await tx.chapter.update({
        where: { id: chapterId },
        data: {
          title: parsedData.title,
          content: parsedData.content,
          isPremium: parsedData.isPremium,
          price: parsedData.price,
          positionX: parsedData.positionX,
          positionY: parsedData.positionY,
        },
      });

      return chapter;
    });

    // Revalidate path untuk IAT agar data selalu segar
    revalidatePath(`/dashboard/novels/edit/${novelId}/iat`);

    // Revalidate path untuk halaman baca publik
    revalidatePath(`/read/${novelId}/${chapterId}`);

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
    const { novelId, chapterId } = await params;
    // 1. Verifikasi Sesi
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Akses ditolak" }, { status: 401 });
    }

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

    // Revalidate path untuk IAT agar data selalu segar
    revalidatePath(`/dashboard/novels/edit/${novelId}/iat`);

    return NextResponse.json({ message: "Chapter berhasil dihapus" });
  } catch (error) {
    console.error("[CHAPTER_DELETE_ERROR]", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
