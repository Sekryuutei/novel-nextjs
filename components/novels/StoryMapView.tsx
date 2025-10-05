"use client";

import { Chapter } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  Connection,
  MarkerType,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  useReactFlow,
} from "reactflow";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  CircularProgress,
} from "@mui/material";
import dagre from "dagre";

import ChapterNode from "@/components/iat/ChapterNode";
import CustomEdge from "@/components/iat/CustomEdge";

import "reactflow/dist/style.css";

interface StoryMapViewProps {
  novelId: string;
  chapters: Chapter[];
  onUpdate: () => void;
}

type ChapterNodeData = {
  label: string;
  chapterNumber: number;
  novelId: string;
  chapterId: string;
};

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 220;
const nodeHeight = 80;

const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
  dagreGraph.setGraph({ rankdir: "LR" });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.position = {
      x: nodeWithPosition.x - nodeWidth / 2,
      y: nodeWithPosition.y - nodeHeight / 2,
    };

    return node;
  });

  return { nodes, edges };
};

const nodeTypes = { chapter: ChapterNode };
const edgeTypes = { custom: CustomEdge };

function StoryMap({ novelId, chapters, onUpdate }: StoryMapViewProps) {
  const router = useRouter();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { screenToFlowPosition } = useReactFlow();

  // State untuk dialog
  const [dialogState, setDialogState] = useState<{
    type: "new" | "connect";
    data: any;
  } | null>(null);
  const [inputText, setInputText] = useState("");
  const [isPending, setIsPending] = useState(false);
  const connectingNodeId = useRef<string | null>(null);

  useEffect(() => {
    const getElements = () => {
      const initialNodes: Node<ChapterNodeData>[] = chapters.map((chapter) => ({
        id: chapter.id,
        type: "chapter",
        data: {
          label: chapter.title,
          chapterNumber: chapter.chapterNumber,
          novelId: novelId,
          chapterId: chapter.id,
          onUpdate: onUpdate,
        },
        position: { x: 0, y: 0 }, // Position will be set by dagre
      }));

      const initialEdges: Edge[] = [];
      chapters.forEach((chapter) => {
        // Pastikan choicesAsSource ada dan merupakan array
        if (!Array.isArray(chapter.choicesAsSource)) return;

        chapter.choicesAsSource.forEach((choice) => {
          if (choice.nextChapterId) {
            initialEdges.push({
              id: `e-${choice.id}`,
              source: chapter.id,
              target: choice.nextChapterId,
              type: "custom",
              markerEnd: { type: MarkerType.ArrowClosed, color: "#6b7280" },
              data: { label: choice.text },
              style: { stroke: "#9ca3af" },
            });
          }
        });
      });

      return getLayoutedElements(initialNodes, initialEdges);
    };

    const { nodes: layoutedNodes, edges: layoutedEdges } = getElements();
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [chapters, novelId, onUpdate, setNodes, setEdges]);

  const onConnectStart = useCallback(
    (_: any, { nodeId }: { nodeId: string | null }) => {
      connectingNodeId.current = nodeId;
    },
    []
  );

  const onConnectEnd = useCallback(
    (event: MouseEvent | TouchEvent) => {
      if (!connectingNodeId.current) return;

      const targetIsPane = (event.target as HTMLElement).classList.contains(
        "react-flow__pane"
      );

      if (targetIsPane) {
        const position = screenToFlowPosition({
          x: (event as MouseEvent).clientX,
          y: (event as MouseEvent).clientY,
        });
        setDialogState({ type: "new", data: { position } });
        setInputText("");
      }
    },
    [screenToFlowPosition]
  );

  const onConnect = useCallback((params: Connection) => {
    if (params.source === params.target) return;
    setDialogState({ type: "connect", data: params });
    setInputText("");
  }, []);

  const handleCloseDialog = () => {
    setDialogState(null);
    setInputText("");
  };

  const handleDialogSubmit = async () => {
    if (!dialogState || !inputText) return;

    setIsPending(true);
    try {
      if (dialogState.type === "new") {
        // Membuat chapter baru dan choice baru
        if (!connectingNodeId.current)
          throw new Error("Node asal tidak ditemukan.");

        await fetch(
          `/api/novels/${novelId}/chapters/${connectingNodeId.current}/branch`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              newChoiceText: inputText,
              newChapterTitle: `Chapter Baru (dari ${
                chapters.find((c) => c.id === connectingNodeId.current)?.title
              })`,
            }),
          }
        );
      } else if (dialogState.type === "connect") {
        // Menghubungkan dua chapter yang sudah ada
        const { source, target } = dialogState.data;
        if (!source || !target)
          throw new Error("Chapter asal atau tujuan tidak valid.");

        const sourceChapter = chapters.find((c) => c.id === source);
        if (!sourceChapter)
          throw new Error("Data chapter asal tidak ditemukan.");

        const existingChoices = (sourceChapter.choicesAsSource as any[]) || [];
        const updatedChoices = [
          ...existingChoices,
          { text: inputText, nextChapterId: target },
        ];

        await fetch(`/api/novels/${novelId}/chapters/${source}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...sourceChapter, choices: updatedChoices }),
        });
      }
      onUpdate(); // Memicu refresh data di halaman IAT
    } catch (error) {
      console.error("Gagal menyimpan perubahan:", error);
      alert("Gagal menyimpan perubahan. Lihat konsol untuk detail.");
    } finally {
      setIsPending(false);
      handleCloseDialog();
    }
  };

  const onNodeDragStop = useCallback(
    (_: any, node: Node) => {
      const chapterToUpdate = chapters.find((c) => c.id === node.id);
      if (!chapterToUpdate) return;

      fetch(`/api/novels/${novelId}/chapters/${node.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...chapterToUpdate,
          positionX: node.position.x,
          positionY: node.position.y,
        }),
      });
    },
    [novelId, chapters]
  );

  return (
    <>
      <div style={{ width: "100%", height: "100%" }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onConnectStart={onConnectStart}
          onConnectEnd={onConnectEnd}
          onNodeDragStop={onNodeDragStop}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>

      <Dialog open={!!dialogState} onClose={handleCloseDialog}>
        <DialogTitle>
          {dialogState?.type === "new"
            ? "Buat Chapter & Pilihan Baru"
            : "Tambah Pilihan ke Chapter"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Masukkan teks untuk pilihan yang akan mengarah ke chapter ini.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Teks Pilihan"
            fullWidth
            variant="standard"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Batal</Button>
          <Button
            onClick={handleDialogSubmit}
            disabled={isPending || !inputText}
          >
            {isPending ? <CircularProgress size={24} /> : "Simpan"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default function StoryMapView(props: StoryMapViewProps) {
  return (
    <ReactFlowProvider>
      <StoryMap {...props} />
    </ReactFlowProvider>
  );
}
