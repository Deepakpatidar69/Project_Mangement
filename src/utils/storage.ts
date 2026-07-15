import AsyncStorage from "@react-native-async-storage/async-storage";
import { TOKEN_KEY } from "./Constent";

export const setToken = async (token: string) => {
  await AsyncStorage.setItem(TOKEN_KEY, JSON.stringify(token));
};

export const getToken = async () => {
  const token = await AsyncStorage.getItem(TOKEN_KEY);

  console.log("token in getToken : ", token);

  let parseToken = token ? JSON.parse(token) : "";

  return parseToken;
};

export const removeToken = async () => {
  await AsyncStorage.removeItem(TOKEN_KEY);
};
