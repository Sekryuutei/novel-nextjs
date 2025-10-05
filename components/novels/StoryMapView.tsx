"use client";

import { useCallback, useEffect, useState } from "react";
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  Connection,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  useReactFlow,
  NodeChange,
  applyNodeChanges,
} from "reactflow";
import {
  Button,
  CircularProgress,
  Box,
  Typography,
  Alert,
} from "@mui/material";
import { v4 as uuidv4 } from "uuid";
import dagre from "dagre";

import InkNode from "@/components/iat/InkNode";
import EditableEdge from "@/components/iat/EditableEdge"; // Impor edge baru

import "reactflow/dist/style.css";

interface StoryMapViewProps {
  novelId: string;
  initialInkScript: string | null;
}

const nodeTypes = { ink: InkNode };
const edgeTypes = { default: EditableEdge }; // Gunakan edge baru sebagai default

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 250;
const nodeHeight = 120;

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

// Fungsi untuk mengubah skrip Ink menjadi state visual (nodes, edges)
const parseInkScriptToElements = (
  inkScript: string
): { nodes: Node[]; edges: Edge[] } => {
  if (!inkScript) return { nodes: [], edges: [] };

  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const knotRegex = /===\s*(\w+)\s*===([\s\S]*?)(?===|$)/g;
  let match;

  while ((match = knotRegex.exec(inkScript)) !== null) {
    const knotId = match[1]; // Ini adalah ID unik, bukan judul
    const knotContent = match[2];

    const choiceRegex = /\*\s*\[(.*?)\]\s*->\s*(\w+)/g;
    const contentWithoutChoices = knotContent.replace(choiceRegex, "").trim();
    const lines = contentWithoutChoices.split("\n");
    const title = lines.shift() || knotId.replace(/_/g, " "); // Ambil baris pertama sebagai judul dan HAPUS dari array
    const content = lines.join("\n"); // Gabungkan sisa baris sebagai konten

    nodes.push({
      id: knotId,
      type: "ink",
      position: { x: 0, y: 0 }, // Posisi awal, akan di-layout oleh dagre
      data: {
        title: title,
        content: content,
      },
    });

    let choiceMatch;
    while ((choiceMatch = choiceRegex.exec(knotContent)) !== null) {
      edges.push({
        id: `e-${knotId}-${choiceMatch[2]}-${uuidv4()}`,
        source: knotId,
        target: choiceMatch[2],
        label: choiceMatch[1],
      });
    }
  }

  return { nodes, edges };
};

// Fungsi untuk mengubah state visual (nodes, edges) menjadi skrip Ink
const generateInkScript = (nodes: Node[], edges: Edge[]): string => {
  let script = "";
  nodes.forEach((node) => {
    // Gunakan ID node sebagai nama knot, karena dijamin unik.
    script += `=== ${node.id} ===\n`;
    // Simpan judul sebagai baris pertama konten untuk parsing kembali
    script += `${node.data.title || "Tanpa Judul"}\n`;
    script += `${node.data.content || ""}\n`;

    const outgoingEdges = edges.filter((edge) => edge.source === node.id);
    if (outgoingEdges.length > 0) {
      outgoingEdges.forEach((edge) => {
        // Arahkan ke ID node target, yang juga merupakan nama knot-nya.
        script += `* [${edge.label || "Lanjutkan"}] -> ${edge.target}\n`;
      });
    } else {
      script += "-> END\n";
    }
    script += "\n";
  });
  return script;
};

function StoryMap({ novelId, initialInkScript }: StoryMapViewProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { screenToFlowPosition } = useReactFlow();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { deleteElements } = useReactFlow();

  useEffect(() => {
    if (initialInkScript) {
      // Jika ada skrip, parse dan layout
      const { nodes: parsedNodes, edges: parsedEdges } =
        parseInkScriptToElements(initialInkScript);

      // Tambahkan callback onChange ke setiap elemen yang di-parse
      parsedNodes.forEach(
        (node) => (node.data.onChange = handleNodeDataChange)
      );
      parsedEdges.forEach(
        (edge) => (edge.data = { onChange: handleEdgeDataChange })
      );

      const { nodes: layoutedNodes, edges: layoutedEdges } =
        getLayoutedElements(parsedNodes, parsedEdges);
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
    } else if (nodes.length === 0) {
      // Jika tidak ada skrip dan tidak ada node, buat node awal
      // Gunakan ID yang bisa diprediksi untuk node awal
      setNodes([
        {
          id: "Awal_Cerita", // Gunakan ID yang bisa diprediksi
          type: "ink",
          position: { x: 100, y: 100 },
          data: {
            title: "Awal Cerita",
            content: "Tulis konten awal di sini...",
            onChange: handleNodeDataChange,
          },
        },
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialInkScript]); // Hanya jalankan saat skrip awal berubah

  const handleNodeDataChange = useCallback(
    (nodeId: string, data: any) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            return { ...node, data: { ...node.data, ...data } };
          }
          return node;
        })
      );
    },
    [setNodes]
  );

  const onNodesChangeWithData = useCallback(
    (changes: NodeChange[]) => {
      setNodes((nds) => {
        const nextNodes = applyNodeChanges(changes, nds);
        // Pastikan fungsi onChange di-pass ke node baru
        return nextNodes.map((n) => ({
          ...n,
          data: { ...n.data, onChange: handleNodeDataChange },
        }));
      });
    },
    [setNodes, handleNodeDataChange]
  );

  const handleEdgeDataChange = useCallback(
    (edgeId: string, data: { label: string }) => {
      setEdges((eds) =>
        eds.map((edge) => {
          if (edge.id === edgeId) {
            // React Flow menyimpan label di root object, bukan di data
            return { ...edge, label: data.label };
          }
          return edge;
        })
      );
    },
    [setEdges]
  );

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge = {
        ...params,
        id: uuidv4(),
        label: "Teks Pilihan", // Default label
        data: { onChange: handleEdgeDataChange }, // Kirim callback ke edge
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges, handleEdgeDataChange]
  );

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Backspace" || event.key === "Delete") {
        deleteElements({ nodes, edges });
      }
    },
    [deleteElements, nodes, edges]
  );

  const addNode = () => {
    const newNodeId = `Chapter_${uuidv4().split("-")[0]}`; // Buat ID yang lebih mudah dibaca
    const newNode: Node = {
      id: newNodeId,
      type: "ink",
      // Tempatkan node baru di tengah viewport saat ini
      position: screenToFlowPosition({
        x: window.innerWidth / 2,
        y: window.innerHeight / 3,
      }),
      data: {
        title: "Chapter Baru",
        content: "",
        onChange: handleNodeDataChange,
      },
    };
    setNodes((nds) => nds.concat(newNode));
  };

  const handleSaveStory = async () => {
    setIsPending(true);
    setError(null);
    setSuccess(null);

    const inkScript = generateInkScript(nodes, edges);

    try {
      const res = await fetch(`/api/novels/${novelId}/ink`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inkScript }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal menyimpan cerita.");

      setSuccess(data.message);
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <>
      <Box sx={{ p: 2, display: "flex", gap: 2, alignItems: "center" }}>
        <Button
          variant="contained"
          onClick={handleSaveStory}
          disabled={isPending}
        >
          {isPending ? <CircularProgress size={24} /> : "Simpan Cerita"}
        </Button>
        <Button variant="outlined" onClick={addNode}>
          Tambah Chapter
        </Button>
        <Button
          color="error"
          variant="text"
          size="small"
          onClick={() => deleteElements({ nodes, edges })}
        >
          Hapus Pilihan (Tekan Backspace)
        </Button>
        <Typography variant="caption">
          Hubungkan handle node untuk membuat pilihan.
        </Typography>
      </Box>
      {error && (
        <Alert severity="error" sx={{ m: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ m: 2 }}>
          {success}
        </Alert>
      )}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChangeWithData}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes} // Terapkan edgeTypes
        onKeyDown={onKeyDown}
        fitView
        style={{ height: "100%", width: "100%" }}
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
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
