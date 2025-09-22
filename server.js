import express from "express";
import cors from "cors";
import { WebcastPushConnection } from "tiktok-live-connector";
import admin from "firebase-admin";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const serviceAccount = require("./serviceAccount.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const app = express();
app.use(cors());
app.use(express.json());

let connections = {};

app.post("/start", async (req, res) => {
  const { username, uid } = req.body; // nhận thêm uid từ client
  if (!username || !uid) {
    return res.status(400).send("❌ Missing username or uid");
  }

  if (connections[username]) {
    return res.send(`⚡ Already connected to @${username}`);
  }

  const conn = new WebcastPushConnection(username);

  conn.connect()
    .then((state) =>
      console.log(`✅ Connected to @${username}, roomId=${state.roomId}`)
    )
    .catch((err) => console.error("❌ Connect error:", err));

  conn.on("chat", async (data) => {
    console.log(`💬 ${data.uniqueId}: ${data.comment}`);

    const sessionId = `live_${username}_${new Date()
      .toISOString()
      .split("T")[0]}`;

    const payload = {
      comment: data.comment,
      tiktok_name: data.uniqueId,
      timestamp: new Date(),
      session_id: sessionId,
      created_by: uid,
    };

    try {
      await db.collection("comments").add(payload);
      console.log("✅ Firestore ghi thành công:", payload);
    } catch (err) {
      console.error("❌ Firestore ghi thất bại:", err);
    }
  });

  connections[username] = conn;
  res.send(`🚀 Started listening to @${username}`);
});

// endpoint test Firestore
app.get("/test-firestore", async (req, res) => {
  try {
    const ref = await db.collection("comments").add({
      comment: "test from server",
      tiktok_name: "system",
      timestamp: new Date(),
      session_id: "test_session",
      created_by: "test_uid",
    });
    res.send(`✅ Firestore ghi OK: ${ref.id}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("❌ Firestore ghi lỗi");
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
