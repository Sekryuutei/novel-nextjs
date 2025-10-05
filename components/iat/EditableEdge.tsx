"use client";

import React, { useState } from "react";
import {
  EdgeProps,
  getBezierPath,
  EdgeLabelRenderer,
  BaseEdge,
} from "reactflow";
import { Box, TextField } from "@mui/material";

interface EditableEdgeData {
  onChange: (edgeId: string, data: { label: string }) => void;
}

export default function EditableEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  label,
  data,
}: EdgeProps<EditableEdgeData>) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [labelText, setLabelText] = useState(label as string);

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    // Panggil callback untuk menyimpan perubahan ke state utama
    if (data?.onChange) {
      data.onChange(id, { label: labelText });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleBlur();
    }
  };

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <Box
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: "all",
          }}
          className="nodrag nopan"
          onDoubleClick={handleDoubleClick}
        >
          {isEditing ? (
            <TextField
              autoFocus
              size="small"
              variant="outlined"
              value={labelText}
              onChange={(e) => setLabelText(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              sx={{
                backgroundColor: "white",
                padding: "2px",
                borderRadius: "4px",
              }}
            />
          ) : (
            <Box
              sx={{
                p: 1,
                borderRadius: 1,
                backgroundColor: "rgba(255, 255, 255, 0.8)",
                cursor: "pointer",
              }}
            >
              {label || "Klik 2x untuk edit"}
            </Box>
          )}
        </Box>
      </EdgeLabelRenderer>
    </>
  );
}
