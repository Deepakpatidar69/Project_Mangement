// store/slices/dashboardSlice.ts

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { apiClient } from "../../api/client";
import { API_ENDPOINTS } from "../../api/endpoint";
import { ProjectProps, TaskProps } from "./types";


// 🔹 State type
type DashboardState = {
  totalProjects: number;
  totalTasks: number;
  latestProjects: ProjectProps[];

  latestTasks: TaskProps[]

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
      // 👆 update endpoint if different

      return response.data.data; // { totalProjects, latestProjects }
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

export const fetchDashboardDataForTasks = createAsyncThunk(
  "dashboard/fetchDashboardTasks",
  async ({ limit }: { limit: number }, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(
        API_ENDPOINTS.GET_RECENT_TASKS(limit),
      );
      // 👆 your recent tasks API

      console.log(`response in dashboard data is ${response}`);

      return response.data;
      // { totalTasks, tasks } OR { tasks } depending on your API
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || "Something went wrong",
      );
    }
  },
);

// 🔥 Slice
const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {},

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
        console.log(
          `DashBoard Task Fetching data is : ${JSON.stringify(action.payload)}`,
        );

        state.loading.projects = false;
        state.totalProjects = action.payload?.totalProjects;
        state.latestProjects = action.payload?.latestProjects;
      })

      .addCase(fetchDashboardDataForProject.rejected, (state, action) => {
        state.loading.projects = false;
        state.error.projectError = action.payload as string;
      })

      // =========================
      // 🔥 TASK CASES (NEW)
      // =========================
      .addCase(fetchDashboardDataForTasks.pending, (state) => {
        state.loading.tasks = true;
        state.error.tasksError = null;
      })

      .addCase(fetchDashboardDataForTasks.fulfilled, (state, action) => {
        state.loading.tasks = false;

        console.log(
          `DashBoard Task Fetching data is : ${JSON.stringify(action.payload)}`,
        );

        // 🔹 adjust based on API response
        state.latestTasks = action.payload.latestTasks || action.payload;

        // optional (if you add count in backend later)

        state.totalTasks = action.payload?.totalTasks || 0;
      })

      .addCase(fetchDashboardDataForTasks.rejected, (state, action) => {
        state.loading.tasks = false;
        state.error.tasksError = action.payload as string;
      });
  },
});

export default dashboardSlice.reducer;
