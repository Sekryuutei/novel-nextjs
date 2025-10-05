// c:\Users\anggi\Documents\Project\novel-nextjs\components\iat\CustomEdge.tsx
"use client";

import { getBezierPath, EdgeLabelRenderer, EdgeProps } from "reactflow";

export default function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <path
        id={id}
        style={{ ...style, strokeDasharray: "5 5" }}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            background: "#e0f2fe",
            padding: "2px 8px",
            borderRadius: "9999px",
            fontSize: 12,
            color: "#0c4a6e",
            pointerEvents: "all",
          }}
          className="nodrag nopan"
        >
          {data.label}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
