import React, { useRef } from "react";
import {
  Box,
  HStack,
  VStack,
  Text,
  Icon,
  Pressable,
  Avatar,
  Progress,
} from "native-base";
import {
  FontAwesome,
  Ionicons,
  MaterialIcons,
  // @ts-ignore - no declaration file for react-native-vector-icons
} from "react-native-vector-icons";
import { ProjectProps } from "../../store/slices/types";
import {
  adjustSizeToResolveZoomInIssue,
  getShortText,
} from "../../utils/Helper";
import { getStatus } from "../utils/screen.utils";
import { Animated } from "react-native";
import { useScaleAnimation } from "../../hooks/useScaleAnimation";

// ─── Theme Map ────────────────────────────────────────────────────────────────

const THEMES = {
  purple: { accent: "#7C3AED", accentLight: "#EDE9FE", accentText: "#4C1D95" },
  blue: { accent: "#2563EB", accentLight: "#DBEAFE", accentText: "#1E3A8A" },
  green: { accent: "#059669", accentLight: "#D1FAE5", accentText: "#065F46" },
  orange: { accent: "#D97706", accentLight: "#FEF3C7", accentText: "#92400E" },
} as const;

type ThemeKey = keyof typeof THEMES;
export const THEME_CYCLE: ThemeKey[] = ["purple", "blue", "green", "orange"];

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ProjectCardProps {
  project: ProjectProps;
  colorTheme?: ThemeKey;
  onPress?: () => void;
  onOptionsPress?: () => void;
  width: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getRelativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

// ─── ProjectCard ──────────────────────────────────────────────────────────────

export const ProjectCard = ({
  project,
  colorTheme = "purple",
  onPress,
  onOptionsPress,
  width,
}: ProjectCardProps) => {
  const baseSize = width;

  const title = adjustSizeToResolveZoomInIssue(baseSize * 0.048);
  const body = adjustSizeToResolveZoomInIssue(baseSize * 0.036);
  const meta = adjustSizeToResolveZoomInIssue(baseSize * 0.032);
  const badge = adjustSizeToResolveZoomInIssue(baseSize * 0.03);
  const iconSize = baseSize * 0.055;

  const theme = THEMES[colorTheme];

  const isComplete = project.status;
  const accent = isComplete ? "#10B981" : theme.accent;

  const creatorName = project.admin?.fullName ?? "Unknown";
  const creatorInitial = creatorName?.charAt(0).toUpperCase();
  const avatarUri = project.admin?.profileImgUrl;

  const percentage =
    project.totalTasksCount > 0
      ? Math.round((project.completedTaskCount / project.totalTasksCount) * 100)
      : 0;

  const projectStatus = getStatus(project.status, project.projectDeadline);

  const { scaleValue, handlePressIn, handlePressOut } = useScaleAnimation();

  if (baseSize <= 0) return null;

  return (
    <Pressable
      onPress={onPress}
      width={"100%"}
      m={"1%"}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      {({ isPressed }) => (
        // 4. Wrap your UI in Animated.View and apply the scale transform here!
        <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
          <Box
            width={"98%"}
            bg={isPressed ? "coolGray.50" : "white"}
            borderRadius={baseSize * 0.05}
            borderLeftWidth={baseSize * 0.015}
            borderLeftColor={accent}
            shadow={isPressed ? 1 : 3}
            overflow="hidden"
          >
            <VStack width={"100%"} px={"4%"} pt={"4%"} pb={"3%"} space={2}>
              {/* ── Row 1: Status badge + date ── */}
              <HStack justifyContent="space-between" alignItems="center">
                <HStack
                  px={"2%"}
                  py={"1%"}
                  borderRadius={baseSize * 0.1}
                  bg={projectStatus.background}
                  alignItems="center"
                  justifyContent={"center"}
                  space={"5%"}
                >
                  <Icon
                    as={projectStatus.iconType}
                    name={projectStatus.iconName}
                    size={iconSize * 0.85}
                    color={projectStatus.color}
                  />
                  <Text
                    fontSize={badge}
                    fontWeight="600"
                    color={projectStatus.color}
                  >
                    {projectStatus.status}
                  </Text>
                </HStack>

                <HStack
                  justifyContent={"center"}
                  alignItems={"center"}
                  space={"4%"}
                >
                  <Text fontSize={meta} color="coolGray.400">
                    {getRelativeDate(project.createdAt)}
                  </Text>
                </HStack>
              </HStack>

              {/* ── Row 2: Title ── */}
              <Text
                fontSize={title}
                fontWeight="700"
                color="coolGray.800"
                numberOfLines={1}
                lineHeight={title * 1.35}
              >
                {project.projectHeader}
              </Text>

              {/* ── Row 3: Description ── */}
              {!!project.projectDesc && (
                <Text
                  fontSize={body}
                  color="coolGray.500"
                  numberOfLines={2}
                  lineHeight={body * 1.5}
                >
                  {getShortText(project.projectDesc, 40)}
                </Text>
              )}

              {/* ── Row 4: Progress bar ── */}
              <VStack width={"100%"} flex={1} space={"5%"}>
                <HStack justifyContent="space-between" alignItems="center">
                  <Text
                    fontSize={badge * 1.2}
                    color="coolGray.400"
                    fontWeight="500"
                  >
                    Progress
                  </Text>
                  <Text
                    fontSize={badge * 1.2}
                    color="coolGray.600"
                    fontWeight="700"
                  >
                    {percentage}%
                  </Text>
                </HStack>
                <Progress
                  width={"100%"}
                  value={percentage}
                  size={meta}
                  bg="coolGray.100"
                  _filledTrack={{ bg: accent }}
                  borderRadius={99}
                />
              </VStack>

              {/* ── Divider ── */}
              <Box height={"1px"} bg="coolGray.100" mt={1} />

              {/* ── Row 5: Admin info + task counts ── */}
              <HStack
                width={"100%"}
                justifyContent="space-between"
                alignItems="center"
              >
                <HStack
                  justifyContent={"flex-start"}
                  alignItems="center"
                  space={"5%"}
                >
                  <Avatar
                    size={iconSize * 1.2}
                    bg={accent}
                    source={avatarUri ? { uri: avatarUri } : undefined}
                  >
                    <Text fontSize={meta * 1.3} color="white" fontWeight="700">
                      {creatorInitial}
                    </Text>
                  </Avatar>
                  <VStack justifyContent={"center"} alignItems={"flex-start"}>
                    <Text fontSize={meta} fontWeight="600" color="coolGray.700">
                      {getShortText(creatorName, 18)}
                    </Text>
                    <Text fontSize={badge} color="coolGray.400">
                      Admin
                    </Text>
                  </VStack>
                </HStack>

                <HStack
                  justifyContent={"flex-end"}
                  alignItems="center"
                  space={"6%"}
                >
                  <HStack
                    justifyContent={"space-between"}
                    space={"4%"}
                    alignItems="center"
                  >
                    <Icon
                      as={FontAwesome}
                      name="tasks"
                      size={iconSize * 0.8}
                      color="coolGray.400"
                    />
                    <Text fontSize={meta} color="coolGray.500" fontWeight="500">
                      {project.totalTasksCount ?? 0}
                    </Text>
                  </HStack>
                  <HStack
                    alignItems="center"
                    justifyContent={"space-between"}
                    space={"4%"}
                  >
                    <Icon
                      as={MaterialIcons}
                      name="message"
                      size={iconSize * 0.8}
                      color="coolGray.400"
                    />
                    <Text fontSize={meta} color="coolGray.500" fontWeight="500">
                      {project.messageCount ?? 0}
                    </Text>
                  </HStack>
                  <HStack
                    alignItems="center"
                    justifyContent={"space-between"}
                    space={"4%"}
                  >
                    <Icon
                      as={Ionicons}
                      name="people-outline"
                      size={iconSize * 0.9}
                      color="coolGray.400"
                    />
                    <Text fontSize={meta} color="coolGray.500" fontWeight="500">
                      {project.membersCount ?? 0}
                    </Text>
                  </HStack>
                </HStack>
              </HStack>
            </VStack>
          </Box>
        </Animated.View>
      )}
    </Pressable>
  );
};
