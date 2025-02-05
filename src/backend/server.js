import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config(); // Load environment variables

const app = express();
app.use(cors());
app.use(express.json());

const ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;

// Route to fetch Instagram messages
app.get("/getMessages", async (req, res) => {
    try {
        const url = "https://graph.facebook.com/v22.0/me/conversations";
        const params = {
            platform: "instagram",
            fields: "id,updated_time,messages{created_time,from,message}",
            access_token: ACCESS_TOKEN,
            limit: 50 
        };

        // Make API request using Axios
        const response = await axios.get(url, { params });

        // Extract messages
        const data = response.data;
        let messagesArray = [];

        if (data.data && data.data.length > 0) {
            messagesArray = data.data[0].messages.data.map(msg => msg.message);
        }

        // Return JSON response
        res.json({ messages: messagesArray });

    } catch (error) {
        console.error("Error fetching messages:", error.response?.data || error.message);
        res.status(500).json({ error: error.message });
    }
});

// Start Express server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
