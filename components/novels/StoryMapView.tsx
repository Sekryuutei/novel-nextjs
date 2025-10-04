"use client";

import { Chapter } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import ReactFlow, {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  Connection,
  EdgeChange,
  NodeChange,
  MarkerType,
  useReactFlow,
} from "reactflow";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";

import "reactflow/dist/style.css";

interface StoryMapViewProps {
  novelId: string;
  chapters: Chapter[];
}

type ChapterNodeData = {
  label: string;
  chapterNumber: number;
  novelId: string;
  chapterId: string;
};

export default function StoryMapView({ novelId, chapters }: StoryMapViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [nodes, setNodes] = useState<Node<ChapterNodeData>[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const { screenToFlowPosition } = useReactFlow();

  // State for the new chapter dialog
  const connectingNodeId = useRef<string | null>(null);
  const [newChapterData, setNewChapterData] = useState<{
    position: { x: number; y: number };
  } | null>(null);
  const [newChoiceText, setNewChoiceText] = useState("");
  const [newChapterTitle, setNewChapterTitle] = useState("");

  // State for adding a choice between existing chapters
  const [connection, setConnection] = useState<Connection | null>(null);
  const [addChoiceText, setAddChoiceText] = useState("");

  useEffect(() => {
    const initialNodes: Node<ChapterNodeData>[] = chapters.map(
      (chapter, index) => ({
        id: chapter.id,
        type: "default",
        data: {
          label: `#${chapter.chapterNumber}: ${chapter.title}`,
          chapterNumber: chapter.chapterNumber,
          novelId: novelId,
          chapterId: chapter.id,
        },
        position: {
          x: chapter.positionX ?? (index % 4) * 250,
          y: chapter.positionY ?? Math.floor(index / 4) * 150,
        },
      })
    );

    const initialEdges: Edge[] = [];
    chapters.forEach((chapter) => {
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

  const onNodesChange = useCallback(
    (changes: NodeChange[]) =>
      setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) =>
      setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnectStart = useCallback(
    (_: any, { nodeId }: { nodeId: string | null }) => {
      connectingNodeId.current = nodeId;
    },
    []
  );

  const onNodeDragStop = useCallback(
    (_: any, node: Node<ChapterNodeData>) => {
      startTransition(async () => {
        await fetch(`/api/novels/${novelId}/chapters/${node.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            positionX: node.position.x,
            positionY: node.position.y,
          }),
        });
      });
    },
    [novelId]
  );

  const onNodeDoubleClick = useCallback(
    (_: any, node: Node<ChapterNodeData>) => {
      router.push(
        `/dashboard/novels/edit/${node.data.novelId}/chapters/${node.data.chapterId}`
      );
    },
    [router]
  );

  const onConnect = useCallback((params: Connection) => {
    // Prevent connecting a node to itself
    if (params.source === params.target) return;
    setConnection(params);
  }, []);

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
        setNewChapterData({ position });
      }
    },
    [screenToFlowPosition]
  );

  const handleCreateNewChapter = async () => {
    if (!newChapterData || !connectingNodeId.current) return;

    const sourceNodeId = connectingNodeId.current;
    const { position } = newChapterData;

    startTransition(async () => {
      try {
        // 1. Create the new chapter
        const createRes = await fetch(`/api/novels/${novelId}/chapters`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: newChapterTitle,
            positionX: position.x,
            positionY: position.y,
          }),
        });
        if (!createRes.ok) throw new Error("Gagal membuat chapter baru.");
        const newChapter: Chapter = await createRes.json();

        // 2. Update the source chapter to add the new choice
        const sourceChapter = chapters.find((c) => c.id === sourceNodeId);
        const existingChoices = (sourceChapter?.choicesAsSource as any[]) || [];
        const updatedChoices = [
          ...existingChoices,
          { text: newChoiceText, nextChapterId: newChapter.id },
        ];

        await fetch(`/api/novels/${novelId}/chapters/${sourceNodeId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ choices: updatedChoices }),
        });

        // 3. Refresh the page to get all data again.
        // A more advanced implementation could update the state locally.
        router.refresh();
      } catch (error) {
        console.error("Error creating new chapter and choice:", error);
      } finally {
        // 4. Close dialog and reset state
        setNewChapterData(null);
        setNewChapterTitle("");
        setNewChoiceText("");
        connectingNodeId.current = null;
      }
    });
  };

  const handleAddChoice = async () => {
    if (!connection || !addChoiceText) return;

    const { source, target } = connection;
    if (!source || !target) return;

    startTransition(async () => {
      try {
        const sourceChapter = chapters.find((c) => c.id === source);
        if (!sourceChapter) throw new Error("Chapter asal tidak ditemukan.");

        const existingChoices = (sourceChapter.choicesAsSource as any[]) || [];
        const updatedChoices = [
          ...existingChoices,
          { text: addChoiceText, nextChapterId: target },
        ];

        await fetch(`/api/novels/${novelId}/chapters/${source}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ choices: updatedChoices }),
        });

        // Refresh data untuk menampilkan edge baru
        router.refresh();
      } catch (error) {
        console.error("Gagal menambahkan pilihan:", error);
      } finally {
        // Tutup dialog dan reset state
        setConnection(null);
        setAddChoiceText("");
      }
    });
  };

  return (
    <>
      <div
        style={{ height: "70vh", border: "1px solid #ddd", borderRadius: 8 }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeDragStop={onNodeDragStop}
          onNodeDoubleClick={onNodeDoubleClick}
          onConnectStart={onConnectStart}
          onConnect={onConnect}
          onConnectEnd={onConnectEnd}
          fitView
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>
      <Dialog open={!!newChapterData} onClose={() => setNewChapterData(null)}>
        <DialogTitle>Buat Chapter Baru</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Teks Pilihan"
            fullWidth
            variant="standard"
            value={newChoiceText}
            onChange={(e) => setNewChoiceText(e.target.value)}
            required
          />
          <TextField
            margin="dense"
            label="Judul Chapter Baru"
            fullWidth
            variant="standard"
            value={newChapterTitle}
            onChange={(e) => setNewChapterTitle(e.target.value)}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewChapterData(null)}>Batal</Button>
          <Button
            onClick={handleCreateNewChapter}
            disabled={isPending || !newChoiceText || !newChapterTitle}
          >
            {isPending ? "Membuat..." : "Buat"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!connection} onClose={() => setConnection(null)}>
        <DialogTitle>Tambah Pilihan</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Teks Pilihan"
            fullWidth
            variant="standard"
            value={addChoiceText}
            onChange={(e) => setAddChoiceText(e.target.value)}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConnection(null)}>Batal</Button>
          <Button
            onClick={handleAddChoice}
            disabled={isPending || !addChoiceText}
          >
            {isPending ? "Menyimpan..." : "Simpan"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
