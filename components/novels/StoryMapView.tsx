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

  // State untuk dialog "Buat Chapter Baru"
  const [newChapterDialog, setNewChapterDialog] = useState<{
    position: { x: number; y: number };
  } | null>(null);
  const [newChapterTitle, setNewChapterTitle] = useState("");
  const [newChoiceText, setNewChoiceText] = useState("");

  // State untuk dialog "Hubungkan Chapter"
  const [connectDialog, setConnectDialog] = useState<Connection | null>(null);
  const [connectChoiceText, setConnectChoiceText] = useState("");

  const [isPending, setIsPending] = useState(false);
  const connectingNodeId = useRef<string | null>(null);

  useEffect(() => {
    const nodesWithoutPosition = chapters.some(
      (c) => c.positionX === null || c.positionY === null
    );

    let initialNodes: Node<ChapterNodeData>[] = chapters.map((chapter) => ({
      id: chapter.id,
      type: "chapter",
      data: {
        label: chapter.title,
        chapterNumber: chapter.chapterNumber,
        novelId: novelId,
        chapterId: chapter.id,
        onUpdate: onUpdate,
      },
      // Gunakan posisi dari DB jika ada, jika tidak, default ke 0,0
      position: {
        x: chapter.positionX ?? 0,
        y: chapter.positionY ?? 0,
      },
    }));

    const initialEdges: Edge[] = [];
    chapters.forEach((chapter) => {
      if (Array.isArray(chapter.choicesAsSource)) {
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
      }
    });

    // Hanya jalankan layout otomatis jika ada node yang belum punya posisi
    if (nodesWithoutPosition) {
      const { nodes: layoutedNodes, edges: layoutedEdges } =
        getLayoutedElements(initialNodes, initialEdges);
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
    } else {
      setNodes(initialNodes);
      setEdges(initialEdges);
    }
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
        setNewChapterDialog({ position });
        setNewChapterTitle("");
        setNewChoiceText("");
      }
    },
    [screenToFlowPosition]
  );

  const onConnect = useCallback((params: Connection) => {
    if (params.source === params.target) return;
    setConnectDialog(params);
    setConnectChoiceText("");
  }, []);

  const handleCloseDialog = () => {
    setNewChapterDialog(null);
    setConnectDialog(null);
  };

  const handleNewChapterSubmit = async () => {
    if (!newChapterDialog || !newChapterTitle || !newChoiceText) return;

    setIsPending(true);
    try {
      if (!connectingNodeId.current)
        throw new Error("Node asal tidak ditemukan.");

      await fetch(
        `/api/novels/${novelId}/chapters/${connectingNodeId.current}/branch`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            newChoiceText: newChoiceText,
            newChapterTitle: newChapterTitle,
            positionX: newChapterDialog.position.x,
            positionY: newChapterDialog.position.y,
          }),
        }
      );
      onUpdate();
    } catch (error) {
      console.error("Gagal membuat chapter baru:", error);
      alert("Gagal membuat chapter baru.");
    } finally {
      setIsPending(false);
      handleCloseDialog();
    }
  };

  const handleConnectSubmit = async () => {
    if (!connectDialog || !connectChoiceText) return;
    // Jangan izinkan pilihan tanpa teks untuk koneksi manual
    if (connectChoiceText.trim() === "") {
      alert("Teks pilihan tidak boleh kosong.");
      return;
    }

    setIsPending(true);
    try {
      const { source, target } = connectDialog;
      if (!source || !target)
        throw new Error("Chapter asal atau tujuan tidak valid.");

      // Ambil data chapter asal yang terbaru untuk menghindari menimpa perubahan lain
      const sourceChapterRes = await fetch(
        `/api/novels/${novelId}/chapters/${source}`
      );
      if (!sourceChapterRes.ok)
        throw new Error("Gagal mengambil data chapter asal.");
      const sourceChapter = await sourceChapterRes.json();

      await fetch(`/api/novels/${novelId}/chapters/${source}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...sourceChapter,
          choices: [
            ...(sourceChapter.choicesAsSource || []),
            { text: connectChoiceText, nextChapterId: target },
          ],
        }),
      });
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
        // Only send the fields that are being updated
        body: JSON.stringify({
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

      {/* Dialog untuk membuat chapter baru */}
      <Dialog open={!!newChapterDialog} onClose={handleCloseDialog}>
        <DialogTitle>Buat Chapter & Pilihan Baru</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Buat sebuah chapter baru dan pilihan yang mengarah ke sana.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Teks Pilihan"
            placeholder="Contoh: Pergi ke hutan"
            fullWidth
            variant="standard"
            value={newChoiceText}
            onChange={(e) => setNewChoiceText(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Judul Chapter Baru"
            placeholder="Contoh: Hutan Terlarang"
            fullWidth
            variant="standard"
            value={newChapterTitle}
            onChange={(e) => setNewChapterTitle(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Batal</Button>
          <Button
            onClick={handleNewChapterSubmit}
            disabled={isPending || !newChapterTitle}
          >
            {isPending ? <CircularProgress size={24} /> : "Buat"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog untuk menghubungkan chapter */}
      <Dialog open={!!connectDialog} onClose={handleCloseDialog}>
        <DialogTitle>Hubungkan Chapter</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Buat sebuah pilihan untuk menghubungkan kedua chapter ini.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Teks Pilihan"
            fullWidth
            variant="standard"
            value={connectChoiceText}
            onChange={(e) => setConnectChoiceText(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Batal</Button>
          <Button onClick={handleConnectSubmit} disabled={isPending}>
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
