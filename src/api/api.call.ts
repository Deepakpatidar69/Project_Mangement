import { apiClient } from "./client";
import { API_ENDPOINTS } from "./endpoint";

export const fetchSearchResult = async (userData: string, limit?: number) => {
  try {
    const data = await apiClient.get(
      API_ENDPOINTS.SEARCH_USER(userData, limit),
    );

    return data.data;
  } catch (err) {
    console.log(`Err At :: api.call.ts :: fetchSearchResult :: ${err}`);
    return null;
  }
};
