import React, { useState ,useEffect} from "react";
import { Handle } from "@xyflow/react";
import axios from "axios";

const OrderProcessingNode = ({data}) => {
  const [messages, setMessages] = useState(data.messages || []);
  const [processedOrders, setProcessedOrders] = useState([]);
  const [accessKey, setAccessKey] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);


  useEffect(() => {
    if (data.messages) {
        setMessages(data.messages);
    }
}, [data.messages]);

const processOrders = async () => {
    setIsProcessing(true);
    try {
        const response = await axios.post("http://localhost:5000/api/processOrders", {
            conversations: messages,
            openaiKey: accessKey
        });
        setProcessedOrders(response.data.orders);
        // Pass processed orders to the next node
        data.onOrdersProcessed(response.data.orders);
    } catch (error) {
        console.error("Error processing orders:", error);
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

      {/* Display received messages */}
      {messages.length > 0 && (
        <div className="mt-4 p-2 border border-gray-200 rounded bg-gray-100">
          <h4 className="font-semibold">Received Messages:</h4>
          <ul className="text-sm max-h-40 overflow-y-auto">
            {messages.map((msg, index) => (
              <li key={index} className="p-1 border-b">{msg}</li>
            ))}
          </ul>
        </div>
      )}
      <button
          onClick={processOrders}
          disabled={isProcessing || !messages.length}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded disabled:bg-blue-300"
      >
      {isProcessing ? "Processing..." : "Process Orders"}
      </button>

    

        <Handle type="target" position="top" id="step1" />
        <Handle type="source" position="bottom" id="step3" />
    </div>
  );
};

export { OrderProcessingNode };
