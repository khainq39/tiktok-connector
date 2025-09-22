import express from "express";
import cors from "cors";
import { WebcastPushConnection } from "tiktok-live-connector";
import admin from "firebase-admin";
import serviceAccount from "./serviceAccountKey.json" assert { type: "json" };

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();

const app = express();
app.use(cors());
app.use(express.json());

let connections = {};

app.post("/start", async (req, res) => {
  const { username, uid } = req.body;
  if (!username || !uid) return res.status(400).send("❌ Missing username or uid");

  if (connections[username]) {
    return res.send(`⚡ Already connected to @${username}`);
  }

  const conn = new WebcastPushConnection(username);

  conn.connect()
    .then(state => console.log(`✅ Connected to @${username}, roomId=${state.roomId}`))
    .catch(err => console.error("❌ Connect error:", err));

  conn.on("chat", async (data) => {
    console.log(`💬 ${data.uniqueId}: ${data.comment}`);
    try {
      await db.collection("comments").add({
        tiktok_name: data.uniqueId,
        comment: data.comment,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        session_id: `live_${username}_${new Date().toISOString().split("T")[0]}`,
        created_by: userUid
      });
      console.log("✅ Saved to Firestore");
    } catch (err) {
      console.error("❌ Firestore error:", err);
    }
  });

  connections[username] = conn;
  res.send(`🚀 Started listening to @${username}`);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
