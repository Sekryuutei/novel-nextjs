import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { UpdateNovelSchema } from "@/lib/validators/novel";
import { z } from "zod";

interface IParams {
  params: { novelId: string };
}

export async function GET(request: NextRequest, { params }: IParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { novelId } = params;

    const novel = await prisma.novel.findUnique({
      where: {
        id: novelId,
        authorId: session.user.id, // Ensure only the author can get their novel
      },
    });

    if (!novel) {
      return new NextResponse("Novel not found", { status: 404 });
    }

    return NextResponse.json(novel);
  } catch (error) {
    console.error("[NOVEL_GET_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: IParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { novelId } = params;
    const body = await request.json();
    const { title, description } = UpdateNovelSchema.parse(body);

    const novel = await prisma.novel.findUnique({
      where: { id: novelId },
    });

    if (!novel || novel.authorId !== session.user.id) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const updatedNovel = await prisma.novel.update({
      where: { id: novelId },
      data: {
        title,
        description,
      },
    });

    return NextResponse.json(updatedNovel);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 422 });
    }

    console.error("[NOVEL_PUT_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: IParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { novelId } = params;

    if (!novelId) {
      return new NextResponse("Novel ID is required", { status: 400 });
    }

    // Temukan novel untuk memastikan novel tersebut ada dan milik pengguna yang sedang login
    const novelToDelete = await prisma.novel.findUnique({
      where: {
        id: novelId,
      },
    });

    if (!novelToDelete) {
      return new NextResponse("Novel not found", { status: 404 });
    }

    // Otorisasi: Pastikan hanya penulis novel yang bisa menghapusnya
    if (novelToDelete.authorId !== session.user.id) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Hapus novel dari database
    await prisma.novel.delete({
      where: {
        id: novelId,
      },
    });

    return new NextResponse(null, { status: 204 }); // 204 No Content
  } catch (error) {
    console.error("[NOVEL_DELETE_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
