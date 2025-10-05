"use client";

import { Handle, Position, NodeProps } from "reactflow";
import {
  Card,
  CardContent,
  TextField,
  Box,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormGroup,
  FormControlLabel,
  Switch,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import UnfoldMoreIcon from "@mui/icons-material/UnfoldMore";
import UnfoldLessIcon from "@mui/icons-material/UnfoldLess";
import { memo, useState, Fragment } from "react";
import TiptapEditor from "./TiptapEditor"; // Pastikan path ini benar

// Tipe data yang diterima oleh node ini dari StoryMapView
interface InkNodeData {
  title: string;
  content: string;
  isStart: boolean; // Menandakan node awal
  isEnd: boolean; // Menandakan node akhir
  onChange: (
    nodeId: string,
    data: {
      title?: string;
      content?: string;
      isEnd?: boolean;
    }
  ) => void;
}

function InkNode({ id, data, isConnectable }: NodeProps<InkNodeData>) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true); // Default diciutkan

  // Handler untuk perubahan judul
  const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    data.onChange(id, { title: event.target.value });
  };

  // Handler untuk perubahan konten
  const handleContentChange = (htmlContent: string) => {
    data.onChange(id, { content: htmlContent });
  };

  const handleIsEndChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const isNowEnd = event.target.checked;
    // Saat kita set sebagai 'end', kita perlu mengubah kontennya untuk menyertakan `-> END` agar Ink mengerti.
    const newContent = isNowEnd
      ? `${data.content}\n-> END`
      : data.content.replace(/\n*->\s*END\s*/g, "").trim();
    data.onChange(id, { content: newContent, isEnd: isNowEnd });
  };

  return (
    <Card
      elevation={3}
      sx={{
        border: data.isStart
          ? "2px solid #16a34a"
          : data.isEnd
          ? "2px solid #dc2626"
          : "1px solid #ddd",
        borderRadius: "8px",
        width: 300, // Beri lebar tetap untuk konsistensi layout
        backgroundColor: "white",
        transition: "border-color 0.2s ease-in-out",
      }}
    >
      {/* Handle untuk koneksi masuk (dari chapter sebelumnya) */}
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        style={{
          width: 12,
          height: 12,
          background: "#9ca3af",
          border: "2px solid white",
        }}
      />

      <CardContent sx={{ p: "16px !important" }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 1,
          }}
        >
          {data.isStart && <Chip label="Awal" color="success" size="small" />}
          {data.isEnd && <Chip label="Akhir" color="error" size="small" />}
          <Box sx={{ flexGrow: 1 }} />
          <IconButton size="small" onClick={() => setSettingsOpen(true)}>
            <SettingsIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={() => setIsCollapsed(!isCollapsed)}>
            {isCollapsed ? (
              <UnfoldMoreIcon fontSize="small" />
            ) : (
              <UnfoldLessIcon fontSize="small" />
            )}
          </IconButton>
        </Box>
        <Box>
          {/* Jadikan TextField judul sebagai handle untuk drag */}
          <div
            className="custom-drag-handle"
            style={{ cursor: "move", borderRadius: "4px" }}
          >
            <TextField
              variant="standard"
              fullWidth
              placeholder="Judul Chapter"
              value={data.title}
              onChange={handleTitleChange}
              sx={{ mb: 1 }}
              InputProps={{
                disableUnderline: true,
                style: { fontSize: "1.1rem", fontWeight: "bold" },
              }}
            />
          </div>
          {!isCollapsed && (
            <TiptapEditor
              content={data.content || ""}
              onChange={handleContentChange}
            />
          )}
        </Box>
      </CardContent>

      {/* Handle untuk koneksi keluar (untuk membuat pilihan) */}
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        style={{
          width: 16,
          height: 16,
          background: "#3b82f6",
          border: "2px solid white",
        }}
      />

      {/* Dialog Pengaturan */}
      <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)}>
        <DialogTitle>Pengaturan Chapter: {data.title}</DialogTitle>
        <DialogContent>
          <FormGroup>
            <FormControlLabel
              control={
                <Switch
                  checked={data.isEnd}
                  onChange={handleIsEndChange}
                  disabled={data.isStart}
                />
              }
              label="Jadikan Chapter Akhir (Ending)"
            />
          </FormGroup>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", mt: 1 }}
          >
            Menandai ini sebagai chapter akhir akan menghentikan alur cerita di
            sini. Anda tidak bisa menandai chapter awal sebagai chapter akhir.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setSettingsOpen(false)}
            variant="contained"
            color="primary"
          >
            Tutup
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}

export default memo(InkNode);
