import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Start seeding ...");

  // 1. Hapus data lama (opsional, tapi baik untuk konsistensi)
  await prisma.choice.deleteMany();
  await prisma.chapter.deleteMany();
  await prisma.novel.deleteMany();
  await prisma.user.deleteMany();

  // 2. Buat satu user penulis
  const hashedPassword = await bcrypt.hash("password123", 12);
  const author = await prisma.user.create({
    data: {
      email: "penulis@hebat.com",
      name: "Penulis Hebat",
      password: hashedPassword,
      role: "AUTHOR",
    },
  });
  console.log(`Created user: ${author.name} (id: ${author.id})`);

  // 3. Buat Novel Interaktif
  const interactiveNovel = await prisma.novel.create({
    data: {
      title: "Petualangan di Hutan Terlarang",
      description:
        "Sebuah perjalanan di mana setiap pilihanmu menentukan nasib sang protagonis.",
      authorId: author.id,
      status: "PUBLISHED",
      isPremium: false,
    },
  });
  console.log(`Created novel: ${interactiveNovel.title}`);

  // 4. Buat beberapa chapter untuk novel interaktif
  const chapter1 = await prisma.chapter.create({
    data: {
      title: "Pintu Masuk Hutan",
      content:
        "<p>Kamu berdiri di depan gerbang hutan yang gelap dan misterius. Kabut tipis menyelimuti pepohonan, dan suara-suara aneh terdengar dari dalam. Apa yang akan kamu lakukan?</p>",
      chapterNumber: 1,
      novelId: interactiveNovel.id,
      authorId: author.id,
    },
  });

  const chapter2 = await prisma.chapter.create({
    data: {
      title: "Persimpangan Aneh",
      content:
        "<p>Setelah berjalan beberapa saat, kamu tiba di sebuah persimpangan. Jalan ke kiri menuju sungai yang deras, sementara jalan ke kanan menuju sebuah gua yang gelap.</p>",
      chapterNumber: 2,
      novelId: interactiveNovel.id,
      authorId: author.id,
    },
  });

  const chapter3_sungai = await prisma.chapter.create({
    data: {
      title: "Menyeberangi Sungai",
      content:
        "<p>Kamu memilih jalan kiri. Arus sungai sangat deras, tetapi kamu berhasil menyeberang dengan selamat dan menemukan desa tersembunyi di seberang.</p>",
      chapterNumber: 3,
      novelId: interactiveNovel.id,
      authorId: author.id,
    },
  });

  const chapter4_gua = await prisma.chapter.create({
    data: {
      title: "Menjelajahi Gua",
      content:
        "<p>Kamu memilih jalan kanan dan masuk ke dalam gua. Di dalamnya, kamu menemukan harta karun kuno yang berkilauan!</p>",
      chapterNumber: 4,
      novelId: interactiveNovel.id,
      authorId: author.id,
    },
  });

  // 5. Hubungkan chapter dengan Pilihan (Choice)
  // Dari Chapter 1 ke Chapter 2
  await prisma.choice.create({
    data: {
      text: "Masuk ke dalam hutan",
      chapterId: chapter1.id,
      nextChapterId: chapter2.id,
    },
  });

  // Dari Chapter 2, ada dua pilihan
  await prisma.choice.createMany({
    data: [
      {
        text: "Pilih jalan kiri menuju sungai",
        chapterId: chapter2.id,
        nextChapterId: chapter3_sungai.id,
      },
      {
        text: "Pilih jalan kanan menuju gua",
        chapterId: chapter2.id,
        nextChapterId: chapter4_gua.id,
      },
    ],
  });

  console.log("Seeding finished.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
