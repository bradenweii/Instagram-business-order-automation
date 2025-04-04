import { useState,useEffect} from "react";
import { Handle, Position } from "@xyflow/react";
import axios from "axios";
import { useStore } from '../nodes/index';

// interface OrderRecieptProps {
//   data: {
//     orders?: any[];
//     accessToken?: string;
//   }
// }

interface Order {
    order_details: string;
    username: string;
    user_id: string;
    from?: {
        username: string;
        id: string;
      };
  }

  

const OrderReciept = () => {
    const [isSending, setIsSending] = useState(false);
    const [sentStatus, setSentStatus] = useState<Record<string, boolean>>({});

    const processedOrders = useStore((state) => state.processedOrders);
    const accessToken = useStore((state) => state.accessToken);
    const conversations = useStore((state) => state.conversations);

    const setStage3Complete = useStore((state) => state.setStage3Complete);

    useEffect(() => {
        console.log("Stage 3 - Received orders:", processedOrders);
        console.log("Stage 3 - Access token:", accessToken);
      }, [processedOrders]);   

      useEffect(() => {
        // When sending completes and we have sent all receipts
        setStage3Complete(false);
        
    }, [isSending, sentStatus, processedOrders.length]);



      const findRecipientId = (username: string): string | undefined => {
        // Search through all conversations and their messages
        for (const conversation of conversations) {
            const messages = conversation.messages?.data || [];
            for (const message of messages) {
                if (message.from?.username === username) {
                    console.log(`Found matching ID for ${username}:`, message.from.id);
                    return message.from.id;
                }
            }
        }
        console.warn(`No recipient ID found for username: ${username}`);
        return undefined;
    };


    const sendReceipt = async (order: Order) => {
        if (sentStatus[order.user_id]) return;
        
        try {
            setIsSending(true);
            const recipientId = findRecipientId(order.username);

      console.log("Attempting to send receipt:", {
        recipientId: order.user_id,
        username: order.username,
        hasAccessToken: !!accessToken
      });
            const payload = {
                recipient_id: recipientId,
                message: `Thank you for your order!\n\nOrder Details:\n${order.order_details}\n\nWe'll process it shortly.`,
                access_token: accessToken
              };
        
              const headers = {
                "Content-Type": "application/json",
                "Instagram-Access-Token": accessToken
              };

              const response = await axios.post(
                "https://instagram-business-order-automation-1.onrender.com/api/sendMessage",
                payload,
                { headers }
              );
    
          if (response.data.status === "success") {
            setSentStatus(prev => ({
              ...prev,
              [order.user_id]: true

            }));
          }
          setStage3Complete(true);

        } catch (error) {
          console.error("Error sending receipt:", error);
        }
      };
    
      
      const sendAllReceipts = async () => {
        setIsSending(true);
        try {
          await Promise.all(processedOrders.map(order => sendReceipt(order)));
          console.log("All receipts sent successfully");
        } catch (error: unknown) {
          console.error("Error sending all receipts:", error);
          const message = error instanceof Error ? error.message : 'Unknown error';
          alert("Failed to send all receipts: " + message);
        } finally {
          setIsSending(false);
        }
      };
    

      return (
        <div className="p-4 bg-white border border-gray-300 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold">Order Receipts</h3>
          
          <div className="mt-2 text-xs text-gray-500">
            Orders to process: {processedOrders.length}
          </div>
          
          {processedOrders.length > 0 ? (
            <div className="mt-4">
              <div className="max-h-60 overflow-y-auto">
                {processedOrders.map((order, index) => (
                  <div key={index} className="mb-4 p-2 border rounded">
                    <p className="font-medium">Order for @{order.username}</p>
                    <pre className="whitespace-pre-wrap text-sm mt-1">
                      {order.order_details}
                    </pre>
                    <p className="text-xs text-gray-500 mt-1">User ID: {order.user_id}</p>
                    <button
                      onClick={() => sendReceipt(order)}
                      disabled={sentStatus[order.user_id]}
                      className="mt-2 px-3 py-1 bg-green-500 text-white text-sm rounded disabled:bg-green-300"
                    >
                      {sentStatus[order.user_id] ? "Receipt Sent! ✓" : "Send Receipt"}
                    </button>
                  </div>
                ))}
              </div>
              
              <button
                onClick={sendAllReceipts}
                disabled={isSending || processedOrders.every(order => sentStatus[order.user_id])}
                data-testid="send-receipts-btn"
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded disabled:bg-blue-300"
              >
                {isSending ? "Sending..." : "Send All Receipts"}
              </button>
            </div>
          ) : (
            <p className="mt-4 text-gray-500">No orders to process</p>
          )}
      <Handle 
        type="target" 
        position={Position.Top} 
        id="step1" 
      />    
      </div>

);
};

export{OrderReciept};