import { useCallback, useState } from "react";
import {
  ReactFlow,
  Background,
  addEdge,
  useNodesState,
  useEdgesState,
  type OnConnect,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";

import { initialNodes, nodeTypes } from "./nodes";
import { initialEdges, edgeTypes } from "./edges";
import { RunButton } from "./components/RunButton";
import { RunReportPanel } from "./components/RunReportPanel";
//import { Logo } from "./components/Logo";

export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [isPanelOpen, setIsPanelOpen] = useState(false);


  // const onConnect: OnConnect = useCallback(
  //   (connection) => setEdges((edges) => addEdge(connection, edges)),
  //   [setEdges]
  // );

  const onConnect: OnConnect = useCallback(
    (connection) => {
      // Get source node data
      const sourceNode = nodes.find(n => n.id === connection.source);
      
      // Update target node with source node's data
      if (sourceNode?.data?.conversations) {
        setNodes(nodes.map(node => {
          if (node.id === connection.target) {
            return {
              ...node,
              data: {
                ...node.data,
                conversations: sourceNode.data.conversations,
                accessToken: sourceNode.data.accessToken
              }
            };
          }
          return node;
        }));
      }
      
      setEdges((edges) => addEdge(connection, edges));
    },
    [setEdges, nodes, setNodes]
  );


  return (
    <ReactFlow
      nodes={nodes}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      edges={edges}
      edgeTypes={edgeTypes}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      fitView
    >
      <Background />
      
      <RunButton
       onRun={() => setIsPanelOpen(true)}
        />
      <RunReportPanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
      />
    </ReactFlow>
  );
}
