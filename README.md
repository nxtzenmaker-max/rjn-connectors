# ⚡ RJN Connectors Hub

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fnxtzenmaker-max%2Frjn-connectors)

High-Performance Universal Connectors & Tool Hub for **RJN Hologram AI** and **Deepgram Voice Agent**.
Deploys instantly to **Vercel** with zero-configuration serverless functions and pre-configured CORS headers.

---

## 🌟 Available Connectors

| Connector | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| ☀️ **Live Weather** | `/api/weather` | Real-time global weather, temperature, humidity, wind | None (Free Open-Meteo) |
| 🌐 **Web Search** | `/api/search` | Live Wikipedia & DuckDuckGo instant answer extracts | None (Public API) |
| 🗄️ **MongoDB Sync** | `/api/database` | Multi-turn speech sync & cloud memory bridge | Pre-configured Appwrite Bridge |
| ⏱️ **System & Math** | `/api/system` | Live datetime in any timezone + safe math evaluator | None |
| 🐙 **GitHub Sync** | `/api/github` | Repository stats, commit history & project status | Optional `GITHUB_TOKEN` |
| 🎨 **IconScout** | `/api/iconscout` | 1,900+ vector icons, SVGs, real-time previews & IconScout API | None (Built-in) / Optional `ICONSCOUT_CLIENT_ID` |
| ⚡ **Universal Router**| `/api/execute` | Single dispatch endpoint for AI function calls | Internal Router |

---

## 🚀 How to Deploy on Vercel

### Option 1: One-Click Import from GitHub
1. Open your [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **"Add New..."** → **"Project"**.
3. Select the repository **`nxtzenmaker-max/rjn-connectors`**.
4. Leave all settings at default (Root Directory: `./`, Framework: `Other`).
5. Click **"Deploy"**.
6. Within 10 seconds, your Vercel URL (e.g. `https://rjn-connectors.vercel.app`) will be live!

---

## 🔌 API Reference & Usage

### 1. Live Weather Connector
```bash
curl "https://<your-vercel-domain>/api/weather?city=Mumbai"
```
**Response:**
```json
{
  "success": true,
  "city": "Mumbai, India",
  "temperature": "29.4°C",
  "feelsLike": "32.1°C",
  "humidity": "68%",
  "windSpeed": "12.4 km/h",
  "condition": "Mainly clear 🌤️"
}
```

### 2. Web Search & Knowledge Connector
```bash
curl "https://<your-vercel-domain>/api/search?query=Albert+Einstein"
```

### 3. System Date, Time & Math
```bash
# Get IST time
curl "https://<your-vercel-domain>/api/system?tz=Asia/Kolkata"

# Evaluate math expression
curl "https://<your-vercel-domain>/api/system?action=calculate&expr=(15*8)%2B45"
```

### 4. Universal Execute Router (for AI Tool Calling)
```bash
curl -X POST "https://<your-vercel-domain>/api/execute" \
  -H "Content-Type: application/json" \
  -d '{
    "connector": "weather",
    "params": { "city": "Delhi" }
  }'
```

---

## 🧠 Deepgram Voice Agent Integration
To connect these tools to RJN's Voice Agent, pass the function schemas from `/api/connectors` into `agent.think.functions`. When the user asks:
- *"Delhi ka mausam kaisa hai?"* → Calls `get_weather`
- *"Newton kaun tha?"* → Calls `web_search`
- *"Abhi kitne baj rahe hain?"* → Calls `get_system_time`

---

## 📄 License
MIT © [nxtzenmaker-max](https://github.com/nxtzenmaker-max)
