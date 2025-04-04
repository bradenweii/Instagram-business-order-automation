from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import json
import pandas as pd
import openai
import re
from openai import OpenAI
import os



app = Flask(__name__)
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:5173",
                    "https://ig-business-order-automation.vercel.app"
                    ],  # Your frontend URL
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Instagram-Access-Token"]
    }
})


# Basic route to test server
@app.route("/", methods=["GET"])
def home():
    print("Home endpoint hit!")
    return jsonify({
        "status": "success",
        "message": "Server is running!"
    })
@app.route("/test", methods=["GET"])
def test_connection():
    return jsonify({
        "status": "success",
        "message": "Backend is connected!"
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
        
        url = "https://graph.facebook.com/v22.0/me/conversations"
        params = {
            "platform": "instagram",
            "fields": "name,messages{created_time,from,message}",
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


# Add OPTIONS handling for preflight requests
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', 'http://localhost:5173')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Instagram-Access-Token')
    response.headers.add('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
    return response

@app.route("/getMessages", methods=["GET"])
def get_messages():
    try:
        access_token = request.headers.get('Instagram-Access-Token')
        if not access_token:
            return jsonify({"status": "error", "message": "No access token provided"}), 400

        url = "https://graph.facebook.com/v22.0/me/conversations"
        params = {
            "platform": "instagram",
            "fields": "name,messages{created_time,from{id,username},message}",
            "access_token": access_token,
            "limit": 50  # Increase limit
        }
        response = requests.get(url, params=params)
        data = response.json()

        conversations = []
        if "data" in data:
            for conv in data["data"]:
                messages = []
                participant_name = conv.get("name", "Unknown")
                conversation_id = conv.get("id")

                for msg in conv.get("messages", {}).get("data", []):
                    messages.append({
                        "message": msg["message"],
                        "created_time": msg["created_time"],
                        "from": participant_name
                    })

                conversations.append({
                    "name": participant_name,
                    "conversation_id": conversation_id,
                    "messages": messages
                })

        return conversations
    
    
    except Exception as e:
        print("Error:", str(e))
        return jsonify({"status": "error", "message": "Server error", "details": str(e)}), 500

print(get_messages)


def parse_order_info(order_info,id):
    """
    Parses the order information text and extracts structured data.
    """
    orders = []
    
    order_blocks = order_info.split("\n\n")  

    for block in order_blocks:
        item_match = re.search(r"- Item: (.+)", block)
        size_match = re.search(r"- Size: (.+)", block)
        quantity_match = re.search(r"- Quantity: (\d+)", block)
        special_match = re.search(r"- Special Requests: (.+)", block)


        order_data = {
            "Instagram Handle":id,
            "Item": item_match.group(1) if item_match else "N/A",
            "Size": size_match.group(1) if size_match else "N/A",
            "Quantity": int(quantity_match.group(1)) if quantity_match else 0,
            "Special Requests": special_match.group(1) if special_match else "None"
        }
        
        orders.append(order_data)
    
    return orders

def saveOrderToCSV(orders,filename='order.csv'):
    df = pd.DataFrame(orders)
    df.to_csv(filename,index=False)
    


@app.route("/api/processOrders", methods=["POST", "OPTIONS"])
def process_orders():
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"})
        
    print("Received order processing request")
    try:
        data = request.json
        print("Received data:", data)  # Debug log
        
        conversations = data.get("conversations", [])
        api_key = data.get("openaiKey","").strip()
        
        if not api_key:
            return jsonify({
                "status": "error",
                "message": "OpenAI API key is required"
            }), 400
            
        if not conversations:
            return jsonify({
                "status": "error",
                "message": "No conversations provided"
            }), 400
        
        # #Extract messages from conversations
        # messages_text = ",".join([
        #     str(msg.get("message", "")) 
        #     for msg in conversations 
        #     if msg.get("message")
        # ])
        
        # if not messages_text.strip():
        #     return jsonify({
        #         "status": "error",
        #         "message": "No valid messages found in conversations"
        #     }), 400

        # print(f"Processing messages: {messages_text}")  # Debug log
        
        all_orders = []
        processed_orders = []

       
        # for conv in conversations:
        #     api_key = data.get("openaiKey", "").strip()
        #     username = conv.get("name")
        #     if not api_key:
        #             return jsonify({
        #             "status": "error",
        #             "message": "OpenAI API key is required"
        #         }), 400

        #     # Extract messages text
        #     messages_text = ", ".join([
        #     str(msg.get("message", "")) 
        #     for msg in conversations
        #     if msg.get("message")
        #     ])
            
        #     if not messages_text.strip():
        #         continue  # Skip this conversation if no valid messages
        messages_by_user = {}
        user_ids = {}
        for msg in conversations:
            username = msg.get("name", "Unknown User")
            user_id = msg.get("id")
            if username not in messages_by_user:
                messages_by_user[username] = []
                user_ids[username] = user_id 
            messages_by_user[username].append(msg.get("message", ""))

        # Process orders for each user
        for username, messages in messages_by_user.items():
            messages_text = ", ".join(filter(None, messages))
            
            if not messages_text.strip():
                continue

            
            print(f"Processing messages for user {username}: {messages_text}")


            client = OpenAI(api_key=api_key)
            
            completion = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                            {
                                "role": "system",
                                "content": "Extract order information from this conversation. Include items, quantities, and any special requests."
                            },
                            {
                                "role": "user",
                                "content": messages_text
                            }
                        ]
                    )
                
            order_info = completion.choices[0].message.content
            print(f"OpenAI response: {order_info}")
            formatted_order_info = f"Order from @{username}:\n{order_info}"

            # Add the processed order with username
            processed_order = {
                "order_details": formatted_order_info,
                "username": username,
                "user_id": user_ids.get(username)
            }
            processed_orders.append(processed_order)

            
            # Parse and save to CSV with username
            parsed_orders = parse_order_info(order_info, username)
            all_orders.extend(parsed_orders)

        # Save all orders to CSV at once
        if all_orders:
            saveOrderToCSV(all_orders)
            df = pd.DataFrame(all_orders)
            csv_data = df.to_csv(index=False)
            return jsonify({
                "status": "success",
                "orders": processed_orders,
                "csv_data": csv_data
            })
            
        return jsonify({
            "status": "success",
            "orders": processed_orders
        })
        
    except Exception as e:
        print("Error occurred:", str(e))
        import traceback
        traceback.print_exc()
        return jsonify({
            "status": "error",
            "message": str(e),
            "details": traceback.format_exc()
            }), 500
    




@app.route("/api/sendMessage", methods=["POST", "OPTIONS"])
def send_message():
    if request.method == "OPTIONS":
        response = jsonify({"status": "ok"})
        return response
    try:

        access_token = request.headers.get('Instagram-Access-Token')
        print(f"Access token: {access_token}")

        data = request.json
        recipient_id = data.get("recipient_id")
        message = data.get("message")

        url = "https://graph.facebook.com/v22.0/me/messages"

        # headers = {
        #     "Authorization": f"Bearer {access_token}",
        #     "Content-Type": "application/json"
        # }
        # params = {
        #         "recipient": {
        #             "id": recipient_id
        #         },
        #         "message": {
        #             "text": message
        #         }
        # }
        payload = {
            "messaging_type": "RESPONSE",
            "recipient": {
                "id": str(recipient_id)
            },
            "message": {
                "text": message
            },
            "access_token": access_token
        }

        #response = requests.post(url, headers=headers, json=params)
        response = requests.post(url, json=payload)


        if response.status_code != 200:
                return jsonify({
                    "status": "error",
                    "message": f"Instagram API returned status {response.status_code}",
                    "details": response.text
                }), response.status_code

        return jsonify({
               "status": "success",
            "message": "Message sent successfully",
            "details": response.json()
        })
    except Exception as e:
        print(f"Error sending message: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


if __name__ == "__main__":
    PORT = int(os.environ.get("PORT", 8000))
    print(f"Server starting on {PORT}")
    app.run(host='0.0.0.0', port=PORT, debug=True)