// TransferOwnershipScreen.tsx
import React, { useState, useMemo } from "react";
import { Box, VStack, Text, Pressable, HStack } from "native-base";
import { TextInput, StyleSheet, ActivityIndicator } from "react-native";
// @ts-ignore
import { Feather } from "react-native-vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAtom, useSetAtom } from "jotai";
import { useDispatch, useSelector } from "react-redux";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

import { useContainerDimensions } from "../../hooks/OnlayoutHooks";
import { adjustSizeToResolveZoomInIssue } from "../../utils/Helper";
import { AppLoaderAtom, isDisplayErrorMessageAtom } from "../../utils/Constent";
import { RouteStackParamStack } from "../../appNavigator/navigator.utils";
import { CommonDetailHeader } from "../../components/CommonDetailHeader";
import { RootState, AppDispatch } from "../../store";

import {
  sendTransferOwnershipOtpUtil,
  verifyOtpUtil,
  sendNewEmailOtpUtil,
  confirmTransferOwnershipUtil,
  onLogoutUser,
} from "./auth.utils";

export default function TransferOwnershipScreen() {
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

  const setDisplayAppLoader = useSetAtom(AppLoaderAtom);
  const [, setErrorModal] = useAtom(isDisplayErrorMessageAtom);

  // Read current user email from Redux state
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const currentEmail = currentUser?.email || "";

  // Check if current user is an OAuth user (Google/GitHub)
  // Adapt this check depending on how your Redux state stores the provider
  const isOAuthUser = !currentUser?.isVerifiedByPassword;

  // Flow State
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [currentEmailOtp, setCurrentEmailOtp] = useState("");
  const [transferToken, setTransferToken] = useState("");

  const [newEmail, setNewEmail] = useState("");
  const [newEmailOtp, setNewEmailOtp] = useState("");

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // --- Validation ---
  const isStep1Valid = useMemo(() => {
    if (isOAuthUser) return true; // No password needed for OAuth users
    return password.trim().length >= 8;
  }, [password, isOAuthUser]);

  const isStep2Valid = useMemo(
    () =>
      currentEmailOtp.trim().length === 6 &&
      /^\d+$/.test(currentEmailOtp.trim()),
    [currentEmailOtp],
  );

  const isStep3Valid = useMemo(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return (
      emailRegex.test(newEmail.trim()) &&
      newEmail.trim().toLowerCase() !== currentEmail.toLowerCase()
    );
  }, [newEmail, currentEmail]);

  const isStep4Valid = useMemo(
    () => newEmailOtp.trim().length === 6 && /^\d+$/.test(newEmailOtp.trim()),
    [newEmailOtp],
  );

  // --- Handlers ---

  // STEP 1: Verify Password (if applicable) & Send OTP
  const handleVerifyPasswordAndSendOtp = async () => {
    if (!isStep1Valid || isSubmitting) return;
    setErrors({});
    setStatusMessage(null);
    setIsSubmitting(true);
    setDisplayAppLoader({
      isLoading: true,
      message: "Verifying credentials...",
    });

    try {
      // If OAuth user, password can be sent as an empty string; backend will skip it
      const response = await sendTransferOwnershipOtpUtil(
        currentEmail,
        password,
      );
      if (!response.success) throw new Error(response.message);

      setStep(2);
      setStatusMessage({
        type: "success",
        text: "OTP sent to your current email.",
      });
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err?.message || "Failed to verify identity.",
      });
    } finally {
      setIsSubmitting(false);
      setDisplayAppLoader({ isLoading: false, message: "" });
    }
  };

  // STEP 2: Verify Current Email OTP -> Receive Transfer Token
  const handleVerifyCurrentEmailOtp = async () => {
    if (!isStep2Valid || isSubmitting) return;
    setErrors({});
    setStatusMessage(null);
    setIsSubmitting(true);
    setDisplayAppLoader({ isLoading: true, message: "Verifying OTP..." });

    try {
      const response = await verifyOtpUtil(
        currentEmail,
        currentEmailOtp,
        "TRANSFER_OWNERSHIP",
      );

      if (!response.success || !response.transferToken) {
        throw new Error(
          response.message || "Failed to retrieve transfer token.",
        );
      }

      setTransferToken(response.transferToken);
      setStep(3);
      setStatusMessage({
        type: "success",
        text: "Identity verified. Enter the new owner's email.",
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

  // STEP 3: Check New Email & Send OTP
  const handleSendNewEmailOtp = async () => {
    if (!isStep3Valid || isSubmitting) return;
    setErrors({});
    setStatusMessage(null);
    setIsSubmitting(true);
    setDisplayAppLoader({ isLoading: true, message: "Checking new email..." });

    try {
      const response = await sendNewEmailOtpUtil({
        newEmail,
        transferToken,
        currentEmail,
      });
      if (!response.success) throw new Error(response.message);

      setStep(4);
      setStatusMessage({
        type: "success",
        text: "Verification OTP sent to the new email.",
      });
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err?.message || "Failed to process new email.",
      });
    } finally {
      setIsSubmitting(false);
      setDisplayAppLoader({ isLoading: false, message: "" });
    }
  };

  // STEP 4: Verify New Email OTP & Finalize Transfer
  const handleFinalizeTransfer = async () => {
    if (!isStep4Valid || isSubmitting) return;
    setErrors({});
    setStatusMessage(null);
    setIsSubmitting(true);
    setDisplayAppLoader({
      isLoading: true,
      message: "Transferring Ownership...",
    });

    try {
      const response = await confirmTransferOwnershipUtil({
        currentEmail,
        newEmail,
        otp: newEmailOtp,
        transferToken,
      });

      if (!response.success) throw new Error(response.message);

      // Show success message and update loader for logout transition
      setStatusMessage({
        type: "success",
        text: "Ownership securely transferred. Logging out...",
      });

      setDisplayAppLoader({
        isLoading: true,
        message: "Logging out...",
      });

      // Wait 2.5 seconds, then log out the user
      setTimeout(() => {
        setDisplayAppLoader({ isLoading: false, message: "" });
        onLogoutUser(dispatch);
      }, 2500);
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err?.message || "Failed to transfer ownership.",
      });
      // Only clear loading state on error, so the loader persists during successful redirect
      setIsSubmitting(false);
      setDisplayAppLoader({ isLoading: false, message: "" });
    }
  };

  // --- Field Renderer ---
  const renderField = ({
    label,
    value,
    onChangeText,
    fieldKey,
    placeholder,
    isSecure = false,
    showPass = false,
    setShowPass,
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
          secureTextEntry={isSecure && !showPass}
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
        {isSecure && setShowPass && (
          <Pressable onPress={() => setShowPass(!showPass)}>
            <Feather
              name={showPass ? "eye-off" : "eye"}
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
            title="Transfer Ownership"
            subtitle={
              step === 1
                ? "Verify your identity to begin."
                : step === 2
                  ? "Enter the OTP sent to your current email."
                  : step === 3
                    ? "Enter the new owner's email address."
                    : "Verify the new email address to complete transfer."
            }
            onTabBackButton={() => navigation.goBack()}
            showEdit={false}
            showMenuBar={false}
            fs={baseSize}
          />

          <KeyboardAwareScrollView
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
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
                {statusMessage && (
                  <Box
                    width="100%"
                    bg={
                      statusMessage.type === "success" ? "green.50" : "red.50"
                    }
                    borderWidth={1}
                    borderColor={
                      statusMessage.type === "success"
                        ? "green.300"
                        : "red.300"
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
                )}

                {/* STEP 1 */}
                {step === 1 && (
                  <>
                    {renderField({
                      label: "Current Email",
                      value: currentEmail,
                      onChangeText: () => {},
                      fieldKey: "email",
                      editable: false,
                    })}

                    {isOAuthUser ? (
                      <Box bg="blue.50" p={"4%"} borderRadius="lg" mb={"6%"}>
                        <Text color="blue.800" fontSize={statusTextSize}>
                          You are signed in via{" "}
                          {currentUser?.authProvider || "a Social Account"}.
                          Tap below to send a security OTP to your email to
                          verify identity.
                        </Text>
                      </Box>
                    ) : (
                      renderField({
                        label: "Password",
                        value: password,
                        onChangeText: setPassword,
                        fieldKey: "password",
                        placeholder: "Enter your password",
                        isSecure: true,
                        showPass: showPassword,
                        setShowPass: setShowPassword,
                      })
                    )}
                  </>
                )}

                {/* STEP 2 */}
                {step === 2 &&
                  renderField({
                    label: "6-Digit OTP",
                    value: currentEmailOtp,
                    onChangeText: setCurrentEmailOtp,
                    fieldKey: "currentEmailOtp",
                    placeholder: "Enter OTP",
                    keyboardType: "number-pad",
                    maxLength: 6,
                  })}

                {/* STEP 3 */}
                {step === 3 &&
                  renderField({
                    label: "New Owner Email",
                    value: newEmail,
                    onChangeText: setNewEmail,
                    fieldKey: "newEmail",
                    placeholder: "Enter new email address",
                    keyboardType: "email-address",
                  })}

                {/* STEP 4 */}
                {step === 4 &&
                  renderField({
                    label: "New Email OTP",
                    value: newEmailOtp,
                    onChangeText: setNewEmailOtp,
                    fieldKey: "newEmailOtp",
                    placeholder: "Enter OTP sent to new email",
                    keyboardType: "number-pad",
                    maxLength: 6,
                  })}
              </Box>

              <Box width="100%" mt={"4%"}>
                {step === 1 && (
                  <ActionButton
                    label={
                      isOAuthUser
                        ? "Send Verification OTP"
                        : "Verify Identity"
                    }
                    onPress={handleVerifyPasswordAndSendOtp}
                    isDisabled={!isStep1Valid}
                    isLoading={isSubmitting}
                    buttonTextSize={buttonTextSize}
                  />
                )}
                {step === 2 && (
                  <ActionButton
                    label="Verify OTP"
                    onPress={handleVerifyCurrentEmailOtp}
                    isDisabled={!isStep2Valid}
                    isLoading={isSubmitting}
                    buttonTextSize={buttonTextSize}
                  />
                )}
                {step === 3 && (
                  <ActionButton
                    label="Send Verification to New Email"
                    onPress={handleSendNewEmailOtp}
                    isDisabled={!isStep3Valid}
                    isLoading={isSubmitting}
                    buttonTextSize={buttonTextSize}
                  />
                )}
                {step === 4 && (
                  <ActionButton
                    label="Confirm Transfer"
                    onPress={handleFinalizeTransfer}
                    isDisabled={!isStep4Valid}
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
  textInput: { flex: 1, paddingVertical: 10 },
});