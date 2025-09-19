import express from "express";
import cors from "cors";
import TikTokLiveConnection from "tiktok-live-connector";
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const app = express();
app.use(cors());
app.use(express.json());

// Firebase Admin SDK
initializeApp({ credential: applicationDefault() });
const db = getFirestore();

let connections = {};

app.get("/", (req, res) => res.send("TikTok Connector running 🚀"));

// API start lấy comment
app.post("/start", async (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).send("Thiếu username");

  if (connections[username]) {
    return res.send(`Đang kết nối tới @${username}`);
  }

  const tiktok = new TikTokLiveConnection(username);

  tiktok.connect()
    .then(state => console.log(`✅ Connected to @${username}, roomId=${state.roomId}`))
    .catch(err => console.error("❌ Connect error:", err));

  tiktok.on("chat", async (data) => {
    await db.collection("comments").add({
      tiktok_name: data.uniqueId,
      comment: data.comment,
      created_at: new Date().toISOString(),
      session_id: `live_${username}_${new Date().toISOString().split("T")[0]}`
    });
  });

  connections[username] = tiktok;
  res.send(`Bắt đầu lấy comment từ @${username}`);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
