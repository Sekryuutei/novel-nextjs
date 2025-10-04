"use client";

import { Chapter } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  MarkerType,
  ReactFlowProvider,
} from "reactflow";

import "reactflow/dist/style.css";

interface StoryGraphViewerProps {
  novelId: string;
  chapters: Chapter[];
}

type ChapterNodeData = {
  label: string;
  isStartNode: boolean;
};

function Flow({ novelId, chapters }: StoryGraphViewerProps) {
  const router = useRouter();
  const [nodes, setNodes] = useState<Node<ChapterNodeData>[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  useEffect(() => {
    const initialNodes: Node<ChapterNodeData>[] = chapters.map(
      (chapter, index) => ({
        id: chapter.id,
        type: "default",
        data: {
          label: `#${chapter.chapterNumber}: ${chapter.title}`,
          isStartNode: chapter.chapterNumber === 1,
        },
        position: {
          x: chapter.positionX ?? (index % 4) * 250,
          y: chapter.positionY ?? Math.floor(index / 4) * 150,
        },
        style:
          chapter.chapterNumber === 1
            ? {
                background: "#d1fae5", // Green for start node
                borderColor: "#10b981",
              }
            : undefined,
      })
    );

    const initialEdges: Edge[] = [];
    chapters.forEach((chapter) => {
      // Ganti 'choices' dengan 'choicesAsSource'
      const choices = (chapter.choicesAsSource as any[]) || [];
      choices.forEach((choice, index) => {
        if (choice.nextChapterId) {
          initialEdges.push({
            id: `e-${chapter.id}-${choice.nextChapterId}-${index}`,
            source: chapter.id,
            target: choice.nextChapterId,
            label: choice.text,
            markerEnd: {
              type: MarkerType.ArrowClosed,
            },
          });
        }
      });
    });

    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [chapters, novelId]);

  const onNodeClick = useCallback(
    (_: any, node: Node<ChapterNodeData>) => {
      router.push(`/read/${novelId}/${node.id}`);
    },
    [router, novelId]
  );

  return (
    <div
      style={{ height: "50vh", border: "1px solid #e5e7eb", borderRadius: 8 }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodeClick={onNodeClick}
        fitView
        nodesDraggable={false}
        nodesConnectable={false}
      >
        <Background />
        <Controls showInteractive={false} />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}

export default function StoryGraphViewer(props: StoryGraphViewerProps) {
  return (
    <ReactFlowProvider>
      <Flow {...props} />
    </ReactFlowProvider>
  );
}
