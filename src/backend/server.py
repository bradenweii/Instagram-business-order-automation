from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import json
import pandas as pd
import openai

app = Flask(__name__)
CORS(app)

# Basic route to test server
@app.route("/", methods=["GET"])
def home():
    print("Home endpoint hit!")
    return jsonify({
        "status": "success",
        "message": "Server is running!"
    })

@app.route("/api/test", methods=["GET"])
def test():
    print("Test endpoint hit!")
    return jsonify({
        "status": "success",
        "message": "API endpoint is working!"
    })

@app.route("/api/getConversations", methods=["GET"])
def get_conversations():
    try:
        print("=== Get Conversations endpoint hit ===")
        print("Headers received:", dict(request.headers))
        
        access_token = request.headers.get('Instagram-Access-Token')
        if not access_token:
            print("No access token provided")
            return jsonify({
                "status": "error",
                "message": "No access token provided"
            }), 400
        
        print(f"Using access token: {access_token[:20]}...")
        
        url = "https://graph.facebook.com/v18.0/me/conversations"
        params = {
            "platform": "instagram",
            "fields": "id,participants,messages{created_time,from,message}",
            "access_token": access_token,
            "limit": 50
        }

        print("Making request to Instagram API...")
        response = requests.get(url, params=params)
        print("Instagram API response status:", response.status_code)
        print("Instagram API response:", response.text[:500])
        
        if response.status_code != 200:
            return jsonify({
                "status": "error",
                "message": f"Instagram API returned status {response.status_code}",
                "details": response.text
            }), response.status_code
        
        data = response.json()
        return jsonify({
            "status": "success",
            "conversations": data.get("data", [])
        })
        
    except Exception as e:
        print("Error occurred:", str(e))
        return jsonify({
            "status": "error",
            "message": "Server error",
            "details": str(e)
        }), 500

@app.route("/test", methods=["GET"])
def test_connection():
    return jsonify({
        "status": "success",
        "message": "Backend is connected!"
    })

# Add OPTIONS handling for preflight requests
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', 'http://localhost:5173')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Instagram-Access-Token')
    response.headers.add('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
    return response

@app.route("/getMessages", methods=["GET"])
def get_messages():
    ACCESS_TOKEN = request.headers.get('Instagram-Access-Token')
    url = "https://graph.facebook.com/v22.0/me/conversations"
    params = {
        "platform": "instagram",
        "fields": "id,updated_time,messages{created_time,from,message}",
        "access_token": ACCESS_TOKEN,
        "limit": 50  # Increase limit
    }

#     response = requests.get(url, params=params)
#     data = response.json()

#     if "data" in data and len(data["data"]) > 0:
#         messages_array = [msg["message"] for msg in data["data"][0]["messages"]["data"]]
#     else:
#         messages_array = []

#     return jsonify({"messages": messages_array})

# if __name__ == "__main__":
#     app.run(port=5000, debug=True)
    response = requests.get(url, params=params)
    data = response.json()

    conversations = []
    if "data" in data:
        for conv in data["data"]:
            messages = conv["messages"]["data"]
            participant = conv["participants"]["data"][0]["username"]
            conversations.append({
                "conversation_id": conv["id"],
                "participant": participant,
                "messages": messages
            })

    return jsonify({"conversations": conversations})

@app.route("/api/processOrders", methods=["POST", "OPTIONS"])
def process_orders():
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"})
        
    print("Received order processing request")
    data = request.json
    conversations = data["conversations"]
    openai.api_key = data["openaiKey"]
    
    processed_orders = []
    for conv in conversations:
        # Combine messages into a single string for processing
        messages_text = "\n".join([msg["message"] for msg in conv["messages"]])
        
        # Process with GPT
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "Extract order information from this conversation. Include items, quantities, and any special requests."},
                {"role": "user", "content": messages_text}
            ]
        )
        
        order_info = response.choices[0].message["content"]
        
        processed_orders.append({
            "conversation_id": conv["conversation_id"],
            "customer": conv["participant"],
            "order_details": order_info
        })
    
    # Save to Excel
    df = pd.DataFrame(processed_orders)
    df.to_excel("orders.xlsx", index=False)
    
    return jsonify({"orders": processed_orders})

if __name__ == "__main__":
    PORT = 8000
    print(f"Server starting on http://localhost:{PORT}")
    print("Available endpoints:")
    print("  - GET  /")
    print("  - GET  /api/test")
    print("  - GET  /api/getConversations")
    app.run(host='0.0.0.0', port=PORT, debug=True)