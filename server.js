import express from "express";
import cors from "cors";
import { TikTokLiveConnection } from "tiktok-live-connector";
import admin from "firebase-admin";
import fs from "fs";

// Init Firebase Admin SDK
const serviceAccount = JSON.parse(
  fs.readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, "utf8")
);

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
  res.send("✅ TikTok Connector server is running");
});

// API start lấy comment TikTok
app.post("/start", async (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).send("❌ Missing username");

  if (connections[username]) {
    return res.send(`⚡ Already connected to @${username}`);
  }

  let tiktokLive = new TikTokLiveConnection(username);

  tiktokLive.connect()
    .then(state => {
      console.log(`✅ Connected to @${username}, roomId=${state.roomId}`);
    })
    .catch(err => {
      console.error("❌ Connect error:", err);
    });

  // Khi có chat → ghi vào Firestore
  tiktokLive.on("chat", async (data) => {
    console.log(`💬 ${data.uniqueId}: ${data.comment}`);

    await db.collection("comments").add({
      tiktok_name: data.uniqueId,
      comment: data.comment,
      timestamp: new Date().toISOString()
    });
  });

  connections[username] = tiktokLive;
  res.send(`🚀 Started listening to @${username}`);
});

// PORT Render cấp qua env
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
