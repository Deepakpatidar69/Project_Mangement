import React, {
  useEffect,
  useMemo,
  useState,
  useRef,
  useCallback,
} from "react";
// @ts-ignore
import { MaterialIcons, Ionicons } from "react-native-vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  Box,
  HStack,
  VStack,
  Pressable,
  Icon,
  Avatar as NBAvatar,
  Center,
} from "native-base";

import { RootState, AppDispatch } from "../../store";
import { RouteStackParamStack } from "../../appNavigator/navigator.utils";

import { useContainerDimensions } from "../../hooks/OnlayoutHooks";
import {
  adjustSizeToResolveZoomInIssue,
  getShortText,
} from "../../utils/Helper";
import { Text, RefreshControl } from "react-native"; // <-- 1. Import RefreshControl
import { clearTaskError, fetchTaskForId } from "../../store/slices/TaskSlice";
import {
  deleteComment,
  fetchTaskComments,
} from "../../store/slices/CommentSlice";
import { FontAwesome } from "@expo/vector-icons";
import { ProjectProps, TaskProps } from "../../store/slices/types";
import { formatDate, PRIORITY_CONFIG, timeAgo } from "../../utils/Helper";
import { CommonDetailHeader } from "../../components/CommonDetailHeader";
import { getStatus } from "../utils/screen.utils";
import RecentMessages from "../../components/DisplayRecentMessage";
import {
  onOpenMessageModel,
  onTapDeadlineUpdateModal,
  onTapDeleteButton,
  onTapMarkComplete,
  onTapUpdatePriority,
} from "../../modals/model.utils";
import UpdateTask from "./UpdateTasks";
import { useSetAtom } from "jotai";
import { AppLoaderAtom } from "../../utils/Constent";
import { isDisplayErrorMessageAtom } from "../../utils/Constent";
import { MenuOption } from "../../utils/props.utils";
import { getTaskMenuOptions } from "../../modals/ActionMenu.Options.utile";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { clearTaskMessages} from "../../store/slices/MessageSlice";

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function TaskDetailScreen({ route }: any) {
  const [isDisplayUpdateTask, setIsDisplayUpdateTask] =
    useState<boolean>(false);

  const navigation =
    useNavigation<NativeStackNavigationProp<RouteStackParamStack>>();
  const { taskId } = route.params;
  const dispatch = useDispatch<AppDispatch>();

  const { containerDimensions, onLayout } = useContainerDimensions();
  const baseSize = containerDimensions.width;

  const fs = useMemo(
    () => ({
      header: adjustSizeToResolveZoomInIssue(baseSize * 0.065),
      title: adjustSizeToResolveZoomInIssue(baseSize * 0.045),
      subTitle: adjustSizeToResolveZoomInIssue(baseSize * 0.04),
      meta: adjustSizeToResolveZoomInIssue(baseSize * 0.03),
      icon: adjustSizeToResolveZoomInIssue(baseSize * 0.1),
    }),
    [baseSize],
  );

  const { singleTask, loading, error } = useSelector(
    (state: RootState) => state.task,
  );
  const { singleProject } = useSelector((state: RootState) => state.project);
  const { comments, loading: commentLoading } = useSelector(
    (state: RootState) => state.comment,
  );
  const { user } = useSelector((state: RootState) => state.auth);

  const task = singleTask as TaskProps | null;
  const project = singleProject as ProjectProps | null;

  // ─── Global Loader & Error Logic ─────────────────────────────────────────
  const setDisplayAppLoader = useSetAtom(AppLoaderAtom);
  const setErrorModal = useSetAtom(isDisplayErrorMessageAtom);

  const hasFetched = useRef(false);
  const isDeleted = useRef(false);

  // ─── Refresh Logic ───────────────────────────────────────────────────────
  // 2. Setup states for pulling to refresh
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // 3. Create the refresh handler
  const onRefresh = useCallback(() => {
    setRefreshing(true);

    // Re-fetch the task data via Redux
    dispatch(fetchTaskForId(taskId));

    // Change the key to remount child components like <RecentMessages />
    // so they trigger their internal re-fetches automatically.
    setTimeout(() => {
      setRefreshKey((prevKey) => prevKey + 1);
      setRefreshing(false);
    }, 1000);
  }, [dispatch, taskId]);
  // ─────────────────────────────────────────────────────────────────────────

  // ── Clear stale task messages only when navigating to a DIFFERENT task.
  useEffect(() => {
    dispatch(clearTaskMessages());
  }, [taskId, dispatch]);

  useEffect(() => {
    // Determine if we are still waiting on data or layout
    const isUIReady = containerDimensions.baseSize > 0;
    // We only consider the task "ready" if it exists AND its ID matches the route ID
    const isTaskDataReady = task && task.taskId === taskId;

    if (
      loading ||
      commentLoading ||
      !isUIReady ||
      (!isTaskDataReady && !error)
    ) {
      setDisplayAppLoader({
        isLoading: true,
        message: "Loading task...",
      });
    } else {
      setDisplayAppLoader({ isLoading: false, message: "" });
    }
  }, [
    loading,
    commentLoading,
    containerDimensions.baseSize,
    task,
    taskId,
    error,
    setDisplayAppLoader,
  ]);

  // ─── Fetch Task API Call ──────────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;

    if (taskId && !hasFetched.current) {
      hasFetched.current = true;
      dispatch(clearTaskError());

      dispatch(fetchTaskForId(taskId))
        .unwrap()
        .catch((errPayload) => {
          if (!isMounted || isDeleted.current) return;

          setErrorModal((prev) => ({
            ...prev,
            isModalOpen: true,
            title: "Something went wrong",
            subTitle:
              typeof errPayload === "string"
                ? errPayload
                : ((errPayload as any)?.message ??
                  "Unable to load this task. Please try again."),
            onClickLeftButton: () => {
              dispatch(clearTaskError());
              navigation.goBack();
            },
          }));
        });
    }

    return () => {
      isMounted = false;
      setDisplayAppLoader({ isLoading: false, message: "" });
    };
  }, [taskId, dispatch, setErrorModal, navigation, setDisplayAppLoader]);

  // ─── GUARDS ─────────────────────────────────────────────

  if (isDeleted.current) {
    return <Box flex={1} bg="coolGray.50" />;
  }

  if (containerDimensions.baseSize === 0 || !task || task.taskId !== taskId) {
    if (!loading && error && (!task || task.taskId !== taskId)) {
      return (
        <Center flex={1} bg="coolGray.50" onLayout={onLayout}>
          <Text style={{ color: "#9CA3AF" }}>Task not found</Text>
        </Center>
      );
    }
    return <Box flex={1} bg="coolGray.50" onLayout={onLayout} />;
  }

  // ─── Derived State ───────────────────────────────────────────────────────

  const isPrivateTask = !task.projectId;
  const isProjectTask = !!task.projectId;
  const isProjectAdmin = task.userRole === "ADMIN";
  const isProjectEditor = task.userRole === "EDITOR";
  const isTaskCreator = task.taskCreator?.userId === user?.userId;
  const canPerformOperation = isPrivateTask
    ? isTaskCreator
    : isProjectAdmin || isProjectEditor;

  const isCompleted = task.status === true;

  const priorityCfg = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.MEDIUM;

  const taskStatus = getStatus(task.status, task.taskDeadline);
  const projectStatus = project
    ? getStatus(project.status, project.projectDeadline)
    : null;

  // ─── Handlers ────────────────────────────────────────────────────────────

  const onHandleClickMessageButton = () => {
    onOpenMessageModel({
      deadline: task.taskDeadline,
      isDisplay: true,
      status: task.status,
      title: task.taskHeader,
      type: "TASK",
      uniqueId: task.taskId,
    });
  };

  const onClickMarkCompleted = () => {
    onTapMarkComplete({
      type: "TASK",
      taskId: task!.taskId,
      isProjectTask: isProjectTask,
      projectId: project?.projectId,
      isComplete: task.status ?? false,
    });
  };

  const onClickUpdateDeadline = async () => {
    await onTapDeadlineUpdateModal({
      currentDeadline: task!.taskDeadline,
      type: "TASK",
      taskId: task!.taskId,
      isProjectTask: isProjectTask,
      projectId: project?.projectId,
    });
  };

  const onClickUpdatePriority = async () => {
    await onTapUpdatePriority({
      currentPriority: task!.priority,
      type: "TASK",
      taskId: task!.taskId,
      isProjectTask: isProjectTask,
      projectId: project?.projectId,
    });
  };

  const handleDeleteTask = async () => {
    await onTapDeleteButton({
      type: "TASK",
      isProjecttask: isProjectTask,
      projectId: project?.projectId,
      taskId: task!.taskId,
      onSuccess: () => {
        isDeleted.current = true;
        dispatch(clearTaskError());
        navigation.goBack();
      },
    });
  };

  const taskMenuOptions: MenuOption[] = getTaskMenuOptions({
    isCompleted: isCompleted,
    onClickUpdate: () => setIsDisplayUpdateTask(true),
    onClickDelete: handleDeleteTask,
    onClickMarkComplete: onClickMarkCompleted,
  });

  // ─── Render ──────────────────────────────────────────────────────────────

  if (isDisplayUpdateTask) {
    return (
      <UpdateTask
        onCancel={() => setIsDisplayUpdateTask(false)}
        onSuccess={() => setIsDisplayUpdateTask(false)}
      />
    );
  }

  return (
    <Box flex={1} bg="coolGray.50" onLayout={onLayout}>
      <CommonDetailHeader
        title="Task Details"
        subtitle="Here's everything about this task."
        onTabBackButton={() => navigation.goBack()}
        showEdit={canPerformOperation && !isCompleted}
        onEdit={() => setIsDisplayUpdateTask(true)}
        showMenuBar={canPerformOperation}
        menuOption={taskMenuOptions}
        fs={baseSize}
      />
      <KeyboardAwareScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bottomOffset={20}
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: containerDimensions.height * 0.01,
          paddingHorizontal: "4%",
        }}
        // 4. Attach RefreshControl here
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* 5. Wrap everything in a key to force complete remounts and refetching of child APIs */}
        <VStack width="100%" key={`task-content-${refreshKey}`}>
          {/* ── Task type + status badges ── */}
          <HStack
            justifyContent="space-between"
            pt={"2%"}
            alignItems="center"
            mb={3}
          >
            <Box
              bg={isPrivateTask ? "coolGray.600" : "indigo.50"}
              px={adjustSizeToResolveZoomInIssue(baseSize * 0.025)}
              py={adjustSizeToResolveZoomInIssue(baseSize * 0.015)}
              rounded="full"
            >
              <Text
                style={{
                  fontSize: adjustSizeToResolveZoomInIssue(fs.meta * 0.75),
                  fontWeight: "700",
                  color: isPrivateTask ? "white" : "indigo.500",
                  letterSpacing: 0.6,
                }}
              >
                {isPrivateTask ? "PRIVATE TASK" : "PROJECT TASK"}
              </Text>
            </Box>
            <HStack
              bg={taskStatus.background}
              px={adjustSizeToResolveZoomInIssue(baseSize * 0.02)}
              py={adjustSizeToResolveZoomInIssue(baseSize * 0.01)}
              rounded="full"
              alignItems="center"
              space={adjustSizeToResolveZoomInIssue(baseSize * 0.01)}
            >
              <Icon
                as={taskStatus.iconType}
                name={taskStatus.iconName}
                size={fs.icon * 0.52}
                color={taskStatus.color}
              />
              <Text
                style={{
                  fontSize: adjustSizeToResolveZoomInIssue(baseSize * 0.03),
                  fontWeight: "600",
                  color: taskStatus.color,
                }}
              >
                {taskStatus.status}
              </Text>
            </HStack>
          </HStack>

          {/* ── Task title + description ── */}
          <Box
            bg="coolGray.50"
            rounded="2xl"
            p={adjustSizeToResolveZoomInIssue(baseSize * 0.02)}
            pl={adjustSizeToResolveZoomInIssue(baseSize * 0.05)}
            mb={adjustSizeToResolveZoomInIssue(baseSize * 0.05)}
            shadow={1}
          >
            <Text
              style={{
                fontSize: adjustSizeToResolveZoomInIssue(baseSize * 0.06),
                fontWeight: "800",
                color: "#111827",
                marginBottom: adjustSizeToResolveZoomInIssue(fs.title * 0.85),
              }}
            >
              {task.taskHeader}
            </Text>
            <Text
              style={{
                fontSize: adjustSizeToResolveZoomInIssue(fs.subTitle * 0.8),
                color: "#6B7280",
                marginBottom: adjustSizeToResolveZoomInIssue(baseSize * 0.05),
              }}
            >
              {getShortText(task.taskDesc, 80) || "No description available."}
            </Text>
          </Box>

          {/* ── Metadata chips ── */}
          <VStack
            space={adjustSizeToResolveZoomInIssue(baseSize * 0.03)}
            mb={adjustSizeToResolveZoomInIssue(baseSize * 0.04)}
          >
            <HStack justifyContent="space-between">
              {/* Priority Card */}
              <HStack
                w="48%"
                bg="white"
                rounded="xl"
                p={adjustSizeToResolveZoomInIssue(baseSize * 0.03)}
                borderWidth={1}
                borderColor="coolGray.100"
                alignItems="center"
                justifyContent="space-between"
              >
                <HStack
                  space={adjustSizeToResolveZoomInIssue(baseSize * 0.02)}
                  alignItems="center"
                  flex={1}
                >
                  <Center
                    w={adjustSizeToResolveZoomInIssue(baseSize * 0.08)}
                    h={adjustSizeToResolveZoomInIssue(baseSize * 0.08)}
                    rounded="lg"
                    bg={priorityCfg.bg}
                  >
                    <Icon
                      as={Ionicons}
                      name={priorityCfg.icon}
                      size={adjustSizeToResolveZoomInIssue(fs.icon * 0.5)}
                      color={priorityCfg.color}
                    />
                  </Center>
                  <VStack flex={1} pr={1}>
                    <Text
                      style={{
                        fontSize: adjustSizeToResolveZoomInIssue(fs.meta * 1.2),
                        fontWeight: "700",
                        color: priorityCfg.color,
                      }}
                    >
                      {priorityCfg.label}
                    </Text>
                    <Text
                      style={{
                        fontSize: adjustSizeToResolveZoomInIssue(fs.meta),
                        color: "#4b5563",
                      }}
                    >
                      Priority
                    </Text>
                  </VStack>
                </HStack>
                {isTaskCreator && (
                  <Pressable
                    disabled={isCompleted}
                    alignItems="center"
                    justifyContent="center"
                    right={-adjustSizeToResolveZoomInIssue(baseSize * 0.03)}
                    onPress={onClickUpdatePriority}
                  >
                    <Icon
                      as={FontAwesome}
                      name="pencil-square-o"
                      size={adjustSizeToResolveZoomInIssue(fs.icon * 0.8)}
                      color={isCompleted ? "coolGray.200" : "indigo.500"}
                    />
                  </Pressable>
                )}
              </HStack>

              {/* Deadline Card */}
              <HStack
                w="48%"
                bg="white"
                rounded="xl"
                p={adjustSizeToResolveZoomInIssue(baseSize * 0.03)}
                borderWidth={1}
                borderColor="coolGray.100"
                alignItems="center"
                justifyContent="space-between"
              >
                <HStack
                  space={adjustSizeToResolveZoomInIssue(baseSize * 0.02)}
                  alignItems="center"
                  flex={1}
                >
                  {isTaskCreator && (
                    <Pressable
                      position={"absolute"}
                      disabled={isCompleted}
                      right={-adjustSizeToResolveZoomInIssue(baseSize * 0.035)}
                      alignItems="center"
                      justifyContent="center"
                      onPress={onClickUpdateDeadline}
                    >
                      <Icon
                        as={FontAwesome}
                        name="pencil-square-o"
                        size={adjustSizeToResolveZoomInIssue(fs.icon * 0.8)}
                        color={isCompleted ? "coolGray.200" : "indigo.500"}
                      />
                    </Pressable>
                  )}
                  <Center
                    w={adjustSizeToResolveZoomInIssue(baseSize * 0.08)}
                    h={adjustSizeToResolveZoomInIssue(baseSize * 0.08)}
                    rounded="lg"
                    bg="indigo.50"
                  >
                    <Icon
                      as={Ionicons}
                      name="calendar-outline"
                      size={adjustSizeToResolveZoomInIssue(fs.icon * 0.5)}
                      color="indigo.500"
                    />
                  </Center>
                  <VStack flex={1} pr={1}>
                    <Text
                      style={{
                        width: "90%",
                        fontSize: adjustSizeToResolveZoomInIssue(fs.meta * 0.9),
                        fontWeight: "700",
                        color: "#111827",
                      }}
                    >
                      {formatDate(task.taskDeadline, true)}
                    </Text>
                    <Text
                      style={{
                        fontSize: adjustSizeToResolveZoomInIssue(fs.meta),
                        color: "#6B7280",
                      }}
                    >
                      Deadline
                    </Text>
                  </VStack>
                </HStack>
              </HStack>
            </HStack>

            {/* Row 2: Messages & Comments */}
            <HStack justifyContent="space-between">
              <HStack
                w="48%"
                bg="white"
                rounded="xl"
                p={adjustSizeToResolveZoomInIssue(baseSize * 0.03)}
                borderWidth={1}
                borderColor="coolGray.100"
                alignItems="center"
              >
                <HStack
                  space={adjustSizeToResolveZoomInIssue(baseSize * 0.03)}
                  alignItems="center"
                >
                  <Center
                    w={adjustSizeToResolveZoomInIssue(baseSize * 0.1)}
                    h={adjustSizeToResolveZoomInIssue(baseSize * 0.1)}
                    rounded="lg"
                    bg="blue.50"
                  >
                    <Icon
                      as={Ionicons}
                      name="chatbox-outline"
                      size={adjustSizeToResolveZoomInIssue(fs.icon * 0.5)}
                      color="orange.500"
                    />
                  </Center>
                  <VStack>
                    <Text
                      style={{
                        fontSize: adjustSizeToResolveZoomInIssue(fs.meta * 1.5),
                        fontWeight: "800",
                        color: "#111827",
                      }}
                    >
                      {task.messageCount}
                    </Text>
                    <Text
                      style={{
                        fontSize: adjustSizeToResolveZoomInIssue(fs.meta),
                        color: "#6B7280",
                      }}
                    >
                      Messages
                    </Text>
                  </VStack>
                </HStack>
              </HStack>

              {/* <HStack
                w="48%"
                bg="white"
                rounded="xl"
                p={adjustSizeToResolveZoomInIssue(baseSize * 0.03)}
                borderWidth={1}
                borderColor="coolGray.100"
                alignItems="center"
              >
                <HStack
                  space={adjustSizeToResolveZoomInIssue(baseSize * 0.03)}
                  alignItems="center"
                >
                  <Center
                    w={adjustSizeToResolveZoomInIssue(baseSize * 0.1)}
                    h={adjustSizeToResolveZoomInIssue(baseSize * 0.1)}
                    rounded="lg"
                    bg="orange.50"
                  >
                
                    <Icon
                      as={Ionicons}
                      name="chatbubble-outline"
                      size={adjustSizeToResolveZoomInIssue(fs.icon * 0.5)}
                      color="blue.500"
                    />
                  </Center>
                  <VStack>
                    <Text
                      style={{
                        fontSize: adjustSizeToResolveZoomInIssue(fs.meta * 1.5),
                        fontWeight: "800",
                        color: "#111827",
                      }}
                    >
                      {task.commentCount}
                    </Text>
                    <Text
                      style={{
                        fontSize: adjustSizeToResolveZoomInIssue(fs.meta),
                        color: "#6B7280",
                      }}
                    >
                      Comments
                    </Text>
                  </VStack>
                </HStack>
              </HStack> */}
              <HStack
                w="48%"
                bg="white"
                rounded="xl"
                p={adjustSizeToResolveZoomInIssue(baseSize * 0.03)}
                borderWidth={1}
                borderColor="coolGray.100"
                alignItems="center"
              >
                <HStack
                  space={adjustSizeToResolveZoomInIssue(baseSize * 0.03)}
                  alignItems="center"
                >
                  <Center
                    w={adjustSizeToResolveZoomInIssue(baseSize * 0.1)}
                    h={adjustSizeToResolveZoomInIssue(baseSize * 0.1)}
                    rounded="lg"
                    bg="orange.50"
                  >
                    <Icon
                      as={Ionicons}
                      name="person-circle-outline"
                      size={adjustSizeToResolveZoomInIssue(fs.icon * 0.5)}
                      color="orange.500"
                    />
                  </Center>
                  <VStack>
                    <Text
                      style={{
                        fontSize: adjustSizeToResolveZoomInIssue(fs.meta * 1.5),
                        fontWeight: "800",
                        color: "#111827",
                      }}
                    >
                      {task.userRole}
                    </Text>
                    <Text
                      style={{
                        fontSize: adjustSizeToResolveZoomInIssue(fs.meta),
                        color: "#6B7280",
                      }}
                    >
                      Role
                    </Text>
                  </VStack>
                </HStack>
              </HStack>
            </HStack>
          </VStack>

          {/* ── Project info card ── */}
          {isProjectTask && task.project && (
            <HStack
              bg="white"
              rounded="2xl"
              p={"4%"}
              py={"5%"}
              mb={"2%"}
              flex={1}
              shadow={1}
              alignItems="center"
              justifyContent="space-between"
            >
              <VStack width={"100%"} px={"2%"} alignItems="flex-start">
                <HStack
                  width={"100%"}
                  space={"2%"}
                  justifyContent={"space-between"}
                >
                  <HStack
                    space={"12%"}
                    justifyContent={"flex-start"}
                    alignItems={"flex-start"}
                  >
                    <Center
                      w={adjustSizeToResolveZoomInIssue(baseSize * 0.1)}
                      h={adjustSizeToResolveZoomInIssue(baseSize * 0.1)}
                      rounded="xl"
                      bg="indigo.50"
                    >
                      <Icon
                        as={Ionicons}
                        name="folder-outline"
                        size={adjustSizeToResolveZoomInIssue(baseSize * 0.08)}
                        color="indigo.500"
                      />
                    </Center>
                    <Text
                      style={{
                        fontSize: adjustSizeToResolveZoomInIssue(
                          baseSize * 0.06,
                        ),
                        color: "#0a3681",
                        fontWeight: "500",
                      }}
                    >
                      Project
                    </Text>
                  </HStack>
                  {projectStatus && (
                    <HStack
                      bg={projectStatus.background}
                      px={adjustSizeToResolveZoomInIssue(baseSize * 0.02)}
                      rounded="full"
                      alignItems="center"
                      space={adjustSizeToResolveZoomInIssue(baseSize * 0.01)}
                      height={adjustSizeToResolveZoomInIssue(baseSize * 0.055)}
                    >
                      <Icon
                        as={projectStatus.iconType}
                        name={projectStatus.iconName}
                        size={fs.icon * 0.45}
                        color={projectStatus.color}
                      />
                      <Text
                        style={{
                          fontSize: adjustSizeToResolveZoomInIssue(
                            baseSize * 0.03,
                          ),
                          fontWeight: "600",
                          color: projectStatus.color,
                        }}
                      >
                        {projectStatus.status}
                      </Text>
                    </HStack>
                  )}
                </HStack>

                <VStack
                  width={"100%"}
                  pt={"2%"}
                  pl={"5%"}
                  justifyContent={"center"}
                  alignItems={"flex-start"}
                >
                  <Text
                    style={{
                      flex: 1,
                      fontSize: adjustSizeToResolveZoomInIssue(baseSize * 0.04),
                      fontWeight: "500",
                      color: "#111827",
                    }}
                  >
                    {getShortText(task.project.projectHeader, 50)}
                  </Text>
                </VStack>
              </VStack>
            </HStack>
          )}

          {/* ── Task Creator ── */}
          <Box
            width={"100%"}
            bg="white"
            rounded="2xl"
            p={"6%"}
            mb={"4%"}
            shadow={1}
          >
            <Text
              style={{
                fontSize: adjustSizeToResolveZoomInIssue(fs.title),
                fontWeight: "700",
                color: "#111827",
              }}
            >
              Task Creator
            </Text>
            <HStack
              width={"100%"}
              justifyContent={"center"}
              alignItems={"center"}
              mt={"2%"}
              space={"2%"}
            >
              <VStack
                width={"60%"}
                space={adjustSizeToResolveZoomInIssue(fs.subTitle)}
                overflow={"hidden"}
                justifyContent={"center"}
                alignItems={"flex-start"}
              >
                <HStack
                  width={"100%"}
                  alignItems={"center"}
                  space={adjustSizeToResolveZoomInIssue(baseSize * 0.02)}
                >
                  <NBAvatar
                    w={adjustSizeToResolveZoomInIssue(fs.icon * 0.65)}
                    h={adjustSizeToResolveZoomInIssue(fs.icon * 0.65)}
                    bg="indigo.500"
                    source={{ uri: task.taskCreator?.profileImgUrl }}
                  >
                    {task.taskCreator?.fullName?.charAt(0) || "U"}
                  </NBAvatar>
                  <Text
                    style={{
                      flex: 1,
                      fontSize: adjustSizeToResolveZoomInIssue(fs.subTitle),
                      fontWeight: "700",
                      color: "#111827",
                    }}
                  >
                    {task.taskCreator?.fullName}
                  </Text>
                </HStack>
                <HStack
                  width={"100%"}
                  alignItems={"center"}
                  space={adjustSizeToResolveZoomInIssue(baseSize * 0.02)}
                >
                  <Icon
                    as={Ionicons}
                    name="person-circle-outline"
                    size={adjustSizeToResolveZoomInIssue(fs.icon * 0.6)}
                    color="indigo.800"
                  />
                  <Text
                    style={{
                      flex: 1,
                      fontSize: adjustSizeToResolveZoomInIssue(fs.subTitle),
                      color: "#3B82F6",
                    }}
                  >
                    {task?.userRole}
                  </Text>
                </HStack>
                <HStack
                  width={"100%"}
                  alignItems={"center"}
                  space={adjustSizeToResolveZoomInIssue(baseSize * 0.02)}
                >
                  <Icon
                    as={Ionicons}
                    name="mail-outline"
                    size={adjustSizeToResolveZoomInIssue(fs.icon * 0.6)}
                    color="blue.600"
                  />
                  <Text
                    style={{
                      flex: 1,
                      fontSize: adjustSizeToResolveZoomInIssue(
                        fs.subTitle * 0.8,
                      ),
                      color: "#6B7280",
                    }}
                  >
                    {task.taskCreator?.email}
                  </Text>
                </HStack>
              </VStack>

              <VStack
                width={"40%"}
                alignItems="flex-end"
                justifyContent="center"
                space={adjustSizeToResolveZoomInIssue(baseSize * 0.05)}
              >
                <VStack alignItems="flex-start">
                  <Text
                    style={{
                      fontSize: adjustSizeToResolveZoomInIssue(
                        fs.subTitle * 0.85,
                      ),
                      color: "#9CA3AF",
                      fontWeight: "500",
                    }}
                  >
                    Created At
                  </Text>
                  <Text
                    style={{
                      fontSize: adjustSizeToResolveZoomInIssue(fs.meta),
                      color: "#374151",
                      fontWeight: "500",
                    }}
                  >
                    {formatDate(task.createdAt, true)}
                  </Text>
                </VStack>
                <VStack alignItems="flex-start">
                  <Text
                    style={{
                      fontSize: adjustSizeToResolveZoomInIssue(
                        fs.subTitle * 0.85,
                      ),
                      color: "#9CA3AF",
                      fontWeight: "500",
                    }}
                  >
                    Updated At
                  </Text>
                  <Text
                    style={{
                      fontSize: adjustSizeToResolveZoomInIssue(fs.meta),
                      color: "#374151",
                      fontWeight: "500",
                    }}
                  >
                    {formatDate(task.updatedAt, true)}
                  </Text>
                </VStack>
              </VStack>
            </HStack>
          </Box>

          {/* ── Task Information ── */}
          <Box
            width={"100%"}
            bg="white"
            rounded="2xl"
            p={adjustSizeToResolveZoomInIssue(baseSize * 0.04)}
            mb={adjustSizeToResolveZoomInIssue(baseSize * 0.04)}
            borderWidth={1}
            shadow={1}
            borderColor="coolGray.100"
          >
            <Text
              style={{
                fontSize: adjustSizeToResolveZoomInIssue(fs.title),
                fontWeight: "800",
                color: "#111827",
                marginBottom: adjustSizeToResolveZoomInIssue(baseSize * 0.03),
              }}
            >
              Task Information
            </Text>
            <Text
              style={{
                fontSize: adjustSizeToResolveZoomInIssue(fs.subTitle),
                fontWeight: "700",
                color: "#111827",
                marginBottom: adjustSizeToResolveZoomInIssue(baseSize * 0.01),
              }}
            >
              Description
            </Text>
            <Text
              style={{
                fontSize: adjustSizeToResolveZoomInIssue(fs.meta),
                color: "#6B7280",
              }}
            >
              {task.taskDesc || "No description available."}
            </Text>
          </Box>

          {/* ── Recent Messages ── */}
          <RecentMessages
            type={isProjectTask ? "PROJECT_TASK" : "TASK"}
            baseSize={baseSize}
            fs={fs}
            taskId={task.taskId}
            currentUserId={user!.userId}
            isCompleted={task.status}
            loginUserRole={task.userRole}
          />

          {/* ── Comments preview ── */}
          {/* <VStack
            width={"100%"}
            space={adjustSizeToResolveZoomInIssue(baseSize * 0.03)}
            mb={adjustSizeToResolveZoomInIssue(baseSize * 0.02)}
          >
            <HStack justifyContent="space-between" alignItems="center">
              <HStack space={adjustSizeToResolveZoomInIssue(baseSize * 0.035)}>
                <Text
                  style={{
                    fontSize: adjustSizeToResolveZoomInIssue(fs.title),
                    fontWeight: "700",
                    color: "#111827",
                  }}
                >
                  Comments
                </Text>
                <Center
                  bg="blue.500"
                  px={adjustSizeToResolveZoomInIssue(baseSize * 0.02)}
                  py={adjustSizeToResolveZoomInIssue(baseSize * 0.005)}
                  rounded="md"
                >
                  <Text
                    style={{
                      color: "white",
                      fontSize: adjustSizeToResolveZoomInIssue(fs.subTitle),
                      fontWeight: "700",
                    }}
                  >
                    {task.commentCount}
                  </Text>
                </Center>
              </HStack>

              <Pressable onPress={() => console.log("Click on View Comments")}>
                <Text
                  style={{
                    fontSize: adjustSizeToResolveZoomInIssue(fs.subTitle),
                    color: "#3B82F6",
                    fontWeight: "600",
                  }}
                >
                  View all →
                </Text>
              </Pressable>
            </HStack>

            {!comments?.length && !commentLoading ? (
              <Box
                bg="white"
                rounded="2xl"
                p={adjustSizeToResolveZoomInIssue(baseSize * 0.1)}
                alignItems="center"
                shadow={1}
              >
                <Text
                  style={{
                    color: "#9CA3AF",
                    fontSize: adjustSizeToResolveZoomInIssue(fs.meta),
                  }}
                >
                  No comments yet
                </Text>
              </Box>
            ) : (
              <Box bg="white" rounded="2xl" shadow={1} overflow="hidden">
                {comments.slice(0, 3).map((comment: any, index: number) => {
                  const isCommentCreator =
                    comment.commentSender?.userId === user?.userId;
                  const canDeleteComment =
                    isProjectAdmin || isTaskCreator || isCommentCreator;

                  return (
                    <HStack
                      key={comment.commentId}
                      space={3}
                      alignItems="flex-start"
                      p={3}
                      borderBottomWidth={
                        index !== 2 && index !== comments.length - 1 ? 1 : 0
                      }
                      borderBottomColor="coolGray.100"
                    >
                      <NBAvatar
                        w={adjustSizeToResolveZoomInIssue(baseSize * 0.1)}
                        h={adjustSizeToResolveZoomInIssue(baseSize * 0.1)}
                        bg="blue.500"
                        source={{ uri: comment.commentSender?.profileImageUrl }}
                      >
                        {comment.commentSender?.name?.charAt(0) || "U"}
                      </NBAvatar>
                      <VStack flex={1}>
                        <HStack
                          justifyContent="space-between"
                          alignItems="flex-start"
                          mb={1}
                        >
                          <VStack>
                            <Text
                              style={{
                                fontSize: adjustSizeToResolveZoomInIssue(
                                  baseSize * 0.1,
                                ),
                                fontWeight: "700",
                                color: "#111827",
                              }}
                            >
                              {comment.commentSender?.name}
                            </Text>
                            <Text
                              style={{
                                fontSize: adjustSizeToResolveZoomInIssue(
                                  baseSize * 0.1,
                                ),
                                color: "#9CA3AF",
                              }}
                            >
                              {comment.commentSender?.email}
                            </Text>
                          </VStack>
                          <HStack alignItems="center" space={2}>
                            <Text
                              style={{
                                fontSize: adjustSizeToResolveZoomInIssue(
                                  baseSize * 0.1,
                                ),
                                color: "#9CA3AF",
                              }}
                            >
                              {timeAgo(comment.createdAt)}
                            </Text>
                            {canDeleteComment && (
                              <Pressable
                                onPress={async () => {
                                  try {
                                    await dispatch(
                                      deleteComment({
                                        commentId: comment.commentId,
                                        taskId,
                                      }),
                                    ).unwrap();
                                    dispatch(fetchTaskComments(taskId));
                                  } catch (err) {
                                    console.log(`Delete Comment Error: ${err}`);
                                  }
                                }}
                              >
                                <Icon
                                  as={Ionicons}
                                  name="trash-outline"
                                  size={adjustSizeToResolveZoomInIssue(
                                    baseSize * 0.1,
                                  )}
                                  color="red.500"
                                />
                              </Pressable>
                            )}
                          </HStack>
                        </HStack>
                        <Text
                          style={{
                            fontSize: adjustSizeToResolveZoomInIssue(
                              baseSize * 0.1,
                            ),
                            color: "#4B5563",
                          }}
                          numberOfLines={2}
                        >
                          {comment.comment}
                        </Text>
                      </VStack>
                    </HStack>
                  );
                })}
              </Box>
            )}
          </VStack> */}
        </VStack>
      </KeyboardAwareScrollView>

      {/* ── Bottom action bar ── */}
      <HStack
        bg="white"
        p={adjustSizeToResolveZoomInIssue(baseSize * 0.05)}
        borderTopWidth={1}
        borderTopColor="coolGray.100"
        shadow={3}
        space={adjustSizeToResolveZoomInIssue(baseSize * 0.05)}
      >
        <Pressable
          flex={1}
          bg={isCompleted ? "coolGray.100" : "indigo.50"}
          rounded="xl"
          py={adjustSizeToResolveZoomInIssue(baseSize * 0.03)}
          flexDirection="row"
          justifyContent="center"
          alignItems="center"
          onPress={onHandleClickMessageButton}
          isDisabled={isCompleted}
          _pressed={{ bgColor: "indigo.600" }}
        >
          {({ isPressed }) => (
            <>
              <Icon
                as={MaterialIcons}
                name="message"
                size={adjustSizeToResolveZoomInIssue(fs.icon * 0.5)}
                color={
                  isCompleted
                    ? "coolGray.200"
                    : isPressed
                      ? "indigo.100"
                      : "indigo.500"
                }
                mr={adjustSizeToResolveZoomInIssue(baseSize * 0.02)}
              />
              <Text
                style={{
                  color: isCompleted
                    ? "#9CA3AF"
                    : isPressed
                      ? "#fff"
                      : "#121212",
                  fontWeight: "700",
                  fontSize: adjustSizeToResolveZoomInIssue(fs.subTitle * 0.85),
                }}
              >
                Send Message
              </Text>
            </>
          )}
        </Pressable>

        {canPerformOperation && (
          <Pressable
            flex={1}
            bg={isCompleted ? "coolGray.100" : "red.200"}
            rounded="xl"
            py={adjustSizeToResolveZoomInIssue(baseSize * 0.03)}
            flexDirection="row"
            justifyContent="center"
            alignItems="center"
            onPress={handleDeleteTask}
            isDisabled={isCompleted}
            _pressed={{ bg: "red.500" }}
          >
            {({ isPressed }) => (
              <>
                <Icon
                  as={Ionicons}
                  name="trash-outline"
                  size={adjustSizeToResolveZoomInIssue(fs.icon * 0.5)}
                  color={
                    isCompleted
                      ? "coolGray.200"
                      : isPressed
                        ? "red.200"
                        : "red.500"
                  }
                  mr={adjustSizeToResolveZoomInIssue(baseSize * 0.02)}
                />
                <Text
                  style={{
                    color: isCompleted
                      ? "#9CA3AF"
                      : isPressed
                        ? "#FEE2E2"
                        : "#121212",
                    fontWeight: "700",
                    fontSize: adjustSizeToResolveZoomInIssue(
                      fs.subTitle * 0.85,
                    ),
                  }}
                >
                  Delete Task
                </Text>
              </>
            )}
          </Pressable>
        )}
      </HStack>
    </Box>
  );
}
