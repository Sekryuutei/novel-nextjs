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
import { memo, useState } from "react";
import { MuiColorInput } from "mui-color-input";

// Tipe data yang diterima oleh node ini dari StoryMapView
interface InkNodeData {
  title: string;
  content: string;
  isStart: boolean; // Menandakan node awal
  isEnd: boolean; // Menandakan node akhir
  fontFamily?: string | null;
  fontColor?: string | null;
  backgroundColor?: string | null;
  onChange: (
    nodeId: string,
    data: {
      title?: string;
      content?: string;
      isEnd?: boolean;
      fontFamily?: string | null;
      fontColor?: string | null;
      backgroundColor?: string | null;
    }
  ) => void;
}

function InkNode({ id, data, isConnectable }: NodeProps<InkNodeData>) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [localSettings, setLocalSettings] = useState({
    fontFamily: data.fontFamily || "Inter",
    fontColor: data.fontColor || "#000000",
    backgroundColor: data.backgroundColor || "#FFFFFF",
  });

  // Handler untuk perubahan judul
  const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    data.onChange(id, { title: event.target.value });
  };

  // Handler untuk perubahan konten
  const handleContentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    data.onChange(id, { content: event.target.value });
  };

  const handleIsEndChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const isNowEnd = event.target.checked;
    // Saat kita set sebagai 'end', kita perlu mengubah kontennya untuk menyertakan `-> END` agar Ink mengerti.
    const newContent = isNowEnd
      ? `${data.content}\n-> END`
      : data.content.replace(/\n*->\s*END\s*/g, "").trim();
    data.onChange(id, { content: newContent, isEnd: isNowEnd });
  };

  const handleSettingsChange = (field: string, value: string) => {
    setLocalSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveSettings = () => {
    data.onChange(id, {
      fontFamily: localSettings.fontFamily,
      fontColor: localSettings.fontColor,
      backgroundColor: localSettings.backgroundColor,
    });
    setSettingsOpen(false);
  };

  const handleOpenSettings = () => {
    setLocalSettings({
      fontFamily: data.fontFamily || "Inter",
      fontColor: data.fontColor || "#000000",
      backgroundColor: data.backgroundColor || "#FFFFFF",
    });
    setSettingsOpen(true);
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
        minWidth: 250, // Lebar minimal
        maxWidth: 400, // Lebar maksimal
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
          <IconButton size="small" onClick={handleOpenSettings}>
            <SettingsIcon fontSize="small" />
          </IconButton>
        </Box>
        <Box>
          <TextField
            variant="standard"
            fullWidth
            placeholder="Judul Chapter"
            value={data.title}
            onChange={handleTitleChange}
            sx={{ mb: 1, fontWeight: "bold" }}
            InputProps={{ style: { fontWeight: "bold" } }}
          />
          <TextField
            variant="standard"
            fullWidth
            multiline
            maxRows={10} // Batasi agar tidak terlalu panjang
            placeholder="Tulis konten cerita di sini..."
            value={data.content}
            onChange={handleContentChange}
          />
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
          <hr style={{ margin: "16px 0" }} />
          <FormControl fullWidth margin="normal">
            <InputLabel id="font-family-label">Jenis Font</InputLabel>
            <Select
              labelId="font-family-label"
              value={localSettings.fontFamily}
              onChange={(e) =>
                handleSettingsChange("fontFamily", e.target.value)
              }
              label="Jenis Font"
            >
              <MenuItem value={"Inter"}>Inter (Default)</MenuItem>
              <MenuItem value={"Roboto"}>Roboto</MenuItem>
              <MenuItem value={"'Times New Roman', serif"}>
                Times New Roman
              </MenuItem>
              <MenuItem value={"'Georgia', serif"}>Georgia</MenuItem>
              <MenuItem value={"'Courier New', monospace"}>
                Courier New
              </MenuItem>
            </Select>
          </FormControl>
          <MuiColorInput
            name="fontColor"
            label="Warna Teks"
            format="hex"
            fullWidth
            margin="normal"
            value={localSettings.fontColor}
            onChange={(value) => handleSettingsChange("fontColor", value)}
          />
          <MuiColorInput
            name="backgroundColor"
            label="Warna Latar"
            format="hex"
            fullWidth
            margin="normal"
            value={localSettings.backgroundColor}
            onChange={(value) => handleSettingsChange("backgroundColor", value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsOpen(false)}>Tutup</Button>
          <Button
            onClick={handleSaveSettings}
            variant="contained"
            color="primary"
          >
            Simpan
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}

export default memo(InkNode);
