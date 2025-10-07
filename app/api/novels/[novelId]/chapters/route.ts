import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

interface IParams {
  novelId?: string;
}

export async function POST(request: Request, context: { params: IParams }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { novelId } = context.params;
  if (!novelId) {
    return new NextResponse("Novel ID is required", { status: 400 });
  }

  const body = await request.json();
  const { title, content, isStart } = body;

  if (!title) {
    return new NextResponse("Title is required", { status: 400 });
  }

  try {
    // Cari chapter terakhir untuk menentukan chapterNumber berikutnya
    const lastChapter = await prisma.chapter.findFirst({
      where: { novelId: novelId },
      orderBy: { chapterNumber: "desc" },
    });

    const newChapterNumber = lastChapter ? lastChapter.chapterNumber + 1 : 1;

    const chapter = await prisma.chapter.create({
      data: {
        title,
        content: content || "",
        chapterNumber: newChapterNumber,
        isStart: isStart || false,
        novelId: novelId,
        authorId: session.user.id, // Hubungkan dengan author yang sedang login
      },
    });

    // Setelah chapter dibuat, update totalChapters di novel
    await prisma.novel.update({
      where: { id: novelId },
      data: {
        totalChapters: {
          increment: 1,
        },
      },
    });
    return NextResponse.json(chapter);
  } catch (error) {
    console.error("[CHAPTERS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
