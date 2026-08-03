import { API_BASE_URL } from "@env";


export const API_ENDPOINTS = {
  // VERIFY URL
  VERIFY_URL: `${API_BASE_URL}/auth/me`,
  /**
   *
   * ------------------------------------ AUTH ENDPOINTS -------------------------------------
   *
   */

  LOGIN: `${API_BASE_URL}/auth/login`,
  REGISTER: `${API_BASE_URL}/auth/register`,
  FETCH_PROFILE_DATA: `${API_BASE_URL}/auth/me`,
  GOOGLE_LOGIN: `${API_BASE_URL}/auth/google`,
  GITHUB_LOGIN: `${API_BASE_URL}/auth/github`,
  UPDATE_PROFILE: `${API_BASE_URL}/auth/updateProfile`,
  DELETE_PROFILE: `${API_BASE_URL}/auth/deleteProfile`,
  CHANGE_PASSWORD: `${API_BASE_URL}/auth/change-password`,
  FORGOT_PASSWORD: `${API_BASE_URL}/auth/forgot-password`,
  RESET_PASSWORD: `${API_BASE_URL}/auth/reset-password`,
  VERIFY_EMAIL: `${API_BASE_URL}/auth/verify-email`,
  RESEND_VERIFICATION: `${API_BASE_URL}/auth/resend-verification`,
  FORGOT_RESET_PASSWORD: `${API_BASE_URL}/auth/reset-password`,
  CONFIRM_TRANSFER_OWNERSHIP: `${API_BASE_URL}/auth/confirm-transfer-ownership`,

  /**
   *
   * ------------------------------------ VERIFY EMAIL ENDPOINTS -------------------------------------
   *
   */
  // Call this when the user clicks "Sign Up"
  SEND_REGISTRATION_OTP: `${API_BASE_URL}/send-registration-otp`,

  // Call this when the user clicks "Forgot Password"
  SEND_RESET_OTP: `${API_BASE_URL}/send-reset-otp`,

  // Call this to verify OTPs for Registration, Forgot Password, Transfer Ownership, Set Password, and Change Password
  VERIFY_OTP: `${API_BASE_URL}/verify-otp`,

  // ==========================================
  // TRANSFER OWNERSHIP FLOW ENDPOINTS
  // ==========================================

  // Step 1: Send OTP to current email (verifies password first)
  SEND_TRANSFER_OWNERSHIP_OTP: `${API_BASE_URL}/send-transfer-ownership-otp`,

  // Step 3: Check if new email is available & send OTP to the NEW email
  SEND_NEW_EMAIL_OTP: `${API_BASE_URL}/send-new-email-otp`,

  // ==========================================
  // PASSWORD MANAGEMENT ENDPOINTS
  // ==========================================

  // Call this to send OTP for OAuth users setting a password for the first time
  SEND_SET_PASSWORD_OTP: `${API_BASE_URL}/send-set-password-otp`,

  // Call this to send OTP for existing users changing their password
  SEND_CHANGE_PASSWORD_OTP: `${API_BASE_URL}/send-change-password-otp`,

  // Unified endpoint for completing the Set/Change password flow using the OTP token
  CHANGE_OR_SET_PASSWORD: `${API_BASE_URL}/change-or-set-password`,

  // Endpoint to verify password and send the account deletion OTP
  SEND_DELETE_ACCOUNT_OTP: `${API_BASE_URL}/send-delete-account-otp`,

  /**
   *
   * ------------------------------------ PROJECT ENDPOINTS -------------------------------------
   *
   */

  CREATE_PROJECT: `${API_BASE_URL}/project/create-project`,
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
    return `${API_BASE_URL}/project/fetch-created-projects${q ? `?${q}` : ""}`;
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
    return `${API_BASE_URL}/project/fetch-assign-projects${q ? `?${q}` : ""}`;
  },

  FETCH_PROJECT: (projectId: string) =>
    `${API_BASE_URL}/project/${projectId}/fetch-project`,
  UPDATE_PROJECT: `${API_BASE_URL}/project/update-project`,
  UPDATE_PROJECT_STATUS: (projectId: string) =>
    `${API_BASE_URL}/project/${projectId}/update-project-status`,
  UPDATE_PROJECT_DEADLINE: (projectId: string) =>
    `${API_BASE_URL}/project/${projectId}/update-project-deadline`,
  UPDATE_PROJECT_PRIORITY: (projectId: string) =>
    `${API_BASE_URL}/project/${projectId}/update-project-priority`,
  LEAVE_PROJECT: (projectId: string) =>
    `${API_BASE_URL}/project/${projectId}/leave`,
  DELETE_PROJECT: (projectId: string) =>
    `${API_BASE_URL}/project/${projectId}/delete-project`,

  /**
   *
   * ------------------------------------ TASKS ENDPOINTS -------------------------------------
   *
   */

  CREATE_PRIVATE_TASK: `${API_BASE_URL}/task/create-private-task`,

  CREATE_PROJECT_TASK: `${API_BASE_URL}/task/create-project-task`,

  FETCH_SINGLE_TASK: (taskId: string) =>
    `${API_BASE_URL}/task/${taskId}/fetch-task`,

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
    return `${API_BASE_URL}/task/${projectId}/fetch-project-task${q ? `?${q}` : ""}`;
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
    return `${API_BASE_URL}/task/fetch-private-task${q ? `?${q}` : ""}`;
  },

  UPDATE_PRIVATE_TASK: `${API_BASE_URL}/task/update-private-task`,
  UPDATE_PROJECT_TASK: `${API_BASE_URL}/task/update-project-task`,
  UPDATE_PRIVATE_TASK_STATUS: `${API_BASE_URL}/task/update-private-task-status`,
  UPDATE_PRIVATE_TASK_DEADLINE: `${API_BASE_URL}/task/update-private-task-deadline`,
  UPDATE_PRIVATE_TASK_PRIORITY: `${API_BASE_URL}/task/update-private-task-priority`,
  UPDATE_PROJECT_TASK_STATUS: `${API_BASE_URL}/task/update-project-task-status`,
  UPDATE_PROJECT_TASK_DEADLINE: `${API_BASE_URL}/task/update-project-task-deadline`,
  UPDATE_PROJECT_TASK_PRIORITY: `${API_BASE_URL}/task/update-project-task-priority`,

  DELETE_PRIVATE_TASK: (taskId: string) =>
    `${API_BASE_URL}/task/${taskId}/delete-private-task`,

  DELETE_PROJECT_TASK: (projectId: string, taskId: string) =>
    `${API_BASE_URL}/task/${projectId}/${taskId}/delete-project-task`,

  /**
   *
   * ------------------------------------ MEMBERS ENDPOINTS -------------------------------------
   *
   */

  ADD_MEMBER: `${API_BASE_URL}/member/add-member`,

  FETCH_MEMBERS: (projectId: string, limit?: number, skip?: number) => {
    const params = new URLSearchParams();
    if (limit !== undefined) params.append("limit", String(limit));
    if (skip !== undefined) params.append("skip", String(skip));
    const q = params.toString();
    return `${API_BASE_URL}/member/${projectId}/fetch-member${q ? `?${q}` : ""}`;
  },

  UPDATE_MEMBER_ROLE: `${API_BASE_URL}/member/update-role`,

  REMOVE_MEMBER: (memberId: string, projectId: string) =>
    `${API_BASE_URL}/member/${memberId}/${projectId}/remove-member`,

  /**
   *
   * ------------------------------------ MESSAGES ENDPOINTS -------------------------------------
   *
   */
  SEND_MESSAGE: `${API_BASE_URL}/message/send-message`,
  FETCH_PRIVATE_MESSAGES: (limit?: number, skip?: number) => {
    const params = new URLSearchParams();
    if (limit !== undefined) params.append("limit", String(limit));
    if (skip !== undefined) params.append("skip", String(skip));
    const q = params.toString();
    return `${API_BASE_URL}/message/private-message${q ? `?${q}` : ""}`;
  },

  FETCH_PROJECT_MESSAGE: (projectId: string, limit?: number, skip?: number) => {
    const params = new URLSearchParams();
    if (limit !== undefined) params.append("limit", String(limit));
    if (skip !== undefined) params.append("skip", String(skip));
    const q = params.toString();
    return `${API_BASE_URL}/message/${projectId}/project-message${q ? `?${q}` : ""}`;
  },

  FETCH_TASK_MESSAGE: (taskId: string, limit?: number, skip?: number) => {
    const params = new URLSearchParams();
    if (limit !== undefined) params.append("limit", String(limit));
    if (skip !== undefined) params.append("skip", String(skip));
    const q = params.toString();
    return `${API_BASE_URL}/message/${taskId}/task-message${q ? `?${q}` : ""}`; // (you’ll build this)
  },

  UPDATE_MESSAGE: (messageId: string) =>
    `${API_BASE_URL}/message/${messageId}/update-message`, // (you’ll build this)
  DELETE_MESSAGE: (messageId: string) =>
    `${API_BASE_URL}/message/${messageId}/delete-message`, // (you’ll build this)

  // 📌 Assignment
  ASSIGN_TASK: `${API_BASE_URL}/task/assign`,

  /**
   * ------------------------------------COMMENTS ENDPOINT---------------------------------------------
   */

  ADD_COMMENT: (taskId: string) => `${API_BASE_URL}/${taskId}/add-comment`,
  FETCH_COMMENT: (commentId: string) =>
    `${API_BASE_URL}/${commentId}/fetch-comment`,
  FETCH_TASK_COMMENT: (taskId: string) =>
    `${API_BASE_URL}/${taskId}/fetch-task-comments`,
  FETCH_USER_COMMENT: `${API_BASE_URL}/fetch-user-comments`,
  DELETE_COMMENT: `${API_BASE_URL}/delete-comment`,

  // DashBoard
  GET_RECENT_TASKS: (limit?: number) =>
    `${API_BASE_URL}/task/dashboard/recent-tasks?limit=${limit}`,
  GET_RECENT_PROJECT: (limit?: number) =>
    `${API_BASE_URL}/project/dashboard/recent-project?limit=${limit}`,

  /**
   * ------------------------------------USER ENDPOINT---------------------------------------------
   */

  SEARCH_USER: (userData: string, limit?: number) =>
    `${API_BASE_URL}/user/search?query=${userData}&limit=${limit}`,
  UPDATE_PROFILE_IMAGE: `${API_BASE_URL}/user/update-profile-img`,
  DELETE_ACCOUNT: `${API_BASE_URL}/user/deleteAccount`,
};

export type fetchStatusType = "COMPLETED" | "IN_PROGRESS" | "ALL";
