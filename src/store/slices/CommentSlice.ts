import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { apiClient } from "../../api/client";
import { API_ENDPOINTS } from "../../api/endpoint";

/* ================= TYPES ================= */

type Comment = {
  commentId: string;
  comment: string;
  commentCreatorId: string;
  commentedTaskId: string;
  createdAt: string;
  commentCreator?: {
    userId: string;
    name: string;
  };
};

type CommentState = {
  comments: Comment[];

  loading: boolean;

  error: string | null;

  success: boolean;
};

const initialState: CommentState = {
  comments: [],

  loading: false,

  error: null,

  success: false,
};

/* ================= THUNKS ================= */

// ✅ ADD COMMENT
export const addComment = createAsyncThunk(
  "comment/add",
  async (data: { taskId: string; comment: string }, thunkAPI) => {
    try {
      const res = await apiClient.post(API_ENDPOINTS.ADD_COMMENT(data.taskId), {
        comment: data.comment,
      });
      return res.data.comment;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        err?.response?.data?.message || "Add comment failed",
      );
    }
  },
);

// ✅ FETCH TASK COMMENTS
export const fetchTaskComments = createAsyncThunk(
  "comment/fetchTask",
  async (taskId: string, thunkAPI) => {
    try {
      const res = await apiClient.post(
        API_ENDPOINTS.FETCH_TASK_COMMENT(taskId),
      );
      return res.data.comments;
    } catch (err: any) {
      return thunkAPI.rejectWithValue("Fetch comments failed");
    }
  },
);

// ✅ FETCH SINGLE COMMENT
export const fetchCommentById = createAsyncThunk(
  "comment/fetchOne",
  async (commentId: string, thunkAPI) => {
    try {
      const res = await apiClient.post(API_ENDPOINTS.FETCH_COMMENT(commentId));
      return res.data.comment;
    } catch (err: any) {
      return thunkAPI.rejectWithValue("Fetch comment failed");
    }
  },
);

// ✅ FETCH USER COMMENTS
export const fetchUserComments = createAsyncThunk(
  "comment/fetchUser",
  async (_, thunkAPI) => {
    try {
      const res = await apiClient.post(API_ENDPOINTS.FETCH_USER_COMMENT);
      return res.data.comments;
    } catch (err: any) {
      return thunkAPI.rejectWithValue("Fetch user comments failed");
    }
  },
);

// ✅ DELETE COMMENT
export const deleteComment = createAsyncThunk(
  "comment/delete",
  async (data: { commentId: string; taskId: string }, thunkAPI) => {
    try {
      await apiClient.post(API_ENDPOINTS.DELETE_COMMENT, data);
      return data.commentId;
    } catch (err: any) {
      return thunkAPI.rejectWithValue("Delete failed");
    }
  },
);

/* ================= SLICE ================= */

const commentSlice = createSlice({
  name: "comment",
  initialState,
  reducers: {
    resetComments: () => initialState,

    clearCommentStatus: (state) => {
      state.error = null;
      state.success = false;
    },

    clearCommentError: (state) => {
      state.error = initialState.error;
    },
  },

  extraReducers: (builder) => {
    builder

      /* ===== FETCH TASK COMMENTS ===== */
      .addCase(fetchTaskComments.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(fetchTaskComments.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;

        state.comments = action.payload;
      })
      .addCase(fetchTaskComments.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      })

      /* ===== ADD ===== */
      .addCase(addComment.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(addComment.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;

        // newest first UI
        state.comments.unshift(action.payload);
      })
      .addCase(addComment.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      })

      /* ===== DELETE ===== */
      .addCase(deleteComment.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(deleteComment.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;

        state.comments = state.comments.filter(
          (c) => c.commentId !== action.payload,
        );
      })
      .addCase(deleteComment.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      });
  },
});

export const { resetComments, clearCommentStatus, clearCommentError } = commentSlice.actions;
export default commentSlice.reducer;
