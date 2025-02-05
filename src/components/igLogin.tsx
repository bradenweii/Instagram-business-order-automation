import React, { useState ,useId} from "react";
import { Handle } from "@xyflow/react";
import axios from "axios";

const igLogin = ({data}) =>{

  const [messages, setMessages] = useState([]);
  const [accessKey, setAccessKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchMessages = async () => {
    setIsLoading(true);
    setError("");
    try {
        const response = await axios.get("http://localhost:5000/api/getConversations", {
            headers: {
                'Instagram-Access-Token': accessKey
            }
        });
        console.log("Received data:", response.data);
        setMessages(response.data.conversations);
        if (data.onMessagesUpdate) {
            data.onMessagesUpdate(response.data.conversations);
        }
    } catch (error) {
        console.error("Error:", error);
        setError(error.response?.data?.error || "Failed to fetch messages");
    } finally {
        setIsLoading(false);
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
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded disabled:bg-blue-300"
          >
              {isLoading ? "Fetching..." : "Fetch Messages"}
          </button>
          </div>
      
      </div>
      <Handle type="source" position="bottom" id="step1" />
  </div>
);
};


export{igLogin};
