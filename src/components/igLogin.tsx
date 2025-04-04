import { Handle,Position } from "@xyflow/react";
import axios from "axios";
import { useStore } from '../nodes/index';
import { useState } from 'react';
interface Message {
    created_time: string;
    message: string;
}

interface Conversation {
    id: string;
    name: string;
    messages: {
        data: Message[];
    };
}
interface IgLoginProps {
    data: {
      onDataUpdate?: (data: any) => void;
    };
  }

const igLogin = ({ data }: IgLoginProps) => {
    const [messages, setMessages] = useState<Conversation[]>([]);
    const [accessKey, setAccessKey] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const updateConversations = useStore(state => state.updateConversations);

    const fetchMessages = async () => {
        setIsLoading(true);
        setError("");
        try {
            console.log("Making API request with token:", accessKey);
            const response = await axios.get("https://instagram-business-order-automation-1.onrender.com/api/getConversations", {
                headers: {
                    'Instagram-Access-Token': accessKey
                }
            });
            console.log("Full API response:", response);
            console.log("Response data:", response.data);

            if (response.data.status === "success") {
                const conversations = response.data.conversations || [];
                console.log("Stage 1 - Retrieved conversations:", conversations);
                
                setMessages(conversations);
                updateConversations(conversations, accessKey);

                // Update the store and notify parent
                if (data.onDataUpdate) {
                    data.onDataUpdate({
                        conversations: conversations,
                        accessToken: accessKey
                    });
                }
            }

            
        
        } catch (error: any) {
            console.error("Error:", error);
            setError(error.response?.data?.error || "Failed to fetch messages");
        } finally {
            setIsLoading(false);
        }
    };

   

    // Safely format conversations data
    const formatConversations = () => {
        if (!Array.isArray(messages) || messages.length === 0) {
            return "";
        }

        try {
            return messages.map(conv => {
                if (!conv) return '';
                const participant = conv.name || 'Unknown';
                const messageList = Array.isArray(conv.messages?.data) 
                    ? conv.messages.data.map(msg => `- ${msg.message || ''}`).join('\n')
                    : '';
                return `Conversation with ${participant}:\n${messageList}`;
            }).join('\n\n');
        } catch (err) {
            console.error('Error formatting conversations:', err);
            return "Error formatting conversations";
        }
    };

    return (
        <div className="p-4 bg-white border border-black-300 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold">Instagram Login</h3>
            <div className="mt-4">
                <label htmlFor="accessKey" className="block text-sm font-medium text-gray-700">
                    Instagram Access Token:
                </label>
                <textarea
                    id="accessKey"
                    value={accessKey}
                    rows={1}
                    cols={10}
                    onChange={(e) => setAccessKey(e.target.value)}
                    className="mt-1 px-4 py-2 border border-black rounded outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div>
                    <button
                        onClick={fetchMessages}
                        disabled={isLoading}
                        data-testid="fetch-messages-btn"
                        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded disabled:bg-blue-300"
                    >
                        {isLoading ? "Fetching..." : "Fetch Messages"}
                    </button>
                </div>

                {error && (
                    <div className="mt-2 text-red-500 text-sm">
                        {error}
                    </div>
                )}

                <div className="mt-4">
                    <label htmlFor="conversations" className="block text-sm font-medium text-gray-700">
                        Conversations:
                    </label>
                    <textarea
                        id="conversations"
                        value={formatConversations()}
                        readOnly
                        rows={5}
                        className="mt-1 w-full px-4 py-2 border border-gray-300 rounded bg-gray-50"
                    />
                </div>
            </div>
            <Handle type="source" position={Position.Bottom} id="step1" />
        </div>
    );
};

export { igLogin };
