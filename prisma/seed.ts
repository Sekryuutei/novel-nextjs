import { PrismaClient, NovelStatus, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Start seeding ...");

  // --- Hapus data lama untuk memastikan kebersihan data ---
  // Urutan penghapusan penting untuk menghindari constraint errors
  await prisma.readingHistory.deleteMany();
  await prisma.purchase.deleteMany();
  await prisma.chapter.deleteMany();
  await prisma.novel.deleteMany();
  await prisma.user.deleteMany();
  console.log("Old data deleted.");

  // --- Buat Akun Pengguna ---
  // Password untuk semua akun di bawah ini adalah: "password123"
  const hashedPassword = await bcrypt.hash("password123", 10);

  const authorUser = await prisma.user.create({
    data: {
      email: "author@example.com",
      name: "Penulis Hebat",
      password: hashedPassword,
      role: UserRole.AUTHOR,
    },
  });

  const readerUser = await prisma.user.create({
    data: {
      email: "reader@example.com",
      name: "Pembaca Setia",
      password: hashedPassword,
      role: UserRole.READER,
    },
  });

  console.log("Users created:", { authorUser, readerUser });

  // --- Buat Novel Interaktif ---
  const novel = await prisma.novel.create({
    data: {
      title: "Misteri Hutan Terlarang",
      description:
        "Sebuah petualangan di hutan misterius di mana setiap pilihanmu akan menentukan nasibmu. Apakah kamu akan menemukan harta karun, atau tersesat selamanya?",
      authorId: authorUser.id,
      status: NovelStatus.PUBLISHED,
      genre: ["Misteri", "Petualangan"],
      tags: ["hutan", "teka-teki", "pilihan"],
    },
  });

  console.log(`Novel "${novel.title}" created.`);

  // --- Buat Chapters dengan Alur Bercabang ---

  // Chapter 1: Awal Petualangan
  const chapter1 = await prisma.chapter.create({
    data: {
      title: "Gerbang Hutan",
      content:
        '<p>Kamu berdiri di depan gerbang Hutan Terlarang. Kabut tipis menyelimuti pepohonan, dan suara-suara aneh terdengar dari dalam. Sebuah papan tua bertuliskan "Jangan Masuk". Rasa penasaran dan ketakutan bergejolak di dalam dirimu.</p>',
      chapterNumber: 1,
      novelId: novel.id,
      authorId: authorUser.id,
      positionX: 100,
      positionY: 200,
    },
  });

  // Chapter 2: Masuk ke Dalam Hutan
  const chapter2 = await prisma.chapter.create({
    data: {
      title: "Persimpangan Jalan",
      content:
        "<p>Kamu memberanikan diri masuk. Semakin dalam, hutan terasa semakin gelap. Kamu tiba di sebuah persimpangan. Jalan ke kiri menuju sebuah gua gelap, sementara jalan ke kanan tampak lebih terang dan mengarah lebih dalam ke hutan.</p>",
      chapterNumber: 2,
      novelId: novel.id,
      authorId: authorUser.id,
      positionX: 400,
      positionY: 100,
    },
  });

  // Chapter 3: Akhir Pengecut
  const chapter3 = await prisma.chapter.create({
    data: {
      title: "Kembali Pulang",
      content:
        "<p>Kamu memutuskan bahwa ini adalah ide yang buruk. Kamu berbalik dan berlari pulang secepat mungkin. Malam itu, kamu tidur dengan nyenyak, tetapi selamanya bertanya-tanya misteri apa yang kamu lewatkan.</p><p><b>--- TAMAT (Akhir Pengecut) ---</b></p>",
      chapterNumber: 3,
      novelId: novel.id,
      authorId: authorUser.id,
      positionX: 400,
      positionY: 300,
    },
  });

  // Chapter 4: Harta Karun (Akhir Baik)
  const chapter4 = await prisma.chapter.create({
    data: {
      title: "Gua Harta Karun",
      content:
        "<p>Dengan hati-hati, kamu memasuki gua. Di dalamnya, kamu menemukan sebuah peti tua yang berisi koin emas dan permata berkilauan. Kamu berhasil menemukan harta karun legendaris Hutan Terlarang!</p><p><b>--- TAMAT (Akhir Bahagia) ---</b></p>",
      chapterNumber: 4,
      novelId: novel.id,
      authorId: authorUser.id,
      positionX: 700,
      positionY: 50,
    },
  });

  // Chapter 5: Tersesat (Akhir Netral)
  const chapter5 = await prisma.chapter.create({
    data: {
      title: "Jauh di Dalam Hutan",
      content:
        "<p>Kamu terus berjalan menyusuri jalan setapak yang lebih terang. Namun, tak lama kemudian, jalan itu menghilang. Kamu tersesat! Setelah berjam-jam berteriak, tim penyelamat akhirnya menemukanmu. Kamu selamat, tetapi tidak menemukan apa-apa.</p><p><b>--- TAMAT (Akhir Biasa) ---</b></p>",
      chapterNumber: 5,
      novelId: novel.id,
      authorId: authorUser.id,
      positionX: 700,
      positionY: 200,
    },
  });

  // --- Hubungkan Chapters dengan Pilihan (Choices) ---

  // Pilihan dari Chapter 1
  await prisma.choice.createMany({
    data: [
      {
        text: "Masuk ke dalam hutan",
        chapterId: chapter1.id,
        nextChapterId: chapter2.id,
      },
      {
        text: "Berbalik dan pulang",
        chapterId: chapter1.id,
        nextChapterId: chapter3.id,
      },
    ],
  });

  // Pilihan dari Chapter 2
  await prisma.choice.createMany({
    data: [
      { text: "Pergi ke gua", chapterId: chapter2.id, nextChapterId: chapter4.id },
      { text: "Masuk lebih dalam", chapterId: chapter2.id, nextChapterId: chapter5.id },
    ],
  });

  console.log("Chapters and choices created.");
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
