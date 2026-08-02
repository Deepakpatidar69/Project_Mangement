import React, { useEffect, useState } from "react";
import { Center, Text, VStack } from "native-base";
import LottieView from "lottie-react-native";
import { getAnimationAssets } from "../AssetsMapping/AssetMap";
import {
  adjustSizeToResolveZoomInIssue,
  getScreenDimensions,
} from "../utils/Helper";

interface AppLoaderProps {
  /** Controls whether the loader is visible */
  isLoading: boolean;
  /** The custom message to display below the spinner */
  message?: string;
  /** Whether the loader covers the entire screen or just its container */
  fullScreen?: boolean;
}

export default function AppLoader({
  isLoading,
  message = "Loading",
  fullScreen = true,
}: AppLoaderProps) {
  // 1. Initialize with 3 dots so it ALWAYS shows them immediately on render
  const [dots, setDots] = useState("...");

  const { baseSizeScreen } = getScreenDimensions();

  /* =========================================
     ANIMATED DOTS (...)
  ========================================= */
  useEffect(() => {
    // Only run if actually loading
    if (!isLoading) return;

    // 2. 300ms is the visual "sweet spot" so it doesn't flicker too fast
    const interval = setInterval(() => {
      setDots((prev) => {
        if (prev.length >= 3) return "";
        return prev + ".";
      });
    }, 300);

    return () => clearInterval(interval);
  }, [isLoading]);

  /* =========================================
     IF NOT LOADING, RENDER NOTHING
  ========================================= */
  if (!isLoading) return null;

  const lottieSize = adjustSizeToResolveZoomInIssue(baseSizeScreen * 0.45);

  return (
    <Center
      bg={fullScreen ? "rgb(255, 255, 255)" : "white"}
      position={fullScreen ? "absolute" : "relative"}
      top={0}
      left={0}
      right={0}
      bottom={0}
      zIndex={999}
    >
      <VStack alignItems="center" justifyContent="center">
        <LottieView
          source={getAnimationAssets("LOADING")}
          autoPlay
          loop
          duration={3000}
          style={{
            width: lottieSize,
            height: lottieSize,
          }}
        />
        <Text
          fontSize={adjustSizeToResolveZoomInIssue(baseSizeScreen * 0.05)}
          mt={-adjustSizeToResolveZoomInIssue(baseSizeScreen * 0.1)}
          fontWeight="semibold"
          color="coolGray.700"
        >
          {/* 3. Combined string ensures perfect React Native layout updates */}
          {`${message}${dots}`}
        </Text>
      </VStack>
    </Center>
  );
}
