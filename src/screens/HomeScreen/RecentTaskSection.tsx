import React, { useEffect } from "react";
import {
  Box,
  HStack,
  VStack,
  Text,
  Icon,
  Avatar,
  Pressable,
} from "native-base";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { FlatList } from "react-native";
import { useSetAtom } from "jotai";
import { AppDispatch, RootState } from "../../store";
import {  clearTaskError, fetchDashboardTasks } from "../../store/slices/TaskSlice";
import { RouteStackParamStack } from "../../appNavigator/navigator.utils";
import { useContainerDimensions } from "../../hooks/OnlayoutHooks";
import {
  adjustSizeToResolveZoomInIssue,
  getShortText,
} from "../../utils/Helper";
import { TaskProps } from "../../store/slices/types";
import { Animated } from "react-native";
import AppLoader from "../../components/CustomLoader";
import { useScaleAnimation } from "../../hooks/useScaleAnimation";
import { isDisplayErrorMessageAtom } from "../../utils/Constent"; // adjust path to where you defined this atom

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

// ─── Single row — no onLayout needed, inherits width from section ────────────
function TaskRow({
  task,
  fontSize,
  isLast,
  onTapTask,
}: {
  task: TaskProps;
  fontSize: { title: number; meta: number; badge: number; iconSize: number };
  isLast: boolean;
  onTapTask: (taskId: string) => void;
}) {
  const isComplete = task.status;
  const accent = isComplete ? "#10B981" : "#7C3AED"; // emerald vs violet

  const creatorName = task.taskCreator.fullName ?? "Unknown";
  const creatorInitial = creatorName.charAt(0).toUpperCase();
  const avatarUri = task.taskCreator?.profileImgUrl; // adjust to your UserProps shape

  const { scaleValue, handlePressIn, handlePressOut } = useScaleAnimation();

  return (
    <Box
      width={"100%"}
      borderBottomWidth={isLast ? 0 : 0.5}
      borderBottomColor={"coolGray.100"}
    >
      <Pressable
        onPress={() => onTapTask(task.taskId)}
        mr={"2%"}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
          <HStack
            width={"100%"}
            px={"4%"}
            py={"3.5%"}
            alignItems={"center"}
            space={"3%"}
          >
            {/* ── Checkbox ── */}
            <Box
              w={fontSize.title * 1.6}
              h={fontSize.title * 1.6}
              borderRadius={6}
              bg={isComplete ? "violet.600" : "transparent"}
              borderWidth={isComplete ? 0 : 2}
              borderColor={"emerald.500"}
              justifyContent={"center"}
              alignItems={"center"}
              flexShrink={0}
            >
              {isComplete && (
                <Icon
                  as={Ionicons}
                  name={"checkmark"}
                  size={fontSize.badge}
                  color={"white"}
                />
              )}
            </Box>

            {/* ── Title + updated ── */}
            <VStack flex={1} space={"0.5%"}>
              <Text
                fontSize={fontSize.title}
                fontWeight={"500"}
                color={isComplete ? "coolGray.400" : "coolGray.800"}
                numberOfLines={1}
                strikeThrough={isComplete}
              >
                {task.taskHeader}
              </Text>
              <HStack alignItems="center" space={1.5}>
                <Avatar
                  size={fontSize.iconSize}
                  bg={accent}
                  source={avatarUri ? { uri: avatarUri } : undefined}
                >
                  <Text
                    fontSize={fontSize.meta * 1.1}
                    color="white"
                    fontWeight="700"
                  >
                    {creatorInitial}
                  </Text>
                </Avatar>
                <VStack>
                  <Text
                    fontSize={fontSize.meta}
                    fontWeight="600"
                    color="coolGray.700"
                  >
                    {getShortText(creatorName, 18)}
                  </Text>
                  <Text fontSize={fontSize.badge} color="coolGray.400">
                    {task.userRole}
                  </Text>
                </VStack>
              </HStack>
            </VStack>

            {/* ── Badge + date ── */}
            <VStack alignItems={"flex-end"} space={"2%"} flexShrink={0}>
              <Box
                px={fontSize.badge * 0.8}
                py={fontSize.badge * 0.4}
                borderRadius={fontSize.badge * 1.2}
                right={-adjustSizeToResolveZoomInIssue(fontSize.badge * 1.2)}
                bg={isComplete ? "emerald.50" : "violet.50"}
              >
                <Text
                  fontSize={fontSize.badge}
                  fontWeight={"500"}
                  color={isComplete ? "emerald.800" : "violet.800"}
                >
                  {isComplete ? "Completed" : "In progress"}
                </Text>
              </Box>
              <Text fontSize={fontSize.meta} color={"coolGray.400"}>
                {getRelativeDate(task.createdAt)}
              </Text>
            </VStack>
          </HStack>
        </Animated.View>
      </Pressable>
    </Box>
  );
}

// ─── Section ─────────────────────────────────────────────────────────────────
export const RecentTaskSection = ({
  onTapViewAllTasks,
  onClickCreateTask,
}: {
  onTapViewAllTasks: () => void;
  onClickCreateTask: () => void;
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation =
    useNavigation<
      NativeStackNavigationProp<RouteStackParamStack, "HomeScreen">
    >();
  const { latestTasks, taskLoading, taskError } = useSelector(
    (s: RootState) => s.task.dashboard,
  );

  const { containerDimensions, onLayout } = useContainerDimensions();
  const w = containerDimensions.width;

  // Global error modal setter
  const setErrorModal = useSetAtom(isDisplayErrorMessageAtom);

  // All font sizes from the section's own measured width
  const fontSize = {
    header: adjustSizeToResolveZoomInIssue(w * 0.048),
    title: adjustSizeToResolveZoomInIssue(w * 0.038),
    meta: adjustSizeToResolveZoomInIssue(w * 0.03),
    badge: adjustSizeToResolveZoomInIssue(w * 0.028),
    iconSize: adjustSizeToResolveZoomInIssue(w * 0.055),
  };

  useEffect(() => {
    latestTasks.length === 0 && dispatch(fetchDashboardTasks());
  }, [dispatch]);

  // ── Show global error modal whenever the slice reports a task error ────────
  useEffect(() => {
    if (!taskError) return;

    setErrorModal((prev) => ({
      ...prev,
      isModalOpen: true,
      title: "Something went wrong",
      subTitle:
        typeof taskError === "string"
          ? taskError
          : ((taskError as any)?.message ??
            "Unable to fetch tasks. Please try again."),
      onClickLeftButton: () => {
        dispatch(clearTaskError());
       navigation.canGoBack() && navigation.goBack?.();
      },
    }));
  }, [taskError, setErrorModal, navigation]);

  const onTapTask = async (taskId: string) => {
    navigation.navigate("TaskDetail", { taskId: taskId });
  };

  // ── renderItem ──────────────────────────────────────────────────────────────
  const renderItem = ({ item, index }: { item: TaskProps; index: number }) => (
    <TaskRow
      task={item}
      fontSize={fontSize}
      isLast={index === latestTasks.length - 1}
      onTapTask={onTapTask}
    />
  );

  // ── keyExtractor ────────────────────────────────────────────────────────────
  const keyExtractor = (item: TaskProps) => item.taskId;

  // ── Empty state ─────────────────────────────────────────────────────────────
  const ListEmptyComponent = () => (
    <Box
      bg={"white"}
      borderRadius={16}
      borderWidth={1}
      borderColor={"coolGray.100"}
      borderStyle={"dashed"}
      py={8}
      alignItems={"center"}
    >
      <Text fontSize={fontSize.meta * 1.2} color={"coolGray.400"} mb={3}>
        No tasks found.
      </Text>

      <Pressable
        onPress={() =>
          navigation.navigate("CreateTaskScreen", {
            taskType: "TASK",
            onBack: () => navigation.goBack(),
          })
        }
        bg={"violet.600"}
        px={"5%"}
        py={"2%"}
        borderRadius={20}
        _pressed={{
          opacity: 0.7,
          style: { transform: [{ scale: 0.9 }] },
        }}
      >
        <Text fontSize={fontSize.meta * 1.5} color={"white"} fontWeight={"600"}>
          + Create New Task
        </Text>
      </Pressable>
    </Box>
  );

  return (
    <Box width={"100%"} onLayout={onLayout}>
      {containerDimensions.baseSize > 0 && (
        <VStack width={"100%"} space={"3%"}>
          {/* ── Section header ── */}
          <HStack
            width={"100%"}
            justifyContent={"space-between"}
            alignItems={"center"}
          >
            <Text
              fontSize={fontSize.header}
              fontWeight={"700"}
              color={"coolGray.800"}
            >
              Recent Tasks
            </Text>
            <Pressable onPress={onTapViewAllTasks}>
              <Text
                fontSize={fontSize.header * 0.85}
                color={"violet.600"}
                fontWeight={"500"}
              >
                View All
              </Text>
            </Pressable>
          </HStack>

          {/* ── Card container ── */}
          {taskLoading ? (
            <Box
              bg={"white"}
              borderRadius={adjustSizeToResolveZoomInIssue(
                containerDimensions.width * 0.04,
              )}
              borderWidth={adjustSizeToResolveZoomInIssue(
                containerDimensions.width * 0.005,
              )}
              borderColor={"coolGray.100"}
              py={adjustSizeToResolveZoomInIssue(
                containerDimensions.width * 0.1,
              )}
              alignItems={"center"}
            >
              <AppLoader
                isLoading
                fullScreen={false}
                message="tasks loading"
              />
            </Box>
          ) : (
            <Box
              bg={"white"}
              borderRadius={adjustSizeToResolveZoomInIssue(
                containerDimensions.width * 0.04,
              )}
              borderWidth={adjustSizeToResolveZoomInIssue(
                containerDimensions.width * 0.005,
              )}
              borderColor={"coolGray.100"}
              overflow={
                latestTasks && latestTasks.length > 0 ? "hidden" : "visible"
              }
              shadow={latestTasks && latestTasks.length > 0 ? 1 : 0}
            >
              <FlatList
                data={latestTasks ?? []}
                keyExtractor={keyExtractor}
                renderItem={renderItem}
                scrollEnabled={false}
                ListEmptyComponent={ListEmptyComponent}
                style={{ backgroundColor: "transparent" }}
              />
            </Box>
          )}
        </VStack>
      )}
    </Box>
  );
};
