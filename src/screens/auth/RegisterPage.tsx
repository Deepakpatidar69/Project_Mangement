import React, { useState, useEffect, useCallback } from "react";
import {
  Platform,
  TextInput,
  View,
  Image,
  useWindowDimensions,
} from "react-native";
import {
  Box,
  VStack,
  Button,
  Text,
  Center,
  Pressable,
  HStack,
  FormControl,
  Divider,
} from "native-base";
//@ts-ignore
import Icon from "react-native-vector-icons/MaterialIcons";
import { useDispatch, useSelector } from "react-redux";
import { useFocusEffect } from "@react-navigation/native";
import {
  registerUser,
  resetAuthState,
  clearAuthError,
} from "../../store/slices/authSlice";
import { AppDispatch, RootState } from "../../store";
import { getAssets } from "../../AssetsMapping/AssetMap";
import { useContainerDimensions } from "../../hooks/OnlayoutHooks";
import { adjustSizeToResolveZoomInIssue } from "../../utils/Helper";
import { signInWithGoogle } from "../../authentation/googleSignIn.utils";
import { signInWithGitHub } from "../../authentation/githubSignIn.utils";
import { sendRegistrationOtpUtil } from "./auth.utils";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { DEFAULT_OTP_RESEND_SECONDS } from "../../utils/Constent";

export default function SignupScreen({ navigation }: any) {
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector((state: RootState) => state.auth);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showError, setShowError] = useState(true);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);

  // --- OTP state ---
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0); // seconds remaining before resend is allowed
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otp, setOtp] = useState(""); // Captures the 6 digit OTP

  const { containerDimensions, onLayout } = useContainerDimensions();

  // Live screen dimensions
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const isTablet = screenWidth >= 768;
  const isLandscape = screenWidth > screenHeight;
  const isSmallPhone = screenWidth < 360;

  const clamp = (value: number, min: number, max: number) =>
    Math.min(Math.max(value, min), max);

  const sz = (factor: number, min: number, max: number) =>
    clamp(
      adjustSizeToResolveZoomInIssue(containerDimensions.baseSize * factor),
      min,
      max,
    );

  useFocusEffect(
    useCallback(() => {
      dispatch(clearAuthError());
      setShowError(true);
    }, [dispatch]),
  );

  useEffect(() => {
    if (error?.registerError) {
      setShowError(true);
    }
  }, [error?.registerError]);

  useEffect(() => {
    if (error?.googleLoginError) {
      setShowError(true);
    }
  }, [error?.googleLoginError]);

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  useEffect(() => {
    if (otpSent) {
      setOtpSent(false);
      setOtpTimer(0);
      setOtpError(null);
      setOtp(""); // Reset OTP input if email changes
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email]);

  useEffect(() => {
    if (otpTimer <= 0) return;
    const timerId = setTimeout(() => {
      setOtpTimer((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timerId);
  }, [otpTimer]);

  const handleSendOtp = async () => {
    if (!isEmailValid || otpTimer > 0 || otpLoading) return;

    setOtpLoading(true);
    setOtpError(null);

    const result = await sendRegistrationOtpUtil(email.trim());

    setOtpLoading(false);

    if (result.success) {
      setOtpSent(true);
      setOtpTimer(DEFAULT_OTP_RESEND_SECONDS);
    } else {
      setOtpError(result.message);
    }
  };

  const isOtpButtonDisabled = !isEmailValid || otpTimer > 0 || otpLoading;

  const otpButtonLabel = otpLoading
    ? "Sending..."
    : otpTimer > 0
      ? `${otpTimer}s`
      : otpSent
        ? "Resend"
        : "Send OTP";

  const handlePhoneChange = (val: string) => {
    const numericVal = val.replace(/[^0-9]/g, "");
    if (numericVal.length <= 10) {
      setPhone(numericVal);
    }
  };

  const isPhoneValid = phone.length === 0 || phone.length === 10;
  const isPhoneInvalid = phone.length > 0 && phone.length < 10;
  const doPasswordsMatch =
    confirmPassword.length === 0 || password === confirmPassword;

  // Form is only valid if OTP is sent and filled out
  const isFormValid =
    firstName.trim() &&
    email.trim() &&
    password &&
    password === confirmPassword &&
    isPhoneValid &&
    otpSent &&
    otp.trim().length >= 6;

  const handleSignup = () => {
    if (!isFormValid) return;

    const payload = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phone: phone.trim() ? `+91${phone.trim()}` : undefined,
      password,
      otp: otp.trim(), // Send OTP to backend slice
    };

    dispatch(registerUser(payload));
  };

  const handleGoogleSignup = async () => {
    try {
      setGoogleLoading(true);
      await signInWithGoogle(dispatch);
    } catch (err) {
      console.log("Google signup failed");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGithubLogin = async () => {
    try {
      setGithubLoading(true);
      await signInWithGitHub(dispatch);
    } catch (error) {
      console.log("Login failed");
    } finally {
      setGithubLoading(false);
    }
  };

  const formMaxWidth = isTablet ? 520 : 450;

  const rawImageSize =
    containerDimensions.baseSize > 0 ? containerDimensions.baseSize * 0.45 : 90;
  const imageSize = isLandscape
    ? clamp(rawImageSize, 40, 60)
    : clamp(rawImageSize, 70, 160);

  // Compact input styling
  const inputPaddingV = sz(0.016, 8, 12);
  const inputPaddingH = isSmallPhone ? 10 : sz(0.03, 12, 16);
  const inputFontSize = sz(0.038, 13, 16);
  const labelFontSize = sz(0.035, 12, 14);
  const iconSize = sz(0.052, 18, 22);

  const displayedError =
    (error?.registerError || error?.googleLoginError) && showError
      ? error?.registerError || error?.googleLoginError
      : null;

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
      bounces={false}
   
    >
      <Box flex={1} bg="#F8F9FB" onLayout={onLayout} safeArea>
        {containerDimensions.baseSize > 0 && (
          <Center flex={1} width={"100%"} px={isTablet ? "8%" : "6%"} py={10}>
            <VStack
              w={"100%"}
              maxW={`${formMaxWidth}px`}
              space={sz(0.04, 4, 6)}
            >
              {/* 1. Illustration & Header */}
              <VStack alignItems="center" space={2}>
                <Image
                  source={getAssets("SIGN_UP_ICON")}
                  style={{
                    width: imageSize,
                    height: imageSize,
                    resizeMode: "contain",
                  }}
                />
                <Text
                  fontSize={sz(0.05, 20, 26)}
                  fontWeight="800"
                  color="#111827"
                  letterSpacing="sm"
                  textAlign="center"
                  mt={2}
                >
                  Create Your Account
                </Text>
                <Text
                  fontSize={sz(0.03, 12, 15)}
                  color="#6B7280"
                  fontWeight="medium"
                  textAlign="center"
                  px={2}
                >
                  Join us and start managing your projects and tasks
                  effortlessly.
                </Text>
              </VStack>

              {/* 2. Inputs Group */}
              <VStack width={"100%"} space={3}>
                {/* First + Last Name */}
                <HStack space={3} alignItems="center">
                  <FormControl isRequired flex={1}>
                    <FormControl.Label
                      _text={{
                        color: "#111827",
                        fontWeight: "600",
                        fontSize: labelFontSize,
                        mb: 1,
                      }}
                    >
                      First Name
                    </FormControl.Label>
                    <View
                      style={{
                        backgroundColor: "white",
                        borderColor: "#D1D5DB",
                        borderWidth: 1,
                        borderRadius: 10,
                        flexDirection: "row",
                        alignItems: "center",
                        paddingHorizontal: inputPaddingH,
                      }}
                    >
                      <Icon
                        name="person-outline"
                        size={iconSize}
                        color="#9CA3AF"
                        style={{ marginRight: 6 }}
                      />
                      <TextInput
                        placeholder="First name"
                        placeholderTextColor="#9CA3AF"
                        value={firstName}
                        onChangeText={setFirstName}
                        style={{
                          flex: 1,
                          paddingVertical: inputPaddingV,
                          fontSize: inputFontSize,
                          color: "#111827",
                        }}
                      />
                    </View>
                  </FormControl>

                  <FormControl flex={1}>
                    <FormControl.Label
                      _text={{
                        color: "#111827",
                        fontWeight: "600",
                        fontSize: labelFontSize,
                        mb: 1,
                      }}
                    >
                      Last Name
                    </FormControl.Label>
                    <View
                      style={{
                        backgroundColor: "white",
                        borderColor: "#D1D5DB",
                        borderWidth: 1,
                        borderRadius: 10,
                        flexDirection: "row",
                        alignItems: "center",
                        paddingHorizontal: inputPaddingH,
                      }}
                    >
                      <Icon
                        name="person-outline"
                        size={iconSize}
                        color="#9CA3AF"
                        style={{ marginRight: 6 }}
                      />
                      <TextInput
                        placeholder="Last name"
                        placeholderTextColor="#9CA3AF"
                        value={lastName}
                        onChangeText={setLastName}
                        style={{
                          flex: 1,
                          paddingVertical: inputPaddingV,
                          fontSize: inputFontSize,
                          color: "#111827",
                        }}
                      />
                    </View>
                  </FormControl>
                </HStack>

                {/* Email + Send OTP button */}
                <FormControl isRequired>
                  <FormControl.Label
                    _text={{
                      color: "#111827",
                      fontWeight: "600",
                      fontSize: labelFontSize,
                      mb: 1,
                    }}
                  >
                    Email
                  </FormControl.Label>

                  <HStack space={2} alignItems="stretch">
                    <View
                      style={{
                        flex: 1,
                        backgroundColor: "white",
                        borderColor: "#D1D5DB",
                        borderWidth: 1,
                        borderRadius: 10,
                        flexDirection: "row",
                        alignItems: "center",
                        paddingHorizontal: inputPaddingH,
                      }}
                    >
                      <Icon
                        name="email"
                        size={iconSize}
                        color="#9CA3AF"
                        style={{ marginRight: 6 }}
                      />
                      <TextInput
                        placeholder="Enter your email"
                        placeholderTextColor="#9CA3AF"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        style={{
                          flex: 1,
                          paddingVertical: inputPaddingV,
                          fontSize: inputFontSize,
                          color: "#111827",
                        }}
                      />
                    </View>

                    <Button
                      onPress={handleSendOtp}
                      isDisabled={isOtpButtonDisabled}
                      isLoading={otpLoading}
                      _spinner={{ color: "white" }}
                      bg={isOtpButtonDisabled ? "#303235" : "#4F46E5"}
                      _pressed={{ bg: "#4338CA" }}
                      _disabled={{ bg: "#70757c" }}
                      borderRadius="lg"
                      px={3}
                      justifyContent="center"
                      _text={{
                        fontSize: sz(0.032, 11, 13),
                        fontWeight: "600",
                        color: isOtpButtonDisabled ? "#27292d" : "white",
                      }}
                    >
                      {otpButtonLabel}
                    </Button>
                  </HStack>

                  {otpError && (
                    <Text color="#DC2626" fontSize={11} mt={1} ml={1}>
                      {otpError}
                    </Text>
                  )}
                  {otpSent && !otpError && otpTimer > 0 && (
                    <Text color="#059669" fontSize={11} mt={1} ml={1}>
                      OTP sent. You can resend in {otpTimer}s.
                    </Text>
                  )}
                </FormControl>

                {/* OTP Input Field */}
                {otpSent && (
                  <FormControl isRequired>
                    <FormControl.Label
                      _text={{
                        color: "#111827",
                        fontWeight: "600",
                        fontSize: labelFontSize,
                        mb: 1,
                      }}
                    >
                      Verification Code
                    </FormControl.Label>
                    <View
                      style={{
                        backgroundColor: "white",
                        borderColor: "#D1D5DB",
                        borderWidth: 1,
                        borderRadius: 10,
                        flexDirection: "row",
                        alignItems: "center",
                        paddingHorizontal: inputPaddingH,
                      }}
                    >
                      <Icon
                        name="verified-user"
                        size={iconSize}
                        color="#9CA3AF"
                        style={{ marginRight: 6 }}
                      />
                      <TextInput
                        placeholder="Enter OTP"
                        placeholderTextColor="#9CA3AF"
                        value={otp}
                        onChangeText={setOtp}
                        keyboardType="number-pad"
                        maxLength={6}
                        style={{
                          flex: 1,
                          paddingVertical: inputPaddingV,
                          fontSize: inputFontSize,
                          color: "#111827",
                          letterSpacing: 4,
                        }}
                      />
                    </View>
                  </FormControl>
                )}

                {/* Phone */}
                <FormControl isInvalid={isPhoneInvalid}>
                  <FormControl.Label
                    _text={{
                      color: "#111827",
                      fontWeight: "600",
                      fontSize: labelFontSize,
                      mb: 1,
                    }}
                  >
                    Phone Number (Optional)
                  </FormControl.Label>
                  <View
                    style={{
                      backgroundColor: "white",
                      borderColor: isPhoneInvalid ? "#DC2626" : "#D1D5DB",
                      borderWidth: 1,
                      borderRadius: 10,
                      flexDirection: "row",
                      alignItems: "center",
                      paddingHorizontal: inputPaddingH,
                    }}
                  >
                    <Icon
                      name="call"
                      size={iconSize}
                      color="#9CA3AF"
                      style={{ marginRight: 6 }}
                    />
                    <TextInput
                      placeholder="Enter your phone number"
                      placeholderTextColor="#9CA3AF"
                      value={phone}
                      onChangeText={handlePhoneChange}
                      keyboardType="number-pad"
                      maxLength={10}
                      style={{
                        flex: 1,
                        paddingVertical: inputPaddingV,
                        fontSize: inputFontSize,
                        color: "#111827",
                      }}
                    />
                  </View>
                  {isPhoneInvalid && (
                    <Text color="#DC2626" fontSize={11} mt={1} ml={1}>
                      Phone number must be exactly 10 digits.
                    </Text>
                  )}
                </FormControl>

                {/* Password */}
                <FormControl isRequired>
                  <FormControl.Label
                    _text={{
                      color: "#111827",
                      fontWeight: "600",
                      fontSize: labelFontSize,
                      mb: 1,
                    }}
                  >
                    Password
                  </FormControl.Label>
                  <View
                    style={{
                      backgroundColor: "white",
                      borderColor: "#D1D5DB",
                      borderWidth: 1,
                      borderRadius: 10,
                      flexDirection: "row",
                      alignItems: "center",
                      paddingHorizontal: inputPaddingH,
                    }}
                  >
                    <Icon
                      name="lock-outline"
                      size={iconSize}
                      color="#9CA3AF"
                      style={{ marginRight: 6 }}
                    />
                    <TextInput
                      key={showPassword ? "visible" : "hidden"}
                      placeholder="Create a password"
                      placeholderTextColor="#9CA3AF"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                      spellCheck={false}
                      textContentType="password"
                      keyboardType="default"
                      style={{
                        flex: 1,
                        paddingVertical: inputPaddingV,
                        fontSize: inputFontSize,
                        color: "#111827",
                      }}
                    />
                    <Pressable
                      onPress={() => setShowPassword(!showPassword)}
                      p={1}
                      ml={2}
                    >
                      <Icon
                        name={showPassword ? "visibility" : "visibility-off"}
                        size={iconSize}
                        color="#9CA3AF"
                      />
                    </Pressable>
                  </View>
                </FormControl>

                {/* Confirm Password */}
                <FormControl
                  isRequired
                  isInvalid={!doPasswordsMatch && confirmPassword.length > 0}
                >
                  <FormControl.Label
                    _text={{
                      color: "#111827",
                      fontWeight: "600",
                      fontSize: labelFontSize,
                      mb: 1,
                    }}
                  >
                    Re-enter Password
                  </FormControl.Label>
                  <View
                    style={{
                      backgroundColor: "white",
                      borderColor:
                        !doPasswordsMatch && confirmPassword.length > 0
                          ? "#DC2626"
                          : "#D1D5DB",
                      borderWidth: 1,
                      borderRadius: 10,
                      flexDirection: "row",
                      alignItems: "center",
                      paddingHorizontal: inputPaddingH,
                    }}
                  >
                    <Icon
                      name="lock-outline"
                      size={iconSize}
                      color="#9CA3AF"
                      style={{ marginRight: 6 }}
                    />
                    <TextInput
                      key={showConfirmPassword ? "visible" : "hidden"}
                      placeholder="Confirm your password"
                      placeholderTextColor="#9CA3AF"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry={!showConfirmPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                      spellCheck={false}
                      textContentType="password"
                      keyboardType="default"
                      style={{
                        flex: 1,
                        paddingVertical: inputPaddingV,
                        fontSize: inputFontSize,
                        color: "#111827",
                      }}
                    />
                    <Pressable
                      onPress={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      p={1}
                      ml={2}
                    >
                      <Icon
                        name={
                          showConfirmPassword ? "visibility" : "visibility-off"
                        }
                        size={iconSize}
                        color="#9CA3AF"
                      />
                    </Pressable>
                  </View>
                  {!doPasswordsMatch && confirmPassword.length > 0 && (
                    <Text color="#DC2626" fontSize={11} mt={1} ml={1}>
                      Passwords do not match.
                    </Text>
                  )}
                </FormControl>
              </VStack>

              {/* 3. Error & Button */}
              <VStack space={3}>
                {displayedError && (
                  <Box
                    bg="red.100"
                    p={sz(0.015, 6, 10)}
                    borderRadius="lg"
                    flexDirection="row"
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <Text
                      color="red.600"
                      fontWeight="medium"
                      flex={1}
                      mr={2}
                      fontSize={sz(0.03, 11, 14)}
                    >
                      {displayedError}
                    </Text>
                    <Pressable
                      onPress={() => setShowError(false)}
                      hitSlop={8}
                      p={1}
                    >
                      <Icon
                        name="close"
                        size={sz(0.04, 14, 18)}
                        color="#DC2626"
                      />
                    </Pressable>
                  </Box>
                )}

                <Button
                  mt={1}
                  py={sz(0.02, 2, 3)}
                  bg="#4F46E5"
                  borderRadius="xl"
                  onPress={handleSignup}
                  isLoading={loading?.register}
                  isLoadingText="Creating Account..."
                  isDisabled={!isFormValid}
                  _pressed={{ bg: "#4338CA" }}
                  _text={{
                    fontSize: sz(0.045, 14, 16),
                    fontWeight: "600",
                    color: "white",
                  }}
                >
                  Sign Up
                </Button>
              </VStack>

              {/* 4. Social Signup + Footer */}
              <VStack space={3}>
                <HStack alignItems="center" space={3}>
                  <Divider flex={1} bg="#E5E7EB" />
                  <Text color="#9CA3AF" fontSize={sz(0.035, 12, 15)}>
                    or
                  </Text>
                  <Divider flex={1} bg="#E5E7EB" />
                </HStack>

                <VStack width={"100%"} space={3}>
                  <Pressable
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 1,
                      borderColor: "#D1D5DB",
                      borderRadius: 12,
                      paddingVertical: sz(0.02, 8, 14),
                      opacity: googleLoading ? 0.6 : 1,
                    }}
                    onPress={handleGoogleSignup}
                    disabled={googleLoading}
                  >
                    <Image
                      source={getAssets("GOOGLE_ICON")}
                      style={{
                        width: sz(0.06, 18, 24),
                        height: sz(0.06, 18, 24),
                        marginRight: sz(0.03, 10, 14),
                      }}
                    />
                    <Text fontWeight="600" color="#111827">
                      {googleLoading ? "Signing up..." : "Continue with Google"}
                    </Text>
                  </Pressable>

                  <Pressable
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 1,
                      borderColor: "#D1D5DB",
                      borderRadius: 12,
                      paddingVertical: sz(0.02, 8, 14),
                    }}
                    onPress={handleGithubLogin}
                  >
                    <Image
                      source={getAssets("GITHUB_ICON")}
                      style={{
                        width: sz(0.06, 18, 24),
                        height: sz(0.06, 18, 24),
                        marginRight: sz(0.03, 10, 14),
                      }}
                    />
                    <Text fontWeight="600" color="#111827">
                      {githubLoading ? "Signing up..." : "Continue with Github"}
                    </Text>
                  </Pressable>
                </VStack>

                <Pressable
                  justifyContent="center"
                  p={1}
                  onPress={() => {
                    dispatch(resetAuthState());
                    navigation.navigate("LoginScreen");
                  }}
                >
                  <Text
                    textAlign="center"
                    color="#6B7280"
                    fontSize={sz(0.045, 13, 15)}
                  >
                    Already have an account?{" "}
                    <Text color="#4F46E5" fontWeight="600">
                      Login
                    </Text>
                  </Text>
                </Pressable>
              </VStack>
            </VStack>
          </Center>
        )}
      </Box>
    </KeyboardAwareScrollView>
  );
}
