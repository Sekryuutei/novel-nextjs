import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

interface IParams {
  novelId: string;
  chapterId: string;
}

export async function POST(request: Request, { params }: { params: IParams }) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { novelId, chapterId } = params;
  if (!novelId || !chapterId) {
    return new NextResponse("Novel ID dan Chapter ID diperlukan", {
      status: 400,
    });
  }

  const body = await request.json();
  const { text, nextChapterId } = body;

  if (!text || !nextChapterId) {
    return new NextResponse("Teks pilihan dan chapter tujuan diperlukan", {
      status: 400,
    });
  }

  try {
    // Verifikasi bahwa user adalah pemilik chapter sumber
    const sourceChapter = await prisma.chapter.findFirst({
      where: {
        id: chapterId,
        authorId: session.user.id,
      },
    });

    if (!sourceChapter) {
      return new NextResponse("Chapter sumber tidak ditemukan atau akses ditolak", {
        status: 404,
      });
    }

    // Buat pilihan baru
    const newChoice = await prisma.choice.create({
      data: {
        text,
        chapterId, // ID chapter sumber
        nextChapterId, // ID chapter tujuan
      },
    });

    return NextResponse.json(newChoice);
  } catch (error) {
    console.error("[CHOICES_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

