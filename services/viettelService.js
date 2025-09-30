
import axios from "axios";

const BASE_URL = "https://partner.viettelpost.vn/v2";

// Hàm call chung
async function apiCall(endpoint, body, token) {
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };

  const { data } = await axios.post(`${BASE_URL}${endpoint}`, body, { headers });
  return data;
}

export const viettelService = {
  login: (username, password) =>
    apiCall("/user/Login", { USERNAME: username, PASSWORD: password }),

  getPrice: (payload, token) => apiCall("/order/getPrice", payload, token),

  createOrder: (payload, token) => apiCall("/order/createOrder", payload, token),

  updateOrder: (payload, token) => apiCall("/order/UpdateOrder", payload, token),

  trackOrder: (payload, token) => apiCall("/order/getOrderInfo", payload, token),

  printOrder: (payload, token) => apiCall("/order/print", payload, token)
};
