import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { CreateChapterSchema } from "@/lib/validators/chapter"; // This line is already correct
import { z } from "zod";

interface IParams {
  params: { novelId: string };
}

export async function POST(request: NextRequest, { params }: IParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { novelId } = params;
    const body = await request.json();
    const { title } = CreateChapterSchema.parse(body);

    // Verifikasi kepemilikan novel
    const novelOwner = await prisma.novel.findUnique({
      where: {
        id: novelId,
        authorId: session.user.id,
      },
    });

    if (!novelOwner) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Cari chapter terakhir untuk menentukan chapterNumber berikutnya
    const lastChapter = await prisma.chapter.findFirst({
      where: {
        novelId: novelId,
      },
      orderBy: {
        chapterNumber: "desc",
      },
    });

    const newChapterNumber = lastChapter ? lastChapter.chapterNumber + 1 : 1;

    const chapter = await prisma.chapter.create({
      data: {
        title,
        chapterNumber: newChapterNumber,
        novelId: novelId,
        authorId: session.user.id,
        content: "", // Konten awal kosong
      },
    });

    return NextResponse.json(chapter, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 422 });
    }
    console.error("[CHAPTERS_POST_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function GET(request: NextRequest, { params }: IParams) {
  try {
    // Tidak perlu session untuk GET list, karena bisa dilihat publik
    const { novelId } = params;

    const chapters = await prisma.chapter.findMany({
      where: {
        novelId: novelId,
      },
      orderBy: {
        chapterNumber: "asc",
      },
    });

    return NextResponse.json(chapters);
  } catch (error) {
    console.error("[CHAPTERS_GET_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
