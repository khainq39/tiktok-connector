
import admin from "firebase-admin";
import { viettelService } from "../services/viettelService.js";

const db = admin.firestore();

// Lấy account từ Firestore
async function getAccount() {
  const doc = await db.collection("shipping_accounts").doc("viettel_post").get();
  return doc.exists ? doc.data() : null;
}

// Lưu account (token + info)
async function saveAccount(account) {
  await db.collection("shipping_accounts").doc("viettel_post").set(account, { merge: true });
}

export const shippingController = {
  login: async (req, res) => {
    try {
      const { username, password } = req.body;
      const data = await viettelService.login(username, password);

      if (data.status !== 200) {
        return res.status(400).json(data);
      }

      await saveAccount({
        username,
        password,
        token: data.data.token,
        partner: data.data.partner,
        expired_at: Date.now() + 3600 * 1000
      });

      res.json({ message: "✅ Login success", token: data.data.token });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  getPrice: async (req, res) => {
    try {
      const account = await getAccount();
      if (!account?.token) return res.status(401).json({ error: "Not logged in" });

      const data = await viettelService.getPrice(req.body, account.token);
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  createOrder: async (req, res) => {
    try {
      const account = await getAccount();
      if (!account?.token) return res.status(401).json({ error: "Not logged in" });

      const data = await viettelService.createOrder(req.body, account.token);

      if (data.status === 200) {
        await db.collection("shipments").add({
          ...data.data,
          created_at: admin.firestore.FieldValue.serverTimestamp()
        });
      }

      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  updateOrder: async (req, res) => {
    try {
      const account = await getAccount();
      if (!account?.token) return res.status(401).json({ error: "Not logged in" });

      const data = await viettelService.updateOrder(req.body, account.token);
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  trackOrder: async (req, res) => {
    try {
      const account = await getAccount();
      if (!account?.token) return res.status(401).json({ error: "Not logged in" });

      const data = await viettelService.trackOrder({ ORDER_NUMBER: req.params.order_number }, account.token);
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  printOrder: async (req, res) => {
    try {
      const account = await getAccount();
      if (!account?.token) return res.status(401).json({ error: "Not logged in" });

      const data = await viettelService.printOrder({ ORDER_NUMBER: req.params.order_number }, account.token);
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};
