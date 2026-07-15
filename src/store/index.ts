import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import projectReducer from "./slices/ProjectSlice";
import taskReducer from "./slices/TaskSlice";
import memberReducer from "./slices/MemberSlice";
import messageReducer from "./slices/MessageSlice";
import commentReducer from "./slices/CommentSlice";
import dashboardReducer from "./slices/DashboardSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    project: projectReducer,
    task: taskReducer,
    member: memberReducer,
    message: messageReducer,
    comment: commentReducer,
    dashboard : dashboardReducer
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
