import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

const progressSchema = z.object({
  novelId: z.string(),
  chapterId: z.string(),
});

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Akses ditolak" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const novelId = searchParams.get("novelId");

  if (!novelId) {
    return NextResponse.json(
      { message: "novelId diperlukan" },
      { status: 400 }
    );
  }

  const progress = await prisma.readingProgress.findUnique({
    where: {
      userId_novelId: {
        userId: session.user.id,
        novelId: novelId,
      },
    },
  });

  return NextResponse.json(progress);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Akses ditolak" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { novelId, chapterId } = progressSchema.parse(body);

    const existingProgress = await prisma.readingProgress.findUnique({
      where: {
        userId_novelId: {
          userId: session.user.id,
          novelId: novelId,
        },
      },
    });

    if (existingProgress) {
      const currentPath = existingProgress.path;
      const currentIndex = currentPath.indexOf(
        existingProgress.currentChapterId
      );

      // Cek apakah chapter yang dituju adalah chapter berikutnya di path yang sudah ada
      const isMovingForward =
        currentIndex !== -1 && currentPath[currentIndex + 1] === chapterId;

      // Cek apakah pembaca kembali ke chapter sebelumnya
      const isMovingBackward =
        currentIndex > 0 && currentPath[currentIndex - 1] === chapterId;

      if (isMovingForward || isMovingBackward) {
        // Jika hanya bergerak maju/mundur di path yang ada, cukup update chapter saat ini
        const updatedProgress = await prisma.readingProgress.update({
          where: { id: existingProgress.id },
          data: { currentChapterId: chapterId },
        });
        return NextResponse.json(updatedProgress);
      }

      // Jika pembaca membuat pilihan baru (bukan maju/mundur di path yang ada),
      // potong path lama dan buat path baru.
      const newPath = currentPath.slice(0, currentIndex + 1);
      newPath.push(chapterId);

      const updatedProgress = await prisma.readingProgress.update({
        where: { id: existingProgress.id },
        data: {
          path: newPath,
          currentChapterId: chapterId,
        },
      });
      return NextResponse.json(updatedProgress);
    } else {
      // Buat progres baru jika belum ada
      const newProgress = await prisma.readingProgress.create({
        data: {
          userId: session.user.id,
          novelId: novelId,
          path: [chapterId],
          currentChapterId: chapterId,
        },
      });
      return NextResponse.json(newProgress, { status: 201 });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ errors: error.issues }, { status: 422 });
    }
    console.error("[READ_PROGRESS_POST_ERROR]", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
