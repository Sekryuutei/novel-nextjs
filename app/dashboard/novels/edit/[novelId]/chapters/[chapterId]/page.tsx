import { getServerSession } from "next-auth/next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Container, Typography, Grid, Button, Box } from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
// Kita akan membuat komponen ini di langkah berikutnya
import ChapterEditorForm from "@/components/chapters/ChapterEditorForm";

interface ChapterEditorPageProps {
  params: {
    novelId: string;
    chapterId: string;
  };
}

export default async function ChapterEditorPage({
  params,
}: ChapterEditorPageProps) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/login");
  }

  const { novelId, chapterId } = params;

  const [novel, chapter] = await Promise.all([
    prisma.novel.findUnique({
      where: { id: novelId, authorId: session.user.id },
    }),
    prisma.chapter.findUnique({
      where: { id: chapterId, novelId: novelId, authorId: session.user.id },
    }),
  ]);

  if (!novel || !chapter) {
    notFound();
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box mb={3}>
        <Button
          component={Link}
          href={`/dashboard/novels/edit/${novel.id}`}
          startIcon={<ArrowBack />}
        >
          {" "}
          Kembali ke Editor Novel{" "}
        </Button>{" "}
      </Box>
      <ChapterEditorForm novelId={novel.id} chapter={chapter} />
    </Container>
  );
}
