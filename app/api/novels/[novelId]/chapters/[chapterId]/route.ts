import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

interface IParams {
  novelId: string;
  chapterId: string;
}

export async function PATCH(request: Request, { params }: { params: IParams }) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { chapterId } = params;
  const body = await request.json();
  const { title, content, isEnd } = body;

  try {
    const updatedChapter = await prisma.chapter.update({
      where: {
        id: chapterId,
        authorId: session.user.id, // Pastikan hanya pemilik yang bisa mengedit
      },
      data: {
        title,
        content,
        isEnd,
      },
    });

    return NextResponse.json(updatedChapter);
  } catch (error) {
    console.error("[CHAPTER_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: IParams }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { novelId, chapterId } = params;

  try {
    // Hapus chapter, pastikan hanya pemilik yang bisa menghapus
    await prisma.chapter.delete({
      where: {
        id: chapterId,
        authorId: session.user.id,
      },
    });

    // Update totalChapters di novel
    await prisma.novel.update({
      where: {
        id: novelId,
      },
      data: {
        totalChapters: {
          decrement: 1,
        },
      },
    });

    return new NextResponse(null, { status: 204 }); // No Content
  } catch (error) {
    console.error("[CHAPTER_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
