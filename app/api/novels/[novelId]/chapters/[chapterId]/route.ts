import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { UpdateChapterSchema } from "@/lib/validators/chapter";

interface IParams {
  params: {
    novelId: string;
    chapterId: string;
  };
}

// GET: Mengambil satu chapter untuk diedit
export async function GET(request: NextRequest, { params }: IParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { chapterId, novelId } = params;

    const chapter = await prisma.chapter.findUnique({
      where: {
        id: chapterId,
        novelId: novelId,
        authorId: session.user.id, // Pemeriksaan keamanan
      },
    });

    if (!chapter) {
      return new NextResponse("Chapter tidak ditemukan", { status: 404 });
    }

    return NextResponse.json(chapter);
  } catch (error) {
    console.error("[CHAPTER_GET_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// PUT: Memperbarui chapter
export async function PUT(request: NextRequest, { params }: IParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { chapterId, novelId } = params;
    const body = await request.json();
    const data = UpdateChapterSchema.parse(body);

    // Verifikasi kepemilikan chapter
    const chapterOwner = await prisma.chapter.findUnique({
      where: {
        id: chapterId,
        novelId: novelId,
        authorId: session.user.id,
      },
    });

    if (!chapterOwner) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const updatedChapter = await prisma.chapter.update({
      where: {
        id: chapterId,
      },
      data,
    });

    return NextResponse.json(updatedChapter);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 422 });
    }
    console.error("[CHAPTER_PUT_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// DELETE: Menghapus chapter
export async function DELETE(request: NextRequest, { params }: IParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { chapterId, novelId } = params;

    // Verifikasi kepemilikan chapter
    const chapterOwner = await prisma.chapter.findUnique({
      where: {
        id: chapterId,
        novelId: novelId,
        authorId: session.user.id,
      },
    });

    if (!chapterOwner) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    await prisma.chapter.delete({
      where: {
        id: chapterId,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[CHAPTER_DELETE_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
