"use client";

import { useState, useTransition } from "react";
import {
  Box,
  Typography,
  IconButton,
  Collapse,
  Paper,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Chip,
  FormControl,
  MenuItem,
  InputLabel,
  Select,
  FormGroup,
  FormControlLabel,
  Switch,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddLinkIcon from "@mui/icons-material/AddLink";
import CallSplitIcon from "@mui/icons-material/CallSplit";
import TiptapEditor from "../iat/TiptapEditor";
import { ChapterWithChoices } from "./StoryOutlineView";

interface ChapterRowProps {
  chapter: ChapterWithChoices;
  allChapters: Map<string, ChapterWithChoices>;
  novelId: string;
  onUpdate: () => void;
  level?: number;
}

export function ChapterRow({
  chapter,
  allChapters,
  novelId,
  onUpdate,
  level = 0,
}: ChapterRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState(chapter.title);
  const [content, setContent] = useState(chapter.content || "");
  const [isEnd, setIsEnd] = useState(chapter.isEnd);
  // State untuk dialog tambah cabang
  const [isAddChoiceOpen, setIsAddChoiceOpen] = useState(false);
  const [choiceText, setChoiceText] = useState("");
  const [nextChapterId, setNextChapterId] = useState("");

  const handleSave = () => {
    startTransition(async () => {
      await fetch(`/api/novels/${novelId}/chapters/${chapter.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, isEnd }),
      });
      setIsEditing(false);
      onUpdate();
    });
  };

  const handleDelete = () => {
    if (
      !window.confirm(
        `Yakin ingin menghapus chapter "${chapter.title}"? Ini akan menghapus semua pilihan yang mengarah ke chapter ini.`
      )
    )
      return;
    startTransition(async () => {
      await fetch(`/api/novels/${novelId}/chapters/${chapter.id}`, {
        method: "DELETE",
      });
      onUpdate();
    });
  };

  const handleAddChoice = () => {
    startTransition(async () => {
      await fetch(`/api/novels/${novelId}/chapters/${chapter.id}/choices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: choiceText, nextChapterId }),
      });
      // Reset state dan tutup dialog
      setIsAddChoiceOpen(false);
      setChoiceText("");
      setNextChapterId("");
      onUpdate();
    });
  };

  const choices = chapter.choicesAsSource || [];

  return (
    <Box>
      <Paper
        elevation={2}
        sx={{
          p: 2,
          display: "flex",
          alignItems: "center",
          gap: 1,
          mb: 2,
          borderLeft: 5,
          borderColor: chapter.isStart ? "success.main" : "primary.main",
          ...(chapter.isEnd && { borderColor: "error.main" }),
        }}
      >
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          {chapter.title}
        </Typography>
        {chapter.isEnd && <Chip label="Akhir" color="error" size="small" />}
        <IconButton onClick={() => setIsEditing(!isEditing)} size="small">
          <EditIcon />
        </IconButton>
        {!chapter.isStart && (
          <IconButton onClick={handleDelete} size="small" disabled={isPending}>
            {isPending ? (
              <CircularProgress size={20} />
            ) : (
              <DeleteIcon color="error" />
            )}
          </IconButton>
        )}
      </Paper>

      <Collapse in={isEditing}>
        <Paper sx={{ p: 2, mb: 2 }} elevation={1}>
          <TextField
            label="Judul Chapter"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            variant="outlined"
            sx={{ mb: 2 }}
          />
          <TiptapEditor content={content} onChange={setContent} />
          <FormGroup sx={{ mt: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={isEnd}
                  onChange={(e) => setIsEnd(e.target.checked)}
                  disabled={chapter.isStart}
                />
              }
              label="Tandai sebagai Chapter Akhir (Ending)"
            />
          </FormGroup>
          <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
            <Button onClick={() => setIsEditing(false)} sx={{ mr: 1 }}>
              Batal
            </Button>
            <Button
              onClick={handleSave}
              variant="contained"
              disabled={isPending}
            >
              {isPending ? <CircularProgress size={24} /> : "Simpan"}
            </Button>
          </Box>
        </Paper>
      </Collapse>

      {/* Render Pilihan dan Chapter Anak */}
      <Box
        sx={{
          pl: 4,
          ml: 2,
          borderLeft: choices.length > 0 ? "2px dashed #ccc" : "none",
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        {choices.map((choice, index) => {
          const nextChapter = allChapters.get(choice.nextChapterId);
          if (!nextChapter) return null;

          return (
            <Box key={choice.id} sx={{ position: "relative", pt: 2 }}>
              <Box
                sx={{
                  position: "absolute",
                  left: 0,
                  top: "28px",
                  transform: "translateX(-50%)",
                  display: "flex",
                  alignItems: "center",
                  bgcolor: "background.paper",
                  px: 1,
                }}
              >
                <Box
                  sx={{
                    width: "32px",
                    height: "2px",
                    bgcolor: "#ccc",
                    mr: 1,
                  }}
                />
                <Chip
                  icon={<CallSplitIcon />}
                  label={choice.text || "Selanjutnya"}
                  size="small"
                  variant="outlined"
                />
              </Box>
              <ChapterRow
                chapter={nextChapter}
                allChapters={allChapters}
                novelId={novelId}
                onUpdate={onUpdate}
                level={level + 1}
              />
            </Box>
          );
        })}
        {/* Tombol untuk menambah pilihan/cabang baru */}
        <Box sx={{ pl: 4 }}>
          <Button
            startIcon={<AddLinkIcon />}
            size="small"
            onClick={() => setIsAddChoiceOpen(true)}
          >
            Tambah Cabang
          </Button>
        </Box>
      </Box>

      {/* Dialog untuk Menambah Cabang/Pilihan */}
      <Dialog
        open={isAddChoiceOpen}
        onClose={() => setIsAddChoiceOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Tambah Cabang dari "{chapter.title}"</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Teks Pilihan (Contoh: Pergi ke kiri)"
            type="text"
            fullWidth
            variant="outlined"
            value={choiceText}
            onChange={(e) => setChoiceText(e.target.value)}
            sx={{ mt: 2 }}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel id="next-chapter-label">
              Arahkan ke Chapter...
            </InputLabel>
            <Select
              labelId="next-chapter-label"
              value={nextChapterId}
              label="Arahkan ke Chapter..."
              onChange={(e) => setNextChapterId(e.target.value)}
            >
              {Array.from(allChapters.values())
                .filter((c) => c.id !== chapter.id) // Tidak bisa link ke diri sendiri
                .map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.title}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsAddChoiceOpen(false)}>Batal</Button>
          <Button
            onClick={handleAddChoice}
            variant="contained"
            disabled={isPending || !choiceText || !nextChapterId}
          >
            {isPending ? <CircularProgress size={24} /> : "Tambah Pilihan"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
