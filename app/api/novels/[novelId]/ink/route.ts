import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

interface ProgressParams {
  params: {
    novelId: string;
  };
}

const inkSchema = z.object({
  inkScript: z.string(),
});

export async function PATCH(request: NextRequest, { params }: ProgressParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Akses ditolak." }, { status: 401 });
    }

    const { novelId } = await params;

    const novel = await prisma.novel.findFirst({
      where: { id: novelId, authorId: session.user.id },
    });

    if (!novel) {
      return NextResponse.json(
        { message: "Novel tidak ditemukan atau Anda tidak punya akses." },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { inkScript } = inkSchema.parse(body);

    await prisma.novel.update({
      where: { id: novelId },
      data: {
        inkScript: inkScript, // Simpan skrip mentah apa adanya
        hasBranching: true,
      },
    });

    // Kembalikan skrip mentah untuk IAT, bukan JSON
    return NextResponse.json({
      message: "Cerita berhasil disimpan.",
      inkScript: inkScript,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ errors: error.issues }, { status: 422 });
    }
    console.error("[INK_PATCH_ERROR]", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan di server." },
      { status: 500 }
    );
  }
}
