import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { apiClient } from "../../api/client";
import { API_ENDPOINTS, fetchStatusType } from "../../api/endpoint";
import { PriorityLevel, ProjectProps } from "./types";
import {
  formatDashBoardProjectResponse,
  formatProjectResponse,
  formatSingleProject,
} from "../TypeFormatter";
import { DEFAULT_RECENT_PROJECT_LIMIT } from "../../utils/Constent";

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
   

      const res = await apiClient.get(
        API_ENDPOINTS.FETCH_CREATED_PROJECT(
          fetchType == undefined ? "ALL" : fetchType,
          limit,
          skip,
        ),
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
// 🔥 LEAVE PROJECT
//
export const leaveProject = createAsyncThunk(
  "project/leave",
  async (projectId: string, thunkAPI) => {
    try {
      const res = await apiClient.delete(
        API_ENDPOINTS.LEAVE_PROJECT(projectId),
      );

      return res.data;
    } catch (err: any) {

      const errorMessage =
        err.response?.data?.message || "Failed to leave the project";
      return thunkAPI.rejectWithValue(errorMessage);
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
      state.assignProjects = initialState.assignProjects;
      state.createdProjects = initialState.createdProjects;
      state.singleProject = initialState.singleProject;
      state.loading = initialState.loading;
      state.success = initialState.success;
      state.error = initialState.error;
      state.dashboard = initialState.dashboard;
    },

    updateProjectStats: (
      state,
      action: PayloadAction<{
        entity: "MESSAGE" | "TASK" | "MEMBER" | "TASK_COMPLETE";
        change: number;
      }>,
    ) => {
      const { entity, change } = action.payload;
      if (entity === "MESSAGE") {
        state.singleProject!.messageCount += change;
        state.dashboard.latestProjects = state.dashboard.latestProjects.map(
          (project) => {
            if (project.projectId === state.singleProject?.projectId) {
              return {
                ...project,
                messageCount: (project.membersCount += change),
              };
            } else {
              return project;
            }
          },
        );
      }
      if (entity === "TASK") {
        state.singleProject!.totalTasksCount += change;

        state.dashboard.latestProjects = state.dashboard.latestProjects.map(
          (project) => {
            if (project.projectId === state.singleProject?.projectId) {
              return {
                ...project,
                totalTasksCount: (project.totalTasksCount += change),
              };
            } else {
              return project;
            }
          },
        );
      }

      if (entity === "TASK_COMPLETE") {
        state.singleProject!.completedTaskCount += change;
        state.dashboard.latestProjects = state.dashboard.latestProjects.map(
          (project) => {
            if (project.projectId === state.singleProject?.projectId) {
              return {
                ...project,
                completedTaskCount: (project.completedTaskCount += change),
              };
            } else {
              return project;
            }
          },
        );
      }
      if (entity === "MEMBER") {
        state.singleProject!.membersCount += change;

        state.dashboard.latestProjects = state.dashboard.latestProjects.map(
          (project) => {
            if (project.projectId === state.singleProject?.projectId) {
              return {
                ...project,
                membersCount: (project.membersCount += change),
              };
            } else {
              return project;
            }
          },
        );
      }
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
        state.error = null;
      })
      .addCase(fetchCreatedProject.fulfilled, (state, action: any) => {
        state.loading = false;

        const projects =
          formatProjectResponse(action.payload.createdProjects.projects) || [];

        // Append if it's a load more, otherwise replace
        if (action.meta.arg?.skip > 0) {
          state.createdProjects.projects = [
            ...state.createdProjects.projects,
            ...projects,
          ];
        } else {
          state.createdProjects.projects = projects;
        }

        state.createdProjects.totalCount =
          action.payload.createdProjects.totalProjectsCount || 0;
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
        state.error = null;
      })
      .addCase(fetchAssignProjects.fulfilled, (state, action: any) => {
        state.loading = false;

        const projects =
          formatProjectResponse(action.payload.assignProjects.projects) || [];

        // Append if it's a load more, otherwise replace
        if (action.meta.arg?.skip > 0) {
          state.assignProjects.projects = [
            ...state.assignProjects.projects,
            ...projects,
          ];
        } else {
          state.assignProjects.projects = projects;
        }

        // Note: Changed the fallback here from || [] to || 0 so totalCount stays a number
        state.assignProjects.totalCount =
          action.payload.assignProjects.totalProjectsCount || 0;
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

        state.dashboard.latestProjects = updateList(
          state.dashboard.latestProjects,
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

        state.dashboard.latestProjects = updateList(
          state.dashboard.latestProjects,
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

        state.dashboard.latestProjects = updateList(
          state.dashboard.latestProjects,
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

        state.dashboard.latestProjects = updateList(
          state.dashboard.latestProjects,
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
      // 🔥 LEAVE PROJECT
      //
      .addCase(leaveProject.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(leaveProject.fulfilled, (state, action: any) => {
        state.loading = false;
        state.success = true;

        const leftProjectId = action.payload.leavedProject?.projectId;
        if (!leftProjectId) return;

        const remove = (list: any[]) =>
          list.filter((p) => p.projectId !== leftProjectId);

        state.createdProjects.projects = remove(state.createdProjects.projects);
        state.assignProjects.projects = remove(state.assignProjects.projects);

        const isLatest = state.dashboard.latestProjects.some(
          (p) => p.projectId === leftProjectId,
        );

        state.dashboard.totalProjects = Math.max(
          0,
          state.dashboard.totalProjects - 1,
        );

        if (isLatest) {
          state.dashboard.latestProjects =
            state.dashboard.latestProjects.filter(
              (p) => p.projectId !== leftProjectId,
            );

          if (state.dashboard.totalProjects >= DEFAULT_RECENT_PROJECT_LIMIT) {
            const newLatest =
              state.assignProjects.projects.find(
                (ap) =>
                  !state.dashboard.latestProjects.some(
                    (lp) => lp.projectId === ap.projectId,
                  ),
              ) ||
              state.createdProjects.projects.find(
                (cp) =>
                  !state.dashboard.latestProjects.some(
                    (lp) => lp.projectId === cp.projectId,
                  ),
              );

            if (newLatest) {
              state.dashboard.latestProjects.push(newLatest);
            }
          }
        }

        if (state.singleProject?.projectId === leftProjectId) {
          state.singleProject = null;
        }
      })
      .addCase(leaveProject.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
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

        const deleted = formatSingleProject(action.payload.deletedProject);
        if (!deleted) return;

        // 1. Normal remove from created/assign lists
        const remove = (list: any[]) =>
          list.filter((p) => p.projectId !== deleted.projectId);

        state.createdProjects.projects = remove(state.createdProjects.projects);
        state.assignProjects.projects = remove(state.assignProjects.projects);

        // 2. Check if deleted project is in latestProjects
        const isLatest = state.dashboard.latestProjects.some(
          (p) => p.projectId === deleted.projectId,
        );

        // Update total projects count first
        state.dashboard.totalProjects = Math.max(
          0,
          state.dashboard.totalProjects - 1,
        );

        if (isLatest) {
          // Us particular project ko remove kro
          state.dashboard.latestProjects =
            state.dashboard.latestProjects.filter(
              (p) => p.projectId !== deleted.projectId,
            );

          // Agar total projects limit se jyada (ya barabar) hain, tabhi naya add kro
          if (state.dashboard.totalProjects >= DEFAULT_RECENT_PROJECT_LIMIT) {
            // Find a project from createdProjects that is NOT already in latestProjects
            const newLatest = state.createdProjects.projects.find(
              (cp) =>
                !state.dashboard.latestProjects.some(
                  (lp) => lp.projectId === cp.projectId,
                ),
            );

            if (newLatest) {
              state.dashboard.latestProjects.push(newLatest);
            }
          }
          // Agar limit se kam hai, to else block nahi hai -> "jo hai vo hai"
        }

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
        state.dashboard.projectLoading = false;
        state.dashboard.totalProjects = action.payload.totalProjectsCount;
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

export const { resetProjectState, clearProjectError, updateProjectStats } =
  projectSlice.actions;
export default projectSlice.reducer;
