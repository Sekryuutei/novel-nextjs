import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

const branchSchema = z.object({
  newChoiceText: z.string().optional(),
  newChapterTitle: z.string().min(1, "Judul chapter baru tidak boleh kosong."),
  positionX: z.number().optional(),
  positionY: z.number().optional(),
});

interface BranchParams {
  params: {
    novelId: string;
    chapterId: string;
  };
}

export async function POST(request: NextRequest, { params }: BranchParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Akses ditolak." }, { status: 401 });
    }

    const { novelId, chapterId } = await params;

    // 1. Validate request body
    const body = await request.json();
    const { newChoiceText, newChapterTitle, positionX, positionY } =
      branchSchema.parse(body);

    // 2. Verify ownership of the novel
    const novel = await prisma.novel.findFirst({
      where: {
        id: novelId,
        authorId: session.user.id,
      },
      include: {
        chapters: {
          select: { chapterNumber: true },
        },
      },
    });

    if (!novel) {
      return NextResponse.json(
        { message: "Novel tidak ditemukan atau Anda tidak punya akses." },
        { status: 404 }
      );
    }

    // 3. Lakukan logika percabangan dalam satu transaksi
    const newChapter = await prisma.$transaction(async (tx) => {
      // a. Dapatkan nomor chapter tertinggi saat ini untuk menentukan nomor chapter baru
      const lastChapter = await tx.chapter.findFirst({
        where: { novelId: novelId },
        orderBy: { chapterNumber: "desc" },
        select: { chapterNumber: true },
      });
      const newChapterNumber = (lastChapter?.chapterNumber || 0) + 1;

      // b. Buat chapter baru
      const newChapter = await tx.chapter.create({
        data: {
          title: newChapterTitle,
          chapterNumber: newChapterNumber,
          novelId: novelId,
          content: "", // Tambahkan konten kosong sebagai default
          authorId: session.user.id,
          positionX: positionX,
          positionY: positionY,
        },
      });

      // c. Buat choice baru yang menghubungkan chapter asal ke chapter baru
      await tx.choice.create({
        data: {
          text: newChoiceText || "", // Gunakan string kosong jika tidak ada input
          chapterId: chapterId,
          nextChapterId: newChapter.id,
        },
      });

      return newChapter;
    });

    // Revalidate path untuk IAT agar data selalu segar
    revalidatePath(`/dashboard/novels/edit/${novelId}/iat`);

    return NextResponse.json(newChapter, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Input tidak valid", errors: error.issues },
        { status: 422 }
      );
    }
    console.error("[CHAPTER_BRANCH_POST_ERROR]", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan di server." },
      { status: 500 }
    );
  }
}
