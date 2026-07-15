import { BASE_URL } from "../utils/Constent";

export const API_ENDPOINTS = {
  // VERIFY URL
  VERIFY_URL: `${BASE_URL}/auth/me`,
  /**
   *
   * ------------------------------------ AUTH ENDPOINTS -------------------------------------
   *
   */

  LOGIN: `${BASE_URL}/auth/login`,
  REGISTER: `${BASE_URL}/auth/register`,
  GOOGLE_LOGIN: `${BASE_URL}/auth/google`,
  GITHUB_LOGIN: `${BASE_URL}/auth/github`,
  UPDATE_PROFILE: `${BASE_URL}/auth/updateProfile`,
  DELETE_PROFILE: `${BASE_URL}/auth/deleteProfile`, 
  CHANGE_PASSWORD: `${BASE_URL}/auth/change-password`,
  FORGOT_PASSWORD: `${BASE_URL}/auth/forgot-password`,
  RESET_PASSWORD: `${BASE_URL}/auth/reset-password`,
  VERIFY_EMAIL: `${BASE_URL}/auth/verify-email`,
  RESEND_VERIFICATION: `${BASE_URL}/auth/resend-verification`,

  
  /**
   *
   * ------------------------------------ PROJECT ENDPOINTS -------------------------------------
   *
   */

  CREATE_PROJECT: `${BASE_URL}/project/create-project`,
  FETCH_CREATED_PROJECT: (
    fetchType: fetchStatusType,
    limit?: number,
    skip?: number,
  ) => {
    const params = new URLSearchParams();
    if (limit !== undefined) params.append("limit", String(limit));
    if (skip !== undefined) params.append("skip", String(skip));
    if (fetchType !== undefined) params.append("fetchType", String(fetchType));
    const q = params.toString();
    return `${BASE_URL}/project/fetch-created-projects${q ? `?${q}` : ""}`;
  },
  FETCH_ASSIGN_PROJECTS: (
    fetchType?: fetchStatusType,
    limit?: number,
    skip?: number,
  ) => {
    const params = new URLSearchParams();
    if (limit !== undefined) params.append("limit", String(limit));
    if (skip !== undefined) params.append("skip", String(skip));
    if (fetchType !== undefined) params.append("fetchType", String(fetchType));
    const q = params.toString();
    return `${BASE_URL}/project/fetch-assign-projects${q ? `?${q}` : ""}`;
  },

  FETCH_PROJECT: (projectId: string) =>
    `${BASE_URL}/project/${projectId}/fetch-project`,
  UPDATE_PROJECT: `${BASE_URL}/project/update-project`,
  UPDATE_PROJECT_STATUS: (projectId: string) =>
    `${BASE_URL}/project/${projectId}/update-project-status`,
  UPDATE_PROJECT_DEADLINE: (projectId: string) =>
    `${BASE_URL}/project/${projectId}/update-project-deadline`,
  UPDATE_PROJECT_PRIORITY: (projectId: string) =>
    `${BASE_URL}/project/${projectId}/update-project-priority`,
  DELETE_PROJECT: (projectId: string) =>
    `${BASE_URL}/project/${projectId}/delete-project`,

  /**
   *
   * ------------------------------------ TASKS ENDPOINTS -------------------------------------
   *
   */

  CREATE_PRIVATE_TASK: `${BASE_URL}/task/create-private-task`,

  CREATE_PROJECT_TASK: `${BASE_URL}/task/create-project-task`,

  FETCH_SINGLE_TASK: (taskId: string) =>
    `${BASE_URL}/task/${taskId}/fetch-task`,

  FETCH_PROJECT_TASK: (
    projectId: string,
    fetchType: fetchStatusType,
    limit?: number,
    skip?: number,
  ) => {
    const params = new URLSearchParams();
    if (limit !== undefined) params.append("limit", String(limit));
    if (skip !== undefined) params.append("skip", String(skip));
    if (fetchType !== "ALL") params.append("fetchType", String(fetchType));
    const q = params.toString();
    return `${BASE_URL}/task/${projectId}/fetch-project-task${q ? `?${q}` : ""}`;
  },

  FETCH_PRIVATE_TASK: (
    fetchType: fetchStatusType,
    limit?: number,
    skip?: number,
  ) => {
    const params = new URLSearchParams();
    if (limit !== undefined) params.append("limit", String(limit));
    if (skip !== undefined) params.append("skip", String(skip));
    if (fetchType !== "ALL") params.append("fetchType", String(fetchType));
    const q = params.toString();
    return `${BASE_URL}/task/fetch-private-task${q ? `?${q}` : ""}`;
  },

  UPDATE_PRIVATE_TASK: `${BASE_URL}/task/update-private-task`,
  UPDATE_PROJECT_TASK: `${BASE_URL}/task/update-project-task`,
  UPDATE_PRIVATE_TASK_STATUS: `${BASE_URL}/task/update-private-task-status`,
  UPDATE_PRIVATE_TASK_DEADLINE: `${BASE_URL}/task/update-private-task-deadline`,
  UPDATE_PRIVATE_TASK_PRIORITY: `${BASE_URL}/task/update-private-task-priority`,
  UPDATE_PROJECT_TASK_STATUS: `${BASE_URL}/task/update-project-task-status`,
  UPDATE_PROJECT_TASK_DEADLINE: `${BASE_URL}/task/update-project-task-deadline`,
  UPDATE_PROJECT_TASK_PRIORITY: `${BASE_URL}/task/update-project-task-priority`,

  DELETE_PRIVATE_TASK: (taskId: string) =>
    `${BASE_URL}/task/${taskId}/delete-private-task`,

  DELETE_PROJECT_TASK: (projectId: string, taskId: string) =>
    `${BASE_URL}/task/${projectId}/${taskId}/delete-project-task`,

  /**
   *
   * ------------------------------------ MEMBERS ENDPOINTS -------------------------------------
   *
   */

  ADD_MEMBER: `${BASE_URL}/member/add-member`,

  FETCH_MEMBERS: (projectId: string, limit?: number, skip?: number) => {
    const params = new URLSearchParams();
    if (limit !== undefined) params.append("limit", String(limit));
    if (skip !== undefined) params.append("skip", String(skip));
    const q = params.toString();
    return `${BASE_URL}/member/${projectId}/fetch-member${q ? `?${q}` : ""}`;
  },

  UPDATE_MEMBER_ROLE: `${BASE_URL}/member/update-role`,

  REMOVE_MEMBER: (memberId: string, projectId: string) =>
    `${BASE_URL}/member/${memberId}/${projectId}/remove-member`,

  LEAVE_PROJECT: (projectId: string) =>
    `${BASE_URL}/member/${projectId}/leave-project`,

  /**
   *
   * ------------------------------------ MESSAGES ENDPOINTS -------------------------------------
   *
   */
  SEND_MESSAGE: `${BASE_URL}/message/send-message`,
  FETCH_PRIVATE_MESSAGES: (limit?: number, skip?: number) => {
    const params = new URLSearchParams();
    if (limit !== undefined) params.append("limit", String(limit));
    if (skip !== undefined) params.append("skip", String(skip));
    const q = params.toString();
    return `${BASE_URL}/message/private-message${q ? `?${q}` : ""}`;
  },

  FETCH_PROJECT_MESSAGE: (projectId: string, limit?: number, skip?: number) => {
    const params = new URLSearchParams();
    if (limit !== undefined) params.append("limit", String(limit));
    if (skip !== undefined) params.append("skip", String(skip));
    const q = params.toString();
    return `${BASE_URL}/message/${projectId}/project-message${q ? `?${q}` : ""}`;
  },

  FETCH_TASK_MESSAGE: (taskId: string, limit?: number, skip?: number) => {
    const params = new URLSearchParams();
    if (limit !== undefined) params.append("limit", String(limit));
    if (skip !== undefined) params.append("skip", String(skip));
    const q = params.toString();
    return `${BASE_URL}/message/${taskId}/task-message${q ? `?${q}` : ""}`; // (you’ll build this)
  },

  UPDATE_MESSAGE: (messageId: string) =>
    `${BASE_URL}/message/${messageId}/update-message`, // (you’ll build this)
  DELETE_MESSAGE: (messageId: string) =>
    `${BASE_URL}/message/${messageId}/delete-message`, // (you’ll build this)

  // 📌 Assignment
  ASSIGN_TASK: `${BASE_URL}/task/assign`,

  /**
   * ------------------------------------COMMENTS ENDPOINT---------------------------------------------
   */

  ADD_COMMENT: (taskId: string) => `${BASE_URL}/${taskId}/add-comment`,
  FETCH_COMMENT: (commentId: string) =>
    `${BASE_URL}/${commentId}/fetch-comment`,
  FETCH_TASK_COMMENT: (taskId: string) =>
    `${BASE_URL}/${taskId}/fetch-task-comments`,
  FETCH_USER_COMMENT: `${BASE_URL}/fetch-user-comments`,
  DELETE_COMMENT: `${BASE_URL}/delete-comment`,

  // DashBoard
  GET_RECENT_TASKS: (limit?: number) =>
    `${BASE_URL}/task/dashboard/recent-tasks?limit=${limit}`,
  GET_RECENT_PROJECT: (limit?: number) =>
    `${BASE_URL}/project/dashboard/recent-project?limit=${limit}`,

  /**
   * ------------------------------------SEARCH ENDPOINT---------------------------------------------
   */

  SEARCH_USER: (userData: string, limit?: number) =>
    `${BASE_URL}/user/search?query=${userData}&limit=${limit}`,
};

export type fetchStatusType = "COMPLETED" | "IN_PROGRESS" | "ALL";
