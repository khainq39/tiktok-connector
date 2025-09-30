import axios from "axios";

const BASE = "https://partner.viettelpost.vn/v2";

let currentToken = null;
let lastLogin = null;
let account = null;

export const setAccount = (username, password) => {
  account = { username, password };
};

export const getToken = async () => {
  // token còn hạn 55 phút
  if (currentToken && lastLogin && Date.now() - lastLogin < 55 * 60 * 1000) {
    return currentToken;
  }
  if (!account) throw new Error("No Viettel account set");

  const res = await axios.post(`${BASE}/user/Login`, {
    USERNAME: account.username,
    PASSWORD: account.password,
  });

  if (res.data?.status === 200) {
    currentToken = res.data.data.token;
    lastLogin = Date.now();
    return currentToken;
  }
  throw new Error("Viettel login failed: " + res.data?.message);
};

// wrapper axios gọi API
const callApi = async (path, method = "GET", data = {}) => {
  const token = await getToken();
  const url = `${BASE}${path}`;
  return axios({
    url,
    method,
    headers: { Token: token },
    data,
  });
};

export const login = async (username, password) => {
  setAccount(username, password);
  return await getToken(); // login ngay lần đầu
};

export const getPricing = (payload) =>
  callApi("/order/getPrice", "POST", payload);

export const createOrder = (payload) =>
  callApi("/order/create", "POST", payload);

export const updateOrder = (orderNumber, type, note) =>
  callApi("/order/updateOrder", "POST", {
    ORDER_NUMBER: orderNumber,
    TYPE: type,
    NOTE: note,
  });

export const trackOrder = (orderNumber) =>
  callApi(`/order/getOrder?ORDER_NUMBER=${orderNumber}`, "GET");

export const printOrder = (orderNumber) =>
  callApi(`/order/print?ORDER_NUMBER=${orderNumber}`, "GET");
