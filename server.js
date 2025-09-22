import express from "express";
import cors from "cors";
import { WebcastPushConnection } from "tiktok-live-connector";
import admin from "firebase-admin";

// 🔑 Load service account JSON từ biến môi trường (Render secret)
// Bạn phải add service account JSON vào Render → Environment → FIREBASE_SERVICE_ACCOUNT
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const app = express();
app.use(cors());
app.use(express.json());

let connections = {};

// Endpoint test
app.get("/", (req, res) => {
  res.send("✅ TikTok Connector is running");
});

// API start lấy comment TikTok
app.post("/start", async (req, res) => {
  const { username, userId } = req.body;
  if (!username || !userId) {
    return res.status(400).send("❌ Missing username or userId");
  }

  if (connections[username]) {
    return res.send(`⚡ Already connected to @${username}`);
  }

  const conn = new WebcastPushConnection(username);

  conn.connect()
    .then((state) => console.log(`✅ Connected to @${username}, roomId=${state.roomId}`))
    .catch((err) => console.error("❌ Connect error:", err));

  // Khi có chat
  conn.on("chat", async (data) => {
    console.log(`💬 ${data.uniqueId}: ${data.comment}`);

    try {
      await db.collection("comments").add({
        comment: data.comment,
        tiktok_name: data.uniqueId,
        timestamp: new Date().toISOString(),
        session_id: `live_${username}_${new Date().toISOString().split("T")[0]}`,
        created_by: userId, // UID từ Firebase Auth (client gửi lên)
      });
    } catch (err) {
      console.error("❌ Firestore write error:", err);
    }
  });

  connections[username] = conn;
  res.send(`🚀 Started listening to @${username}`);
});

// PORT Render cấp qua env
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
