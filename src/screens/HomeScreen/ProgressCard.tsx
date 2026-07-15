import React, { useEffect, useRef } from "react";
import { Animated, Easing, View } from "react-native";
import { Box, HStack, VStack, Text, Icon } from "native-base";
import { LinearGradient } from "expo-linear-gradient";
import { adjustSizeToResolveZoomInIssue } from "../../utils/Helper";
import { FontAwesome, Ionicons } from "@expo/vector-icons";

interface ProgressCardProps {
  type: "PROJECT" | "TASK";
  total: number;
  completed: number;
  cardWidth: number;
  cardHeight: number;
}

export const ProgressCard: React.FC<ProgressCardProps> = ({
  type,
  cardHeight,
  cardWidth,
  total,
  completed,
}) => {
  const isProject = type === "PROJECT";

  // 1. Configuration & Math
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  const pending = Math.max(0, total - completed);

  const config = {
    bgGradient: isProject
      ? (["#6366f1", "#4338ca"] as const)
      : (["#038ccc", "#025e87"] as const),
    title: isProject ? "Projects Progress" : "Tasks Progress",
    subTitle: isProject ? "Projects Completed" : "Tasks Completed",
  };

  // 2. Derived Dimensions
  const baseSize = Math.min(cardHeight, cardWidth);
  const circleSize = adjustSizeToResolveZoomInIssue(baseSize * 0.24);
  const radius = adjustSizeToResolveZoomInIssue(circleSize / 2);
  const strokeWidth = adjustSizeToResolveZoomInIssue(circleSize * 0.1);

  // 3. Animation Logic — split so rotation can run on the native thread
  const rotationValue = useRef(new Animated.Value(0)).current; // drives circle (native)
  const barValue = useRef(new Animated.Value(0)).current; // drives bar width (JS)

  useEffect(() => {
    rotationValue.setValue(0);
    barValue.setValue(0);

    Animated.timing(rotationValue, {
      toValue: percentage,
      duration: 1400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true, // rotation is a transform — runs on native thread, no stutter
    }).start();

    Animated.timing(barValue, {
      toValue: percentage,
      duration: 1400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false, // width is a layout prop — must stay JS-driven
    }).start();
  }, [percentage, rotationValue, barValue]);

  // 4. Interpolations for the Two Halves
  // Right side fills from 0% to 50%
  const rotateRight = rotationValue.interpolate({
    inputRange: [0, 50, 100],
    outputRange: ["0deg", "180deg", "180deg"],
    extrapolate: "clamp",
  });

  // Left side fills from 50% to 100%
  const rotateLeft = rotationValue.interpolate({
    inputRange: [0, 50, 100],
    outputRange: ["0deg", "0deg", "180deg"],
    extrapolate: "clamp",
  });

  const animatedBarWidth = barValue.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
    extrapolate: "clamp",
  });

  if (baseSize <= 0) return null;

  return (
    <Box
      w={cardWidth}
      height={cardHeight}
      bg={"transparent"}
      justifyContent={"center"}
      alignItems={"center"}
      rounded="2xl"
      overflow={"visible"}
    >
      <Box
        width={"100%"}
        height={"100%"}
        rounded="2xl"
        shadow={1}
        bg={"transparent"}
        justifyContent={"center"}
        alignItems={"center"}
      >
        <LinearGradient
          colors={config.bgGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ width: "98%", height: "98%", borderRadius: 16 }}
        >
          <Box width={"100%"} height={"15%"}>
            {/* Header Row: Icon & Native Circular Indicator */}
            <Box
              w={baseSize * 0.16}
              h={baseSize * 0.16}
              rounded="md"
              bg="rgba(255, 255, 255, 0.2)"
              justifyContent="center"
              alignItems="center"
              position={"absolute"}
              top={2}
              left={2}
              zIndex={1}
            >
              <Icon
                as={isProject ? Ionicons : FontAwesome}
                name={isProject ? "folder-outline" : "tasks"}
                size={adjustSizeToResolveZoomInIssue(baseSize * 0.1)}
                color={isProject ? "white" : "white"}
              />
            </Box>

            {/* Pure NativeBase Circular Progress Representation */}
            <Box
              w={circleSize}
              h={circleSize}
              top={1}
              right={1}
              justifyContent="center"
              alignItems="center"
              position="absolute"
              zIndex={1}
              rounded="full"
              overflow="hidden"
            >
              {/* 1. Track (Background Base Circle) */}
              <Box
                position="absolute"
                w={circleSize}
                h={circleSize}
                rounded="full"
                bg="rgba(255, 255, 255, 0.2)"
              />

              {/* 2. Left Side Wrap (Handles 50% - 100% progress) */}
              <Box
                position="absolute"
                w={radius}
                h={circleSize}
                left={0}
                overflow="hidden"
              >
                <Animated.View
                  style={{
                    width: circleSize,
                    height: circleSize,
                    position: "absolute",
                    left: 0,
                    transform: [{ rotate: rotateLeft }],
                  }}
                >
                  {/* Colored semi-circle on the right half */}
                  <View
                    style={{
                      position: "absolute",
                      width: radius,
                      height: circleSize,
                      left: radius,
                      borderTopRightRadius: radius,
                      borderBottomRightRadius: radius,
                      backgroundColor: "white",
                    }}
                  />
                </Animated.View>
              </Box>

              {/* 3. Right Side Wrap (Handles 0% - 50% progress) */}
              <Box
                position="absolute"
                w={radius}
                h={circleSize}
                right={0}
                overflow="hidden"
              >
                <Animated.View
                  style={{
                    width: circleSize,
                    height: circleSize,
                    position: "absolute",
                    left: -radius,
                    transform: [{ rotate: rotateRight }],
                  }}
                >
                  {/* Colored semi-circle on the left half */}
                  <View
                    style={{
                      position: "absolute",
                      width: radius,
                      height: circleSize,
                      left: 0,
                      borderTopLeftRadius: radius,
                      borderBottomLeftRadius: radius,
                      backgroundColor: "white",
                    }}
                  />
                </Animated.View>
              </Box>

              {/* 4. Inner Circle Mask (Covers the center to create the Donut Ring effect) */}
              <Box
                position="absolute"
                w={circleSize - strokeWidth * 2}
                h={circleSize - strokeWidth * 2}
                rounded="full"
                bg={config.bgGradient[0]}
                justifyContent="center"
                alignItems="center"
              >
                <Text color="white" fontSize={adjustSizeToResolveZoomInIssue(circleSize * 0.2)} fontWeight="bold">
                  {percentage}%
                </Text>
              </Box>
            </Box>
          </Box>

          {/* Main Stats Segment */}
          <VStack
            width={"100%"}
            height={"55%"}
            overflow={"hidden"}
            p={baseSize * 0.05}
            justifyContent={"flex-start"}
            alignItems={"flex-start"}
          >
            <Text
              color="rgba(255, 255, 255, 0.8)"
              fontSize={adjustSizeToResolveZoomInIssue(baseSize * 0.08)}
              fontWeight="semibold"
            >
              {config.title}
            </Text>
            <HStack alignItems="baseline">
              <Text color="white" fontSize="xl" fontWeight="bold">
                {completed}
              </Text>
              <Text
                color="rgba(255, 255, 255, 0.6)"
                fontSize="sm"
                fontWeight="medium"
                ml={1}
              >
                / {total}
              </Text>
            </HStack>
            <Text color="rgba(255, 255, 255, 0.7)" fontSize="10px" mb={3}>
              {config.subTitle}
            </Text>

            {/* Mini Progress Bar Line */}
            <Box h={1} bg="rgba(255, 255, 255, 0.2)" rounded="full" w="100%">
              <Animated.View
                style={{
                  height: "100%",
                  backgroundColor: "white",
                  borderRadius: 2,
                  width: animatedBarWidth,
                }}
              />
            </Box>
          </VStack>

          {/* Footer Breakdown Row */}
          <HStack
            height={"30%"}
            width={"100%"}
            px={"2%"}
            justifyContent="space-between"
            borderTopWidth={1}
            borderTopColor="rgba(255, 255, 255, 0.1)"
            pt={"2%"}
          >
            <VStack height={"100%"} alignItems="center" space={"10%"}>
              <Text
                color="rgba(255, 255, 255, 0.6)"
                fontSize={adjustSizeToResolveZoomInIssue(baseSize * 0.065)}
                fontWeight="medium"
              >
                Total
              </Text>
              <Text
                color="white"
                fontSize={adjustSizeToResolveZoomInIssue(baseSize * 0.08)}
                fontWeight="bold"
              >
                {total}
              </Text>
            </VStack>
            <VStack height={"100%"} alignItems="center" space={"10%"}>
              <Text
                color="rgba(255, 255, 255, 0.6)"
                fontSize={adjustSizeToResolveZoomInIssue(baseSize * 0.065)}
                fontWeight="medium"
              >
                Completed
              </Text>
              <Text
                color="white"
                fontSize={adjustSizeToResolveZoomInIssue(baseSize * 0.08)}
                fontWeight="bold"
              >
                {completed}
              </Text>
            </VStack>
            <VStack height={"100%"} alignItems="center" space={"10%"}>
              <Text
                color="rgba(255, 255, 255, 0.6)"
                fontSize={adjustSizeToResolveZoomInIssue(baseSize * 0.065)}
                fontWeight="medium"
              >
                Pending
              </Text>
              <Text
                color="white"
                fontSize={adjustSizeToResolveZoomInIssue(baseSize * 0.08)}
                fontWeight="bold"
              >
                {pending}
              </Text>
            </VStack>
          </HStack>
        </LinearGradient>
      </Box>
    </Box>
  );
};
