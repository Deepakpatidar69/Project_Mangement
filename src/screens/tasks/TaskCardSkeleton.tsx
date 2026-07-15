import React, { useEffect, useRef } from "react";
import { Box, HStack, VStack } from "native-base";
import { Animated, Easing, StyleProp, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

interface ShimmerPlaceholderProps {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

export const ShimmerPlaceholder = ({
  width,
  height,
  borderRadius = 6,
  style,
}: ShimmerPlaceholderProps) => {
  const translateX = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(translateX, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [translateX]);

  const numericWidth = typeof width === "number" ? width : 200;

  const translateXInterpolated = translateX.interpolate({
    inputRange: [-1, 1],
    outputRange: [-numericWidth, numericWidth],
  });

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: "#E5E7EB",
          overflow: "hidden",
        },
        style,
      ]}
    >
      <Animated.View
        style={{
          flex: 1,
          transform: [{ translateX: translateXInterpolated }],
        }}
      >
        <LinearGradient
          colors={["#E5E7EB", "#F3F4F6", "#E5E7EB"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1, width: "200%" }}
        />
      </Animated.View>
    </Animated.View>
  );
};



interface TaskCardSkeletonProps {
  cardHeight: number;
  containerWidth: number;
}

export const TaskCardSkeleton = ({
  cardHeight,
  containerWidth,
}: TaskCardSkeletonProps) => {
  // Proportions derived to roughly match TaskCard's internal spacing
  const basesize = containerWidth;
  const rowGap = cardHeight * 0.08;
  const badgeH = cardHeight * 0.09;
  const titleH = cardHeight * 0.1;
  const lineH = cardHeight * 0.07;
  const avatarSize = cardHeight * 0.16;

  return (
    <Box width={"100%"} m={"1%"} height={cardHeight}>
      <Box
        width={"98%"}
        height={"100%"}
        bg="white"
        borderRadius={16}
        shadow={1}
        overflow="hidden"
      >
        <VStack
          px={"4%"}
          pt={"4%"}
          pb={"3%"}
          flex={1}
          justifyContent="space-between"
        >
          {/* Row 1: status badge + date */}
          <HStack justifyContent="space-between" alignItems="center">
            <ShimmerPlaceholder
              width={basesize * 0.18}
              height={badgeH}
              borderRadius={20}
            />
            <ShimmerPlaceholder
              width={basesize * 0.13}
              height={lineH * 0.8}
              borderRadius={4}
            />
          </HStack>

          {/* Row 2: title */}
          <ShimmerPlaceholder width={"80%"} height={titleH} borderRadius={4} />

          {/* Row 3: description (2 lines) */}
          <VStack space={rowGap * 0.5}>
            <ShimmerPlaceholder width={"95%"} height={lineH} borderRadius={4} />
            <ShimmerPlaceholder width={"70%"} height={lineH} borderRadius={4} />
          </VStack>

          {/* Divider */}
          <Box height={"1px"} bg="coolGray.100" />

          {/* Row 4: creator + counters */}
          <HStack justifyContent="space-between" alignItems="center">
            <HStack alignItems="center" space={2}>
              <ShimmerPlaceholder
                width={avatarSize}
                height={avatarSize}
                borderRadius={100}
              />
              <VStack space={1}>
                <ShimmerPlaceholder
                  width={basesize * 0.24}
                  height={lineH * 0.7}
                  borderRadius={4}
                />
                <ShimmerPlaceholder
                  width={basesize * 0.16}
                  height={lineH * 0.55}
                  borderRadius={4}
                />
              </VStack>
            </HStack>
            <HStack space={3}>
              <ShimmerPlaceholder
                width={basesize * 0.06}
                height={lineH * 0.7}
                borderRadius={4}
              />
              <ShimmerPlaceholder
                width={basesize * 0.06}
                height={lineH * 0.7}
                borderRadius={4}
              />
            </HStack>
          </HStack>
        </VStack>
      </Box>
    </Box>
  );
};

interface TaskListSkeletonProps {
  containerHeight: number;
  containerWidth: number;
  visibleCount?: number; // how many cards should fit on screen
}

export const TaskListSkeleton = ({
  containerHeight,
  containerWidth,
  visibleCount = 4,
}: TaskListSkeletonProps) => {

  const cardHeight = containerHeight / visibleCount;

  return (
    <VStack flex={1}>
      {Array.from({ length: visibleCount }).map((_, i) => (
        <TaskCardSkeleton
          key={i}
          cardHeight={cardHeight}
          containerWidth={containerWidth}
        />
      ))}
    </VStack>
  );
};