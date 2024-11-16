from flask import Flask, request, jsonify
import requests

app = Flask(__name__)

# Facebook WhatsApp Business API credentials
WHATSAPP_API_URL = 'https://graph.facebook.com/v21.0/457860314085873/messages'  # Ganti dengan Phone Number ID Anda
ACCESS_TOKEN = 'EAAGWbVguzsMBO1xah7fsrrDNpE7GiE74BSaSQR1XDC0zDusnsVUGbMWa3q19BxdXEiN4rckYCSeuwodC4xdeWg7oV5ZC1ntMA8MZB9Ohfr0P46NxNolftM4U8rG5ZAPoL2Fvh91VCxQ13ie89kql45Qo4TIaOrnii1WxKbojsKbr8pK7fNXjPDb031dkssxEB5dbkj8R2uaAFmRJUxqLjc8uKUZD'  # Ganti dengan Facebook Access Token Anda

# Gemini API key
GEMINI_API_KEY = 'AIzaSyDWhbF2IaIvoSQ4RambSH_TYxifNBBq6TM'  # Ganti dengan Gemini API Key Anda

def query_gemini(prompt):
    url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateText"
    headers = {
        "Authorization": f"Bearer {GEMINI_API_KEY}",
        "Content-Type": "application/json",
    }
    data = {
        "prompt": prompt,
        "maxTokens": 150
    }
    response = requests.post(url, headers=headers, json=data)
    if response.status_code == 200:
        return response.json().get('generatedText', 'Sorry, I could not understand that.')
    else:
        return f"Error: {response.status_code} - {response.text}"

def chat_with_gemini(user_input):
    response_text = query_gemini(user_input)
    return response_text

@app.route("/whatsapp", methods=["POST"])
def whatsapp_webhook():
    # Mendapatkan pesan yang masuk dari WhatsApp
    incoming_message = request.json.get("entry", [])[0].get("changes", [])[0].get("value", {}).get("messages", [])[0].get("text", {}).get("body")
    from_number = request.json.get("entry", [])[0].get("changes", [])[0].get("value", {}).get("messages", [])[0].get("from")

    if not incoming_message or not from_number:
        return jsonify({"error": "Invalid message format"}), 400

    # Dapatkan respons dari Gemini API
    bot_response = chat_with_gemini(incoming_message)

    # Kirimkan balasan ke WhatsApp menggunakan Facebook Graph API
    data = {
        "messaging_product": "whatsapp",
        "to": from_number,
        "text": {"body": bot_response}
    }
    headers = {
        "Authorization": f"Bearer {ACCESS_TOKEN}",
        "Content-Type": "application/json"
    }
    response = requests.post(WHATSAPP_API_URL, json=data, headers=headers)

    if response.status_code == 200:
        return jsonify({"status": "success"}), 200
    else:
        return jsonify({"error": "Failed to send message", "details": response.json()}), 400

if __name__ == "__main__":
    app.run(debug=True)
