import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import {
  Container,
  Typography,
  Paper,
  Box,
  Button,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  Stack,
} from "@mui/material";
import Link from "next/link";
import Image from "next/image";
import { Book, Person, Star } from "@mui/icons-material";
import StoryGraphViewer from "@/components/read/StoryGraphViewer";

interface NovelDetailPageProps {
  params: {
    novelId: string;
  };
}

async function getNovelDetails(novelId: string) {
  const novel = await prisma.novel.findUnique({
    where: {
      id: novelId,
      status: "PUBLISHED", // Hanya tampilkan novel yang sudah di-publish
    },
    include: {
      author: {
        select: {
          name: true,
        },
      },
      chapters: {
        orderBy: {
          chapterNumber: "asc",
        },
        select: {
          id: true,
          title: true,
          chapterNumber: true,
          // Ganti 'choices' dengan relasi yang benar
          choicesAsSource: true,
          positionX: true,
          positionY: true,
          isPremium: true,
        },
      },
    },
  });
  return novel;
}

export default async function NovelDetailPage({
  params,
}: NovelDetailPageProps) {
  const { novelId } = params;
  const novel = await getNovelDetails(novelId);

  if (!novel) {
    notFound();
  }

  const firstChapter = novel.chapters[0];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: { xs: 2, md: 4 } }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            gap: 4,
          }}
        >
          {novel.coverImage && (
            <Box
              sx={{
                flexShrink: 0,
                width: { xs: "100%", md: 250 },
                height: 350,
                position: "relative",
              }}
            >
              <Image
                src={novel.coverImage}
                alt={novel.title}
                fill
                style={{ objectFit: "cover", borderRadius: "8px" }}
                sizes="(max-width: 768px) 100vw, 250px"
              />
            </Box>
          )}
          <Box>
            <Typography variant="h3" component="h1" gutterBottom>
              {novel.title}
            </Typography>
            <Stack
              direction="row"
              spacing={1}
              sx={{ mb: 2 }}
              alignItems="center"
            >
              <Chip
                icon={<Person />}
                label={novel.author.name || "Anonim"}
                size="small"
              />
              <Chip
                icon={<Book />}
                label={`${novel.chapters.length} Chapter`}
                size="small"
              />
              <Chip
                icon={<Star />}
                label={`Rating: ${novel.rating || "N/A"}`}
                size="small"
              />
            </Stack>
            <Typography variant="body1" color="text.secondary" paragraph>
              {novel.description || "Tidak ada deskripsi."}
            </Typography>
            {firstChapter && (
              <Button
                component={Link}
                href={`/read/${novel.id}/${firstChapter.id}`}
                variant="contained"
                size="large"
                sx={{ mt: 2 }}
              >
                Mulai Membaca
              </Button>
            )}
          </Box>
        </Box>
      </Paper>

      <Paper elevation={2} sx={{ mt: 4, p: 3 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          Peta Cerita
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Klik pada sebuah chapter untuk mulai membaca dari sana.
        </Typography>
        <StoryGraphViewer novelId={novel.id} chapters={novel.chapters} />
      </Paper>

      <Paper elevation={2} sx={{ mt: 4, p: 3 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          Daftar Chapter
        </Typography>
        <List>
          {novel.chapters.map((chapter, index) => (
            <ListItem
              key={chapter.id}
              component={Link}
              href={`/read/${novel.id}/${chapter.id}`}
              button
            >
              <ListItemText
                primary={`#${chapter.chapterNumber}: ${chapter.title}`}
              />
              {chapter.isPremium && (
                <Chip label="Premium" size="small" color="secondary" />
              )}
            </ListItem>
          ))}
        </List>
      </Paper>
    </Container>
  );
}
