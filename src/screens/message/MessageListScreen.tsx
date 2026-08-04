import React, { useCallback, useEffect, useRef, useState } from "react";
import { FlatList, TextInput, Platform, LayoutChangeEvent } from "react-native";
import {
  Box,
  Text,
  HStack,
  VStack,
  Center,
  Pressable,
  Icon,
  Spinner,
} from "native-base";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAtom, useSetAtom } from "jotai";
import { AppDispatch, RootState } from "../../store";
import {
  clearMessageError,
  deleteMessage,
  fetchProjectMessages,
  fetchTaskMessages,
} from "../../store/slices/MessageSlice";
import {
  MessageProps,
  TaskProps,
  ProjectProps,
} from "../../store/slices/types";
import { onSendMessage } from "../../modals/model.utils";
import {
  globalMenuAtom,
  AppLoaderAtom,
  isDisplayErrorMessageAtom,
  DEFAULT_MESSAGE_LIMIT_ON_MESSAGE_SCREEN,
} from "../../utils/Constent";
import {
  adjustSizeToResolveZoomInIssue,
  getInsetTop,
} from "../../utils/Helper";
import { useContainerDimensions } from "../../hooks/OnlayoutHooks";
import { RouteStackParamStack } from "../../appNavigator/navigator.utils";
import { FooterLoadMoreButton } from "../../components/FooterLoadMoreButton";
import { fetchProjectById } from "../../store/slices/ProjectSlice";
import { fetchTaskForId } from "../../store/slices/TaskSlice";
import { MessageCard } from "./MessageCard";
import { MessageListSkeleton } from "./MessageCardSkeleton";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import {
  onUpdateGlobalStateForProject,
  onUpdateGlobalStateForTask,
} from "../../utils/GlobalStateUpdateUtils";

type MessageListRoute = RouteProp<RouteStackParamStack, "MessageListScreen">;
const PAGE_LIMIT = DEFAULT_MESSAGE_LIMIT_ON_MESSAGE_SCREEN;

// ─── MAIN COMPONENT ───
export default function MessageListScreen() {
  const route = useRoute<MessageListRoute>();
  const { type, taskId, projectId, loginUserRole } = route.params;

  // ✅ NEW: "PROJECT_TASK" = a task that lives inside a project.
  // Treat it the same as "TASK" everywhere task-specific data/actions are needed.
  const isTaskLike = type === "TASK" || type === "PROJECT_TASK";
  const isPureProject = type === "PROJECT";

  const navigation =
    useNavigation<NativeStackNavigationProp<RouteStackParamStack>>();
  const dispatch = useDispatch<AppDispatch>();

  const [, setGlobalMenu] = useAtom(globalMenuAtom);

  // Global error modal setter
  const setErrorModal = useSetAtom(isDisplayErrorMessageAtom);

  const { containerDimensions, onLayout } = useContainerDimensions();
  const baseSize = containerDimensions.baseSize;
  const safeTop = getInsetTop();

  const headerTitleSize = adjustSizeToResolveZoomInIssue(baseSize * 0.05);
  const meta = adjustSizeToResolveZoomInIssue(baseSize * 0.035);

  const fs = {
    meta,
    title: headerTitleSize,
    subTitle: meta,
  };

  const { singleTask } = useSelector((state: RootState) => state.task);
  const { singleProject } = useSelector((state: RootState) => state.project);

  const task = singleTask as TaskProps | null;
  const project = singleProject as ProjectProps | null;

  // ✅ isTaskLike covers TASK + PROJECT_TASK
  const typeLabel = isTaskLike ? "Task Messages" : "Project Messages";

  // ✅ For PROJECT_TASK, prefer the task header but fall back to the project header
  const mainHeaderText = isTaskLike
    ? (task?.taskHeader ?? project?.projectHeader)
    : project?.projectHeader;

  const { user } = useSelector((state: RootState) => state.auth);
  const currentUserId = user?.userId;

  const isAdmin = isTaskLike
    ? task?.userRole === "CREATOR"
    : project?.userRole === "ADMIN";
  const isEditor = isTaskLike
    ? task?.userRole === "EDITOR"
    : project?.userRole === "EDITOR";
  const isTaskCreator =
    isTaskLike && !!task && task.taskCreator.userId === currentUserId;

  // ✅ Compare status against the actual "completed" enum value instead of
  // assigning the raw status directly.
  const isCompleted = isTaskLike ? singleTask?.status : singleProject?.status;

  const {
    loading: msgLoading,
    error: projectError,
    taskError,
    projectMessages,
    taskMessages,
    totalProjectMessageCount,
    totalTaskMessageCount,
  } = useSelector((state: RootState) => state.message);

  const msgError = isTaskLike ? taskError : projectError;
  const messages = isTaskLike ? taskMessages : projectMessages;
  const messageCount = isTaskLike ? totalTaskMessageCount : totalProjectMessageCount;

  const [messageText, setMessageText] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const pageRef = useRef({ limit: PAGE_LIMIT, skip: 0 });
  const [page, setPage] = useState(0);

  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [headerDim, setHeaderDim] = useState({ height: 0, width: 0 });
  const [sendBarDim, setSendBarDim] = useState({ height: 0, width: 0 });
  const [skeletonContainerHeight, setSkeletonContainerHeight] = useState(0);

  const prevHeaderDimRef = useRef({ height: 0, width: 0 });
  const prevSendBarDimRef = useRef({ height: 0, width: 0 });

  // ─── Global Loader Logic ──────────────────────────────────────────────────
  const setDisplayAppLoader = useSetAtom(AppLoaderAtom);

  useEffect(() => {
    if (containerDimensions.baseSize === 0) {
      setDisplayAppLoader({ isLoading: true, message: "Loading Messages" });
    } else {
      setDisplayAppLoader({ isLoading: false, message: "" });
    }
  }, [containerDimensions.baseSize, setDisplayAppLoader]);

  useEffect(() => {
    return () => {
      setDisplayAppLoader({ isLoading: false, message: "" });
    };
  }, [setDisplayAppLoader]);

  useEffect(() => {
    if (!msgError) return;

    setErrorModal((prev) => ({
      ...prev,
      isModalOpen: true,
      title: "Something went wrong",
      subTitle:
        typeof msgError === "string"
          ? msgError
          : ((msgError as any)?.message ??
            "Unable to load messages. Please try again."),
      onClickLeftButton: () => {
        dispatch(clearMessageError());
        navigation.goBack?.();
      },
    }));
  }, [msgError, setErrorModal]);

  // ─── Layout Handlers ──────────────────────────────────────────────────────
  const onHeaderLayout = useCallback((e: LayoutChangeEvent) => {
    const { height, width } = e.nativeEvent.layout;
    if (
      prevHeaderDimRef.current.height === height &&
      prevHeaderDimRef.current.width === width
    )
      return;
    prevHeaderDimRef.current = { height, width };
    setHeaderDim({ height, width });
  }, []);

  const onSendBarLayout = useCallback((e: LayoutChangeEvent) => {
    const { height, width } = e.nativeEvent.layout;
    if (
      prevSendBarDimRef.current.height === height &&
      prevSendBarDimRef.current.width === width
    )
      return;
    prevSendBarDimRef.current = { height, width };
    setSendBarDim({ height, width });
  }, []);

  useEffect(() => {
    if (containerDimensions.height === 0) return;
    const remaining =
      containerDimensions.height - headerDim.height - sendBarDim.height;
    setSkeletonContainerHeight(remaining > 0 ? remaining : 0);
  }, [containerDimensions.height, headerDim.height, sendBarDim.height]);

  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // ✅ For PROJECT_TASK we may need BOTH the task record (for header/roles)
  // and the project record (for context), so fetch both when available.
  useEffect(() => {
    if (isTaskLike && taskId) {
      !singleTask && dispatch(fetchTaskForId(taskId));
    }
    if ((isPureProject || type === "PROJECT_TASK") && projectId) {
      !singleProject && dispatch(fetchProjectById(projectId));
    }
  }, [
    type,
    taskId,
    projectId,
    dispatch,
    singleTask,
    singleProject,
    isTaskLike,
    isPureProject,
  ]);

  useEffect(() => {
    if (!isMountedRef.current) return;
    pageRef.current = { limit: PAGE_LIMIT, skip: 0 };
    setPage(0);
    setInitialLoadDone(false);

    const load = async () => {
      if (!isMountedRef.current) return;

      if (isTaskLike && taskId) {
        await dispatch(
          fetchTaskMessages({ taskId, limit: PAGE_LIMIT, skip: 0 }),
        );
      } else if (isPureProject && projectId) {
        await dispatch(
          fetchProjectMessages({ projectId, limit: PAGE_LIMIT, skip: 0 }),
        );
      }
      if (isMountedRef.current) setInitialLoadDone(true);
    };

    load();
  }, [type, taskId, projectId, dispatch, isTaskLike, isPureProject]);

  useEffect(() => {
    if (page === 0) return;

    if (isTaskLike && taskId) {
      dispatch(
        fetchTaskMessages({
          taskId,
          limit: pageRef.current.limit,
          skip: pageRef.current.skip,
        }),
      );
    } else if (isPureProject && projectId) {
      dispatch(
        fetchProjectMessages({
          projectId,
          limit: pageRef.current.limit,
          skip: pageRef.current.skip,
        }),
      );
    }
  }, [page, dispatch, type, taskId, projectId, isTaskLike, isPureProject]);

  const handleLoadMore = useCallback(() => {
    if (msgLoading) return;
    pageRef.current = {
      limit: pageRef.current.limit,
      skip: pageRef.current.skip + pageRef.current.limit,
    };
    setPage((p) => p + 1);
  }, [msgLoading]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setPage(0);
    pageRef.current.skip = 0;

    try {
      if (isTaskLike && taskId) {
        await dispatch(
          fetchTaskMessages({ taskId, limit: PAGE_LIMIT, skip: 0 }),
        );
      } else if (isPureProject && projectId) {
        await dispatch(
          fetchProjectMessages({ projectId, limit: PAGE_LIMIT, skip: 0 }),
        );
      }
    } finally {
      if (isMountedRef.current) {
        setIsRefreshing(false);
      }
    }
  }, [type, taskId, projectId, dispatch, isTaskLike, isPureProject]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || isCompleted) return;
    try {
      await onSendMessage({
        message: messageText,
        type: type === "PROJECT_TASK" ? "TASK" : type,
        taskId,
        projectId,
      });
      setMessageText("");
      // pageRef.current = { limit: PAGE_LIMIT, skip: 0 };
      // setPage(0);
      // if (isTaskLike && taskId) {
      //   dispatch(fetchTaskMessages({ taskId, limit: PAGE_LIMIT, skip: 0 }));
      // } else if (isPureProject && projectId) {
      //   dispatch(
      //     fetchProjectMessages({ projectId, limit: PAGE_LIMIT, skip: 0 }),
      //   );
      // }
    } catch (error: any) {
      console.log("Error sending message:", error);

      setErrorModal((prev) => ({
        ...prev,
        isModalOpen: true,
        title: "Send failed",
        subTitle:
          typeof error === "string"
            ? error
            : (error?.message ??
              "Unable to send this message. Please try again."),
        onClickLeftButton: () => {
          dispatch(clearMessageError());
          navigation.goBack?.();
        },
      }));
    }
  };

  const onDeleteMessage = useCallback(
    async (messageId: string) => {
      try {
        await dispatch(deleteMessage({ messageId: messageId })).unwrap();

        if (isPureProject) {
          await onUpdateGlobalStateForProject({
            entity: "MESSAGE",
            action: "DELETE",
          });
        } else {
          // TASK and PROJECT_TASK both use the task-scoped global state update
          await onUpdateGlobalStateForTask({
            entity: "MESSAGE",
            action: "DELETE",
          });
        }
      } catch (error: any) {
        setErrorModal((prev) => ({
          ...prev,
          isModalOpen: true,
          title: "Action Not Allowed",
          subTitle:
            typeof error === "string"
              ? error
              : (error?.message ?? "Unable to delete this message."),
          onClickLeftButton: () => {
            dispatch(clearMessageError());
            navigation.goBack?.();
          },
        }));
      }
    },
    [dispatch, isPureProject, taskId, projectId, setErrorModal],
  );

  const renderMessage = useCallback(
    ({ item, index }: { item: MessageProps; index: number }) => {
      const isMessageCreator = item.messageSender.userId === currentUserId;

      const isAllowToDelete =
        type === "TASK"
          ? isMessageCreator
          : loginUserRole === "ADMIN" ||
            (loginUserRole === "EDITOR" && isMessageCreator); ;
      return (
        <MessageCard
          msg={item}
          isLast={index === messages.length - 1}
          baseSize={baseSize}
          fs={fs}
          currentUserId={currentUserId}
          onDeleteMessage={onDeleteMessage}
          setGlobalMenu={setGlobalMenu}
          isAllowToDelete={isAllowToDelete}
          isCompleted={isCompleted ?? false}
          messageType={type}
          
        />
      );
    },
    [
      messages.length,
      baseSize,
      fs,
      type,
      currentUserId,
      isAdmin,
      isEditor,
      onDeleteMessage,
      setGlobalMenu,
    ],
  );

  const showInitialSkeleton =
    (!initialLoadDone && !isRefreshing) ||
    (msgLoading && page === 0 && !isRefreshing);

  return (
    <Box flex={1} width="100%" bg="coolGray.50" onLayout={onLayout}>
      {containerDimensions.baseSize > 0 && (
        <KeyboardAvoidingView
          style={{ flex: 1, width: "100%", height: "100%" }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <VStack flex={1} width="100%" height="100%">
            {/* ══════════════════════════════════════════
                HEADER
            ══════════════════════════════════════════ */}
            <Box
              width="100%"
              bg="white"
              paddingLeft={0}
              paddingRight={adjustSizeToResolveZoomInIssue(baseSize * 0.02)}
              pt={safeTop}
              pb="4%"
              borderBottomWidth={1}
              borderBottomColor="coolGray.100"
              onLayout={onHeaderLayout}
            >
              <HStack alignItems="center" mt="1%">
                <Pressable
                  w={adjustSizeToResolveZoomInIssue(baseSize * 0.12)}
                  h={adjustSizeToResolveZoomInIssue(baseSize * 0.12)}
                  rounded="full"
                  bg="coolGray.100"
                  alignItems="center"
                  justifyContent="center"
                  onPress={() => navigation.goBack()}
                  _pressed={{
                    bg: "coolGray.200",
                    style: {
                      transform: [{ scale: 0.9 }],
                    },
                  }}
                  marginLeft={adjustSizeToResolveZoomInIssue(baseSize * 0.01)}
                >
                  <Feather
                    name="arrow-left"
                    size={adjustSizeToResolveZoomInIssue(baseSize * 0.08)}
                    color="#374151"
                  />
                </Pressable>

                <Text
                  flex={1}
                  fontSize={headerTitleSize}
                  fontWeight="800"
                  color="coolGray.900"
                  letterSpacing="-0.2"
                  numberOfLines={1}
                  marginLeft={adjustSizeToResolveZoomInIssue(baseSize * 0.02)}
                >
                  {typeLabel}
                </Text>

                <Center
                  bg="indigo.500"
                  px={adjustSizeToResolveZoomInIssue(baseSize * 0.03)}
                  py={adjustSizeToResolveZoomInIssue(baseSize * 0.01)}
                  rounded="md"
                >
                  <Text color="white" fontSize={meta} fontWeight="700">
                    {messageCount} Messages
                  </Text>
                </Center>
              </HStack>

              {mainHeaderText ? (
                <Box
                  width={"100%"}
                  pl={adjustSizeToResolveZoomInIssue(baseSize * 0.05)}
                >
                  <Text
                    mt="3%"
                    fontSize={meta * 1.1}
                    color="coolGray.500"
                    lineHeight={meta * 1.6}
                  >
                    {mainHeaderText}
                  </Text>
                </Box>
              ) : null}
            </Box>

            {/* SEND MESSAGE INPUT BAR */}
            <HStack
              w="100%"
              bg="white"
              space={adjustSizeToResolveZoomInIssue(baseSize * 0.03)}
              alignItems="center"
              px="4%"
              py="3%"
              borderBottomWidth={1}
              borderBottomColor="coolGray.200"
              zIndex={1}
              onLayout={onSendBarLayout}
            >
              <HStack
                flex={1}
                bg={isCompleted ? "coolGray.100" : "coolGray.50"}
                borderRadius="xl"
                borderWidth={1}
                borderColor={isFocused ? "indigo.500" : "coolGray.200"}
                alignItems="center"
                px={adjustSizeToResolveZoomInIssue(baseSize * 0.05)}
                py={adjustSizeToResolveZoomInIssue(baseSize * 0.02)}
              >
                <TextInput
                  style={{
                    flex: 1,
                    fontSize: meta * 1.2,
                    color: isCompleted ? "#9CA3AF" : "#111827",
                    paddingVertical: adjustSizeToResolveZoomInIssue(
                      baseSize * 0.008,
                    ),
                  }}
                  placeholder={
                    isCompleted
                      ? `Chat closed ( ${isTaskLike ? "Task" : "Project"} Completed)`
                      : `Write a message...`
                  }
                  placeholderTextColor="#9CA3AF"
                  value={messageText}
                  onChangeText={setMessageText}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  multiline
                  editable={!isCompleted}
                />
              </HStack>

              <Pressable
                bg={isCompleted ? "coolGray.400" : "indigo.600"}
                p={adjustSizeToResolveZoomInIssue(baseSize * 0.03)}
                borderRadius="xl"
                onPress={handleSendMessage}
                isDisabled={msgLoading || !messageText.trim() || isCompleted}
                _disabled={{ opacity: 0.6 }}
                _pressed={{ bg: "indigo.700" }}
              >
                {msgLoading ? (
                  <Spinner color="white" size="sm" />
                ) : (
                  <Icon
                    as={Ionicons}
                    name="send"
                    size={adjustSizeToResolveZoomInIssue(baseSize * 0.056)}
                    color="white"
                  />
                )}
              </Pressable>
            </HStack>

            {/* MESSAGE LIST - Scrolling FlatList */}
            <Box flex={1} width="100%">
              {showInitialSkeleton ? (
                <Box
                  height={skeletonContainerHeight}
                  width={containerDimensions.width}
                  justifyContent={"center"}
                  alignItems={"center"}
                >
                  <MessageListSkeleton
                    baseSize={baseSize}
                    height={skeletonContainerHeight}
                    width={containerDimensions.width * 0.96}
                    visibleCount={4}
                  />
                </Box>
              ) : !messages?.length ? (
                <Center flex={1}>
                  <Text color="coolGray.500">
                    {msgError ? " " : "No messages yet"}
                  </Text>
                </Center>
              ) : (
                <FlatList
                  data={messages}
                  keyExtractor={(item: MessageProps) => item.messageId}
                  renderItem={renderMessage}
                  showsVerticalScrollIndicator={false}
                  refreshing={isRefreshing}
                  onRefresh={onRefresh}
                  contentContainerStyle={{
                    rowGap: adjustSizeToResolveZoomInIssue(baseSize * 0.04),
                    marginHorizontal: adjustSizeToResolveZoomInIssue(
                      baseSize * 0.02,
                    ),
                    paddingVertical: adjustSizeToResolveZoomInIssue(
                      baseSize * 0.04,
                    ),
                  }}
                  ListFooterComponent={
                    <FooterLoadMoreButton
                      currentCount={messages.length}
                      fontSize={containerDimensions.baseSize * 0.04}
                      isLoading={msgLoading && page > 0}
                      onLoadMore={handleLoadMore}
                      totalCount={messageCount}
                      type="Message"
                    />
                  }
                />
              )}
            </Box>
          </VStack>
        </KeyboardAvoidingView>
      )}
    </Box>
  );
}
