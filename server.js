import express from "express";
import cors from "cors";
import { WebcastPushConnection } from "tiktok-live-connector";
// import { initializeApp } from "firebase-admin/app";  // khi nào có service account thì bật lại
// import { getFirestore } from "firebase-admin/firestore";

const app = express();
app.use(cors());
app.use(express.json());

// initializeApp();   // tạm tắt Firebase nếu chưa có credentials
// const db = getFirestore();

let connections = {};

app.get("/", (req, res) => {
  res.send("✅ TikTok Connector is running");
});

app.post("/start", async (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).send("❌ Missing username");

  if (connections[username]) {
    return res.send(`⚡ Already connected to @${username}`);
  }

  const conn = new WebcastPushConnection(username);

  conn.connect()
    .then(state => console.log(`✅ Connected to @${username}, roomId=${state.roomId}`))
    .catch(err => console.error("❌ Connect error:", err));

  conn.on("chat", (data) => {
    console.log(`💬 ${data.uniqueId}: ${data.comment}`);
    // TODO: khi có Firebase thì thêm db.collection("comments").add(...)
  });

  connections[username] = conn;
  res.send(`🚀 Started listening to @${username}`);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
import express from "express";
import cors from "cors";
import { WebcastPushConnection } from "tiktok-live-connector";
// import { initializeApp } from "firebase-admin/app";  // khi nào có service account thì bật lại
// import { getFirestore } from "firebase-admin/firestore";

const app = express();
app.use(cors());
app.use(express.json());

// initializeApp();   // tạm tắt Firebase nếu chưa có credentials
// const db = getFirestore();

let connections = {};

app.get("/", (req, res) => {
  res.send("✅ TikTok Connector is running");
});

app.post("/start", async (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).send("❌ Missing username");

  if (connections[username]) {
    return res.send(`⚡ Already connected to @${username}`);
  }

  const conn = new WebcastPushConnection(username);

  conn.connect()
    .then(state => console.log(`✅ Connected to @${username}, roomId=${state.roomId}`))
    .catch(err => console.error("❌ Connect error:", err));

  conn.on("chat", (data) => {
    console.log(`💬 ${data.uniqueId}: ${data.comment}`);
    // TODO: khi có Firebase thì thêm db.collection("comments").add(...)
  });

  connections[username] = conn;
  res.send(`🚀 Started listening to @${username}`);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
