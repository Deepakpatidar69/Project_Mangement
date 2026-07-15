import axios from "axios";
import { getToken, removeToken } from "../utils/storage";
import { BASE_URL } from "../utils/Constent";

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

// 🔥 REQUEST INTERCEPTOR
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await getToken();

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    } catch (error) {
      return Promise.reject(error);
    }
  },
  (error) => Promise.reject(error),
);

// 🔥 RESPONSE INTERCEPTOR
apiClient.interceptors.response.use(
  (response) => response,

  async (error) => {
    
    // 🔴 Unauthorized (token expired / invalid)
    if (error?.response?.status === 401) {
      await removeToken();

      console.log("🔴 Session expired. Please login again.");
      // 👉 You can also trigger navigation to login here later
    }
    
    // 🔴 Network / Server error
    if (!error.response) {
      console.log("🔴 Network Error");
    }

    return Promise.reject(error);
  },
);
