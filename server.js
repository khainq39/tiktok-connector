import express from "express";
import cors from "cors";
import { WebcastPushConnection } from "tiktok-live-connector";
import admin from "firebase-admin";
import dotenv from "dotenv";

// load env
dotenv.config();

// Firestore init
const serviceAccount = JSON.parse(process.env.SERVICE_ACCOUNT_KEY);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();

const app = express();
app.use(cors());
app.use(express.json());

// TikTok connector
let connections = {};

app.post("/start", async (req, res) => {
  const { username, uid } = req.body;
  if (!username || !uid) {
    return res.status(400).send("❌ Missing username or uid");
  }

  if (connections[username]) {
    return res.send(`⚡ Already connected to @${username}`);
  }

  const conn = new WebcastPushConnection(username);

  conn.connect()
    .then(state => console.log(`✅ Connected to @${username}, roomId=${state.roomId}`))
    .catch(err => console.error("❌ Connect error:", err));

  conn.on("chat", async (data) => {
    console.log(`💬 ${data.uniqueId} (${data.nickname}): ${data.comment}`);

    const sessionId = `live_${username}_${new Date().toISOString().split("T")[0]}`;

    try {
      await db.collection("comments").add({
        comment: data.comment,
        uniqueId: data.uniqueId,
        nickname: data.nickname,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        session_id: sessionId,
        created_by: uid,
      });
      console.log(`📥 Saved comment from ${data.uniqueId}`);
    } catch (err) {
      console.error("❌ Firestore write error:", err);
    }
  });

  connections[username] = conn;
  res.send(`🚀 Started listening to @${username}`);
});

// Mount Viettel Post routes
import viettelRoutes from "./routes/shipping/viettel.js";
app.use("/api/shipping/viettel", viettelRoutes);

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
