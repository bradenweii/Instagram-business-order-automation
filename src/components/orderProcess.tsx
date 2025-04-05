import { useState ,useEffect} from "react";
import { Handle,Position} from "@xyflow/react";
import axios from "axios";
import { useStore } from '../nodes/index';



interface ProcessedMessage {
  name: string;
  created_time: string;
  from?: {
    username: string;
    id: string;
  };
  user_id?: string;
  message: string;
}
interface OrderProcessProps {
  data: {
    onProcessComplete?: (orders: any[]) => void;
  };
}
interface InstagramMessage {
  message: string;
  created_time: string;
  from?: {
      username: string;
      id: string;
  };
}

const OrderProcessingNode = ({ data }: OrderProcessProps) => {
  const [messages, setMessages] = useState<ProcessedMessage[]>([]);

  const [,setProcessedOrders] = useState([]);
  const [accessKey, setAccessKey] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderResults, setOrderResults] = useState("");

  const conversations = useStore((state) => state.conversations);
  const accessToken = useStore((state) => state.accessToken);


  useEffect(() => {
    console.log("Stage 2 - Received conversations:", conversations);
    console.log("Stage 2 - Raw conversation data:", JSON.stringify(conversations[0], null, 2));

    if (conversations && conversations.length > 0) {
        const extractedMessages = conversations.flatMap(conv => {
            console.log("Processing conversation:", conv);
            console.log("Messages data:", conv.messages);

            const messages = conv.messages?.data || [];
            return messages.map((msg:InstagramMessage )=> ({
                message: msg.message || '',
                created_time: msg.created_time || '',
                name: msg.from?.username || conv.name || 'Unknown',
                user_id: msg.from?.id || conv.id || ''
            }));
        });
        
       
        
        setMessages(extractedMessages);
    }
}, [conversations, accessToken]);

const processOrders = async () => {
    setIsProcessing(true);
    try {
      if (!messages || messages.length === 0) {
        throw new Error("No messages to process");
      }

      const messageText = messages.map(msg => ({
        message: msg.message,
        created_time: msg.created_time,
        name: msg.from?.username || msg.name,
        user_id: msg.name
      }));

    
      console.log("Processing messages:", messageText);
     


      const response = await axios.post('https://instagram-business-order-automation-1.onrender.com/api/processOrders', {
        conversations: messageText,
          openaiKey: accessKey
      });
      
      console.log("Backend response:", response.data);

      
      // if (response.data.orders && response.data.orders.length > 0) {
      //     setOrderResults(response.data.orders[0].order_details);
      //     setProcessedOrders(response.data.orders); 
      //     console.log("Stage 2 - Orders being passed to Stage 3:", response.data.orders);
          
      // }
      // if (data.onProcessComplete) {
      //   console.log("Stage 2 - Calling onProcessComplete with orders:", response.data.orders);
      //   data.onProcessComplete(response.data.orders);
      // }

      if (response.data.status === "success" && response.data.orders) {
        console.log("Processed orders:", response.data.orders);
        setOrderResults(response.data.orders[0].order_details);
        
        // Add user_id to the processed orders
        const ordersWithIds = response.data.orders.map((order: any, index: number) => ({
          ...order,
          user_id: messages[index].user_id  
        }));
        
        setProcessedOrders(ordersWithIds);
        
        if (data.onProcessComplete) {
          console.log("Calling onProcessComplete with orders:", ordersWithIds);
          data.onProcessComplete(ordersWithIds);
        }
      }

      if (response.data.csv_data) {
        const blob = new Blob([response.data.csv_data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `orders_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }



    } catch (error: any) {
      console.error("Error processing orders:", error);
      console.error("Messages state:", messages);
      setOrderResults("Error processing orders: " + (error.message || "Unknown error"));
    } finally {
      setIsProcessing(false);
  }
};

  return (
    <div className="p-4 bg-white border border-gray-300 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold">Create orders</h3>
      
      <div className="mt-4">
        <label htmlFor="accessKey" className="block text-sm font-medium text-gray-700">
          OpenAI Access key:
        </label>
        <textarea
          id="accessKey"
          name="accessKey"
          rows={1}
          cols={10}
          value={accessKey}
          onChange={(e) => setAccessKey(e.target.value)}
          className="mt-1 px-4 py-2 border border-black rounded outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Debug info */}
      <div className="mt-2 text-xs text-gray-500">
        Messages received: {messages ? messages.length : 0}
      </div>

      {/* Display received messages */}
      {/*{messages && messages.length > 0 && (
        <div className="mt-4 p-2 border border-gray-200 rounded bg-gray-100">
          <h4 className="font-semibold">Received Messages:</h4>
          <ul className="text-sm max-h-40 overflow-y-auto">
            {messages
            .filter((msg) => msg.message.toLowerCase().includes("order"))
            .map((msg, index) => (
              <li key={index} className="p-1 border-b">{msg.message}</li>
            ))}
          </ul>
        </div>
      )}
        */}


      <button
        onClick={processOrders}
        disabled={isProcessing}
        data-testid="process-orders-btn"
        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded disabled:bg-blue-300"
      >
        {isProcessing ? "Processing..." : "Process Orders"}
      </button>

      <div className="mt-4">
        <label htmlFor="orderResults" className="block text-sm font-medium text-gray-700">
          Generated Orders:
        </label>
        <textarea
          id="orderResults"
          name="orderResults"
          rows={4}
          value={orderResults}
          readOnly
          className="mt-1 w-full px-4 py-2 border border-gray-300 rounded bg-gray-50"
        />
      </div>

      <Handle type="target" position={Position.Top} id="step1" />
      <Handle type="source" position={Position.Bottom} id="step3" />
    </div>
  );
};

export { OrderProcessingNode };
