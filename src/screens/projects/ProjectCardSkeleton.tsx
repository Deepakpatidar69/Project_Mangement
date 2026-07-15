import React, { useEffect, useRef, useMemo } from "react";
import { Animated, Easing } from "react-native";
import { Box, HStack, VStack } from "native-base";

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

// ─── ProjectCardSkeleton ────────────────────────────────────────────────────
// Width is now passed down from ProjectListSkeleton (already known — it's the
// list's own containerWidth) instead of each card measuring itself via
// onLayout. That was causing N separate native layout passes (one per visible
// skeleton card) before anything could paint. All sizing here is now derived
// synchronously from the numeric `width` prop, so cards render immediately.

interface ProjectCardSkeletonProps {
  width: number;
  opacity: Animated.Value;
}

export const ProjectCardSkeleton = ({
  width,
  opacity,
}: ProjectCardSkeletonProps) => {
  // Pre-computed once per card from a plain number — no layout event needed.
  const sizes = useMemo(() => {
    const baseSize = width;
    return {
      baseSize,
      title: baseSize * 0.048,
      body: baseSize * 0.036,
      meta: baseSize * 0.032,
      badge: baseSize * 0.03,
      iconSize: baseSize * 0.055,
    };
  }, [width]);

  const { baseSize, title, body, meta, badge, iconSize } = sizes;

  return (
    <Box width={"100%"}>
      <Box
        width={"98%"}
        bg="white"
        borderRadius={baseSize * 0.05}
        borderLeftColor="coolGray.200"
        shadow={1}
        // overflow="hidden"
      >
        <VStack width={"100%"} px={"4%"} pt={"4%"} pb={"3%"} space={2}>
          {/* ── Row 1: Status badge + date ── */}
          <HStack justifyContent="space-between" alignItems="center">
            <Block
              width={baseSize * 0.26}
              height={badge * 2.2}
              radius={baseSize * 0.1}
              opacity={opacity}
            />
            <Block width={baseSize * 0.16} height={meta} opacity={opacity} />
          </HStack>

          {/* ── Row 2: Title ── */}
          <Block width={"70%"} height={title} opacity={opacity} />

          {/* ── Row 3: Description (2 lines) ── */}
          <VStack space={1.5}>
            <Block width={"92%"} height={body} opacity={opacity} />
            <Block width={"60%"} height={body} opacity={opacity} />
          </VStack>

          {/* ── Row 4: Progress bar ── */}
          <VStack width={"100%"} space={"5%"} mt={1}>
            <HStack justifyContent="space-between" alignItems="center">
              <Block
                width={baseSize * 0.18}
                height={badge * 1.2}
                opacity={opacity}
              />
              <Block
                width={baseSize * 0.08}
                height={badge * 1.2}
                opacity={opacity}
              />
            </HStack>
            <Block width={"100%"} height={meta} radius={99} opacity={opacity} />
          </VStack>

          {/* ── Divider ── */}
          <Box height={"1px"} bg="coolGray.100" mt={1} />

          {/* ── Row 5: Admin info + task counts ── */}
          <HStack
            width={"100%"}
            justifyContent="space-between"
            alignItems="center"
          >
            <HStack alignItems="center" space={"5%"}>
              <Animated.View style={{ opacity }}>
                <Box
                  width={iconSize * 1.2}
                  height={iconSize * 1.2}
                  borderRadius={999}
                  bg="coolGray.200"
                />
              </Animated.View>
              <VStack space={1}>
                <Block
                  width={baseSize * 0.22}
                  height={meta}
                  opacity={opacity}
                />
                <Block
                  width={baseSize * 0.12}
                  height={badge}
                  opacity={opacity}
                />
              </VStack>
            </HStack>

            <HStack alignItems="center" space={"6%"}>
              <Block width={baseSize * 0.06} height={meta} opacity={opacity} />
              <Block width={baseSize * 0.06} height={meta} opacity={opacity} />
              <Block width={baseSize * 0.06} height={meta} opacity={opacity} />
            </HStack>
          </HStack>
        </VStack>
      </Box>
    </Box>
  );
};

// ─── ProjectListSkeleton ────────────────────────────────────────────────────
// containerWidth is already known by the caller (ProjectList measures it
// once via its own onLayout) — so we compute sizing here a single time and
// hand plain numbers to every card, and share ONE shimmer animation driver
// across all cards instead of each card creating/starting its own loop.

interface ProjectListSkeletonProps {
  containerHeight: number;
  containerWidth: number;
  visibleCount?: number;
}

export const ProjectListSkeleton = ({
  containerHeight,
  containerWidth,
  visibleCount = 4,
}: ProjectListSkeletonProps) => {
  const opacity = useShimmer(); // single shared animation, not one per card
  const cardWidth = useMemo(() => containerWidth, [containerWidth]);

  return (
    <Box height={containerHeight} width={containerWidth}>
      {cardWidth > 0 && (
        <VStack space={containerHeight * 0.001} alignItems={"center"}>
          {Array.from({ length: visibleCount }).map((_, i) => (
            <ProjectCardSkeleton key={i} width={cardWidth} opacity={opacity} />
          ))}
        </VStack>
      )}
    </Box>
  );
};

export default ProjectListSkeleton;
