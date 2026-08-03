import AsyncStorage from "@react-native-async-storage/async-storage";
import { TOKEN_KEY } from "./Constent";
import { AppDispatch } from "../store";
import { resetAuthState } from "../store/slices/authSlice";
import { resetComments } from "../store/slices/CommentSlice";
import { resetMembers } from "../store/slices/MemberSlice";
import { resetMessageState } from "../store/slices/MessageSlice";
import { resetProjectState } from "../store/slices/ProjectSlice";
import { resetTaskState } from "../store/slices/TaskSlice";
import { resetDashboardState } from "../store/slices/DashboardSlice";

export const setToken = async (token: string) => {
  await AsyncStorage.setItem(TOKEN_KEY, JSON.stringify(token));
};

export const getToken = async () => {
  const token = await AsyncStorage.getItem(TOKEN_KEY);

  let parseToken = token ? JSON.parse(token) : "";

  return parseToken;
};

export const removeToken = async () => {
  await AsyncStorage.removeItem(TOKEN_KEY);
};

export const clearAllStates = async (dispatch: AppDispatch) => {
  dispatch(resetAuthState());
  dispatch(resetComments());
  dispatch(resetMembers());
  dispatch(resetMessageState());
  dispatch(resetProjectState());
  dispatch(resetTaskState());
  dispatch(resetDashboardState());
};