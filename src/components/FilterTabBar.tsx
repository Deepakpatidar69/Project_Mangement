import { Box, HStack, Icon, Pressable, Text } from "native-base";
import React, { useEffect, useRef, useState } from "react";
import { Animated, LayoutChangeEvent, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { adjustSizeToResolveZoomInIssue } from "../utils/Helper";

type FetchType = "IN_PROGRESS" | "COMPLETED" | "ALL";

type Props = {
  callFrom: "TASK" | "PROJECT";
  search: string;
  setSearch: (value: string) => void;
  currentFetchType: FetchType;
  onChangeFetchType: (value: FetchType) => void;
  containerDimentions: { height: number; width: number; baseSize: number };
  allCount: number;
  pendingCount: number;
  completedCount: number;
};

const TABS: Array<{ key: FetchType; labelTask: string; labelProject: string }> =
  [
    { key: "ALL", labelTask: "All Tasks", labelProject: "All Projects" },
    {
      key: "IN_PROGRESS",
      labelTask: "In Progress",
      labelProject: "In Progress",
    },
    { key: "COMPLETED", labelTask: "Completed", labelProject: "Completed" },
  ];

function FilterTabBar({
  callFrom = "PROJECT",
  search,
  setSearch,
  currentFetchType,
  containerDimentions,
  onChangeFetchType,
  allCount,
  pendingCount,
  completedCount,
}: Props) {
  const { width, height, baseSize } = containerDimentions;

  const counts: Record<FetchType, number> = {
    ALL: allCount,
    IN_PROGRESS: pendingCount,
    COMPLETED: completedCount,
  };

  // ── Sizing, all derived from baseSize/width/height ────────────────────────
  const containerRadius = baseSize * 0.1;
  const trackHeight = baseSize * 0.34;
  const trackPadding = baseSize * 0.035;
  const pillRadius = baseSize * 0.16;
  const badgeSize = baseSize * 0.15;
  const searchHeight = baseSize * 0.34;
  const searchRadius = baseSize * 0.16;

  const labelFontSize = adjustSizeToResolveZoomInIssue(
    baseSize * (callFrom === "TASK" ? 0.1 : 0.1),
  );
  const badgeFontSize = adjustSizeToResolveZoomInIssue(baseSize * 0.1);
  const searchFontSize = adjustSizeToResolveZoomInIssue(baseSize * 0.15);
  const searchIconSize = adjustSizeToResolveZoomInIssue(baseSize * 0.16);

  // ── Segmented control: measure track width once it lays out ──────────────
  const [trackWidth, setTrackWidth] = useState(0);
  const onTrackLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w && w !== trackWidth) setTrackWidth(w);
  };

  const segmentWidth =
    trackWidth > 0 ? (trackWidth - trackPadding * 2) / TABS.length : 0;
  const activeIndex = TABS.findIndex((t) => t.key === currentFetchType);

  // ── Animated sliding pill — instant tactile feedback, independent of data fetch ──
  const translateX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!segmentWidth) return;
    Animated.spring(translateX, {
      toValue: activeIndex * segmentWidth,
      useNativeDriver: true,
      speed: 22,
      bounciness: 4,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, segmentWidth]);

  return (
    <Box
      width={width}
      height={height}
      justifyContent="center"
      alignItems="center"
      bg="white"
      borderRadius={containerRadius}
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
        elevation: 4,
      }}
    >
      <Box width="100%" height="100%" justifyContent="center" px={"3%"}>
        {/* ── Segmented tab control ── */}
        <Box
          onLayout={onTrackLayout}
          width="100%"
          height={trackHeight}
          bg="coolGray.100"
          borderRadius={pillRadius}
          p={trackPadding}
          position="relative"
          justifyContent="center"
        >
          {segmentWidth > 0 && (
            <Animated.View
              style={{
                position: "absolute",
                top: trackPadding,
                left: trackPadding,
                width: segmentWidth,
                height: trackHeight - trackPadding * 2,
                borderRadius: pillRadius * 0.85,
                backgroundColor: "#5B3FFF",
                transform: [{ translateX }],
              }}
            />
          )}

          <HStack width="100%" height="100%">
            {TABS.map((tab) => {
              const isActive = tab.key === currentFetchType;
              const label =
                callFrom === "TASK" ? tab.labelTask : tab.labelProject;
              const count = counts[tab.key] ?? 0;

              return (
                <Pressable
                  key={tab.key}
                  onPress={() => onChangeFetchType(tab.key)}
                  flex={1}
                  zIndex={1}
                >
                  {({ isPressed }) => (
                    <Box
                      flex={1}
                      justifyContent="center"
                      alignItems="center"
                      style={{ opacity: isPressed ? 0.7 : 1 }}
                    >
                      <HStack alignItems="center" space={1}>
                        <Text
                          numberOfLines={1}
                          fontSize={labelFontSize}
                          fontWeight={isActive ? "bold" : "medium"}
                          color={isActive ? "white" : "coolGray.500"}
                        >
                          {label}
                        </Text>
                        <Box
                          minW={badgeSize}
                          h={badgeSize}
                          px={1}
                          rounded="full"
                          bg={isActive ? "white" : "coolGray.200"}
                          justifyContent="center"
                          alignItems="center"
                        >
                          <Text
                            fontSize={badgeFontSize}
                            fontWeight="bold"
                            textAlign="center"
                            color={isActive ? "#5B3FFF" : "coolGray.700"}
                          >
                            {count || 0}
                          </Text>
                        </Box>
                      </HStack>
                    </Box>
                  )}
                </Pressable>
              );
            })}
          </HStack>
        </Box>

        {/* ── Search Bar ── */}
        <HStack
          width="100%"
          height={searchHeight}
          mt={height * 0.02}
          justifyContent="center"
          alignItems="center"
        >
          <HStack
            flex={1}
            height="100%"
            bg="white"
            borderRadius={searchRadius}
            borderWidth={1}
            borderColor="coolGray.200"
            alignItems="center"
            px={2}
          >
            <Icon
              as={Ionicons}
              name="search"
              size={searchIconSize}
              mr={2}
              color="coolGray.400"
            />
            <TextInput
              style={{
                flex: 1,
                fontSize: searchFontSize,
                color: "#000",

                // 100% WORKING FIX FOR ANDROID TEXT CUTTING & CENTERING:
                padding: 0,
                paddingVertical: 0,
                paddingTop: 0,
                paddingBottom: 0,
                margin: 0,
                includeFontPadding: false,
                textAlignVertical: "center",
                lineHeight: searchFontSize * 1.2, // Line height ko thoda adjust kiya gaya hai
              }}
              value={search}
              onChangeText={setSearch}
              placeholder={
                callFrom === "TASK" ? "Search tasks..." : "Search projects..."
              }
              placeholderTextColor="#a3a3a3"
              cursorColor="#5B3FFF" // Optional: gives a nice purple cursor
            />
          </HStack>
        </HStack>
      </Box>
    </Box>
  );
}

export default React.memo(FilterTabBar);
