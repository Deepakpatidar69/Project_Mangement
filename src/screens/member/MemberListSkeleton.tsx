// --- MEMBER LIST SKELETON ---

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

interface MemberRowSkeletonProps {
  baseSize: number;
  avatarSize: number;
  opacity: Animated.Value;
}

export const MemberRowSkeleton = ({
  baseSize,
  avatarSize,
  opacity,
}: MemberRowSkeletonProps) => {
  const sizes = useMemo(() => {
    return {
      nameWidth: baseSize * 0.32,
      emailWidth: baseSize * 0.44,
      lineHeight: adjustSizeToResolveZoomInIssue(baseSize * 0.04),
      badgeWidth: baseSize * 0.14,
      iconSize: adjustSizeToResolveZoomInIssue(baseSize * 0.06) * 0.8,
    };
  }, [baseSize]);

  const { nameWidth, emailWidth, lineHeight, badgeWidth, iconSize } = sizes;

  return (
    <Box
      width={"100%"}
      justifyContent={"center"}
      alignItems={"center"}
    >
      <HStack
        width={"96%"}
        bg="white"
        px="5%"
        py="4%"
        borderRadius="2xl"
        alignItems="center"
        space={3}
        shadow={1}
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
          <Block width={nameWidth} height={lineHeight} opacity={opacity} />
          <Block
            width={emailWidth}
            height={lineHeight * 0.8}
            opacity={opacity}
          />
        </VStack>

        <Block
          width={badgeWidth}
          height={lineHeight * 1.1}
          radius={6}
          opacity={opacity}
        />

        <Animated.View style={{ opacity }}>
          <Box
            w={iconSize * 1.6}
            h={iconSize * 1.6}
            borderRadius="full"
            bg="coolGray.200"
          />
        </Animated.View>
      </HStack>
    </Box>
  );
};

interface MemberListSkeletonProps {
  baseSize: number;
  avatarSize: number;
  height?: number;
  width?: number;
  visibleCount?: number;
}

export const MemberListSkeleton = ({
  baseSize,
  avatarSize,
  height,
  width,
  visibleCount = 6,
}: MemberListSkeletonProps) => {
  const opacity = useShimmer(); // single shared animation, not one per row

  return (
    <Box height={height} width={width ?? "100%"}>
      <VStack width="100%" space={adjustSizeToResolveZoomInIssue(baseSize * 0.035)} pb={"5%"}>
        {Array.from({ length: visibleCount }).map((_, i) => (
          <MemberRowSkeleton
            key={i}
            baseSize={baseSize}
            avatarSize={avatarSize}
            opacity={opacity}
          />
        ))}
      </VStack>
    </Box>
  );
};

export default MemberListSkeleton;
