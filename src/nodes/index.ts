import type { NodeTypes } from "@xyflow/react";
import{igLogin} from "../components/igLogin";
import { AppNode } from "./types";
import { OrderProcessingNode } from "../components/orderProcess";
import { OrderReciept } from "../components/orderReciept";
import { create } from 'zustand';


interface SharedState {
  conversations: any[];
  processedOrders: any[];
  accessToken: string;
  

  updateConversations: (conversations: any[], token: string) => void;
  updateProcessedOrders: (orders: any[]) => void;
  runFlow: () => void;
  isStage1Complete: boolean;
  isStage2Complete: boolean;
  isStage3Complete: boolean;
  setStage3Complete: (isComplete: boolean) => void;
}

export const useStore = create<SharedState>((set) => ({
  conversations: [],
  processedOrders: [],
  accessToken: '',
  isStage1Complete: false,
  isStage2Complete: false,
  isStage3Complete: false,


  updateConversations: (conversations, token) => set({ conversations, accessToken: token }),
  updateProcessedOrders: (orders) => set({ processedOrders: orders }),
  setStage3Complete: (isComplete: boolean) => set({ isStage3Complete: isComplete }),

  runFlow: async () => {
    try {
      // Reset states
      set({ 
        isStage1Complete: false, 
        isStage2Complete: false, 
        isStage3Complete: false,
      });
    
    // Reference to button elements
    const fetchButton = document.querySelector('[data-testid="fetch-messages-btn"]');
    const processButton = document.querySelector('[data-testid="process-orders-btn"]');
    const sendAllButton = document.querySelector('[data-testid="send-all-receipts-btn"]');

    
    // Simulate clicks with delays
    if (fetchButton) {
      console.log("Running Stage 1: Fetching Messages");
      (fetchButton as HTMLButtonElement).click();
    }

    // Wait for stage 1 to complete before moving to stage 2
    let attempts = 0;
      while (useStore.getState().conversations.length === 0) {
        console.log("Waiting for messages to be fetched...");
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
      }

    await new Promise(resolve => setTimeout(resolve, 5000));


    if (processButton) {
      console.log("Running Stage 2: Processing Orders");
      (processButton as HTMLButtonElement).click();
    }

    attempts = 0;
      while (useStore.getState().processedOrders.length === 0 && attempts < 30) {
        console.log("Waiting for orders to be processed...");
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
      }

      while (!useStore.getState().isStage2Complete) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Stage 3: Send Receipts
      console.log("Starting Stage 3: Sending Receipts");
      if (sendAllButton && !useStore.getState().isStage3Complete) {
          (sendAllButton as HTMLButtonElement).click();
          // Wait for Stage 3 completion
          while (!useStore.getState().isStage3Complete) {
              await new Promise(resolve => setTimeout(resolve, 1000));
          }
      }
       
    
      
  }catch (error) {
    console.error("Error in flow execution:", error);
    throw error;
  }
}
}));

export const initialNodes: AppNode[] = [
  {
    id: "a",
    type: "instgramLoginNode",
    position: { x: 0, y: 0 },
    data: { 
      label: "Instagram Login",
      onDataUpdate: (data: any) => {
        useStore.getState().updateConversations(data.conversations, data.accessToken);
        
        const ordersNode = initialNodes.find(node => node.id === "c");
        if (ordersNode && ordersNode.data) {
          ordersNode.data.conversations = data.conversations;
          ordersNode.data.accessToken = data.accessToken;
        }
      }
    },

  },
  { 
    id: "c", 
    type:"orders",
    position: { x: 100, y: 100 }, 
    data: {
        label: "step 2", 
        conversations: useStore.getState().conversations,
        accessToken: useStore.getState().accessToken,
      onProcessComplete: (orders: any) => {
        console.log("Stage 2 - Orders completed:", orders);
        useStore.getState().updateProcessedOrders(orders);
        
        // Update receipt node
        const receiptNode = initialNodes.find(node => node.id === "d");
        if (receiptNode && receiptNode.data) {
          receiptNode.data.orders = orders;
          receiptNode.data.accessToken = useStore.getState().accessToken;
        }
      }
      }
  },
  {
    id: "d",
    type: "reciept",
    position: { x: 0, y: 200 },
    data: {
      label: "step 3", 
      orders: useStore.getState().processedOrders,
      accessToken: useStore.getState().accessToken
    },
  },
];

export const nodeTypes = {
  // Add any of your custom nodes here!
  instgramLoginNode: igLogin,
  orders:OrderProcessingNode,
  reciept:OrderReciept


} satisfies NodeTypes;
