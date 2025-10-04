import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import {
  Container,
  Typography,
  Paper,
  Box,
  Button,
  Breadcrumbs,
  Link as MuiLink,
} from "@mui/material";
import Link from "next/link";

interface ChapterPageProps {
  params: {
    novelId: string;
    chapterId: string;
  };
}

async function getChapter(novelId: string, chapterId: string) {
  const chapter = await prisma.chapter.findUnique({
    where: {
      id: chapterId,
      novelId: novelId,
    },
    include: {
      novel: {
        select: {
          title: true,
        },
      },
      choicesAsSource: {
        // Ambil data pilihan dari relasi
        orderBy: { id: "asc" }, // Urutkan pilihan jika perlu
      },
    },
  });
  return chapter;
}

export default async function ReadChapterPage({ params }: ChapterPageProps) {
  const chapter = await getChapter(params.novelId, params.chapterId);

  if (!chapter) {
    notFound();
  }

  // Pilihan cerita disimpan sebagai JSON, jadi kita perlu parse
  const choices = chapter.choicesAsSource || [];

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
        <MuiLink component={Link} underline="hover" color="inherit" href="/">
          Home
        </MuiLink>
        <Typography color="text.primary">{chapter.novel.title}</Typography>
      </Breadcrumbs>

      <Typography variant="h4" component="h1" gutterBottom align="center">
        {chapter.title}
      </Typography>
      <Typography
        variant="subtitle1"
        align="center"
        color="text.secondary"
        sx={{ mb: 4 }}
      >
        Chapter {chapter.chapterNumber}
      </Typography>

      <Paper
        elevation={2}
        sx={{ p: { xs: 2, sm: 4 }, mt: 2, lineHeight: 1.8, fontSize: "1.1rem" }}
      >
        <div dangerouslySetInnerHTML={{ __html: chapter.content }} />
      </Paper>

      {choices.length > 0 && (
        <Box sx={{ mt: 5, display: "flex", flexDirection: "column", gap: 2 }}>
          <Typography variant="h6" align="center">
            Buat Pilihanmu:
          </Typography>
          {choices.map((choice, index) => (
            <Button
              key={index}
              component={Link}
              href={`/read/${params.novelId}/${choice.nextChapterId}`}
              variant="contained"
              size="large"
            >
              {choice.text}
            </Button>
          ))}
        </Box>
      )}
    </Container>
  );
}
