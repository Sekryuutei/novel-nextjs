import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { Container, Typography, Grid } from "@mui/material";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import EditNovelForm from "@/components/novels/EditNovelForm";
import ChapterList from "@/components/chapters/ChapterList";

interface EditNovelPageProps {
  params: {
    id: string;
  };
}

export default async function EditNovelPage({ params }: EditNovelPageProps) {
  const session = await getServerSession(authOptions);

  if (!session) {
    notFound();
  }

  const [novel, chapters] = await Promise.all([
    prisma.novel.findUnique({
      where: {
        id: params.id,
        authorId: session.user.id, // Security check
      },
    }),
    prisma.chapter.findMany({
      where: {
        novelId: params.id,
        authorId: session.user.id,
      },
      orderBy: {
        chapterNumber: "asc",
      },
    }),
  ]);

  if (!novel) {
    notFound();
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Editor Novel: <span className="font-semibold">{novel.title}</span>
      </Typography>
      <Grid container spacing={4}>
        <Grid item xs={12} md={5}>
          <EditNovelForm novel={novel} />
        </Grid>
        <Grid item xs={12} md={7}>
          <ChapterList initialChapters={chapters} novelId={novel.id} />
        </Grid>
      </Grid>
    </Container>
  );
}
