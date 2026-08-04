import axios from "axios";
import { getToken, removeToken } from "../utils/storage";
import {  API_RESOLVE_TIME_LIMIT } from "../utils/Constent";
import { API_BASE_URL } from "@env";


export const apiClient = axios.create({
  baseURL: API_BASE_URL, // TODO :: get From env file
  timeout: API_RESOLVE_TIME_LIMIT,
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
      console.log("🔴 Network Error", error);
    }

    return Promise.reject(error);
  },
);
