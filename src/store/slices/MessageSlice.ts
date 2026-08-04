import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { apiClient } from "../../api/client";
import { API_ENDPOINTS } from "../../api/endpoint";
import { MessageProps } from "./types";
import { formatMessageResponse, formatSingleMessage } from "../TypeFormatter";

type Conversation = {
  userId: string;
  messages: MessageProps[];
};

type MessageState = {
  directConversations: Conversation[];
  projectMessages: MessageProps[];
  taskMessages: MessageProps[];

  totalDirectCount: number;
  totalProjectMessageCount: number; // PROJECT-scoped count
  totalTaskMessageCount: number; // TASK-scoped count

  loading: boolean;

  // ✅ split by scope
  error: string | null; // PROJECT-scoped error
  taskError: string | null; // TASK-scoped error
};

/* =========================
   🔹 INITIAL STATE
========================= */

const initialState: MessageState = {
  directConversations: [],
  projectMessages: [],
  taskMessages: [],

  totalDirectCount: 0,
  totalProjectMessageCount: 0,
  totalTaskMessageCount: 0,

  loading: false,

  error: null,
  taskError: null,
};

/* =========================
   🔹 THUNKS
========================= */

// ✅ SEND MESSAGE
export const sendMessage = createAsyncThunk(
  "messages/send",
  async (
    payload: {
      message: string;
      receiverId?: string;
      projectId?: string;
      taskId?: string;
    },
    thunkAPI,
  ) => {
    try {
   
      const res = await apiClient.post(API_ENDPOINTS.SEND_MESSAGE, payload);

      return res.data.newMessage;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        err?.response?.data?.message || "Failed to send message",
      );
    }
  },
);

// ✅ FETCH DIRECT MESSAGES
export const fetchPrivateMessage = createAsyncThunk(
  "messages/fetchDirect",
  async ({ limit, skip }: { limit?: number; skip?: number }, thunkAPI) => {
    try {
      const res = await apiClient.get(
        API_ENDPOINTS.FETCH_PRIVATE_MESSAGES(limit, skip),
      );
      return res.data; // 🔥 must include { conversations, totalCount }
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        err?.response?.data?.message || "Failed to fetch direct messages",
      );
    }
  },
);

// ✅ FETCH PROJECT MESSAGES
export const fetchProjectMessages = createAsyncThunk(
  "messages/fetchProject",
  async (
    {
      projectId,
      limit,
      skip,
    }: {
      projectId: string;
      limit?: number;
      skip?: number;
    },
    thunkAPI,
  ) => {
    try {
      const res = await apiClient.get(
        API_ENDPOINTS.FETCH_PROJECT_MESSAGE(projectId, limit, skip),
      );

      return res.data; // 🔥 { messages, totalCount }
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        err?.response?.data?.message || "Failed to fetch project messages",
      );
    }
  },
);

// ✅ FETCH TASK MESSAGES
export const fetchTaskMessages = createAsyncThunk(
  "messages/fetchTask",
  async (
    {
      taskId,
      limit,
      skip,
    }: {
      taskId: string;
      limit?: number;
      skip?: number;
    },
    thunkAPI,
  ) => {
    try {
      const res = await apiClient.get(
        API_ENDPOINTS.FETCH_TASK_MESSAGE(taskId, limit, skip),
      );
      return res.data; // 🔥 { messages, totalCount }
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        err?.response?.data?.message || "Failed to fetch task messages",
      );
    }
  },
);

// ✅ UPDATE MESSAGES (Updated to include isTask)
export const updateMessage = createAsyncThunk(
  "messages/update",
  async (
    {
      messageId,
      message,
      isTask,
    }: { messageId: string; message: string; isTask?: boolean },
    thunkAPI,
  ) => {
    try {
      const res = await apiClient.patch(
        API_ENDPOINTS.UPDATE_MESSAGE(messageId),
        { message },
      );
      return res.data;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        err?.response?.data?.message || "Failed to update message",
      );
    }
  },
);

// ✅ DELETE MESSAGE (Updated to accept an object so we can pass isTask)
export const deleteMessage = createAsyncThunk(
  "messages/delete",
  async (
    { messageId, isTask }: { messageId: string; isTask?: boolean },
    thunkAPI,
  ) => {
    try {
      const res = await apiClient.delete(
        API_ENDPOINTS.DELETE_MESSAGE(messageId),
      );

      return res.data;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        err?.response?.data?.message || "Failed to delete message",
      );
    }
  },
);

/* =========================
   🔹 SLICE
========================= */

const messageSlice = createSlice({
  name: "messages",
  initialState,
  reducers: {
    resetMessageState: (state) => {
      state.error = initialState.error;
      state.taskError = initialState.taskError;
      state.loading = initialState.loading;
      state.projectMessages = initialState.projectMessages;
      state.taskMessages = initialState.taskMessages;
      state.totalProjectMessageCount = initialState.totalProjectMessageCount;
      state.totalTaskMessageCount = initialState.totalTaskMessageCount;
    },

    clearMessageError: (state) => {
      state.error = initialState.error;
      state.taskError = initialState.taskError;
    },

    clearTaskMessages : (state) => {
      state.taskMessages = initialState.taskMessages;
      state.totalTaskMessageCount = initialState.totalTaskMessageCount;
    },

    clearProjectMessages : (state) => {
      state.projectMessages = initialState.projectMessages;
      state.totalProjectMessageCount = initialState.totalProjectMessageCount;
    },
  },
  extraReducers: (builder) => {
    /* ================= SEND MESSAGE ================= */
    builder
      .addCase(sendMessage.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.taskError = null;
      })
      .addCase(sendMessage.fulfilled, (state, action: any) => {
        state.loading = false;

        const msg = formatSingleMessage(action.payload);


        if (!msg) return;

        // 🔥 PROJECT
        if (msg.project?.projectId) {
          state.projectMessages.push(msg);
          state.totalProjectMessageCount += 1;
        }

        // 🔥 TASK
        if (msg.task?.taskId) {
          state.taskMessages.push(msg);
          state.totalTaskMessageCount += 1;
        }

        // 🔥 DIRECT
        if (msg.messageReceiver || msg.messageSender.userId) {
          const otherUser =
            msg.messageReceiver.userId || msg.messageSender.userId;

          let conv = state.directConversations.find(
            (c) => c.userId === otherUser,
          );

          if (!conv) {
            conv = { userId: otherUser, messages: [] };
            state.directConversations.push(conv);
          }

          conv.messages.push(msg);
          state.totalDirectCount += 1;
        }
      })
      .addCase(sendMessage.rejected, (state, action: any) => {
        state.loading = false;
        if (action.meta.arg?.taskId) {
          state.taskError = action.payload;
        } else {
          state.error = action.payload;
        }
      })

      /* ================= FETCH MESSAGES FOR PRIVATE  ================= */
      .addCase(fetchPrivateMessage.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPrivateMessage.fulfilled, (state, action: any) => {
        state.loading = false;

        const { conversations, totalMessageCount } = action.payload;

        if (action.meta.arg?.skip > 0) {
          state.directConversations = [
            ...state.directConversations,
            ...conversations,
          ];
        } else {
          state.directConversations = conversations;
        }

        state.totalDirectCount = totalMessageCount;
      })
      .addCase(fetchPrivateMessage.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* ================= FETCH MESSAGES FOR PROJECTS  ================= */
      .addCase(fetchProjectMessages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProjectMessages.fulfilled, (state, action: any) => {
        state.loading = false;
        state.error = null;
        const { messages, totalProjectMessageCount } = action.payload;

        if (action.meta.arg?.skip > 0) {
          state.projectMessages = [
            ...state.projectMessages,
            ...formatMessageResponse(messages),
          ];
        } else {
          state.projectMessages = formatMessageResponse(messages);
        }

        state.totalProjectMessageCount = totalProjectMessageCount;
      })
      .addCase(fetchProjectMessages.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* ================= FETCH MESSAGES FOR TASKS ================= */
      .addCase(fetchTaskMessages.pending, (state) => {
        state.loading = true;
        state.taskError = null;
      })
      .addCase(fetchTaskMessages.fulfilled, (state, action: any) => {
        state.loading = false;
        state.taskError = null;

        const { messages, totalTaskMessageCount } = action.payload;

        if (action.meta.arg?.skip > 0) {
          state.taskMessages = [
            ...state.taskMessages,
            ...formatMessageResponse(messages),
          ];
        } else {
          state.taskMessages = formatMessageResponse(messages);
        }

        state.totalTaskMessageCount = totalTaskMessageCount;
      })
      .addCase(fetchTaskMessages.rejected, (state, action: any) => {
        state.loading = false;
        state.taskError = action.payload;
      })

      /* ================= UPDATE MESSAGES ================= */
      .addCase(updateMessage.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.taskError = null;
      })
      .addCase(updateMessage.fulfilled, (state, action: any) => {
        state.loading = false;

        const updated = formatSingleMessage(action.payload.updatedMessage);
        if (!updated) return;

        const update = (list: any[]) =>
          list.map((m) =>
            m.messageId === updated.messageId ? { ...m, ...updated } : m,
          );

        state.projectMessages = update(state.projectMessages);
        state.taskMessages = update(state.taskMessages);

        state.directConversations.forEach((conv) => {
          conv.messages = conv.messages.map((m) =>
            m.messageId === updated.messageId ? { ...m, ...updated } : m,
          );
        });
      })
      .addCase(updateMessage.rejected, (state, action: any) => {
        state.loading = false;
        // ✅ FIX: Route error based on origin
        if (action.meta.arg?.isTask) {
          state.taskError = action.payload;
        } else {
          state.error = action.payload;
        }
      })

      /* ================= DELETE MESSAGE ================= */
      .addCase(deleteMessage.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.taskError = null;
      })
      .addCase(deleteMessage.fulfilled, (state, action: any) => {
        state.loading = false;

        const deleted = action.payload.deletedMessage;
        if (!deleted) return;

        const id = deleted.messageId;

        const inProject = state.projectMessages.some((m) => m.messageId === id);
        const inTask = state.taskMessages.some((m) => m.messageId === id);

        state.projectMessages = state.projectMessages.filter(
          (m) => m.messageId !== id,
        );
        state.taskMessages = state.taskMessages.filter(
          (m) => m.messageId !== id,
        );

        if (inProject) {
          state.totalProjectMessageCount = Math.max(0, state.totalProjectMessageCount - 1);
        } else if (inTask) {
          state.totalTaskMessageCount = Math.max(0, state.totalTaskMessageCount - 1);
        }
      })
      .addCase(deleteMessage.rejected, (state, action: any) => {
        state.loading = false;
        // ✅ FIX: Route error based on origin
        if (action.meta.arg?.isTask) {
          state.taskError = action.payload;
        } else {
          state.error = action.payload;
        }
      });
  },
});

export const { resetMessageState, clearMessageError, clearProjectMessages, clearTaskMessages } = messageSlice.actions;
export default messageSlice.reducer;
