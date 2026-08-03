import React, { useState, useEffect, useCallback } from "react";
import {
  Platform,
  TextInput,
  View,
  Image,
  useWindowDimensions,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import {
  Box,
  VStack,
  Button,
  Text,
  Center,
  Pressable,
  FormControl,
  HStack,
  Divider,
} from "native-base";
//@ts-ignore
import Icon from "react-native-vector-icons/MaterialIcons";
import { useDispatch, useSelector } from "react-redux";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import {
  loginUser,
  resetAuthState,
  clearAuthError,
} from "../../store/slices/authSlice";
import { AppDispatch, RootState } from "../../store";
import { getAssets } from "../../AssetsMapping/AssetMap";
import { useContainerDimensions } from "../../hooks/OnlayoutHooks";
import { adjustSizeToResolveZoomInIssue } from "../../utils/Helper";
import { signInWithGoogle } from "../../authentation/googleSignIn.utils";
import { signInWithGitHub } from "../../authentation/githubSignIn.utils";
import { RouteStackParamStack } from "../../appNavigator/navigator.utils";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useHideHardwareNavigationButton } from "../../hooks/useHideNavigation";

export default function LoginScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector((state: RootState) => state.auth);

  const navigation =
    useNavigation<NativeStackNavigationProp<RouteStackParamStack>>();

    useHideHardwareNavigationButton();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showError, setShowError] = useState(true);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      dispatch(clearAuthError());
      setShowError(true);
    }, [dispatch]),
  );

  useEffect(() => {
    if (error?.loginError) {
      setShowError(true);
    }
  }, [error?.loginError]);

  useEffect(() => {
    if (error?.googleLoginError) {
      setShowError(true);
    }
  }, [error?.googleLoginError]);

  const isFormValid = email.trim() && password;

  const { containerDimensions, onLayout } = useContainerDimensions();

  // Live screen dimensions - updates automatically on rotation/resize/split-screen
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const isTablet = screenWidth >= 768;
  const isLandscape = screenWidth > screenHeight;
  const isSmallPhone = screenWidth < 360;

  const clamp = (value: number, min: number, max: number) =>
    Math.min(Math.max(value, min), max);

  const handleLogin = () => {
    if (!isFormValid) return;
    dispatch(loginUser({ email: email.trim(), password }));
  };

  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);
      await signInWithGoogle(dispatch);
    } catch (error) {
      console.log("Login failed");
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

  const onClickForgotPass = () => {
    navigation.navigate("ForgotPasswordScreen");
  };

  const formMaxWidth = isTablet ? 520 : 450;

  const rawImageSize =
    containerDimensions.baseSize > 0
      ? containerDimensions.baseSize * 0.45
      : 180;
  const imageSize = isLandscape
    ? clamp(rawImageSize, 60, 100)
    : clamp(rawImageSize, 90, 200);

  const displayedError =
    (error?.loginError || error?.googleLoginError) && showError
      ? error?.loginError || error?.googleLoginError
      : null;

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
      bounces={false}
      enableOnAndroid={true}
      enableAutomaticScroll={true}
      extraScrollHeight={Platform.OS === "ios" ? 20 : 0}
      keyboardOpeningTime={0}
      resetScrollToCoords={{ x: 0, y: 0 }}
    >
      {/*
        FIX: removed `flex={1}` here. This View no longer needs to fill
        exactly the visible screen height — it just needs to hold its
        natural content height. `onLayout` is still used, but only to
        read WIDTH (for font/icon scaling below) — never height, so a
        keyboard-triggered resize can't cascade into a layout change.
      */}
      <Box bg="#F8F9FB" onLayout={onLayout} minHeight={screenHeight}>
        {containerDimensions.baseSize > 0 && (
          <Center
            width={"100%"}
            px={isTablet ? "5%" : "0%"}
            py="6%"
            // FIX: no more height="100%" driving the whole form —
            // Center just wraps content and lets it size naturally.
          >
            <VStack
              w={isTablet ? "70%" : "90%"}
              maxW={`${formMaxWidth}px`}
              // FIX: no more fixed height ("95%"/"92%") on this VStack.
              // Its height now comes purely from its children's natural
              // sizes + the spacing below, so nothing recalculates when
              // the keyboard opens/closes.
            >
              {/* Logo/Icon */}
              <Center width={"100%"} mb="4%">
                <Image
                  source={getAssets("LOGIN_ICON")}
                  style={{
                    width: imageSize,
                    height: imageSize,
                    resizeMode: "contain",
                  }}
                />
              </Center>

              {/* Header */}
              <VStack
                width={"100%"}
                space={"4%"}
                alignItems="center"
                justifyContent="center"
                mb="6%"
              >
                <Text
                  fontSize={clamp(
                    adjustSizeToResolveZoomInIssue(
                      containerDimensions.baseSize * 0.055,
                    ),
                    18,
                    28,
                  )}
                  fontWeight="800"
                  color="#111827"
                  letterSpacing="sm"
                  textAlign="center"
                >
                  Your Workspace Awaits
                </Text>
                <Text
                  fontSize={clamp(
                    adjustSizeToResolveZoomInIssue(
                      containerDimensions.baseSize * 0.038,
                    ),
                    13,
                    18,
                  )}
                  color="#6B7280"
                  fontWeight="medium"
                  textAlign="center"
                  px={2}
                >
                  Continue managing projects, tracking tasks, and achieving your
                  goals.
                </Text>
              </VStack>

              {/* Inputs */}
              <VStack width={"100%"} space={"5%"} mb="4%">
                {/* Email */}
                <FormControl isRequired>
                  <FormControl.Label
                    _text={{
                      color: "#111827",
                      fontWeight: "600",
                      fontSize: clamp(
                        adjustSizeToResolveZoomInIssue(
                          containerDimensions.baseSize * 0.045,
                        ),
                        13,
                        18,
                      ),
                    }}
                  >
                    Email
                  </FormControl.Label>
                  <View
                    style={{
                      backgroundColor: "transparent",
                      borderColor: "#D1D5DB",
                      borderWidth: 1,
                      borderRadius: 12,
                      flexDirection: "row",
                      alignItems: "center",
                      paddingHorizontal: isSmallPhone ? 10 : 16,
                    }}
                  >
                    <Icon
                      name="email"
                      size={20}
                      color="#9CA3AF"
                      style={{ marginRight: 8 }}
                    />
                    <TextInput
                      placeholder="Enter your email"
                      placeholderTextColor="#9CA3AF"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      allowFontScaling={false}
                      maxFontSizeMultiplier={1}
                      style={{
                        flex: 1,
                        paddingVertical: 14,
                        fontSize: isSmallPhone ? 13 : 15,
                        color: "#111827",
                      }}
                    />
                  </View>
                </FormControl>

                {/* Password */}
                <FormControl isRequired>
                  <FormControl.Label
                    _text={{
                      color: "#111827",
                      fontWeight: "600",
                      fontSize: "sm",
                    }}
                  >
                    Password
                  </FormControl.Label>
                  <View
                    style={{
                      backgroundColor: "transparent",
                      borderColor: "#D1D5DB",
                      borderWidth: 1,
                      borderRadius: 12,
                      flexDirection: "row",
                      alignItems: "center",
                      paddingHorizontal: isSmallPhone ? 10 : 16,
                    }}
                  >
                    <Icon
                      name="lock-outline"
                      size={20}
                      color="#9CA3AF"
                      style={{ marginRight: 8 }}
                    />
                    <TextInput
                      key={showPassword ? "visible" : "hidden"}
                      placeholder="Enter your password"
                      placeholderTextColor="#9CA3AF"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                      spellCheck={false}
                      textContentType="password"
                      keyboardType="default"
                      allowFontScaling={false}
                      maxFontSizeMultiplier={1}
                      style={{
                        flex: 1,
                        paddingVertical: 14,
                        fontSize: isSmallPhone ? 13 : 15,
                        color: "#111827",
                      }}
                    />
                    <Pressable
                      onPress={() => setShowPassword(!showPassword)}
                      p={1}
                    >
                      <Icon
                        name={showPassword ? "visibility" : "visibility-off"}
                        size={20}
                        color="#9CA3AF"
                      />
                    </Pressable>
                  </View>
                </FormControl>

                {/* Forgot Password */}
                <Pressable onPress={onClickForgotPass} alignItems="flex-end">
                  <Text color="#4F46E5" fontSize="sm" fontWeight="medium">
                    Forgot Password?
                  </Text>
                </Pressable>
              </VStack>

              {/* Error */}
              {displayedError && (
                <Box
                  bg="red.100"
                  p={adjustSizeToResolveZoomInIssue(
                    containerDimensions.baseSize * 0.015,
                  )}
                  borderRadius="lg"
                  mb="3%"
                  flexDirection="row"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <Text
                    color="red.600"
                    textAlign="left"
                    fontWeight="medium"
                    flex={1}
                    mr={2}
                    fontSize={adjustSizeToResolveZoomInIssue(
                      containerDimensions.baseSize * 0.04,
                    )}
                  >
                    {displayedError}
                  </Text>
                  <Pressable
                    onPress={() => setShowError(false)}
                    hitSlop={8}
                    p={1}
                  >
                    <Icon name="close" size={18} color="#DC2626" />
                  </Pressable>
                </Box>
              )}

              {/* Login Button */}
              <Box width={"100%"} justifyContent="center" mb="4%">
                <Button
                  py={clamp(
                    adjustSizeToResolveZoomInIssue(
                      containerDimensions.baseSize * 0.03,
                    ),
                    10,
                    18,
                  )}
                  bg="#4F46E5"
                  borderRadius="xl"
                  onPress={handleLogin}
                  isLoading={loading?.login}
                  isLoadingText="Logging in..."
                  isDisabled={!isFormValid}
                  _pressed={{ bg: "#4338CA" }}
                  _text={{
                    fontSize: clamp(
                      adjustSizeToResolveZoomInIssue(
                        containerDimensions.baseSize * 0.045,
                      ),
                      14,
                      20,
                    ),
                    fontWeight: "600",
                    color: "white",
                  }}
                >
                  Login
                </Button>
              </Box>

              {/* Divider */}
              <HStack alignItems="center" mb="4%" space={3}>
                <Divider flex={1} bg="#E5E7EB" />
                <Text
                  color="#9CA3AF"
                  fontSize={adjustSizeToResolveZoomInIssue(
                    containerDimensions.baseSize * 0.035,
                  )}
                >
                  or
                </Text>
                <Divider flex={1} bg="#E5E7EB" />
              </HStack>

              {/* Social Buttons */}
              <VStack width={"100%"} space={3} mb="4%">
                <Pressable
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 1,
                    borderColor: "#D1D5DB",
                    borderRadius: 12,
                    paddingVertical: adjustSizeToResolveZoomInIssue(
                      containerDimensions.baseSize * 0.02,
                    ),
                    opacity: googleLoading ? 0.6 : 1,
                  }}
                  onPress={handleGoogleLogin}
                  disabled={googleLoading}
                >
                  <Image
                    source={getAssets("GOOGLE_ICON")}
                    style={{
                      width: adjustSizeToResolveZoomInIssue(
                        containerDimensions.baseSize * 0.085,
                      ),
                      height: adjustSizeToResolveZoomInIssue(
                        containerDimensions.baseSize * 0.085,
                      ),
                      marginRight: adjustSizeToResolveZoomInIssue(
                        containerDimensions.baseSize * 0.045,
                      ),
                    }}
                  />
                  <Text fontWeight="600" color="#111827">
                    {googleLoading ? "Signing in..." : "Continue with Google"}
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
                    paddingVertical: adjustSizeToResolveZoomInIssue(
                      containerDimensions.baseSize * 0.02,
                    ),
                  }}
                  onPress={handleGithubLogin}
                >
                  <Image
                    source={getAssets("GITHUB_ICON")}
                    style={{
                      width: adjustSizeToResolveZoomInIssue(
                        containerDimensions.baseSize * 0.085,
                      ),
                      height: adjustSizeToResolveZoomInIssue(
                        containerDimensions.baseSize * 0.085,
                      ),
                      marginRight: adjustSizeToResolveZoomInIssue(
                        containerDimensions.baseSize * 0.045,
                      ),
                    }}
                  />
                  <Text fontWeight="600" color="#111827">
                    {githubLoading ? "Signing in..." : "Continue with Github"}
                  </Text>
                </Pressable>
              </VStack>

              {/* Switch to Signup */}
              <Pressable
                onPress={() => {
                  dispatch(resetAuthState());
                  navigation.navigate("SignupScreen");
                }}
              >
                <Text
                  textAlign="center"
                  color="#6B7280"
                  fontSize={adjustSizeToResolveZoomInIssue(
                    containerDimensions.baseSize * 0.04,
                  )}
                >
                  Don't have an account?{" "}
                  <Text color="#4F46E5" fontWeight="600">
                    Sign up
                  </Text>
                </Text>
              </Pressable>
            </VStack>
          </Center>
        )}
      </Box>
    </KeyboardAwareScrollView>
  );
}
