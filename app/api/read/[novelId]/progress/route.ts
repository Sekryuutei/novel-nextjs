import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { Story } from "inkjs";
import { authOptions } from "@/lib/auth";
import { Compiler } from "inkjs/compiler/Compiler";
import prisma from "@/lib/prisma";

interface ProgressParams {
  params: {
    novelId: string;
  };
}

export async function POST(request: NextRequest, { params }: ProgressParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Akses ditolak" }, { status: 401 });
  }

  const { novelId } = await params;
  const body = await request.json();
  const { choiceIndex } = body;

  try {
    // 1. Dapatkan progres user saat ini dari DB
    const progress = await prisma.readingProgress.findUnique({
      where: { userId_novelId: { userId: session.user.id, novelId } },
    });

    // 2. Muat novel dan skrip Ink-nya dari database
    const novel = await prisma.novel.findUnique({
      where: { id: novelId },
      select: { inkScript: true },
    });

    if (!novel || !novel.inkScript) {
      return NextResponse.json(
        { message: "Cerita interaktif untuk novel ini tidak ditemukan." },
        { status: 404 }
      );
    }

    // Compile skrip Ink mentah menjadi JSON on-the-fly
    let compiledStoryJson: string;
    try {
      const compiler = new Compiler(novel.inkScript);
      const compiledStory = compiler.Compile();
      if (!compiledStory) throw new Error("Cerita tidak valid atau kosong.");
      compiledStoryJson = compiledStory.ToJson();
    } catch (e) {
      throw new Error("Gagal meng-compile cerita.");
    }
    const story = new Story(compiledStoryJson);

    // 3. Muat state cerita sebelumnya jika ada
    if (progress?.inkState) {
      story.state.LoadJson(progress.inkState);
    }

    // 4. Buat pilihan jika ada (jika choiceIndex dikirim dari client)
    if (choiceIndex !== undefined && choiceIndex >= 0) {
      if (story.currentChoices[choiceIndex]) {
        story.ChooseChoiceIndex(choiceIndex);
      }
    }

    // 5. Lanjutkan cerita sampai ada pilihan atau selesai
    let storyText = "";
    while (story.canContinue) {
      storyText += story.Continue();
    }

    // 6. Ambil pilihan yang tersedia sekarang
    const availableChoices = story.currentChoices.map((choice) => ({
      text: choice.text,
      index: choice.index,
      tags: choice.tags,
    }));

    // 7. Simpan state BARU ke database
    const newInkState = story.state.ToJson();
    await prisma.readingProgress.upsert({
      where: { userId_novelId: { userId: session.user.id, novelId } },
      update: { inkState: newInkState },
      create: {
        userId: session.user.id,
        novelId: novelId,
        inkState: newInkState,
      },
    });

    // 8. Kirim kembali konten cerita saat ini dan pilihan yang tersedia
    return NextResponse.json({
      storyText,
      choices: availableChoices,
      isEnd: !story.canContinue && story.currentChoices.length === 0,
    });
  } catch (error) {
    console.error("[INK_PROGRESS_API_ERROR]", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
