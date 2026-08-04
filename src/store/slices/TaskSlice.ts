import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { apiClient } from "../../api/client";
import { API_ENDPOINTS, fetchStatusType } from "../../api/endpoint";
import { TaskProps } from "./types";
import { PriorityLevel } from "../../store/slices/types";
import { formatSingleTask, formatTaskResponse } from "../TypeFormatter";
import { DEFAULT_RECENT_TASK_LIMIT } from "../../utils/Constent";
import { TaskEntityType } from "../../utils/GlobalStateUpdateUtils";

interface TaskStateProps {
  privateTasks: { tasks: TaskProps[]; totalTasks: number };
  projectTasks: { tasks: TaskProps[]; totalTasks: number };
  singleTask: TaskProps | null;
  totalProjectTaskCount: number; // 👈 NEW

  loading: boolean;

  success: boolean;
  error: string | null;

  dashboard: {
    totalTasks: number;
    latestTasks: TaskProps[];
    taskLoading: boolean;
    taskError: string | null;
  };
}

const initialTaskState: TaskStateProps = {
  privateTasks: { tasks: [], totalTasks: 0 },
  projectTasks: { tasks: [], totalTasks: 0 },
  singleTask: null,
  totalProjectTaskCount: 0,

  loading: false,
  success: false,
  error: null,

  dashboard: {
    totalTasks: 0,
    latestTasks: [],
    taskLoading: false,
    taskError: null,
  },
};

// ================= DASHBOARD =================
export const fetchDashboardTasks = createAsyncThunk(
  "task/fetchDashboardTasks",
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiClient.get(API_ENDPOINTS.GET_RECENT_TASKS(3));

      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(
        err?.response?.data?.message || "Failed to fetch dashboard tasks",
      );
    }
  },
);

// ================= CREATE =================
export const createPrivateTask = createAsyncThunk(
  "task/createPrivateTask",
  async (
    data: {
      taskHeader: string;
      taskDesc: string;
      priority: PriorityLevel;
      taskDeadline: Date;
    },
    thunkAPI,
  ) => {
    try {
      const res = await apiClient.post(API_ENDPOINTS.CREATE_PRIVATE_TASK, data);
      return res.data;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        err?.response?.data?.message || "Failed to create task",
      );
    }
  },
);

export const createProjectTask = createAsyncThunk(
  "task/createProjectTask",
  async (
    data: {
      projectId: string;
      taskHeader: string;
      taskDesc: string;
      priority: PriorityLevel;
      taskDeadline: Date;
    },
    thunkAPI,
  ) => {
    try {
      const res = await apiClient.post(API_ENDPOINTS.CREATE_PROJECT_TASK, data);
      return res.data;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        err?.response?.data?.message || "Failed to create task",
      );
    }
  },
);

// ================= FETCH =================
export const fetchTaskForId = createAsyncThunk(
  "task/fetchTaskForId",
  async (taskId: string, thunkAPI) => {
    try {
      const res = await apiClient.get(API_ENDPOINTS.FETCH_SINGLE_TASK(taskId));
      return res.data;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        err?.response?.data?.message || "Failed to fetch task",
      );
    }
  },
);

export const fetchTaskForProject = createAsyncThunk(
  "task/fetchTaskForProject",
  async (
    {
      projectId,
      fetchType,
      limit,
      skip,
    }: {
      projectId: string;
      fetchType?: fetchStatusType;
      limit?: number;
      skip?: number;
    },
    thunkAPI,
  ) => {
    try {
      const res = await apiClient.get(
        API_ENDPOINTS.FETCH_PROJECT_TASK(
          projectId,
          fetchType == undefined ? "ALL" : fetchType,
          limit,
          skip,
        ),
      );

      return res.data;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        err?.response?.data?.message || "Failed to fetch task",
      );
    }
  },
);

export const fetchPrivateTask = createAsyncThunk(
  "task/fetchPrivateTask",
  async (
    {
      fetchType,
      skip,
      limit,
    }: { fetchType?: fetchStatusType; limit?: number; skip?: number },
    thunkAPI,
  ) => {
    try {
      const res = await apiClient.get(
        API_ENDPOINTS.FETCH_PRIVATE_TASK(fetchType || "ALL", limit, skip),
      );


      return res.data;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        err?.response?.data?.message || "Failed to fetch task",
      );
    }
  },
);

// ================= UPDATE =================

export const updatePrivateTask = createAsyncThunk(
  "task/updatePrivateTask",
  async (
    data: { taskId: string; taskHeader: string; taskDesc: string },
    thunkAPI,
  ) => {
    try {
      const res = await apiClient.patch(
        API_ENDPOINTS.UPDATE_PRIVATE_TASK,
        data,
      );
      return res.data;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        err?.response?.data?.message || "Failed to update task",
      );
    }
  },
);

export const updatePrivateTaskStatus = createAsyncThunk(
  "task/updatePrivateTaskStatus",
  async (taskId: string, thunkAPI) => {
    try {
      const res = await apiClient.patch(
        API_ENDPOINTS.UPDATE_PRIVATE_TASK_STATUS,
        { taskId },
      );
      return res.data;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        err?.response?.data?.message || "Failed to update task",
      );
    }
  },
);

export const updatePrivateTaskDeadline = createAsyncThunk(
  "task/updatePrivateTaskDeadline",
  async (data: { taskId: string; taskDeadline: Date }, thunkAPI) => {
    try {
      const res = await apiClient.patch(
        API_ENDPOINTS.UPDATE_PRIVATE_TASK_DEADLINE,
        data,
      );
      return res.data;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        err?.response?.data?.message || "Failed to update task",
      );
    }
  },
);

export const updatePrivateTaskPriority = createAsyncThunk(
  "task/updatePrivateTaskPriority",
  async (data: { taskId: string; taskPriority: string }, thunkAPI) => {
    try {
      const res = await apiClient.patch(
        API_ENDPOINTS.UPDATE_PRIVATE_TASK_PRIORITY,
        data,
      );
      return res.data;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        err?.response?.data?.message || "Failed to update task",
      );
    }
  },
);

export const updateProjectTask = createAsyncThunk(
  "task/updateProjectTask",
  async (
    data: {
      taskId: string;
      projectId: string;
      taskHeader: string;
      taskDesc: string;
    },
    thunkAPI,
  ) => {
    try {
      const res = await apiClient.patch(
        API_ENDPOINTS.UPDATE_PROJECT_TASK,
        data,
      );
      return res.data;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        err?.response?.data?.message || "Failed to update task",
      );
    }
  },
);

export const updateProjectTaskStatus = createAsyncThunk(
  "task/updateProjectTaskStatus",
  async (
    data: {
      taskId: string;
      projectId: string;
    },
    thunkAPI,
  ) => {
    try {
      const res = await apiClient.patch(
        API_ENDPOINTS.UPDATE_PROJECT_TASK_STATUS,
        data,
      );
      return res.data;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        err?.response?.data?.message || "Failed to update task",
      );
    }
  },
);

export const updateProjectTaskDeadline = createAsyncThunk(
  "task/updateProjectTaskDeadline",
  async (
    data: {
      taskId: string;
      projectId: string;
      taskDeadline: Date;
    },
    thunkAPI,
  ) => {
    try {
      const res = await apiClient.patch(
        API_ENDPOINTS.UPDATE_PROJECT_TASK_DEADLINE,
        data,
      );
      return res.data;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        err?.response?.data?.message || "Failed to update task",
      );
    }
  },
);

export const updateProjectTaskPriority = createAsyncThunk(
  "task/updateProjectTaskPriority",
  async (
    data: {
      taskId: string;
      projectId: string;
      taskPriority: string;
    },
    thunkAPI,
  ) => {
    try {
      const res = await apiClient.patch(
        API_ENDPOINTS.UPDATE_PROJECT_TASK_PRIORITY,
        data,
      );
      return res.data;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        err?.response?.data?.message || "Failed to update task",
      );
    }
  },
);

// ================= DELETE =================
export const deletePrivateTask = createAsyncThunk(
  "task/deletePrivateTask",
  async (taskId: string, thunkAPI) => {
    try {
      const res = await apiClient.delete(
        API_ENDPOINTS.DELETE_PRIVATE_TASK(taskId),
      );
      return res.data;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        err?.response?.data?.message || "Failed to delete task",
      );
    }
  },
);

export const deleteProjectTask = createAsyncThunk(
  "task/deleteProjectTask",
  async (
    { taskId, projectId }: { taskId: string; projectId: string },
    thunkAPI,
  ) => {
    try {
      const res = await apiClient.delete(
        API_ENDPOINTS.DELETE_PROJECT_TASK(projectId, taskId),
      );
      return res.data;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        err?.response?.data?.message || "Failed to delete task",
      );
    }
  },
);

// ================= SLICE =================
const taskSlice = createSlice({
  name: "Tasks",
  initialState: initialTaskState,
  reducers: {
    resetTaskState: (state) => {
      state.dashboard = initialTaskState.dashboard;
      state.error = initialTaskState.error;
      state.loading = initialTaskState.loading;
      state.privateTasks = initialTaskState.privateTasks;
      state.projectTasks = initialTaskState.projectTasks;
      state.totalProjectTaskCount = initialTaskState.totalProjectTaskCount;
      state.singleTask = initialTaskState.singleTask;
      state.success = initialTaskState.success;
    },

    updateTaskStats: (
      state,
      action: PayloadAction<{ entity: TaskEntityType; change: number }>,
    ) => {
      const { entity, change } = action.payload;

      if (entity === "COMMENT") {
        state.singleTask!.commentCount =
          (state.singleTask!.commentCount || 0) + change;

        state.dashboard.latestTasks = state.dashboard.latestTasks.map(
          (item) => {
            if (item.taskId === state.singleTask?.taskId) {
              return { ...item, commentCount: (item.commentCount += change) };
            } else {
              return item;
            }
          },
        );
      } else if (entity === "MESSAGE") {
        state.singleTask!.messageCount =
          (state.singleTask!.messageCount || 0) + change;

        state.dashboard.latestTasks = state.dashboard.latestTasks.map(
          (item) => {
            if (item.taskId === state.singleTask?.taskId) {
              return {
                ...item,
                messageCount: (item.messageCount += change),
              };
            } else {
              return item;
            }
          },
        );
      }
    },

    clearTaskError: (state) => {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder

      // ===== CREATE PRIVATE =====
      .addCase(createPrivateTask.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = null;
      })
      .addCase(createPrivateTask.fulfilled, (state, action: any) => {
        state.loading = false;
        state.success = true;

        const task = formatSingleTask(action.payload.task);
        if (!task) return;

        state.privateTasks.tasks.unshift(task);
        state.privateTasks.totalTasks += 1;

        state.dashboard.totalTasks += 1;
        state.dashboard.latestTasks.unshift(task);
        state.dashboard.latestTasks = state.dashboard.latestTasks.slice(0, 3);
      })
      .addCase(createPrivateTask.rejected, (state, action: any) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload;
      })

      // ===== CREATE PROJECT =====

      .addCase(createProjectTask.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = null;
      })
      .addCase(createProjectTask.fulfilled, (state, action: any) => {
        state.loading = false;
        state.success = true;

        const task = formatSingleTask(action.payload.task);
        if (!task) return;

        state.projectTasks.tasks.unshift(task);
        state.projectTasks.totalTasks += 1;

        state.totalProjectTaskCount += 1;
      })
      .addCase(createProjectTask.rejected, (state, action: any) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload;
      })

      // ===== UPDATE =====
      .addCase(updatePrivateTask.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = null;
      })
      .addCase(updatePrivateTask.fulfilled, (state, action: any) => {
        state.loading = false;
        state.success = true;

        const updatedTask = formatSingleTask(action.payload.updatedTask);
        if (!updatedTask) return;

        const update = (list: any[]) =>
          list.map((i) =>
            i.taskId === updatedTask.taskId ? { ...i, ...updatedTask } : i,
          );

        state.privateTasks.tasks = update(state.privateTasks.tasks);
        state.singleTask =
          state.singleTask?.taskId === updatedTask.taskId
            ? updatedTask
            : state.singleTask;
        state.dashboard.latestTasks = update(state.dashboard.latestTasks);
      })
      .addCase(updatePrivateTask.rejected, (state, action: any) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload;
      })

      // ===== DELETE =====
      .addCase(deletePrivateTask.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = null;
      })
      .addCase(deletePrivateTask.fulfilled, (state, action: any) => {
        state.loading = false;
        state.success = true;

        const deleted = formatSingleTask(action.payload.deletedTasks);
        if (!deleted) return;

        // 1. Check if the deleted task is in latestTasks
        const isLatest = state.dashboard.latestTasks.some(
          (t) => t.taskId === deleted.taskId,
        );

        // 2. Normal remove from privateTasks list
        const remove = (list: any[]) =>
          list.filter((i) => i.taskId !== deleted.taskId);

        state.privateTasks.tasks = remove(state.privateTasks.tasks);
        state.privateTasks.totalTasks = Math.max(
          0,
          state.privateTasks.totalTasks - 1,
        );

        // Update dashboard total count
        state.dashboard.totalTasks = Math.max(
          0,
          state.dashboard.totalTasks - 1,
        );

        // 3. Update Dashboard latestTasks array
        if (isLatest) {
          // Pehle usko hatao
          state.dashboard.latestTasks = state.dashboard.latestTasks.filter(
            (t) => t.taskId !== deleted.taskId,
          );

          // Agar task ki total count aapki limit se zyada (ya barabar) hai, tabhi naya fetch krke add kro
          // NOTE: Apni limit variable yahan replace krein (jaise DEFAULT_RECENT_TASK_LIMIT)
          if (state.dashboard.totalTasks >= DEFAULT_RECENT_TASK_LIMIT) {
            // Ek aisa task dhundo jo already latestTasks me na ho
            const newLatest = state.privateTasks.tasks.find(
              (pt) =>
                !state.dashboard.latestTasks.some(
                  (lt) => lt.taskId === pt.taskId,
                ),
            );

            if (newLatest) {
              state.dashboard.latestTasks.push(newLatest);
            }
          }
        }
      })
      .addCase(deletePrivateTask.rejected, (state, action: any) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload;
      })

      // ===== DASHBOARD =====
      .addCase(fetchDashboardTasks.pending, (state) => {
        state.dashboard.taskLoading = true;
        state.dashboard.taskError = null;
      })
      .addCase(fetchDashboardTasks.fulfilled, (state, action: any) => {
        state.dashboard.taskLoading = false;
        state.dashboard.latestTasks =
          formatTaskResponse(action.payload.latestTasks) || [];
        state.dashboard.totalTasks = action.payload.totalTasksCount || 0;
      })
      .addCase(fetchDashboardTasks.rejected, (state, action: any) => {
        state.dashboard.taskLoading = false;
        state.dashboard.taskError = action.payload;
      })

      /** ---------------------------------- UPDATE PROJECT TASK ---------------------------------- */

      .addCase(updateProjectTask.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = null;
      })
      .addCase(updateProjectTask.fulfilled, (state, action: any) => {
        state.loading = false;
        state.success = true;

        const updated = formatSingleTask(action.payload.updatedTask);
        if (!updated) return;

        const update = (list: any[]) =>
          list.map((item) =>
            item.taskId === updated.taskId ? { ...item, ...updated } : item,
          );

        // 🔥 update everywhere
        state.projectTasks.tasks = update(state.projectTasks.tasks);

        // 🔥 if currently opened task
        if (state.singleTask?.taskId === updated.taskId) {
          state.singleTask = { ...state.singleTask, ...updated };
        }
      })
      .addCase(updateProjectTask.rejected, (state, action: any) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload;
      })

      /** --------------------------------- FETCH TASK FOR PROJECT --------------------------------- */

      .addCase(fetchTaskForProject.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = null;
      })
      .addCase(fetchTaskForProject.fulfilled, (state, action: any) => {
    
        const { tasks, totalTasksCount } = action.payload;

        const formatedTasks = formatTaskResponse(tasks);

      

        if (action.meta.arg?.skip > 0) {
          state.projectTasks.tasks = [
            ...state.projectTasks.tasks,
            ...formatedTasks,
          ];
        } else {
          state.projectTasks.tasks = formatedTasks;
        }

        state.privateTasks.totalTasks = totalTasksCount; // 🔥 IMPORTANT

        state.loading = false;
        state.success = true;
      })
      .addCase(fetchTaskForProject.rejected, (state, action: any) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload;
      })

      /** ----------------------------------- FETCH TASK FOR ID ------------------------------------- */

      .addCase(fetchTaskForId.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTaskForId.fulfilled, (state, action: any) => {
        state.loading = false;
        state.success = true;

        state.singleTask = formatSingleTask(action.payload.task);
      })
      .addCase(fetchTaskForId.rejected, (state, action: any) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload;
      })

      /** ----------------------------------- FETCH SINGLE TASK ------------------------------------- */

      .addCase(fetchPrivateTask.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPrivateTask.fulfilled, (state, action: any) => {
        const tasks = formatTaskResponse(action.payload.privateTasks.tasks);

        if (action.meta.arg?.skip > 0) {
          state.privateTasks.tasks = [...state.privateTasks.tasks, ...tasks];
        } else {
          state.privateTasks.tasks = tasks ?? [];
        }
        state.privateTasks.totalTasks =
          action.payload.privateTasks.totalTasksCount;
        state.loading = false;
        state.success = true;
      })
      .addCase(fetchPrivateTask.rejected, (state, action: any) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload;
      })

      /** ---------------------------------- DELETE PROJECT TASK -------------------------------------- */

      .addCase(deleteProjectTask.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = null;
      })
      .addCase(deleteProjectTask.fulfilled, (state, action: any) => {
        state.loading = false;
        state.success = true;

        const deleted = formatSingleTask(action.payload.deletedTask);
        if (!deleted) return;

        const remove = (list: any[]) =>
          list.filter((i) => i.taskId !== deleted.taskId);

        state.projectTasks.tasks = remove(state.projectTasks.tasks);
        state.projectTasks.totalTasks -= 1;

        state.totalProjectTaskCount = Math.max(
          0,
          state.totalProjectTaskCount - 1,
        );
      })
      .addCase(deleteProjectTask.rejected, (state, action: any) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload;
      })

      /** ---------------------------------- UPDATE STATUS FOR PROJECT TASK ------------------------------ */

      .addCase(updateProjectTaskStatus.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = null;
      })
      .addCase(updateProjectTaskStatus.fulfilled, (state, action: any) => {
        state.loading = false;
        state.success = true;

        const updatedTask = formatSingleTask(action.payload.updatedTask);
        if (!updatedTask) return;

        state.projectTasks.tasks = state.projectTasks.tasks.map((task) =>
          task.taskId === updatedTask.taskId
            ? { ...task, ...updatedTask }
            : task,
        );

        // ✅ Guard it
        if (state.singleTask?.taskId === updatedTask.taskId) {
          state.singleTask = { ...state.singleTask, ...updatedTask };
        }
      })
      .addCase(updateProjectTaskStatus.rejected, (state, action: any) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload;
      })

      /** ---------------------------------- UPDATE PRIORITY FOR PROJECT TASK ------------------------------ */

      .addCase(updateProjectTaskPriority.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = null;
      })
      .addCase(updateProjectTaskPriority.fulfilled, (state, action: any) => {
        state.loading = false;
        state.success = true;

        const updatedTask = formatSingleTask(action.payload.updatedTask);
        if (!updatedTask) return;

        state.projectTasks.tasks = state.projectTasks.tasks.map((task) =>
          task.taskId === updatedTask.taskId
            ? { ...task, ...updatedTask }
            : task,
        );

        // ✅ Guard it
        if (state.singleTask?.taskId === updatedTask.taskId) {
          state.singleTask = { ...state.singleTask, ...updatedTask };
        }
      })
      .addCase(updateProjectTaskPriority.rejected, (state, action: any) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload;
      })

      /** ---------------------------------- UPDATE DEADLINE FOR PROJECT TASK ------------------------------ */

      .addCase(updateProjectTaskDeadline.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = null;
      })
      .addCase(updateProjectTaskDeadline.fulfilled, (state, action: any) => {
        state.loading = false;
        state.success = true;

        const updatedTask = formatSingleTask(action.payload.updatedTask);
        if (!updatedTask) return;

        state.projectTasks.tasks = state.projectTasks.tasks.map((task) =>
          task.taskId === updatedTask.taskId
            ? { ...task, ...updatedTask }
            : task,
        );

        // ✅ Guard it
        if (state.singleTask?.taskId === updatedTask.taskId) {
          state.singleTask = { ...state.singleTask, ...updatedTask };
        }
      })
      .addCase(updateProjectTaskDeadline.rejected, (state, action: any) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload;
      })

      /** ---------------------------------- UPDATE STATUS FOR PRIVATE TASK ------------------------------ */

      .addCase(updatePrivateTaskStatus.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = null;
      })
      .addCase(updatePrivateTaskStatus.fulfilled, (state, action: any) => {
        state.loading = false;
        state.success = true;

        const updatedTask = formatSingleTask(action.payload.updatedTask);
        if (!updatedTask) return;

        state.privateTasks.tasks = state.privateTasks.tasks.map((task) =>
          task.taskId === updatedTask.taskId
            ? { ...task, ...updatedTask }
            : task,
        );

        state.dashboard.latestTasks = state.dashboard.latestTasks.map((task) =>
          task.taskId === updatedTask.taskId
            ? { ...task, ...updatedTask }
            : task,
        );

        if (state.singleTask?.taskId === updatedTask.taskId) {
          state.singleTask = { ...state.singleTask, ...updatedTask };
        }
      })
      .addCase(updatePrivateTaskStatus.rejected, (state, action: any) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload;
      })

      /** ---------------------------------- UPDATE DEADLINE FOR PRIVATE TASK ------------------------------ */

      .addCase(updatePrivateTaskDeadline.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = null;
      })
      .addCase(updatePrivateTaskDeadline.fulfilled, (state, action: any) => {
        state.loading = false;
        state.success = true;

        const updatedTask = formatSingleTask(action.payload.updatedTask);
        if (!updatedTask) return;

        state.privateTasks.tasks = state.privateTasks.tasks.map((task) =>
          task.taskId === updatedTask.taskId
            ? { ...task, ...updatedTask }
            : task,
        );

        state.dashboard.latestTasks = state.dashboard.latestTasks.map((task) =>
          task.taskId === updatedTask.taskId
            ? { ...task, ...updatedTask }
            : task,
        );

        if (state.singleTask?.taskId === updatedTask.taskId) {
          state.singleTask = { ...state.singleTask, ...updatedTask };
        }
      })
      .addCase(updatePrivateTaskDeadline.rejected, (state, action: any) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload;
      })

      /** ---------------------------------- UPDATE PRIORITY FOR PRIVATE TASK ------------------------------ */

      .addCase(updatePrivateTaskPriority.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = null;
      })
      .addCase(updatePrivateTaskPriority.fulfilled, (state, action: any) => {
        state.loading = false;
        state.success = true;

        const updatedTask = formatSingleTask(action.payload.updatedTask);
        if (!updatedTask) return;

        state.privateTasks.tasks = state.privateTasks.tasks.map((task) =>
          task.taskId === updatedTask.taskId
            ? { ...task, ...updatedTask }
            : task,
        );

        state.dashboard.latestTasks = state.dashboard.latestTasks.map((task) =>
          task.taskId === updatedTask.taskId
            ? { ...task, ...updatedTask }
            : task,
        );

        if (state.singleTask?.taskId === updatedTask.taskId) {
          state.singleTask = { ...state.singleTask, ...updatedTask };
        }
      })
      .addCase(updatePrivateTaskPriority.rejected, (state, action: any) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload;
      });
  },
});

export const { resetTaskState, clearTaskError, updateTaskStats } =
  taskSlice.actions;
export default taskSlice.reducer;
