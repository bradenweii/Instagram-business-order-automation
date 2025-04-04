import type { Node } from "@xyflow/react";

interface AppNodeData extends Record<string, unknown> {
    [key: string]: unknown;
    label?: string;
    conversations?: any[];
    orders?: any[];
    accessToken?: string;
    onDataUpdate?: (data: any) => void;
    func?: (input: any) => any;
    functionName?: string;
    onProcessComplete?: (orders: any) => void;
}

export type AppNode = Node<AppNodeData>;
