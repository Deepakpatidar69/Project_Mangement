import React, { useMemo } from "react";
import {
  Box,
  HStack,
  VStack,
  Text,
  Icon,
  Pressable,
  Avatar,
} from "native-base";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { TaskProps } from "../../store/slices/types";
import {
  adjustSizeToResolveZoomInIssue,
  getShortText,
} from "../../utils/Helper";
import { getStatus } from "../utils/screen.utils";
import { Animated } from "react-native";
import { useScaleAnimation } from "../../hooks/useScaleAnimation";
import { useSelector } from "react-redux";
import { RootState } from "../../store";

export interface TaskCardProps {
  task: TaskProps;
  onPress?: () => void;
  onToggleCheck?: () => void;
  width: number;
}

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

export const TaskCard = ({
  task,
  onPress,
  onToggleCheck,
  width,
}: TaskCardProps) => {

    const { user } = useSelector((state: RootState) => state.auth);
  
  const basesize = width;

  // 1. FIRST HOOK
  const { title, badge, body, iconSize, meta } = useMemo(() => {
    const title = adjustSizeToResolveZoomInIssue(basesize * 0.048);
    const body = adjustSizeToResolveZoomInIssue(basesize * 0.036);
    const meta = adjustSizeToResolveZoomInIssue(basesize * 0.032);
    const badge = adjustSizeToResolveZoomInIssue(basesize * 0.03);
    const iconSize = adjustSizeToResolveZoomInIssue(basesize * 0.055);
    return { title, body, meta, badge, iconSize };
  }, [basesize]);

  // 2. SECOND HOOK - Moved above the early return!
  const { scaleValue, handlePressIn, handlePressOut } = useScaleAnimation();

  const isComplete = task.status;
  const accent = isComplete ? "#10B981" : "#7C3AED";
  const creatorName = task.taskCreator?.fullName ?? "Unknown";
  const creatorInitial = creatorName.charAt(0).toUpperCase();
  const avatarUri = task.taskCreator?.profileImgUrl;
  const projectStatus = getStatus(task.status, task.taskDeadline);

  const isProjectTask = task.project && task.project.projectId !== undefined;

    const findTaskCreatorRole = () => {
      if (isProjectTask && task.project) {

        const isAdmin = task.project.admin.userId ===  task.taskCreatorId;

        return isAdmin ? "Admin" : "Editor";
      }
      return "Creator";
    };

  // EARLY RETURN - Placed safely after all hooks
  if (basesize <= 0) return null;

  return (
    <Pressable
      onPress={onPress}
      width={"100%"}
      m={"1%"}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      {({ isPressed }) => (
        <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
          <Box
            width={"98%"}
            bg={isPressed ? "coolGray.50" : "white"}
            borderRadius={16}
            borderLeftWidth={4}
            borderLeftColor={accent}
            shadow={isPressed ? 1 : 3}
            overflow="hidden"
          >
            <VStack px={"4%"} pt={"4%"} pb={"3%"} space={2}>
              {/* ── Row 1 : status badge + date ── */}
              <HStack justifyContent="space-between" alignItems="center">
                <Box
                  px={2}
                  py={0.5}
                  borderRadius={20}
                  bg={projectStatus.background}
                  flexDirection="row"
                  alignItems="center"
                  style={{ gap: 4 }}
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
                </Box>

                <Text fontSize={meta} color="coolGray.400">
                  {getRelativeDate(task.createdAt)}
                </Text>
              </HStack>

              {/* ── Row 2 : title ── */}
              <Text
                fontSize={title}
                fontWeight="700"
                color="coolGray.800"
                numberOfLines={1}
                lineHeight={title * 1.35}
              >
                {task.taskHeader}
              </Text>

              {/* ── Row 3 : description ── */}
              {!!task.taskDesc && (
                <Text
                  fontSize={body}
                  color="coolGray.500"
                  numberOfLines={2}
                  lineHeight={body * 1.5}
                >
                  {getShortText(task.taskDesc, 100)}
                </Text>
              )}

              {/* ── Divider ── */}
              <Box height={"1px"} bg="coolGray.100" mt={1} />

              {/* ── Row 4 : creator + role + counters ── */}
              <HStack justifyContent="space-between" alignItems="center" pt={1}>
                <HStack alignItems="center" space={1.5}>
                  <Avatar
                    size={iconSize * 1.1}
                    bg={accent}
                    source={avatarUri ? { uri: avatarUri } : undefined}
                  >
                    <Text fontSize={meta} color="white" fontWeight="700">
                      {creatorInitial}"yuyu"
                    </Text>
                  </Avatar>
                  <VStack>
                    <Text fontSize={meta} fontWeight="600" color="coolGray.700">
                      {getShortText(creatorName, 18)}
                    </Text>
                    <Text fontSize={badge} color="coolGray.400">
                      {findTaskCreatorRole()}
                    </Text>
                  </VStack>
                </HStack>

                <HStack space={3} alignItems="center">
                  {/* <HStack alignItems="center" space={1}>
                    <Icon
                      as={Ionicons}
                      name="chatbubble-outline"
                      size={iconSize}
                      color="coolGray.400"
                    />
                    <Text fontSize={meta} color="coolGray.500" fontWeight="500">
                      {task.commentCount}
                    </Text>
                  </HStack> */}

                  <HStack alignItems="center" space={1}>
                    <Icon
                      as={MaterialIcons}
                      name="message"
                      size={iconSize}
                      color="coolGray.400"
                    />
                    <Text fontSize={meta} color="coolGray.500" fontWeight="500">
                      {task.messageCount}
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
