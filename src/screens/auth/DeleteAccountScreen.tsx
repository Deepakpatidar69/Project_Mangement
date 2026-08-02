import React, { useState } from "react";
import { Keyboard, TextInput, Alert, TouchableOpacity } from "react-native";
import {
  Box,
  Button,
  FormControl,
  HStack,
  Icon,
  Text,
  VStack,
  View,
} from "native-base";
import { useNavigation } from "@react-navigation/native";
// @ts-ignore
import Ionicons from "react-native-vector-icons/Ionicons";
import { useDispatch, useSelector } from "react-redux";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteStackParamStack } from "../../appNavigator/navigator.utils";
import { CommonDetailHeader } from "../../components/CommonDetailHeader";
import { useContainerDimensions } from "../../hooks/OnlayoutHooks";
import { useSetAtom } from "jotai";
import { AppLoaderAtom } from "../../utils/Constent";
import { API_ENDPOINTS } from "../../api/endpoint";

// Import utilities
import { sendDeleteAccountOtpUtil, onLogoutUser } from "./auth.utils";
import { apiClient } from "../../api/client";

export function DeleteAccountScreen() {
  const { containerDimensions, onLayout } = useContainerDimensions();
  const navigation =
    useNavigation<NativeStackNavigationProp<RouteStackParamStack>>();
  const dispatch = useDispatch<any>();
  const setDisplayAppLoader = useSetAtom(AppLoaderAtom);

  // Get user from Redux store
  const user = useSelector((state: any) => state.auth.user);

  // Screen State
  const [step, setStep] = useState<"REQUEST_OTP" | "VERIFY_OTP">("REQUEST_OTP");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // New state for inline error handling
  const [errorMsg, setErrorMsg] = useState("");

  // ─────────────────────────────────────────────────────────────────────────
  // Handlers
  // ─────────────────────────────────────────────────────────────────────────

  const handleSendOtp = async () => {
    setErrorMsg(""); // Clear previous errors

    // Only require the password if the user has isVerifiedByPassword set to true
    if (user?.isVerifiedByPassword && !password.trim()) {
      setErrorMsg("Please enter your password to continue.");
      return;
    }

    Keyboard.dismiss();
    setDisplayAppLoader({ isLoading: true, message: "Requesting OTP..." });

    try {
      const res = await sendDeleteAccountOtpUtil(user?.email, password);

      if (!res.success) {
        setErrorMsg(res.message);
        return;
      }

      // Clear any previously entered OTP, clear errors, and move to next step
      setOtp("");
      setErrorMsg("");
      setStep("VERIFY_OTP");
    } catch (error: any) {
      setErrorMsg(
        error?.response?.data?.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setDisplayAppLoader({ isLoading: false, message: "" });
    }
  };

  const handleVerifyAndDelete = async () => {
    setErrorMsg(""); // Clear previous errors

    if (!otp.trim() || otp.length < 4) {
      setErrorMsg("Please enter a valid OTP.");
      return;
    }

    Keyboard.dismiss();
    setDisplayAppLoader({ isLoading: true, message: "Deleting account..." });

    try {
      // Clean, simple call using your apiClient
      await apiClient.post(API_ENDPOINTS.DELETE_ACCOUNT, {
        email: user?.email,
        otp: otp.trim(),
      });

      // If we reach here, it was a 200/Success response!
      Alert.alert(
        "Account Deleted",
        "Your account has been permanently deleted.",
        [
          {
            text: "OK",
            onPress: async () => {
              // Clear Redux auth state and local storage
              await onLogoutUser(dispatch);

              // Reset navigation stack and push to Login
              navigation.reset({
                index: 0,
                routes: [{ name: "LoginScreen" as any }],
              });
            },
          },
        ],
      );
    } catch (error: any) {
      // Axios-style error handling
      const errorMessage =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        "Invalid OTP or failed to delete account.";

      setErrorMsg(errorMessage);
    } finally {
      setDisplayAppLoader({ isLoading: false, message: "" });
    }
  };

  const handleCancelAndGoBack = () => {
    // Clear inputs and return to the request step
    setOtp("");
    setPassword("");
    setErrorMsg("");
    setStep("REQUEST_OTP");
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render Helpers
  // ─────────────────────────────────────────────────────────────────────────

  // Reusable Error Banner Component
  const renderErrorBanner = () => {
    if (!errorMsg) return null;
    return (
      <HStack
        bg="red.100"
        borderWidth={1}
        borderColor="red.300"
        borderRadius="md"
        p={3}
        alignItems="center"
        justifyContent="space-between"
      >
        <Text color="red.700" fontSize="sm" fontWeight="medium" flexShrink={1}>
          {errorMsg}
        </Text>
        <TouchableOpacity onPress={() => setErrorMsg("")} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Icon as={Ionicons} name="close" size="sm" color="red.700" />
        </TouchableOpacity>
      </HStack>
    );
  };

  const { width } = containerDimensions;

  return (
    <View flex={1} bg="coolGray.50" onLayout={onLayout}>
      <CommonDetailHeader
        title="Delete Account"
        onTabBackButton={() => navigation.goBack()}
        showEdit={false}
        showMenuBar={false}
        fs={width}
      />

      <VStack px="5%" py="6" space={6} flex={1}>
        <Box
          bg="red.50"
          p="4"
          borderRadius="md"
          borderWidth={1}
          borderColor="red.200"
        >
          <HStack space={3} alignItems="flex-start">
            <Icon
              as={Ionicons}
              name="warning"
              size="md"
              color="red.600"
              mt={1}
            />
            <VStack flexShrink={1}>
              <Text fontSize="md" fontWeight="bold" color="red.800">
                Warning
              </Text>
              <Text fontSize="sm" color="red.700" mt={1}>
                Deleting your account is permanent. All your projects, tasks,
                and personal data will be wiped immediately. This action cannot
                be undone.
              </Text>
            </VStack>
          </HStack>
        </Box>

        {step === "REQUEST_OTP" ? (
          <VStack space={4}>
            {/* Display the dismissible error banner */}
            {renderErrorBanner()}

            <FormControl>
              <FormControl.Label>Email Address</FormControl.Label>
              <Box
                borderWidth={1}
                borderColor="coolGray.200"
                bg="coolGray.100"
                borderRadius="sm"
              >
                <TextInput
                  value={user?.email || ""}
                  editable={false}
                  style={{
                    padding: 12,
                    fontSize: 16,
                    color: "#6b7280", // coolGray.500
                  }}
                />
              </Box>
            </FormControl>

            {/* Conditionally render the password field using isVerifiedByPassword */}
            {user?.isVerifiedByPassword && (
              <FormControl isRequired isInvalid={!!errorMsg}>
                <FormControl.Label>Enter Password to Confirm</FormControl.Label>
                <HStack
                  borderWidth={1}
                  borderColor={errorMsg ? "red.500" : "coolGray.300"}
                  bg="white"
                  borderRadius="sm"
                  alignItems="center"
                >
                  <TextInput
                    value={password}
                    onChangeText={(val) => {
                      setPassword(val);
                      setErrorMsg(""); // Clear error when typing starts
                    }}
                    secureTextEntry={!showPassword}
                    placeholder="Your current password"
                    placeholderTextColor="#9ca3af" // coolGray.400
                    style={{
                      flex: 1,
                      padding: 12,
                      fontSize: 16,
                      color: "#374151", // coolGray.700
                    }}
                  />
                  <Button
                    size="xs"
                    rounded="none"
                    w="15%"
                    h="full"
                    bg="transparent"
                    _pressed={{ bg: "transparent", opacity: 0.5 }}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Icon
                      as={Ionicons}
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size="sm"
                      color="coolGray.500"
                    />
                  </Button>
                </HStack>
              </FormControl>
            )}

            <Button
              mt={4}
              colorScheme="red"
              bg="red.600"
              _pressed={{ bg: "red.700" }}
              py={3}
              borderRadius="md"
              onPress={handleSendOtp}
            >
              <Text color="white" fontWeight="bold" fontSize="md">
                Send Deletion OTP
              </Text>
            </Button>
          </VStack>
        ) : (
          <VStack space={4}>
            <Text fontSize="md" color="coolGray.700" textAlign="center">
              We've sent a one-time verification code to{" "}
              <Text fontWeight="bold">{user?.email}</Text>.
            </Text>

            {/* Display the dismissible error banner */}
            {renderErrorBanner()}

            <FormControl isRequired isInvalid={!!errorMsg} mt={2}>
              <FormControl.Label>Enter OTP</FormControl.Label>
              <Box
                borderWidth={1}
                borderColor={errorMsg ? "red.500" : "coolGray.300"}
                bg="white"
                borderRadius="sm"
              >
                <TextInput
                  value={otp}
                  onChangeText={(val) => {
                    setOtp(val);
                    setErrorMsg(""); // Clear error when typing starts
                  }}
                  keyboardType="numeric"
                  placeholder="e.g. 123456"
                  placeholderTextColor="#9ca3af"
                  maxLength={6}
                  style={{
                    padding: 12,
                    fontSize: 18,
                    textAlign: "center",
                    letterSpacing: 4,
                    color: "#374151",
                  }}
                />
              </Box>
            </FormControl>

            <Button
              mt={4}
              colorScheme="red"
              bg="red.600"
              _pressed={{ bg: "red.700" }}
              py={3}
              borderRadius="md"
              onPress={handleVerifyAndDelete}
            >
              <Text color="white" fontWeight="bold" fontSize="md">
                Permanently Delete Account
              </Text>
            </Button>

            <Button
              variant="ghost"
              colorScheme="coolGray"
              onPress={handleCancelAndGoBack}
            >
              Cancel & Go Back
            </Button>
          </VStack>
        )}
      </VStack>
    </View>
  );
}