// store/slices/dashboardSlice.ts

import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { apiClient } from "../../api/client";
import { API_ENDPOINTS } from "../../api/endpoint";
import { ProjectProps, TaskProps } from "./types";

// 🔹 State type
type DashboardState = {
  totalProjects: number;
  totalTasks: number;
  latestProjects: ProjectProps[];
  latestTasks: TaskProps[];

  loading: {
    projects: boolean;
    tasks: boolean;
  };
  error: {
    projectError: string | null;
    tasksError: string | null;
  };
};

// 🔥 Async thunk
export const fetchDashboardDataForProject = createAsyncThunk(
  "dashboard/fetchDashboardData",
  async ({ limit }: { limit: number }, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(
        API_ENDPOINTS.GET_RECENT_PROJECT(limit),
      );
      return response.data.data; // { totalProjects, latestProjects }
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || "Something went wrong",
      );
    }
  },
);

export const fetchDashboardDataForTasks = createAsyncThunk(
  "dashboard/fetchDashboardTasks",
  async ({ limit }: { limit: number }, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(
        API_ENDPOINTS.GET_RECENT_TASKS(limit),
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || "Something went wrong",
      );
    }
  },
);

// 🔹 Initial state
const initialState: DashboardState = {
  totalProjects: 0,
  totalTasks: 0,
  latestTasks: [],
  latestProjects: [],
  loading: {
    projects: false,
    tasks: false,
  },
  error: {
    projectError: null,
    tasksError: null,
  },
};

// 🔥 Slice
const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {
    resetDashboardState: () => initialState, // Cleaner way to reset

    // =========================
    // 🔥 PROJECT SYNC ACTIONS
    // =========================

    // CREATE: Adds to the top of the recent list
    addRecentProject: (state, action: PayloadAction<ProjectProps>) => {
      state.latestProjects.unshift(action.payload);
      state.totalProjects += 1;
    },

    // UPDATE: Updates status (like completing it) if it exists in recent list
    updateRecentProject: (
      state,
      action: PayloadAction<{
        projectId: string;
        changes: Partial<ProjectProps>;
      }>,
    ) => {
      const index = state.latestProjects.findIndex(
        (p) => p.projectId === action.payload.projectId,
      );
      if (index !== -1) {
        state.latestProjects[index] = {
          ...state.latestProjects[index],
          ...action.payload.changes,
        };
      }
    },

    // DELETE: Removes from recent list if it exists
    removeRecentProject: (state, action: PayloadAction<string>) => {
      state.latestProjects = state.latestProjects.filter(
        (p) => p.projectId !== action.payload,
      );
      // Only decrement if we actually want total count to reflect here,
      // though user stats usually handle global counts.
    },

    // =========================
    // 🔥 TASK SYNC ACTIONS
    // =========================

    // CREATE: Adds to the top of the recent list
    addRecentTask: (state, action: PayloadAction<TaskProps>) => {
      state.latestTasks.unshift(action.payload);
      state.totalTasks += 1;
    },

    // UPDATE: Updates status (like completing it) if it exists in recent list
    updateRecentTask: (
      state,
      action: PayloadAction<{ taskId: string; changes: Partial<TaskProps> }>,
    ) => {
      const index = state.latestTasks.findIndex(
        (t) => t.taskId === action.payload.taskId,
      );
      if (index !== -1) {
        state.latestTasks[index] = {
          ...state.latestTasks[index],
          ...action.payload.changes,
        };
      }
    },

    // DELETE: Removes from recent list if it exists
    removeRecentTask: (state, action: PayloadAction<string>) => {
      state.latestTasks = state.latestTasks.filter(
        (t) => t.taskId !== action.payload,
      );
    },
  },

  extraReducers: (builder) => {
    builder
      // =========================
      // 🔥 PROJECT CASES
      // =========================
      .addCase(fetchDashboardDataForProject.pending, (state) => {
        state.loading.projects = true;
        state.error.projectError = null;
      })
      .addCase(fetchDashboardDataForProject.fulfilled, (state, action) => {
        state.loading.projects = false;
        state.totalProjects = action.payload?.totalProjects || 0;
        state.latestProjects = action.payload?.latestProjects || [];
      })
      .addCase(fetchDashboardDataForProject.rejected, (state, action) => {
        state.loading.projects = false;
        state.error.projectError = action.payload as string;
      })

      // =========================
      // 🔥 TASK CASES
      // =========================
      .addCase(fetchDashboardDataForTasks.pending, (state) => {
        state.loading.tasks = true;
        state.error.tasksError = null;
      })
      .addCase(fetchDashboardDataForTasks.fulfilled, (state, action) => {
        state.loading.tasks = false;
        state.latestTasks = action.payload.latestTasks || action.payload || [];
        state.totalTasks = action.payload?.totalTasks || 0;
      })
      .addCase(fetchDashboardDataForTasks.rejected, (state, action) => {
        state.loading.tasks = false;
        state.error.tasksError = action.payload as string;
      });
  },
});

export const {
  resetDashboardState,
  addRecentProject,
  updateRecentProject,
  removeRecentProject,
  addRecentTask,
  updateRecentTask,
  removeRecentTask,
} = dashboardSlice.actions;

export default dashboardSlice.reducer;
