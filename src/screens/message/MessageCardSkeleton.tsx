// --- MESSAGE LIST SKELETON ---
// Same pattern as ProjectCardSkeleton/ProjectListSkeleton: one shared
// shimmer animation driver reused across every card (not one Animated.Value
// per card), and all sizing derived synchronously from a plain `baseSize`
// number that's already computed by MessageListScreen — no per-card onLayout
// measuring, so skeleton cards paint immediately with zero layout passes.

import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Easing } from "react-native";
import { Box, HStack, VStack } from "native-base";
import { adjustSizeToResolveZoomInIssue } from "../../utils/Helper";

// ─── Shared shimmer ─────────────────────────────────────────────────────────
function useShimmer() {
  const opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 650,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.35,
          duration: 650,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return opacity;
}

interface BlockProps {
  width: number | string;
  height: number;
  radius?: number;
  opacity: Animated.Value;
}

const Block = ({ width, height, radius = 6, opacity }: BlockProps) => (
  <Animated.View style={{ opacity }}>
    <Box
      width={width}
      height={height}
      borderRadius={radius}
      bg="coolGray.200"
    />
  </Animated.View>
);

// ─── MessageCardSkeleton ────────────────────────────────────────────────────
// Mirrors MessageItem's layout: rounded white card, left accent border,
// circular avatar, name + role-badge line, two text lines for the message
// body, and a footer row (timestamp pill + comment-count pill).

interface MessageCardSkeletonProps {
  baseSize: number;
  opacity: Animated.Value;
}

export const MessageCardSkeleton = ({
  baseSize,
  opacity,
}: MessageCardSkeletonProps) => {
  const sizes = useMemo(() => {
    return {
      avatarSize: adjustSizeToResolveZoomInIssue(baseSize * 0.13),
      nameWidth: baseSize * 0.34,
      badgeWidth: baseSize * 0.16,
      lineHeight: adjustSizeToResolveZoomInIssue(baseSize * 0.035),
      metaHeight: adjustSizeToResolveZoomInIssue(baseSize * 0.028),
    };
  }, [baseSize]);

  const { avatarSize, nameWidth, badgeWidth, lineHeight, metaHeight } = sizes;

  return (
    <Box
      mx={adjustSizeToResolveZoomInIssue(baseSize * 0.01)}
      borderRadius="2xl"
      bg="white"
      shadow={1}
      overflow="hidden"
    >
      <HStack
        width={"98%"}
        borderRadius={16}
        overflow="hidden"
        space={3}
        alignItems="flex-start"
        p={adjustSizeToResolveZoomInIssue(baseSize * 0.045)}
      >
        <Animated.View style={{ opacity }}>
          <Box
            w={avatarSize}
            h={avatarSize}
            borderRadius="full"
            bg="coolGray.200"
          />
        </Animated.View>

        <VStack flex={1} space={1.5}>
          <HStack alignItems="center" space={2}>
            <Block width={nameWidth} height={lineHeight} opacity={opacity} />
            <Block
              width={badgeWidth}
              height={lineHeight * 0.75}
              radius={99}
              opacity={opacity}
            />
          </HStack>

          <VStack space={1.5} mt={1}>
            <Block width={"92%"} height={lineHeight} opacity={opacity} />
            <Block width={"65%"} height={lineHeight} opacity={opacity} />
          </VStack>

          <HStack
            justifyContent="space-between"
            alignItems="center"
            mt={2}
            pt={2}
            borderTopWidth={1}
            borderTopColor="coolGray.50"
          >
            <Block
              width={baseSize * 0.14}
              height={metaHeight}
              opacity={opacity}
            />
            <Block
              width={baseSize * 0.1}
              height={metaHeight}
              radius={99}
              opacity={opacity}
            />
          </HStack>
        </VStack>
      </HStack>
    </Box>
  );
};

// ─── MessageListSkeleton ────────────────────────────────────────────────────
// Uses the same paddingVertical / marginHorizontal / rowGap units as the real
// FlatList's contentContainerStyle in MessageListScreen, so swapping skeleton
// -> real list doesn't cause a visible jump/gap in spacing.

interface MessageListSkeletonProps {
  baseSize: number;
  // Measured from MessageListScreen (container height minus the measured
  // header + send-bar heights, and the container's own width) — same role
  // as ProjectList passing containerHeight/containerWidth into
  // ProjectListSkeleton, just sourced from real onLayout measurements here
  // instead of fixed percentages, since this header's height is dynamic.
  height?: number;
  width?: number;
  visibleCount?: number;
}

export const MessageListSkeleton = ({
  baseSize,
  height,
  width,
  visibleCount = 6,
}: MessageListSkeletonProps) => {
  const opacity = useShimmer(); // single shared animation, not one per card

  return (
    <Box height={height} width={width ?? "100%"}>
      <VStack
        width="100%"
        space={adjustSizeToResolveZoomInIssue(baseSize * 0.04)}
        py={adjustSizeToResolveZoomInIssue(baseSize * 0.04)}
      >
        {Array.from({ length: visibleCount }).map((_, i) => (
          <MessageCardSkeleton key={i} baseSize={baseSize} opacity={opacity} />
        ))}
      </VStack>
    </Box>
  );
};

export default MessageListSkeleton;
