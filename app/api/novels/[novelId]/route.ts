import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

interface IParams {
  novelId: string;
}

export async function GET(request: NextRequest, { params }: { params: IParams }) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { novelId } = params;
  if (!novelId) {
    return new NextResponse("Novel ID is required", { status: 400 });
  }

  try {
    // Cek apakah perlu menyertakan data chapter
    const { searchParams } = new URL(request.url);
    const includeChapters = searchParams.get("includeChapters") === "true";

    const novel = await prisma.novel.findUnique({
      where: {
        id: novelId,
      },
      include: {
        // Hanya sertakan chapter jika diminta oleh query parameter
        chapters: includeChapters
          ? {
              orderBy: {
                chapterNumber: "asc",
              },
              include: {
                choicesAsSource: true, // Sertakan pilihan dari chapter ini
              },
            }
          : false,
      },
    });

    if (!novel) {
      return new NextResponse("Novel not found", { status: 404 });
    }

    return NextResponse.json(novel);
  } catch (error) {
    console.error("[NOVEL_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

