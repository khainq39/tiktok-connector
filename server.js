import express from "express";
import cors from "cors";
import pkg from "tiktok-live-connector";
import admin from "firebase-admin";

const { TikTokLiveConnection } = pkg;

const app = express();
app.use(cors());
app.use(express.json());

// ===== Firebase Admin init =====
if (!admin.apps.length) {
  // Dùng ENV biến SERVICE_ACCOUNT_KEY (Render → Dashboard → Environment)
  const serviceAccount = JSON.parse(process.env.SERVICE_ACCOUNT_KEY);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

// ===== TikTok connections =====
let connections = {};

// Endpoint test
app.get("/", (req, res) => {
  res.send("✅ TikTok Connector server is running");
});

// Start listening to a TikTok username
app.post("/start", async (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).send("❌ Missing username");

  if (connections[username]) {
    return res.send(`⚡ Already connected to @${username}`);
  }

  let tiktokLiveConnection = new TikTokLiveConnection(username);

  // Connect thử
  tiktokLiveConnection
    .connect()
    .then((state) => {
      console.log(`✅ Connected to @${username}, roomId=${state.roomId}`);
    })
    .catch((err) => {
      console.error("❌ Connect error:", err);
    });

  // Khi có chat
  tiktokLiveConnection.on("chat", async (data) => {
    console.log(`💬 ${data.uniqueId}: ${data.comment}`);

    try {
      await db.collection("comments").add({
        tiktok_name: data.uniqueId,
        comment: data.comment,
        timestamp: new Date().toISOString(),
      });
      console.log("✅ Saved comment to Firestore");
    } catch (err) {
      console.error("❌ Firestore error:", err);
    }
  });

  connections[username] = tiktokLiveConnection;
  res.send(`🚀 Started listening to @${username}`);
});

// Render PORT
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
