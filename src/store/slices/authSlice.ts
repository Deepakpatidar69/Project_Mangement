import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { apiClient } from "../../api/client";
import { getToken, removeToken, setToken } from "../../utils/storage";
import { API_ENDPOINTS } from "../../api/endpoint";
import { AuthProps } from "./types";
import { formatSingleUser } from "../TypeFormatter";
import { getApiError } from "../ApiError";
import { signOutUser } from "../../authentation/googleSignIn.utils";

interface AuthState {
  user: AuthProps | null;
  token: string | null;

  loading: {
    register: boolean;
    login: boolean;
    updateProfile: boolean;
    loadUser: boolean;
    logout: boolean;
    changePassword: boolean;
    googleLogin: boolean;
    githubLogin: boolean;
  };

  success: {
    register: boolean;
    login: boolean;
    updateProfile: boolean;
    loadUser: boolean;
    logout: boolean;

    changePassword: boolean;

    googleLogin: boolean;
    githubLogin: boolean;
  };

  error: {
    registerError: string | null;
    loginError: string | null;
    updateError: string | null;
    loadUserError: string | null;
    logoutError: string | null;

    changePasswordError: string | null;

    googleLoginError: string | null;
    githubLoginError: string | null;
  };

  isAuthenticated: boolean;
  isCheckLoadUser: boolean;
}

const authInitialState: AuthState = {
  user: null,
  token: null,
  loading: {
    register: false,
    login: false,
    loadUser: false,
    updateProfile: false,
    logout: false,
    changePassword: false,
    githubLogin: false,
    googleLogin: false,
  },
  success: {
    register: false,
    login: false,
    loadUser: false,
    updateProfile: false,
    logout: false,
    changePassword: false,
    githubLogin: false,
    googleLogin: false,
  },
  error: {
    registerError: null,
    loginError: null,
    loadUserError: null,
    updateError: null,
    logoutError: null,
    changePasswordError: null,
    githubLoginError: null,
    googleLoginError: null,
  },
  isAuthenticated: false,
  isCheckLoadUser: false,
};

// # LOAD USER

export const loadUser = createAsyncThunk(
  "auth/loadUser",
  async (_, thunkAPI) => {
    try {
      const token = await getToken();
      if (!token) return thunkAPI.rejectWithValue("No token found");

      const res = await apiClient.post(API_ENDPOINTS.VERIFY_URL);
      return {
        message: res.data.message,
        user: res.data.user,
      };
    } catch (err: any) {
      await removeToken();

      return thunkAPI.rejectWithValue(getApiError(err, "Session expired"));
    }
  },
);

// # 🔥 LOGIN

export const loginUser = createAsyncThunk(
  "auth/login",
  async (data: { email: string; password: string }, thunkAPI) => {
    try {
      const res = await apiClient.post(API_ENDPOINTS.LOGIN, data);

      const token = res.data.token;
      await setToken(token);
      return {
        user: res.data.user,
        token,
      };
    } catch (err: any) {
      return thunkAPI.rejectWithValue(getApiError(err, "Login failed"));
    }
  },
);

// # 🔥 REGISTER

export const registerUser = createAsyncThunk(
  "auth/register",
  async (
    data: {
      firstName: string;
      lastName: string;
      email: string;
      password: string;
      otp: string;
      phone?: string;
    },
    thunkAPI,
  ) => {
    try {
      const res = await apiClient.post(API_ENDPOINTS.REGISTER, data);
      const token = res.data.token;

      await setToken(token); // 🔥 store

      return {
        user: res.data.user,
        token,
      };
    } catch (err: any) {
      return thunkAPI.rejectWithValue(getApiError(err, "Register failed"));
    }
  },
);

export const googleAuthUser = createAsyncThunk(
  "auth/google",
  async (
    data: {
      email: string;
      firstName: string;
      lastName: string | null;
      fullName: string; // Required by your Prisma schema
      googleId: string; // Maps to your googleId field
      profileImgUrl?: string; // Maps to your profileImgUrl field
    },
    thunkAPI,
  ) => {
    try {

      console.log(`i am call in this ::: for googleSignIn`)

      const res = await apiClient.post(API_ENDPOINTS.GOOGLE_LOGIN, data);

      const token = res.data.token;

      await setToken(token); // Store token locally

      return {
        user: res.data.user,
        token,
      };
    } catch (err: any) {
      console.log(`Err is ::: ${err}`);
      return thunkAPI.rejectWithValue(getApiError(err, "Google Auth failed"));
    }
  },
);

export const githubAuthUser = createAsyncThunk(
  "auth/github",
  async (
    data: {
      email: string;
      firstName: string;
      lastName: string | null;
      fullName: string;
      githubId: string; // Maps to your Prisma schema
      profileImgUrl?: string;
    },
    thunkAPI,
  ) => {
    try {
      const res = await apiClient.post(API_ENDPOINTS.GITHUB_LOGIN, data);

      const token = res.data.token;
      await setToken(token); // Store token locally

      return {
        user: res.data.user,
        token,
      };
    } catch (err: any) {
      return thunkAPI.rejectWithValue(getApiError(err, "GitHub Auth failed"));
    }
  },
);

// # UPDATE

export const updateProfile = createAsyncThunk(
  "auth/updateProfile",
  async (data: Partial<Omit<AuthProps, "userId" | "stats">>, thunkAPI) => {
    try {
      const res = await apiClient.post(API_ENDPOINTS.UPDATE_PROFILE, data);

      return {
        user: res.data.user,
      };
    } catch (err: any) {
      return thunkAPI.rejectWithValue(getApiError(err, "Update failed"));
    }
  },
);

export const updateProfileImageThunk = createAsyncThunk(
  "auth/updateProfileImage",
  async (
    file: { uri: string; type: string; name: string },
    { rejectWithValue },
  ) => {
    try {
      const formData = new FormData();
      formData.append("file", {
        uri: file.uri,
        type: file.type || "image/jpeg",
        name: file.name || "profile.jpg",
      } as any);

      const res = await apiClient.post(
        API_ENDPOINTS.UPDATE_PROFILE_IMAGE,
        formData,
      );

      return res.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update profile image.",
      );
    }
  },
);

export const changePassword = createAsyncThunk(
  "auth/changePassword",
  async (
    data: {
      currentPassword?: string; // Optional: Used for standard change without OTP
      newPassword: string;
      confirmPassword: string;
      token: string; // Optional: Used when verifying via email OTP
    },
    thunkAPI,
  ) => {
    try {
      // NOTE: Make sure this points to your unified endpoint
      // (e.g., API_ENDPOINTS.CHANGE_OR_SET_PASSWORD or whichever name you kept)
      const res = await apiClient.patch(API_ENDPOINTS.CHANGE_PASSWORD, data);

      return {
        message: res.data.message,
      };
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        getApiError(err, "Unable to change password"),
      );
    }
  },
);

export const googleLogin = createAsyncThunk(
  "auth/googleLogin",
  async (
    data: {
      code: string;
    },
    thunkAPI,
  ) => {
    try {
      const res = await apiClient.post(API_ENDPOINTS.GOOGLE_LOGIN, data);

      const token = res.data.token;

      await setToken(token);

      return {
        token,
        user: res.data.user,
      };
    } catch (err: any) {
      return thunkAPI.rejectWithValue(getApiError(err, "Google login failed"));
    }
  },
);

export const githubLogin = createAsyncThunk(
  "auth/githubLogin",
  async (
    data: {
      code: string;
    },
    thunkAPI,
  ) => {
    try {
      const res = await apiClient.post(API_ENDPOINTS.GITHUB_LOGIN, data);

      const token = res.data.token;

      await setToken(token);

      return {
        token,
        user: res.data.user,
      };
    } catch (err: any) {
      return thunkAPI.rejectWithValue(getApiError(err, "GitHub login failed"));
    }
  },
);

export const logoutUser = createAsyncThunk("auth/logoutUser", async () => {
  await signOutUser(); // Sign out from Firebase and Google
  await removeToken();
});

export const fetchUserProfileThunk = createAsyncThunk(
  "auth/fetchUserProfile",
  async (_, thunkAPI) => {
    try {
      const res = await apiClient.post(API_ENDPOINTS.FETCH_PROFILE_DATA);
      return {
        message: res.data.message,
        user: res.data.user,
      };
    } catch (error: any) {
      if (error.response?.status === 401) {
        return thunkAPI.rejectWithValue("UNAUTHORIZED");
      }
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to fetch profile";
      return thunkAPI.rejectWithValue(message);
    }
  },
);

const authSlice = createSlice({
  name: "authSlice",
  initialState: authInitialState,
  reducers: {
    resetAuthState: (state) => {
      state.loading = {
        register: false,
        login: false,
        loadUser: false,
        updateProfile: false,
        logout: false,
        changePassword: false,
        githubLogin: false,
        googleLogin: false,
      };
      state.isAuthenticated = false;
      state.error = {
        registerError: null,
        loginError: null,
        loadUserError: null,
        updateError: null,
        logoutError: null,
        changePasswordError: null,
        githubLoginError: null,
        googleLoginError: null,
      };
      state.success = {
        register: false,
        login: false,
        loadUser: false,
        updateProfile: false,
        logout: false,
        changePassword: false,
        githubLogin: false,
        googleLogin: false,
      };
      state.token = null;
      state.user = null;
    },

    clearAuthError: (state) => {
      state.error = {
        registerError: null,
        loginError: null,
        loadUserError: null,
        updateError: null,
        logoutError: null,
        changePasswordError: null,
        githubLoginError: null,
        googleLoginError: null,
      };
    },

    // Inside authSlice.ts reducers:
    updateUserStats: (state, action) => {
      if (state.user && state.user.stats) {
        const updates = action.payload;
        const current = state.user.stats;

        // 1. Calculate new totals and completed counts first
        const newTotalProjects =
          updates.projectsCount !== undefined
            ? current.totalProjects + updates.projectsCount
            : current.totalProjects;

        const newTotalMyProjects =
          updates.projectsCount !== undefined
            ? current.totalMyProjects + updates.projectsCount
            : current.totalMyProjects;

        const newTotalTasks =
          updates.tasksCount !== undefined
            ? current.totalTasks + updates.tasksCount
            : current.totalTasks;

        const newCompletedProjects =
          updates.completedProjectsCount !== undefined
            ? current.completedProjects + updates.completedProjectsCount
            : current.completedProjects;

        const newCompletedMyProjects =
          updates.completedProjectsCount !== undefined
            ? current.completedMyProjects + updates.completedProjectsCount
            : current.completedMyProjects;

        const newCompletedTasks =
          updates.completedTasksCount !== undefined
            ? current.completedTasks + updates.completedTasksCount
            : current.completedTasks;

        // 2. Build the updated stats object with auto-calculated pending counts
        state.user.stats = {
          ...current,

          totalProjects: newTotalProjects,
          totalMyProjects: newTotalMyProjects,
          totalTasks: newTotalTasks,

          completedProjects: newCompletedProjects,
          completedMyProjects: newCompletedMyProjects,
          completedTasks: newCompletedTasks,

          // Automatically computed pending counts (Total - Completed)
          pendingProjects: Math.max(0, newTotalProjects - newCompletedProjects),
          pendingMyProjects: Math.max(
            0,
            newTotalMyProjects - newCompletedMyProjects,
          ),
          pendingTasks: Math.max(0, newTotalTasks - newCompletedTasks),
        };
      }
    },
  },
  extraReducers: (builder) => {
    builder

      /** ----------------------------- LOGIN USER --------------------------------- */

      .addCase(loginUser.pending, (state) => {
        state.loading.login = true;
        state.error.loginError = null;
        state.success.login = false;
        state.isAuthenticated = false;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.user = formatSingleUser(action.payload.user);
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.loading.login = false;
        state.success.login = true;
        state.error.loadUserError = null;
      })
      .addCase(loginUser.rejected, (state, action: any) => {
        state.loading.login = false;
        state.success.login = false;
        state.isAuthenticated = false;
        state.error.loginError = action.payload;
      })

      /**------------------------------- REGISTER USER -------------------------------*/

      .addCase(registerUser.pending, (state) => {
        state.isAuthenticated = false;
        state.loading.register = true;
        state.success.register = false;
        state.error.registerError = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.user = formatSingleUser(action.payload.user);
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.loading.register = false;
        state.success.register = true;
        state.error.registerError = null;
      })
      .addCase(registerUser.rejected, (state, action: any) => {
        state.error.registerError = action.payload;
        state.isAuthenticated = false;
        state.loading.register = false;
        state.success.register = false;
        state.user = null;
        state.token = null;
      })

      /** --------------------------- LOGOUT USER ---------------------------------- */

      .addCase(logoutUser.pending, (state) => {
        state.loading.logout = true;
        state.success.logout = false;
        state.error.logoutError = null;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.success.logout = true;
        state.loading.logout = false;
        state.isAuthenticated = false;
      })
      .addCase(logoutUser.rejected, (state, action: any) => {
        state.loading.logout = false;
        state.success.logout = false;
        state.error.logoutError = action.payload || "Failed to logout";
      })

      /** ------------------------------ LOAD USER -------------------------------------- */

      .addCase(loadUser.pending, (state) => {
        state.error.loadUserError = null;
        state.loading.loadUser = true;
        state.isAuthenticated = false;
        state.success.loadUser = false;
      })
      .addCase(loadUser.fulfilled, (state, action) => {
        state.loading.loadUser = false;
        state.success.loadUser = true;

        const formatUser = formatSingleUser(action.payload.user);

        state.user = formatUser;
        state.isAuthenticated = true;
        state.error.loadUserError = null;
        state.isCheckLoadUser = true;
      })
      .addCase(loadUser.rejected, (state, action: any) => {
        state.isAuthenticated = false;
        state.isCheckLoadUser = true;
        state.error.loadUserError = action.payload;
        state.success.loadUser = false;
        state.loading.loadUser = false;
        state.user = null;
        state.token = null;
      })

      /** ------------------------------ FETCH PROFILE --------------------------------- */

      .addCase(fetchUserProfileThunk.pending, (state) => {
        // ✅ ONLY update loading state.
        // ❌ DO NOT set state.user = null here! This prevents the login screen redirect during pull-to-refresh.
        state.loading.loadUser = true;
        state.error.loadUserError = null;
      })

      .addCase(fetchUserProfileThunk.fulfilled, (state, action) => {
        state.loading.loadUser = false;

        const formatUser = formatSingleUser(action.payload.user);
        state.user = formatUser;
      })

      .addCase(fetchUserProfileThunk.rejected, (state, action) => {
        state.loading.loadUser = false;
        state.error.loadUserError = action.payload as string;

        if (action.payload === "UNAUTHORIZED") {
          state.user = null;
          state.token = null;
        }
      })

      /** ------------------------------ GOOGLE LOGIN --------------------------------- */
      .addCase(googleAuthUser.pending, (state) => {
        state.error.googleLoginError = null;
        state.loading.googleLogin = true;
        state.success.googleLogin = false;
      })
      .addCase(googleAuthUser.fulfilled, (state, action) => {
        state.loading.googleLogin = false;
        state.success.googleLogin = true;

        try {
          state.user = formatSingleUser(action.payload.user);
        } catch (e) {
          console.log(
            "formatSingleUser failed on Google payload:",
            action.payload.user,
            e,
          );
          state.user = action.payload.user; // fall back to raw user rather than crashing
        }

        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error.googleLoginError = null;
      })
      .addCase(googleAuthUser.rejected, (state, action: any) => {
        state.error.googleLoginError = action.payload;
        state.success.googleLogin = false;
        state.loading.googleLogin = false;
      })

      /** ------------------------------ GITHUB LOGIN ----------------------------------*/
      .addCase(githubAuthUser.pending, (state) => {
        state.error.githubLoginError = null;
        state.loading.githubLogin = true;
        state.success.githubLogin = false;
      })
      .addCase(githubAuthUser.fulfilled, (state, action) => {
        state.loading.githubLogin = false;
        state.success.githubLogin = true;

        try {
          state.user = formatSingleUser(action.payload.user);
        } catch (e) {
          console.log(
            "formatSingleUser failed on Google payload:",
            action.payload.user,
            e,
          );
          state.user = action.payload.user; // fall back to raw user rather than crashing
        }

        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error.githubLoginError = null;
      })
      .addCase(githubAuthUser.rejected, (state, action: any) => {
        state.error.githubLoginError = action.payload;
        state.success.githubLogin = false;
        state.loading.githubLogin = false;
      })

      /** ------------------------------- UPDATE USER ---------------------------------- */

      .addCase(updateProfile.pending, (state) => {
        state.loading.updateProfile = true;
        state.error.updateError = null;
        state.success.updateProfile = false;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading.updateProfile = false;
        state.user = formatSingleUser(action.payload.user);
        state.isAuthenticated = true;
        state.success.updateProfile = true;
        state.error.updateError = null;
      })
      .addCase(updateProfile.rejected, (state, action: any) => {
        state.loading.updateProfile = false;
        state.success.updateProfile = false;
        state.error.updateError = action.payload;
      })

      /** ---------------------------- Update Profile Image -------------------------------- */

      .addCase(updateProfileImageThunk.pending, (state) => {
        state.loading.updateProfile = true;
        state.error.updateError = null;
        state.success.updateProfile = false;
      })
      .addCase(updateProfileImageThunk.fulfilled, (state, action) => {
        state.loading.updateProfile = false;
        state.user!.profileImgUrl = action.payload.updatedUser.profileImgUrl;
        state.user!.profileImgPublicId =
          action.payload.updatedUser.profileImgPublicId;

        state.success.updateProfile = true;
        state.error.updateError = null;
      })
      .addCase(updateProfileImageThunk.rejected, (state, action: any) => {
        state.loading.updateProfile = false;
        state.success.updateProfile = false;
        state.error.updateError = action.payload;
      })
      /** ------------------------------- Change Password ---------------------------------- */

      .addCase(changePassword.pending, (state) => {
        state.loading.changePassword = true;
        state.success.changePassword = false;
        state.error.changePasswordError = null;
      })

      .addCase(changePassword.fulfilled, (state) => {
        state.loading.changePassword = false;
        state.success.changePassword = true;
      })

      .addCase(changePassword.rejected, (state, action: any) => {
        state.loading.changePassword = false;
        state.success.changePassword = false;
        state.error.changePasswordError = action.payload;
      })

      /** ------------------------------- GOOGLE LOGIN ---------------------------------- */

      .addCase(googleLogin.pending, (state) => {
        state.loading.googleLogin = true;
        state.success.googleLogin = false;
        state.error.googleLoginError = null;
      })

      .addCase(googleLogin.fulfilled, (state, action) => {
        state.loading.googleLogin = false;
        state.success.googleLogin = true;

        state.user = formatSingleUser(action.payload.user);
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })

      .addCase(googleLogin.rejected, (state, action: any) => {
        state.loading.googleLogin = false;
        state.success.googleLogin = false;
        state.error.googleLoginError = action.payload;
      })

      /** ------------------------------- GITHUB LOGIN ---------------------------------- */

      .addCase(githubLogin.pending, (state) => {
        state.loading.githubLogin = true;
        state.success.githubLogin = false;
        state.error.githubLoginError = null;
      })

      .addCase(githubLogin.fulfilled, (state, action) => {
        state.loading.githubLogin = false;
        state.success.githubLogin = true;

        state.user = formatSingleUser(action.payload.user);
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })

      .addCase(githubLogin.rejected, (state, action: any) => {
        state.loading.githubLogin = false;
        state.success.githubLogin = false;
        state.error.githubLoginError = action.payload;
      });
  },
});

export const { resetAuthState, clearAuthError, updateUserStats } =
  authSlice.actions;
export default authSlice.reducer;
