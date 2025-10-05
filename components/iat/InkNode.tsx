"use client";

import { Handle, Position, NodeProps } from "reactflow";
import { Card, CardContent, TextField, Box } from "@mui/material";
import { memo } from "react";

// Tipe data yang diterima oleh node ini dari StoryMapView
interface InkNodeData {
  title: string;
  content: string;
  // Callback untuk mengirim perubahan kembali ke parent (StoryMapView)
  onChange: (
    nodeId: string,
    data: { title?: string; content?: string }
  ) => void;
}

function InkNode({ id, data, isConnectable }: NodeProps<InkNodeData>) {
  // Handler untuk perubahan judul
  const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    data.onChange(id, { title: event.target.value });
  };

  // Handler untuk perubahan konten
  const handleContentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    data.onChange(id, { content: event.target.value });
  };

  return (
    <Card
      elevation={3}
      sx={{
        border: "1px solid #ddd",
        borderRadius: "8px",
        width: 250,
        backgroundColor: "white",
      }}
    >
      {/* Handle untuk koneksi masuk (dari chapter sebelumnya) */}
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        style={{ background: "#555" }}
      />

      <CardContent sx={{ p: "16px !important" }}>
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
            rows={2}
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
        style={{ background: "#555" }}
      />
    </Card>
  );
}

export default memo(InkNode);
