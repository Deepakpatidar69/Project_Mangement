import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Box, VStack, Text, Pressable, HStack } from "native-base";
import {
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
} from "react-native";
// @ts-ignore
import { Feather } from "react-native-vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAtom, useSetAtom } from "jotai";

import { AppDispatch, RootState } from "../../store";
import { useContainerDimensions } from "../../hooks/OnlayoutHooks";
import { adjustSizeToResolveZoomInIssue } from "../../utils/Helper";
import { AppLoaderAtom, isDisplayErrorMessageAtom } from "../../utils/Constent";
import { RouteStackParamStack } from "../../appNavigator/navigator.utils";
import { changePassword } from "../../store/slices/authSlice";
import { CommonDetailHeader } from "../../components/CommonDetailHeader";

import {
  sendChangePasswordOtpUtil,
  sendSetPasswordOtpUtil,
  verifyOtpUtil,
} from "./auth.utils";

export default function ChangePasswordScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RouteStackParamStack>>();
  const dispatch = useDispatch<AppDispatch>();

  const { containerDimensions, onLayout } = useContainerDimensions();
  const baseSize = containerDimensions.baseSize;

  const labelSize = adjustSizeToResolveZoomInIssue(baseSize * 0.04);
  const inputTextSize = adjustSizeToResolveZoomInIssue(baseSize * 0.04);
  const errorSize = adjustSizeToResolveZoomInIssue(baseSize * 0.032);
  const iconSize = adjustSizeToResolveZoomInIssue(baseSize * 0.05);
  const buttonTextSize = adjustSizeToResolveZoomInIssue(baseSize * 0.045);
  const statusTextSize = adjustSizeToResolveZoomInIssue(baseSize * 0.036);

  // User State
  const { user } = useSelector((state: RootState) => state.auth);
  const isSetFlow = !user?.isVerifiedByPassword;

  const setDisplayAppLoader = useSetAtom(AppLoaderAtom);
  const [, setErrorModal] = useAtom(isDisplayErrorMessageAtom);

  // ─── 3-Step Flow State ──────────────────────────────────────────────────
  const [step, setStep] = useState<"email" | "otp" | "passwords">("email");
  const [verifiedToken, setVerifiedToken] = useState(""); // Captures JWT from OTP verification

  // Input States
  const [otp, setOtp] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // ─── Live Validation ────────────────────────────────────────────────────
  const isFormValid = useMemo(() => {
    // Step 1: Require current password if they have one
    if (step === "email") {
      if (!isSetFlow && !currentPassword.trim()) return false;
      return true;
    }

    if (step === "otp") return otp.trim().length >= 4;

    // Step 3: Password step validation (only checking new passwords now)
    if (!newPassword.trim() || newPassword.length < 8) return false;
    if (!confirmPassword.trim()) return false;
    if (newPassword !== confirmPassword) return false;
    if (!isSetFlow && newPassword === currentPassword) return false;

    return true;
  }, [step, otp, currentPassword, newPassword, confirmPassword, isSetFlow]);

  useEffect(() => {
    if (step !== "passwords") return;

    if (!confirmPassword) {
      setErrors((prev) => ({ ...prev, confirmPassword: "" }));
      return;
    }
    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      setErrors((prev) => ({
        ...prev,
        confirmPassword: "Passwords do not match",
      }));
    } else {
      setErrors((prev) => ({ ...prev, confirmPassword: "" }));
    }
  }, [newPassword, confirmPassword, step]);

  useEffect(() => {
    if (step !== "passwords") return;

    if (
      !isSetFlow &&
      newPassword &&
      currentPassword &&
      newPassword === currentPassword
    ) {
      setErrors((prev) => ({
        ...prev,
        newPassword: "New password must be different from current password",
      }));
    } else if (newPassword && newPassword.length < 8) {
      setErrors((prev) => ({
        ...prev,
        newPassword: "New password must be at least 8 characters",
      }));
    } else {
      setErrors((prev) => ({ ...prev, newPassword: "" }));
    }
  }, [newPassword, currentPassword, isSetFlow, step]);

  const validatePasswords = useCallback(() => {
    const newErrors: { [key: string]: string } = {};

    if (!newPassword.trim()) {
      newErrors.newPassword = "New password is required";
    } else if (newPassword.length < 8) {
      newErrors.newPassword = "New password must be at least 8 characters";
    }
    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = "Please re-enter your new password";
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    if (
      !isSetFlow &&
      newPassword &&
      currentPassword &&
      newPassword === currentPassword
    ) {
      newErrors.newPassword =
        "New password must be different from current password";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [currentPassword, newPassword, confirmPassword, isSetFlow]);

  // ─── Step 1: Send OTP ───────────────────────────────────────────────────
  const handleSendOtp = async () => {
    if (isSubmitting) return;

    if (!isSetFlow && !currentPassword.trim()) {
      setStatusMessage({
        type: "error",
        text: "Please enter your current password to continue.",
      });
      return;
    }

    Keyboard.dismiss();
    setStatusMessage(null);
    setIsSubmitting(true);
    setDisplayAppLoader({ isLoading: true, message: "Sending OTP..." });

    try {
      const email = user?.email || "";
      // Pass the currentPassword to the util function for validation!
      const res = isSetFlow
        ? await sendSetPasswordOtpUtil(email)
        : await sendChangePasswordOtpUtil(email, currentPassword);

      if (res.success) {
        setStep("otp"); // Move to Step 2
        setStatusMessage({
          type: "success",
          text: `An OTP has been sent to ${email}.`,
        });
      } else {
        setStatusMessage({ type: "error", text: res.message });
      }
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err?.response?.data?.message || "Failed to send OTP.",
      });
    } finally {
      setIsSubmitting(false);
      setDisplayAppLoader({ isLoading: false, message: "" });
    }
  };

  // ─── Step 2: Verify OTP ─────────────────────────────────────────────────
  const handleVerifyOtp = async () => {
    if (!otp || isSubmitting) return;

    Keyboard.dismiss();
    setStatusMessage(null);
    setIsSubmitting(true);
    setDisplayAppLoader({ isLoading: true, message: "Verifying OTP..." });

    try {
      const email = user?.email || "";
      const otpType = isSetFlow ? "SET_PASSWORD" : "CHANGE_PASSWORD";

      const verifyRes = await verifyOtpUtil(email, otp, otpType);

      if (!verifyRes.success) {
        setStatusMessage({
          type: "error",
          text: verifyRes.message || "Invalid OTP",
        });
        setIsSubmitting(false);
        setDisplayAppLoader({ isLoading: false, message: "" });
        return;
      }

      if (!verifyRes.resetToken) {
        setStatusMessage({
          type: "error",
          text: "OTP verified, but no secure token was returned from the server.",
        });
        setIsSubmitting(false);
        setDisplayAppLoader({ isLoading: false, message: "" });
        return;
      }

      // Success! Move to Step 3
      setVerifiedToken(verifyRes.resetToken);
      setStep("passwords");
      setStatusMessage({
        type: "success",
        text: "OTP Verified. Please enter your new password.",
      });
    } catch (err: any) {
      setStatusMessage({ type: "error", text: "Something went wrong." });
    } finally {
      setIsSubmitting(false);
      setDisplayAppLoader({ isLoading: false, message: "" });
    }
  };

  // ─── Step 3: Update Password ────────────────────────────────────────────
  const handleUpdatePassword = async () => {
    if (!validatePasswords() || isSubmitting) return;

    Keyboard.dismiss();
    setStatusMessage(null);
    setIsSubmitting(true);
    setDisplayAppLoader({ isLoading: true, message: "Updating Password..." });

    try {
      const payload: any = {
        newPassword,
        confirmPassword,
        token: verifiedToken,
      };

      // We still include it in the final dispatch if the backend requires it
      if (!isSetFlow) {
        payload.currentPassword = currentPassword;
      }

      const result = await dispatch(changePassword(payload));

      if (changePassword.rejected.match(result)) {
        const message =
          (result.payload as string) || "Failed to update password.";
        setStatusMessage({ type: "error", text: message });
        setIsSubmitting(false);
        setDisplayAppLoader({ isLoading: false, message: "" });
        return;
      }

      // Final Success
      setIsSubmitting(false);
      setDisplayAppLoader({ isLoading: false, message: "" });

      setStatusMessage({
        type: "success",
        text: isSetFlow
          ? "Password set successfully! Redirecting..."
          : "Password updated successfully! Redirecting...",
      });

      // Wait 1.5 seconds, then go back
      setTimeout(() => {
        navigation.goBack();
      }, 1500);
    } catch (err: any) {
      setIsSubmitting(false);
      setDisplayAppLoader({ isLoading: false, message: "" });
      setStatusMessage({
        type: "error",
        text: err?.message || "Something went wrong.",
      });
    }
  };

  const clearFieldError = (field: string) => {
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const renderField = (
    label: string,
    value: string,
    onChangeText: (t: string) => void,
    show: boolean,
    setShow: (v: boolean) => void,
    fieldKey: string,
    placeholder: string,
  ) => (
    <VStack width="100%" mb={"6%"}>
      <Text
        fontSize={labelSize}
        fontWeight="600"
        color="coolGray.700"
        mb={"2%"}
      >
        {label}
      </Text>
      <HStack
        width="100%"
        alignItems="center"
        borderWidth={1}
        borderColor={errors[fieldKey] ? "red.400" : "coolGray.200"}
        borderRadius="lg"
        px={"4%"}
      >
        <TextInput
          style={[styles.textInput, { fontSize: inputTextSize }]}
          placeholder={placeholder}
          placeholderTextColor="#A0AEC0"
          secureTextEntry={!show}
          value={value}
          onChangeText={(t) => {
            onChangeText(t);
            if (fieldKey === "currentPassword") clearFieldError(fieldKey);
          }}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Pressable onPress={() => setShow(!show)} hitSlop={10}>
          <Feather
            name={show ? "eye-off" : "eye"}
            size={iconSize}
            color="#718096"
          />
        </Pressable>
      </HStack>
      {errors[fieldKey] ? (
        <Text fontSize={errorSize} color="red.500" mt={"1.5%"}>
          {errors[fieldKey]}
        </Text>
      ) : null}
    </VStack>
  );

  return (
    <Box width="100%" height="100%" bg="white" onLayout={onLayout}>
      {containerDimensions.baseSize > 0 && (
        <VStack width="100%" height="100%">
          <CommonDetailHeader
            title={isSetFlow ? "Set Password" : "Change Password"}
            subtitle={
              isSetFlow
                ? "Create a new password to enable email login."
                : "Verify your identity to update your password."
            }
            onTabBackButton={() => {
              if (step === "otp") setStep("email");
              else if (step === "passwords") setStep("otp");
              else navigation.goBack();
            }}
            showEdit={false}
            showMenuBar={false}
            fs={baseSize}
          />

          <Box
            flex={1}
            width="100%"
            px={"5%"}
            pt={"5%"}
            justifyContent="space-between"
          >
            <Box>
              {/* ─── STEP 1: EMAIL & CURRENT PASSWORD ─── */}
              {step === "email" && (
                <VStack width="100%" mb={"6%"}>
                  <Text
                    fontSize={labelSize}
                    fontWeight="600"
                    color="coolGray.700"
                    mb={"2%"}
                  >
                    Registered Email
                  </Text>
                  <HStack
                    width="100%"
                    alignItems="center"
                    borderWidth={1}
                    borderColor="coolGray.200"
                    bg="coolGray.100"
                    borderRadius="lg"
                    px={"4%"}
                    mb={!isSetFlow ? "6%" : 0}
                  >
                    <TextInput
                      style={[
                        styles.textInput,
                        { fontSize: inputTextSize, color: "#718096" },
                      ]}
                      value={user?.email || ""}
                      editable={false}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </HStack>

                  {/* Ask for Current Password right away if they are verified by password */}
                  {!isSetFlow &&
                    renderField(
                      "Current Password",
                      currentPassword,
                      setCurrentPassword,
                      showCurrent,
                      setShowCurrent,
                      "currentPassword",
                      "Enter current password",
                    )}

                  <Text fontSize={errorSize} color="coolGray.500" mt={"2%"}>
                    We will send a one-time verification code to this email.
                  </Text>
                </VStack>
              )}

              {/* ─── STEP 2: OTP VERIFICATION ─── */}
              {step === "otp" && (
                <VStack width="100%" mb={"6%"}>
                  <Text
                    fontSize={labelSize}
                    fontWeight="600"
                    color="coolGray.700"
                    mb={"2%"}
                  >
                    Enter Security Code (OTP)
                  </Text>
                  <HStack
                    width="100%"
                    alignItems="center"
                    borderWidth={1}
                    borderColor="coolGray.200"
                    borderRadius="lg"
                    px={"4%"}
                  >
                    <TextInput
                      style={[styles.textInput, { fontSize: inputTextSize }]}
                      placeholder="Enter OTP"
                      placeholderTextColor="#A0AEC0"
                      value={otp}
                      onChangeText={setOtp}
                      keyboardType="number-pad"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </HStack>
                  <Pressable
                    onPress={() => {
                      setStep("email");
                      setStatusMessage(null);
                    }}
                    mt={"3%"}
                  >
                    <Text
                      fontSize={errorSize}
                      color="indigo.500"
                      fontWeight="600"
                    >
                      Resend OTP
                    </Text>
                  </Pressable>
                </VStack>
              )}

              {/* ─── STEP 3: NEW PASSWORD FORM ─── */}
              {step === "passwords" && (
                <VStack>
                  {/* Notice: Current Password has been moved to Step 1! */}
                  {renderField(
                    "New Password",
                    newPassword,
                    setNewPassword,
                    showNew,
                    setShowNew,
                    "newPassword",
                    "Enter new password",
                  )}
                  {renderField(
                    "Re-enter New Password",
                    confirmPassword,
                    setConfirmPassword,
                    showConfirm,
                    setShowConfirm,
                    "confirmPassword",
                    "Re-enter new password",
                  )}
                </VStack>
              )}

              {/* Status Banner */}
              {statusMessage ? (
                <Box
                  width="100%"
                  bg={statusMessage.type === "success" ? "green.50" : "red.50"}
                  borderWidth={1}
                  borderColor={
                    statusMessage.type === "success" ? "green.300" : "red.300"
                  }
                  borderRadius="lg"
                  px={"4%"}
                  py={"3%"}
                  mb={"4%"}
                >
                  <Text
                    fontSize={statusTextSize}
                    color={
                      statusMessage.type === "success" ? "green.700" : "red.600"
                    }
                    fontWeight="500"
                  >
                    {statusMessage.text}
                  </Text>
                </Box>
              ) : null}
            </Box>

            {/* ─── DYNAMIC BUTTON ─── */}
            <Box width="100%" pb={"6%"}>
              <Pressable
                onPress={() => {
                  if (step === "email") handleSendOtp();
                  else if (step === "otp") handleVerifyOtp();
                  else handleUpdatePassword();
                }}
                disabled={!isFormValid || isSubmitting}
                width="100%"
                borderRadius="lg"
                py={"4%"}
                alignItems="center"
                justifyContent="center"
                bg={!isFormValid || isSubmitting ? "coolGray.300" : "#667eea"}
                _pressed={{
                  bg: !isFormValid || isSubmitting ? "coolGray.300" : "#544fd1",
                  style: { transform: [{ scale: 0.98 }] },
                }}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text
                    fontSize={buttonTextSize}
                    fontWeight="600"
                    color="white"
                  >
                    {step === "email"
                      ? "Send OTP"
                      : step === "otp"
                        ? "Verify OTP"
                        : "Update Password"}
                  </Text>
                )}
              </Pressable>
            </Box>
          </Box>
        </VStack>
      )}
    </Box>
  );
}

const styles = StyleSheet.create({
  textInput: {
    flex: 1,
    paddingVertical: 10,
    color: "#1A202C",
  },
});
