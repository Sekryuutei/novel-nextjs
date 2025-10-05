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
  console.log("\n--- [API] INK PROGRESS REQUEST RECEIVED ---");
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    console.log("[API_ERROR] Access denied: No session.");
    return NextResponse.json({ message: "Akses ditolak" }, { status: 401 });
  }

  const novelId = params.novelId;
  const body = await request.json();
  const { choiceIndex, reset } = body; // Ambil flag 'reset' dari body
  console.log(`[API_INFO] Novel ID: ${novelId}`);
  console.log(`[API_INFO] Received choiceIndex: ${choiceIndex}`);

  try {
    // 1. Dapatkan progres user saat ini dari DB
    const progress = await prisma.readingProgress.findUnique({
      where: { userId_novelId: { userId: session.user.id, novelId } },
    });

    // 2. Muat novel dan HANYA skrip Ink-nya dari database
    const novel = await prisma.novel.findUnique({
      where: { id: novelId },
      select: { inkScript: true },
    });

    if (!novel || !novel.inkScript) {
      console.log(
        `[API_ERROR] Novel or inkScript not found for ID: ${novelId}`
      );
      return NextResponse.json(
        { message: "Cerita interaktif untuk novel ini tidak ditemukan." },
        { status: 404 }
      );
    }

    // 3. Compile skrip Ink mentah menjadi JSON on-the-fly
    let compiledStoryJson: string;
    try {
      const compiler = new Compiler(novel.inkScript);
      const compiledStory = compiler.Compile();
      if (!compiledStory) throw new Error("Cerita tidak valid atau kosong.");
      console.log("[API_INFO] Ink script compiled successfully.");
      if (compiler.errors.length > 0) {
        // Jika ada error kompilasi, lempar error dengan detail
        throw new Error(
          `Sintaks Ink tidak valid: ${compiler.errors.join(", ")}`
        );
      }
      compiledStoryJson = compiledStory.ToJson();
    } catch (e: any) {
      // Tangkap error kompilasi dan kirim respons yang jelas
      console.error("[API_ERROR] Ink compilation failed:", e.message);
      if (e.message.startsWith("Sintaks Ink tidak valid")) {
        return NextResponse.json({ message: e.message }, { status: 400 }); // Bad Request
      }
      throw new Error("Gagal meng-compile cerita.");
    }
    const story = new Story(compiledStoryJson);

    // 4. Muat state cerita sebelumnya jika ada
    if (reset || !progress?.inkState) {
      // Jika diminta reset ATAU memang tidak ada progres, mulai dari awal.
      story.ChoosePathString("START");
      console.log(
        "[API_INFO] Starting story from 'START' knot (Reset requested or no progress found)."
      );
    } else if (progress?.inkState) {
      story.state.LoadJson(progress.inkState);
    }

    // 5. Buat pilihan jika ada (jika choiceIndex dikirim dari client)
    if (choiceIndex !== undefined && choiceIndex >= 0) {
      if (story.currentChoices[choiceIndex]) {
        console.log(
          `[API_INFO] Choosing choice index: ${choiceIndex} ("${story.currentChoices[choiceIndex].text}")`
        );
        story.ChooseChoiceIndex(choiceIndex);
      } else {
        console.warn(
          `[API_WARN] Invalid choiceIndex ${choiceIndex} received. Ignoring.`
        );
      }
    }

    // 6. Lanjutkan cerita dan kumpulkan teks
    console.log(
      `[API_INFO] Before ContinueMaximally: canContinue is ${story.canContinue}, choice count is ${story.currentChoices.length}`
    );

    // ================= SOLUSI CERDAS & POWERFUL =================
    // Fungsi helper ini akan melanjutkan cerita, melewati "halaman kosong"
    // dan hanya berhenti ketika menemukan teks narasi atau pilihan.
    const getNextStoryBlock = (storyInstance: Story): string => {
      let accumulatedText = "";
      // Loop ini secara agresif melewati semua langkah 'tak terlihat' (baris kosong, tag, dll).
      while (storyInstance.canContinue) {
        accumulatedText += storyInstance.Continue();

        // Hentikan loop HANYA JIKA kita sudah punya teks yang terlihat
        // ATAU jika kita dihadapkan pada pilihan. Ini adalah kunci untuk tidak berhenti terlalu cepat.
        if (
          accumulatedText.trim() !== "" ||
          storyInstance.currentChoices.length > 0
        ) {
          break;
        }
      }
      return accumulatedText;
    };

    let storyText = getNextStoryBlock(story);

    // Membersihkan teks dari tag internal seperti TITLE:
    storyText = storyText.replace(/^TITLE:.*$/gm, "").trim(); // gm flag untuk global & multiline

    console.log(
      `[API_INFO] After ContinueMaximally: storyText is "${storyText
        .substring(0, 50)
        .replace(/\n/g, "\\n")}..."`
    );

    // 7. Ambil pilihan yang tersedia setelah melanjutkan cerita
    const availableChoices = story.currentChoices.map((choice) => ({
      text: choice.text,
      index: choice.index,
      tags: choice.tags,
    }));
    console.log(
      `[API_INFO] Found ${availableChoices.length} available choices.`
    );

    // 8. Simpan state BARU ke database
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
    console.log("[API_INFO] New story state saved to DB.");

    // 9. Kirim kembali konten cerita saat ini dan pilihan yang tersedia
    const responsePayload = {
      storyText,
      choices: availableChoices,
      isEnd: !story.canContinue && story.currentChoices.length === 0,
    };
    console.log("[API_INFO] Sending response payload:", responsePayload);
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
