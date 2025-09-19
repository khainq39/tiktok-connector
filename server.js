import express from "express";
import cors from "cors";
import { WebcastPushConnection } from "tiktok-live-connector";

const app = express();
app.use(cors());
app.use(express.json());

let connections = {}; // lưu các kết nối đang chạy

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

  let tiktokLiveConnection = new WebcastPushConnection(username);

  // Thử connect
  tiktokLiveConnection.connect()
    .then(state => {
      console.log(`✅ Connected to @${username}, roomId=${state.roomId}`);
    })
    .catch(err => {
      console.error("❌ Connect error:", err);
    });

  // Khi có chat
  tiktokLiveConnection.on("chat", (data) => {
    console.log(`💬 ${data.uniqueId}: ${data.comment}`);
    // TODO: Bạn có thể push vào Firebase Firestore ở đây
  });

  connections[username] = tiktokLiveConnection;
  res.send(`🚀 Started listening to @${username}`);
});

// PORT Render cấp qua env
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
