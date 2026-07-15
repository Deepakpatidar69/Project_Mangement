import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { apiClient } from "../../api/client";
import { API_ENDPOINTS, fetchStatusType } from "../../api/endpoint";
import { PriorityLevel, ProjectProps } from "./types";
import {
  formatDashBoardProjectResponse,
  formatProjectResponse,
  formatSingleProject,
} from "../TypeFormatter";

interface ProjectStateProps {
  assignProjects: { projects: ProjectProps[]; totalCount: number };
  createdProjects: { projects: ProjectProps[]; totalCount: number };
  singleProject: ProjectProps | null;

  loading: boolean;

  error: string | null;

  success: boolean;

  dashboard: {
    totalProjects: number;
    latestProjects: ProjectProps[];
    projectLoading: boolean;
    projectError: string | null;
  };
}

const initialState: ProjectStateProps = {
  assignProjects: { projects: [], totalCount: 0 },
  createdProjects: { projects: [], totalCount: 0 },
  singleProject: null,

  loading: false,

  success: false,

  error: null,

  dashboard: {
    totalProjects: 0,
    latestProjects: [],
    projectLoading: false,
    projectError: null,
  },
};

//
// 🔥 DASHBOARD
//
export const fetchDashboardProjects = createAsyncThunk(
  "project/fetchDashboardProjects",
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiClient.get(API_ENDPOINTS.GET_RECENT_PROJECT(3));
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(
        err?.response?.data?.message || "Failed to fetch projects",
      );
    }
  },
);

//
// 🔥 FETCH
//
export const fetchCreatedProject = createAsyncThunk(
  "project/fetchCreatedProject",
  async (
    {
      fetchType,
      limit,
      skip,
    }: { fetchType?: fetchStatusType; limit?: number; skip?: number },
    { rejectWithValue },
  ) => {
    try {
      console.log(
        `fetchType :: ${fetchType},  limit :: ${limit} , skip :: ${skip}`,
      );

      const res = await apiClient.get(
        API_ENDPOINTS.FETCH_CREATED_PROJECT(
          fetchType == undefined ? "ALL" : fetchType,
          limit,
          skip,
        ),
      );

      console.log(
        `Created Projects is in CreateAsyncThunk :: ${JSON.stringify(res)}`,
      );

      return res.data;
    } catch (err: any) {
      return rejectWithValue(
        err?.response?.data?.message || "Failed to fetch project",
      );
    }
  },
);

export const fetchAssignProjects = createAsyncThunk(
  "member/fetchAssignProject",
  async (
    {
      fetchType,
      limit,
      skip,
    }: { fetchType?: fetchStatusType; limit: number; skip: number },
    thunkAPI,
  ) => {
    try {
      const res = await apiClient.get(
        API_ENDPOINTS.FETCH_ASSIGN_PROJECTS(
          fetchType == undefined ? "ALL" : fetchType,
          limit,
          skip,
        ),
      );

      return res.data;
    } catch (err: any) {
      return thunkAPI.rejectWithValue("Fetch failed");
    }
  },
);

export const fetchProjectById = createAsyncThunk(
  "project/fetchProjectById",
  async (projectId: string, { rejectWithValue }) => {
    try {
      const res = await apiClient.get(API_ENDPOINTS.FETCH_PROJECT(projectId));
      return res.data;
    } catch (err: any) {
      return rejectWithValue(
        err?.response?.data?.message || "Failed to fetch project",
      );
    }
  },
);

//
// 🔥 CREATE
//
export const createProject = createAsyncThunk(
  "project/createProject",
  async (
    data: {
      projectHeader: string;
      projectDesc: string;
      projectDeadline: Date;
      priority: PriorityLevel;
    },
    { rejectWithValue },
  ) => {
    try {
      const res = await apiClient.post(API_ENDPOINTS.CREATE_PROJECT, data);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(
        err?.response?.data?.message || "Failed to create project",
      );
    }
  },
);

//
// 🔥 UPDATE
//
export const updateProject = createAsyncThunk(
  "project/updateProject",
  async (
    data: {
      projectId: string;
      projectHeader: string;
      projectDesc: string;
    },
    { rejectWithValue },
  ) => {
    try {
      const res = await apiClient.patch(API_ENDPOINTS.UPDATE_PROJECT, data);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(
        err?.response?.data?.message || "Failed to update project",
      );
    }
  },
);
//
// 🔥 UPDATE Project Status
//
export const updateProjectStatus = createAsyncThunk(
  "project/updateProjectStatus",
  async (projectId: string, { rejectWithValue }) => {
    try {
      const res = await apiClient.patch(
        API_ENDPOINTS.UPDATE_PROJECT_STATUS(projectId),
      );
      return res.data;
    } catch (err: any) {
      return rejectWithValue(
        err?.response?.data?.message || "Failed to update project",
      );
    }
  },
);
//
// 🔥 UPDATE Project Deadline
//
export const updateProjectDeadline = createAsyncThunk(
  "project/updateProjectDeadline",
  async (
    {
      projectDeadline,
      projectId,
    }: {
      projectId: string;
      projectDeadline: Date;
    },
    { rejectWithValue },
  ) => {
    try {
      const res = await apiClient.patch(
        API_ENDPOINTS.UPDATE_PROJECT_DEADLINE(projectId),
        { projectDeadline: projectDeadline },
      );
      return res.data;
    } catch (err: any) {
      return rejectWithValue(
        err?.response?.data?.message || "Failed to update project",
      );
    }
  },
);
//
// 🔥 UPDATE project Priority
//
export const updateProjectPriority = createAsyncThunk(
  "project/updateProjectPriority",
  async (
    data: {
      projectId: string;
      priority: string;
    },
    { rejectWithValue },
  ) => {
    try {
      const res = await apiClient.patch(
        API_ENDPOINTS.UPDATE_PROJECT_PRIORITY(data.projectId),
        { projectPriority: data.priority },
      );
      return res.data;
    } catch (err: any) {
      return rejectWithValue(
        err?.response?.data?.message || "Failed to update project",
      );
    }
  },
);

//
// 🔥 DELETE
//
export const deleteProject = createAsyncThunk(
  "project/deleteProject",
  async (projectId: string, { rejectWithValue }) => {
    try {
      const res = await apiClient.delete(
        API_ENDPOINTS.DELETE_PROJECT(projectId),
      );
      return res.data;
    } catch (err: any) {
      return rejectWithValue(
        err?.response?.data?.message || "Failed to delete project",
      );
    }
  },
);

//
// 🔥 SLICE
//
const projectSlice = createSlice({
  name: "project",
  initialState,
  reducers: {
    resetProjectState: (state) => {
      state.loading = initialState.loading;
      state.success = initialState.success;
      state.error = initialState.error;
    },

    clearProjectError: (state) => {
      state.error = initialState.error;
    },
  },

  extraReducers: (builder) => {
    builder

      //
      // 🔥 CREATE
      //
      .addCase(createProject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createProject.fulfilled, (state, action: any) => {
        state.loading = false;
        state.success = true;

        const newProject = formatSingleProject(action.payload.project);
        if (!newProject) return;

        state.createdProjects.projects.unshift(newProject);
        state.createdProjects.totalCount = state.createdProjects.totalCount + 1;
        // 🔥 Dashboard update
        state.dashboard.totalProjects += 1;
        state.dashboard.latestProjects.unshift(newProject);
        state.dashboard.latestProjects = state.dashboard.latestProjects.slice(
          0,
          3,
        );
      })
      .addCase(createProject.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload;
      })

      //
      // 🔥 FETCH CREATED
      //
      .addCase(fetchCreatedProject.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCreatedProject.fulfilled, (state, action: any) => {
        state.loading = false;
        state.createdProjects.projects =
          formatProjectResponse(action.payload.createdProjects.projects) || [];
        state.createdProjects.totalCount =
          action.payload.createdProjects.totalProjects || 0;

        console.log(
          `created projects is :: ${JSON.stringify(action.payload.createdProjects)}`,
        );
      })
      .addCase(fetchCreatedProject.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload;
      })

      //
      // 🔥 FETCH ASSIGNED
      //
      .addCase(fetchAssignProjects.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAssignProjects.fulfilled, (state, action: any) => {
        state.loading = false;
        state.assignProjects.projects =
          formatProjectResponse(action.payload.assignProjects.projects) || [];
        state.assignProjects.totalCount =
          action.payload.assignProjects.totalProjects || [];
      })
      .addCase(fetchAssignProjects.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload;
      })

      //
      // 🔥 FETCH SINGLE
      //
      .addCase(fetchProjectById.pending, (state) => {
        state.loading = true;
        state.singleProject = null;
      })
      .addCase(fetchProjectById.fulfilled, (state, action: any) => {
        state.loading = false;
        state.singleProject = formatSingleProject(action.payload.project);
      })
      .addCase(fetchProjectById.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload;
      })

      //
      // 🔥 UPDATE
      //
      .addCase(updateProject.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateProject.fulfilled, (state, action: any) => {
        state.loading = false;
        state.success = true;

        const updated = formatSingleProject(action.payload.updatedProject);
        if (!updated) return;

        const updateList = (list: any[]) =>
          list.map((p) =>
            p.projectId === updated.projectId ? { ...p, ...updated } : p,
          );

        state.createdProjects.projects = updateList(
          state.createdProjects.projects,
        );
        state.assignProjects.projects = updateList(
          state.assignProjects.projects,
        );

        if (state.singleProject?.projectId === updated.projectId) {
          state.singleProject = updated;
        }
      })
      .addCase(updateProject.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload;
      })
      //
      // 🔥 UPDATE STATUS
      //
      .addCase(updateProjectStatus.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateProjectStatus.fulfilled, (state, action: any) => {
        const updated = formatSingleProject(action.payload.updatedProject);
        if (!updated) return;

        const updateList = (list: any[]) =>
          list.map((p) =>
            p.projectId === updated.projectId ? { ...p, ...updated } : p,
          );

        state.createdProjects.projects = updateList(
          state.createdProjects.projects,
        );
        state.assignProjects.projects = updateList(
          state.assignProjects.projects,
        );

        if (state.singleProject?.projectId === updated.projectId) {
          state.singleProject = updated;
        }
        state.loading = false;
        state.success = true;
      })
      .addCase(updateProjectStatus.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload;
      })

      //
      // 🔥 UPDATE PROJECT DEADLINE
      //
      .addCase(updateProjectDeadline.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateProjectDeadline.fulfilled, (state, action: any) => {
        state.loading = false;
        state.success = true;

        const updated = formatSingleProject(action.payload.updatedProject);
        if (!updated) return;

        const updateList = (list: any[]) =>
          list.map((p) =>
            p.projectId === updated.projectId ? { ...p, ...updated } : p,
          );

        state.createdProjects.projects = updateList(
          state.createdProjects.projects,
        );
        state.assignProjects.projects = updateList(
          state.assignProjects.projects,
        );

        if (state.singleProject?.projectId === updated.projectId) {
          state.singleProject = updated;
        }
      })
      .addCase(updateProjectDeadline.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload;
      })

      //
      // 🔥 UPDATE PROJECT PRIORITY
      //
      .addCase(updateProjectPriority.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateProjectPriority.fulfilled, (state, action: any) => {
        state.loading = false;
        state.success = true;

        const updated = formatSingleProject(action.payload.updatedProject);
        if (!updated) return;

        const updateList = (list: any[]) =>
          list.map((p) =>
            p.projectId === updated.projectId ? { ...p, ...updated } : p,
          );

        state.createdProjects.projects = updateList(
          state.createdProjects.projects,
        );
        state.assignProjects.projects = updateList(
          state.assignProjects.projects,
        );

        if (state.singleProject?.projectId === updated.projectId) {
          state.singleProject = updated;
        }
      })
      .addCase(updateProjectPriority.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload;
      })

      //
      // 🔥 DELETE
      //
      .addCase(deleteProject.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteProject.fulfilled, (state, action: any) => {
        state.loading = false;
        state.success = true;

        const deleted = formatSingleProject(action.payload.project);
        if (!deleted) return;

        const remove = (list: any[]) =>
          list.filter((p) => p.projectId !== deleted.projectId);

        state.createdProjects.projects = remove(state.createdProjects.projects);
        state.assignProjects.projects = remove(state.assignProjects.projects);

        // 🔥 Dashboard update
        state.dashboard.totalProjects = Math.max(
          0,
          state.dashboard.totalProjects - 1,
        );
        state.dashboard.latestProjects = state.dashboard.latestProjects.filter(
          (p) => p.projectId !== deleted.projectId,
        );

        if (state.singleProject?.projectId === deleted.projectId) {
          state.singleProject = null;
        }
      })
      .addCase(deleteProject.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload;
      })

      //
      // 🔥 DASHBOARD
      //
      .addCase(fetchDashboardProjects.pending, (state) => {
        state.dashboard.projectLoading = true;
        state.dashboard.projectError = null;
      })
      .addCase(fetchDashboardProjects.fulfilled, (state, action: any) => {
        console.log(
          `Dashboard data is : ${JSON.stringify(action.payload.latestProjects)}`,
        );

        state.dashboard.projectLoading = false;
        state.dashboard.totalProjects = action.payload.totalProjects;
        state.dashboard.latestProjects = formatDashBoardProjectResponse(
          action.payload.latestProjects,
        );
      })
      .addCase(fetchDashboardProjects.rejected, (state, action: any) => {
        state.dashboard.projectLoading = false;
        state.dashboard.projectError = action.payload;
      });
  },
});

export const { resetProjectState, clearProjectError } = projectSlice.actions;
export default projectSlice.reducer;
