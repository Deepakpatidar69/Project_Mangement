// ForgotPasswordScreen.tsx
import React, { useState, useMemo, useEffect } from "react";
import { Box, VStack, Text, Pressable, HStack } from "native-base";
import { TextInput, StyleSheet, ActivityIndicator } from "react-native";
// @ts-ignore
import { Feather } from "react-native-vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAtom, useSetAtom } from "jotai";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

import { useContainerDimensions } from "../../hooks/OnlayoutHooks";
import { adjustSizeToResolveZoomInIssue } from "../../utils/Helper";
import { AppLoaderAtom, isDisplayErrorMessageAtom } from "../../utils/Constent";
import { RouteStackParamStack } from "../../appNavigator/navigator.utils";
import { CommonDetailHeader } from "../../components/CommonDetailHeader";
import {
  resetPasswordWithOtp,
  sendForgotPasswordOtpUtil,
  verifyOtpUtil,
} from "./auth.utils";

export default function ForgotPasswordScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RouteStackParamStack>>();

  const { containerDimensions, onLayout } = useContainerDimensions();
  const baseSize = containerDimensions.baseSize;

  // ─── Scaled sizes ─────────────────────
  const labelSize = adjustSizeToResolveZoomInIssue(baseSize * 0.04);
  const inputTextSize = adjustSizeToResolveZoomInIssue(baseSize * 0.04);
  const errorSize = adjustSizeToResolveZoomInIssue(baseSize * 0.032);
  const iconSize = adjustSizeToResolveZoomInIssue(baseSize * 0.05);
  const buttonTextSize = adjustSizeToResolveZoomInIssue(baseSize * 0.045);
  const statusTextSize = adjustSizeToResolveZoomInIssue(baseSize * 0.036);

  const setDisplayAppLoader = useSetAtom(AppLoaderAtom);
  const [, setErrorModal] = useAtom(isDisplayErrorMessageAtom);

  // ─── Flow State ───────────────────────
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // ─── Form State ───────────────────────
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetToken, setResetToken] = useState("");

  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // ─── Live validation & Form Readiness ─────────────────────────────────

  const isStep1Valid = useMemo(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }, [email]);

  const isStep2Valid = useMemo(() => {
    return otp.trim().length === 6 && /^\d+$/.test(otp.trim());
  }, [otp]);

  const isStep3Valid = useMemo(() => {
    if (!newPassword.trim() || newPassword.length < 8) return false;
    if (!confirmPassword.trim()) return false;
    if (newPassword !== confirmPassword) return false;
    return true;
  }, [newPassword, confirmPassword]);

  // Live "passwords match" check surfaced as a soft inline error while typing
  useEffect(() => {
    if (step !== 3) return;

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

  // Live minimum length check surfaced as a soft inline error while typing
  useEffect(() => {
    if (step !== 3) return;

    if (newPassword && newPassword.length < 8) {
      setErrors((prev) => ({
        ...prev,
        newPassword: "New password must be at least 8 characters",
      }));
    } else {
      setErrors((prev) => ({ ...prev, newPassword: "" }));
    }
  }, [newPassword, step]);

  // ─── Handlers ──────────────────────────

  const handleSendOtp = async () => {
    if (!isStep1Valid || isSubmitting) return;

    setErrors({});
    setStatusMessage(null);
    setIsSubmitting(true);
    setDisplayAppLoader({ isLoading: true, message: "Sending OTP..." });

    try {
      const response = await sendForgotPasswordOtpUtil(email);

      if (!response.success) {
        throw new Error(response.message);
      }

      setStep(2);
      setStatusMessage({ type: "success", text: "OTP sent to your email." });
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err?.message || "Failed to send OTP.",
      });
    } finally {
      setIsSubmitting(false);
      setDisplayAppLoader({ isLoading: false, message: "" });
    }
  };

  const handleVerifyOtp = async () => {
    if (!isStep2Valid || isSubmitting) return;

    setErrors({});
    setStatusMessage(null);
    setIsSubmitting(true);
    setDisplayAppLoader({ isLoading: true, message: "Verifying OTP..." });

    try {
      const response = await verifyOtpUtil(email, otp, "FORGOT_PASSWORD");

      if (!response.success || !response.resetToken) {
        throw new Error(response.message || "Failed to retrieve reset token.");
      }

      setResetToken(response.resetToken);
      setStep(3);
      setStatusMessage({
        type: "success",
        text: "OTP verified. Set your new password.",
      });
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err?.message || "Invalid or expired OTP.",
      });
    } finally {
      setIsSubmitting(false);
      setDisplayAppLoader({ isLoading: false, message: "" });
    }
  };

  const handleResetPassword = async () => {
    if (!isStep3Valid || isSubmitting) return;

    setErrors({});
    setStatusMessage(null);
    setIsSubmitting(true);
    setDisplayAppLoader({ isLoading: true, message: "Resetting Password..." });

    try {
      const response = await resetPasswordWithOtp({
        resetToken,
        newPassword,
        confirmPassword
      });

      if (response && !response.success) {
        throw new Error(response.message);
      }

      // Show inline success message
      setStatusMessage({
        type: "success",
        text: "Password reset successfully!",
      });

      // Show Success Modal
      setErrorModal((prev) => ({
        ...prev,
        isDisplay: true,
        title: "Password Reset Successful",
        subtitle: "You can now log in with your new password.",
        onClickLeftButton: () => {
          setErrorModal((p) => ({ ...p, isDisplay: false }));
          navigation.goBack();
        },
      }));
    } catch (err: any) {
      const message =
        err?.message || "Failed to update password. Session may have expired.";
      setStatusMessage({ type: "error", text: message });
      setErrorModal((prev) => ({
        ...prev,
        isDisplay: true,
        title: "Session Expired or Error",
        subtitle: message,
        onClickLeftButton: () =>
          setErrorModal((p) => ({ ...p, isDisplay: false })),
      }));
    } finally {
      setIsSubmitting(false);
      setDisplayAppLoader({ isLoading: false, message: "" });
    }
  };

  // ─── Reusable Field Renderer ────────────────────────────────────────────
  const renderField = ({
    label,
    value,
    onChangeText,
    fieldKey,
    placeholder,
    isSecure = false,
    showPassword = false,
    setShowPassword,
    editable = true,
    keyboardType = "default",
    maxLength,
  }: any) => (
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
        borderColor={
          errors[fieldKey]
            ? "red.400"
            : editable
              ? "coolGray.200"
              : "coolGray.100"
        }
        borderRadius="lg"
        px={"4%"}
        bg={editable ? "white" : "coolGray.100"}
      >
        <TextInput
          style={[
            styles.textInput,
            {
              fontSize: inputTextSize,
              color: editable ? "#1A202C" : "#718096",
            },
          ]}
          placeholder={placeholder}
          placeholderTextColor="#A0AEC0"
          secureTextEntry={isSecure && !showPassword}
          value={value}
          onChangeText={(t) => {
            onChangeText(t);
            if (errors[fieldKey])
              setErrors((prev) => ({ ...prev, [fieldKey]: "" }));
          }}
          editable={editable}
          keyboardType={keyboardType}
          maxLength={maxLength}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {isSecure && setShowPassword && (
          <Pressable onPress={() => setShowPassword(!showPassword)}>
            <Feather
              name={showPassword ? "eye-off" : "eye"}
              size={iconSize}
              color="#718096"
            />
          </Pressable>
        )}
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
        <VStack width="100%" flex={1}>
          <CommonDetailHeader
            title="Forgot Password"
            subtitle={
              step === 1
                ? "Enter your email to receive an OTP."
                : step === 2
                  ? "Enter the 6-digit OTP sent to your email."
                  : "Create your new password."
            }
            onTabBackButton={() => navigation.goBack()}
            showEdit={false}
            showMenuBar={false}
            fs={baseSize}
          />

          <KeyboardAwareScrollView
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled" // Important: allows tapping buttons without dismissing keyboard first
            bottomOffset={20}
          >
            <Box
              flex={1}
              width="100%"
              px={"5%"}
              pt={"5%"}
              justifyContent="space-between"
            >
              <Box>
                {/* Status Message Banner */}
                {statusMessage ? (
                  <Box
                    width="100%"
                    bg={
                      statusMessage.type === "success" ? "green.50" : "red.50"
                    }
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
                        statusMessage.type === "success"
                          ? "green.700"
                          : "red.600"
                      }
                      fontWeight="500"
                    >
                      {statusMessage.text}
                    </Text>
                  </Box>
                ) : null}

                {/* Field: Email */}
                {renderField({
                  label: "Email Address",
                  value: email,
                  onChangeText: setEmail,
                  fieldKey: "email",
                  placeholder: "Enter registered email",
                  editable: step === 1,
                  keyboardType: "email-address",
                })}

                {/* Field: OTP */}
                {step === 2 &&
                  renderField({
                    label: "6-Digit OTP",
                    value: otp,
                    onChangeText: setOtp,
                    fieldKey: "otp",
                    placeholder: "Enter 6-digit OTP",
                    keyboardType: "number-pad",
                    maxLength: 6,
                  })}

                {/* Fields: Passwords */}
                {step === 3 && (
                  <>
                    {renderField({
                      label: "New Password",
                      value: newPassword,
                      onChangeText: setNewPassword,
                      fieldKey: "newPassword",
                      placeholder: "Enter new password",
                      isSecure: true,
                      showPassword: showNew,
                      setShowPassword: setShowNew,
                    })}
                    {renderField({
                      label: "Re-enter New Password",
                      value: confirmPassword,
                      onChangeText: setConfirmPassword,
                      fieldKey: "confirmPassword",
                      placeholder: "Re-enter new password",
                      isSecure: true,
                      showPassword: showConfirm,
                      setShowPassword: setShowConfirm,
                    })}
                  </>
                )}
              </Box>

              {/* Dynamic Bottom Button */}
              <Box width="100%" mt={"4%"}>
                {step === 1 && (
                  <ActionButton
                    label="Send OTP"
                    onPress={handleSendOtp}
                    isDisabled={!isStep1Valid}
                    isLoading={isSubmitting}
                    buttonTextSize={buttonTextSize}
                  />
                )}
                {step === 2 && (
                  <ActionButton
                    label="Verify OTP"
                    onPress={handleVerifyOtp}
                    isDisabled={!isStep2Valid}
                    isLoading={isSubmitting}
                    buttonTextSize={buttonTextSize}
                  />
                )}
                {step === 3 && (
                  <ActionButton
                    label="Reset Password"
                    onPress={handleResetPassword}
                    isDisabled={!isStep3Valid}
                    isLoading={isSubmitting}
                    buttonTextSize={buttonTextSize}
                  />
                )}
              </Box>
            </Box>
          </KeyboardAwareScrollView>
        </VStack>
      )}
    </Box>
  );
}

// Sub-component for the Action Button updated to accept isDisabled
const ActionButton = ({
  label,
  onPress,
  isLoading,
  isDisabled,
  buttonTextSize,
}: any) => (
  <Pressable
    onPress={onPress}
    disabled={isLoading || isDisabled}
    width="100%"
    borderRadius="lg"
    py={"4%"}
    alignItems="center"
    justifyContent="center"
    bg={isLoading || isDisabled ? "coolGray.300" : "#667eea"}
    _pressed={{
      bg: isLoading || isDisabled ? "coolGray.300" : "#544fd1",
      style: { transform: [{ scale: 0.98 }] },
    }}
  >
    {isLoading ? (
      <ActivityIndicator color="#ffffff" />
    ) : (
      <Text fontSize={buttonTextSize} fontWeight="600" color="white">
        {label}
      </Text>
    )}
  </Pressable>
);

const styles = StyleSheet.create({
  textInput: {
    flex: 1,
    paddingVertical: 10,
  },
});
