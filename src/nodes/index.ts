import type { NodeTypes } from "@xyflow/react";
import{igLogin} from "../components/igLogin";
import { AppNode } from "./types";
import { OrderProcessingNode } from "../components/orderProcess";
import { OrderReciept } from "../components/orderReciept";
export const initialNodes: AppNode[] = [
  {
    id: "a",
    type: "instgramLoginNode",
    position: { x: 0, y: 0 },
    data: { label: "step 1" },

  },
  { 
    id: "c", 
    type:"orders",
    position: { x: 100, y: 100 }, 
    data: { label: "step 2" } },
  {
    id: "d",
    type: "reciept",
    position: { x: 0, y: 200 },
    data: { label: "step 3" },
  },
];

export const nodeTypes = {
  // Add any of your custom nodes here!
  instgramLoginNode: igLogin,
  orders:OrderProcessingNode,
  reciept:OrderReciept


} satisfies NodeTypes;
