import { API_ENDPOINTS } from "../../api/endpoint";
import { AppDispatch } from "../../store";
import { logoutUser } from "../../store/slices/authSlice";
import { clearAllStates } from "../../utils/storage";

export interface SendOtpResult {
  success: boolean;
  message: string;
}

// Extended interface specifically for the verify response
export interface VerifyOtpResult extends SendOtpResult {
  resetToken?: string; // Used for Forgot, Set, and Change password flows
  transferToken?: string; // Used for Transfer Ownership flow
  deleteToken?: string; // NEW: Used for Delete Account flow
}

export const onLogoutUser = async (dispatch: AppDispatch) => {
  await dispatch(logoutUser());
  await clearAllStates(dispatch);
};

/**
 * Internal helper — not exported. Does the actual network call and
 * normalizes the response shape for requests that only need an email.
 */
const postEmailToEndpoint = async (
  endpoint: string,
  email: string,
): Promise<SendOtpResult> => {
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        message: data?.error || "Failed to send OTP. Please try again.",
      };
    }

    return {
      success: true,
      message: data?.message || "OTP sent successfully!",
    };
  } catch (err) {
    console.log("OTP request failed:", err);
    return {
      success: false,
      message: "Network error. Please check your connection and try again.",
    };
  }
};

export const sendRegistrationOtpUtil = async (
  email: string,
): Promise<SendOtpResult> => {
  return postEmailToEndpoint(API_ENDPOINTS.SEND_REGISTRATION_OTP, email);
};

export const sendForgotPasswordOtpUtil = async (
  email: string,
): Promise<SendOtpResult> => {
  return postEmailToEndpoint(API_ENDPOINTS.SEND_RESET_OTP, email);
};

// NEW: Send OTP for OAuth users setting up a password
export const sendSetPasswordOtpUtil = async (
  email: string,
): Promise<SendOtpResult> => {
  return postEmailToEndpoint(API_ENDPOINTS.SEND_SET_PASSWORD_OTP, email);
};

// UPDATED: Send OTP for standard users changing their password (now supports currentPassword)
export const sendChangePasswordOtpUtil = async (
  email: string,
  currentPassword?: string,
): Promise<SendOtpResult> => {
  try {
    const response = await fetch(API_ENDPOINTS.SEND_CHANGE_PASSWORD_OTP, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        ...(currentPassword && { currentPassword }),
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        message:
          data?.error ||
          data?.message ||
          "Failed to verify current password and send OTP.",
      };
    }

    return {
      success: true,
      message: data?.message || "OTP sent successfully!",
    };
  } catch (err) {
    console.log("Change Password OTP request failed:", err);
    return {
      success: false,
      message: "Network error. Please check your connection and try again.",
    };
  }
};

export const sendTransferOwnershipOtpUtil = async (
  email: string,
  password: string,
): Promise<SendOtpResult> => {
  try {
    const response = await fetch(API_ENDPOINTS.SEND_TRANSFER_OWNERSHIP_OTP, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        message: data?.error || "Failed to verify password and send OTP.",
      };
    }

    return {
      success: true,
      message: data?.message || "OTP sent successfully!",
    };
  } catch (err) {
    console.log("Transfer Ownership OTP request failed:", err);
    return {
      success: false,
      message: "Network error. Please check your connection and try again.",
    };
  }
};

// NEW: Send OTP for Delete Account flow
export const sendDeleteAccountOtpUtil = async (
  email: string,
  password?: string,
): Promise<SendOtpResult> => {
  try {
    const response = await fetch(API_ENDPOINTS.SEND_DELETE_ACCOUNT_OTP, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, ...(password && { password }) }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        message: data?.error || "Failed to verify password and send OTP.",
      };
    }

    return {
      success: true,
      message: data?.message || "OTP sent successfully!",
    };
  } catch (err) {
    console.log("Delete Account OTP request failed:", err);
    return {
      success: false,
      message: "Network error. Please check your connection and try again.",
    };
  }
};

/**
 * Verifies the OTP code.
 */
export const verifyOtpUtil = async (
  email: string,
  otp: string,
  type:
    | "REGISTRATION"
    | "FORGOT_PASSWORD"
    | "TRANSFER_OWNERSHIP"
    | "SET_PASSWORD"
    | "CHANGE_PASSWORD"
    | "DELETE_USER",
): Promise<VerifyOtpResult> => {
  try {
    const response = await fetch(API_ENDPOINTS.VERIFY_OTP, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp, type }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        message: data?.error || "Invalid or expired OTP.",
      };
    }

    return {
      success: true,
      message: data?.message || "OTP verified successfully!",
      resetToken:
        data?.resetToken || data?.setPasswordToken || data?.changePasswordToken,
      transferToken: data?.transferToken,
      deleteToken: data?.deleteToken,
    };
  } catch (err) {
    console.log("OTP verification failed:", err);
    return {
      success: false,
      message: "Network error. Please check your connection and try again.",
    };
  }
};

export const sendNewEmailOtpUtil = async ({
  newEmail,
  transferToken,
  currentEmail,
}: {
  newEmail: string;
  transferToken: string;
  currentEmail: string;
}): Promise<SendOtpResult> => {
  try {
    const response = await fetch(API_ENDPOINTS.SEND_NEW_EMAIL_OTP, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newEmail, transferToken, currentEmail }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        message: data?.error || "Failed to send OTP to the new email.",
      };
    }

    return {
      success: true,
      message: data?.message || "OTP sent successfully!",
    };
  } catch (err) {
    console.log("Send New Email OTP request failed:", err);
    return {
      success: false,
      message: "Network error. Please check your connection and try again.",
    };
  }
};

export const confirmTransferOwnershipUtil = async ({
  currentEmail,
  newEmail,
  otp,
  transferToken,
}: {
  currentEmail: string;
  newEmail: string;
  otp: string;
  transferToken: string;
}): Promise<SendOtpResult> => {
  try {
    const response = await fetch(API_ENDPOINTS.CONFIRM_TRANSFER_OWNERSHIP, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentEmail, newEmail, otp, transferToken }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        message: data?.error || "Failed to confirm ownership transfer.",
      };
    }

    return {
      success: true,
      message: data?.message || "Ownership transferred successfully!",
    };
  } catch (err) {
    console.log("Confirm Transfer Ownership request failed:", err);
    return {
      success: false,
      message: "Network error. Please check your connection and try again.",
    };
  }
};

export const resetPasswordWithOtp = async ({
  resetToken,
  newPassword,
  confirmPassword,
}: {
  resetToken: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await fetch(API_ENDPOINTS.FORGOT_RESET_PASSWORD, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resetToken, newPassword, confirmPassword }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        message:
          data?.error || "Failed to reset password. Token may be expired.",
      };
    }

    return {
      success: true,
      message: data?.message || "Password updated successfully!",
    };
  } catch (err) {
    console.error("Reset password failed:", err);
    return {
      success: false,
      message: "Network error. Please check your connection and try again.",
    };
  }
};
