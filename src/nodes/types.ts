import type { Node, BuiltInNode } from "@xyflow/react";

interface AppNodeData {
    label?: string;
    conversations?: any[];
    onDataUpdate?: (data: any) => void;
    func?: (input: any) => any;
    functionName?: string;
    onProcessComplete?: (orders: any) => void;
}

export type AppNode = Node<AppNodeData>;
