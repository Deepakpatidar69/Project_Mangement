import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { apiClient } from "../../api/client";
import { getToken, removeToken, setToken } from "../../utils/storage";
import { API_ENDPOINTS } from "../../api/endpoint";
import { AuthProps } from "./types";
import { formatSingleUser } from "../TypeFormatter";
import { getApiError } from "../ApiError";

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
    forgotPassword: boolean;
    resetPassword: boolean;

    googleLogin: boolean;
    githubLogin: boolean;

    verifyEmail: boolean;
    resendVerification: boolean;
  };

  success: {
    register: boolean;
    login: boolean;
    updateProfile: boolean;
    loadUser: boolean;
    logout: boolean;

    changePassword: boolean;
    forgotPassword: boolean;
    resetPassword: boolean;

    googleLogin: boolean;
    githubLogin: boolean;

    verifyEmail: boolean;
    resendVerification: boolean;
  };

  error: {
    registerError: string | null;
    loginError: string | null;
    updateError: string | null;
    loadUserError: string | null;
    logoutError: string | null;

    changePasswordError: string | null;
    forgotPasswordError: string | null;
    resetPasswordError: string | null;

    googleLoginError: string | null;
    githubLoginError: string | null;

    verifyEmailError: string | null;
    resendVerificationError: string | null;
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
    forgotPassword: false,
    githubLogin: false,
    googleLogin: false,
    resetPassword: false,
    resendVerification: false,
    verifyEmail: false,
  },
  success: {
    register: false,
    login: false,
    loadUser: false,
    updateProfile: false,
    logout: false,
    changePassword: false,
    forgotPassword: false,
    githubLogin: false,
    googleLogin: false,
    resetPassword: false,
    resendVerification: false,
    verifyEmail: false,
  },
  error: {
    registerError: null,
    loginError: null,
    loadUserError: null,
    updateError: null,
    logoutError: null,
    changePasswordError: null,
    forgotPasswordError: null,
    githubLoginError: null,
    googleLoginError: null,
    resetPasswordError: null,
    resendVerificationError: null,
    verifyEmailError: null,
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
      const res = await apiClient.post(API_ENDPOINTS.GOOGLE_LOGIN, data);


      console.log(`Res is :: ${JSON.stringify(res.data)} ------------------------------------`)

      const token = res.data.token;

      console.log(`Token is :: ${token} -------------------------`);
      
      await setToken(token); // Store token locally

      return {
        user: res.data.user,
        token,
      };
    } catch (err: any) {
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

export const changePassword = createAsyncThunk(
  "auth/changePassword",
  async (
    data: {
      currentPassword: string;
      newPassword: string;
      confirmPassword: string;
    },
    thunkAPI,
  ) => {
    try {
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

export const forgotPassword = createAsyncThunk(
  "auth/forgotPassword",
  async (
    data: {
      email: string;
    },
    thunkAPI,
  ) => {
    try {
      const res = await apiClient.post(API_ENDPOINTS.FORGOT_PASSWORD, data);

      return {
        message: res.data.message,
      };
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        getApiError(err, "Unable to send reset email"),
      );
    }
  },
);

export const resetPassword = createAsyncThunk(
  "auth/resetPassword",
  async (
    data: {
      token: string;
      password: string;
      confirmPassword: string;
    },
    thunkAPI,
  ) => {
    try {
      const res = await apiClient.patch(
        `${API_ENDPOINTS.RESET_PASSWORD}/${data.token}`,
        {
          password: data.password,
          confirmPassword: data.confirmPassword,
        },
      );

      return {
        message: res.data.message,
      };
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        getApiError(err, "Unable to reset password"),
      );
    }
  },
);

export const verifyEmail = createAsyncThunk(
  "auth/verifyEmail",
  async (token: string, thunkAPI) => {
    try {
      const res = await apiClient.patch(
        `${API_ENDPOINTS.VERIFY_EMAIL}/${token}`,
      );

      return {
        message: res.data.message,
        user: res.data.user,
      };
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        getApiError(err, "Email verification failed"),
      );
    }
  },
);

export const resendVerification = createAsyncThunk(
  "auth/resendVerification",
  async (_, thunkAPI) => {
    try {
      const res = await apiClient.post(API_ENDPOINTS.RESEND_VERIFICATION);

      return {
        message: res.data.message,
      };
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        getApiError(err, "Unable to resend verification email"),
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
  await removeToken();
});

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
        forgotPassword: false,
        githubLogin: false,
        googleLogin: false,
        resetPassword: false,
        resendVerification: false,
        verifyEmail: false,
      };
      state.isAuthenticated = false;
      state.error = {
        registerError: null,
        loginError: null,
        loadUserError: null,
        updateError: null,
        logoutError: null,
        changePasswordError: null,
        forgotPasswordError: null,
        githubLoginError: null,
        googleLoginError: null,
        resetPasswordError: null,
        resendVerificationError: null,
        verifyEmailError: null,
      };
      state.success = {
        register: false,
        login: false,
        loadUser: false,
        updateProfile: false,
        logout: false,
        changePassword: false,
        forgotPassword: false,
        githubLogin: false,
        googleLogin: false,
        resetPassword: false,
        resendVerification: false,
        verifyEmail: false,
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
        forgotPasswordError: null,
        githubLoginError: null,
        googleLoginError: null,
        resetPasswordError: null,
        resendVerificationError: null,
        verifyEmailError: null,
      };
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

      /** ------------------------------- RESET PASSWORD ---------------------------------- */

      .addCase(resetPassword.pending, (state) => {
        state.loading.resetPassword = true;
        state.success.resetPassword = false;
        state.error.resetPasswordError = null;
      })

      .addCase(resetPassword.fulfilled, (state) => {
        state.loading.resetPassword = false;
        state.success.resetPassword = true;
      })

      .addCase(resetPassword.rejected, (state, action: any) => {
        state.loading.resetPassword = false;
        state.success.resetPassword = false;
        state.error.resetPasswordError = action.payload;
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
      })

      /** ------------------------------- VERIFY EMAIL  ---------------------------------- */

      .addCase(verifyEmail.pending, (state) => {
        state.loading.verifyEmail = true;
        state.success.verifyEmail = false;
        state.error.verifyEmailError = null;
      })

      .addCase(verifyEmail.fulfilled, (state) => {
        state.loading.verifyEmail = false;
        state.success.verifyEmail = true;

        if (state.user) {
          state.user.isEmailVerified = true;
          state.user.emailVerifiedAt = new Date().toISOString();
        }
      })

      .addCase(verifyEmail.rejected, (state, action: any) => {
        state.loading.verifyEmail = false;
        state.success.verifyEmail = false;
        state.error.verifyEmailError = action.payload;
      })

      /** ------------------------------- RESEND VERIFY EMAIL  ---------------------------------- */

      .addCase(resendVerification.pending, (state) => {
        state.loading.resendVerification = true;
        state.success.resendVerification = false;
        state.error.resendVerificationError = null;
      })

      .addCase(resendVerification.fulfilled, (state) => {
        state.loading.resendVerification = false;
        state.success.resendVerification = true;
      })

      .addCase(resendVerification.rejected, (state, action: any) => {
        state.loading.resendVerification = false;
        state.success.resendVerification = false;
        state.error.resendVerificationError = action.payload;
      });
  },
});

export const { resetAuthState, clearAuthError } = authSlice.actions;
export default authSlice.reducer;
