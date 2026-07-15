import React, { useCallback, useEffect, useRef, useState } from "react";
import { TextInput, FlatList } from "react-native";
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
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../store";
import {
  clearMessageError,
  deleteMessage,
  fetchProjectMessages,
  fetchTaskMessages,
  resetMessageState,
} from "../store/slices/MessageSlice";
import { MessageProps } from "../store/slices/types";
import { onSendMessage } from "../modals/model.utils";
import {
  DEFAULT_RECENT_TASK_LIMIT,
  globalMenuAtom,
  isDisplayErrorMessageAtom,
} from "../utils/Constent";
import { adjustSizeToResolveZoomInIssue } from "../utils/Helper";
import { RouteProp, useNavigation } from "@react-navigation/native";
import { RouteStackParamStack } from "../appNavigator/navigator.utils";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAtom } from "jotai";
import { MessageCard } from "../screens/message/MessageCard";

export interface RecentMessagesProps {
  type: "PROJECT" | "TASK";
  baseSize: number;
  fs: any;
  isAdmin?: boolean;
  isEditor?: boolean;
  isTaskCreator?: boolean;
  isProjectTask?: boolean;
  taskId?: string;
  projectId?: string;
  currentUserId?: string;
  isCompleted?: boolean; // ✅ Added isCompleted prop
}

const RecentMessages = ({
  type,
  baseSize,
  fs,
  taskId,
  projectId,
  isAdmin,
  isEditor,
  isTaskCreator,
  currentUserId,
  isProjectTask,
  isCompleted = false,
}: RecentMessagesProps) => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RouteStackParamStack>>();

  const [messageText, setMessageText] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [recentMessages, setRecentMessages] = useState<MessageProps[]>([]);
  const [messageCount, setMessageCount] = useState<number>(0);

  const dispatch = useDispatch<AppDispatch>();
  const [, setGlobalMenu] = useAtom(globalMenuAtom);
  const [, setIsDisplayError] = useAtom(isDisplayErrorMessageAtom);

  const onClickViewAll = () => {
    navigation.navigate("MessageListScreen", {
      type: type,
      projectId: projectId,
      taskId: taskId,
    });
  };

  const {
    loading: msgLoading,
    error: projectError,
    taskError,
    projectMessages,
    taskMessages,
    totalMessageCount,
    totalTaskCount,
  } = useSelector((state: RootState) => state.message);

  const msgError = type === "TASK" ? taskError : projectError;
  const isMountedRef = React.useRef(true);

  // ✅ 1. Reusable helper to explicitly trigger the Error Modal
  const triggerErrorModal = useCallback(
    (title: string, error: any) => {
      const errorMessage =
        typeof error === "string"
          ? error
          : error?.message || "An unexpected error occurred.";

      setIsDisplayError((prev: any) => ({
        ...prev,
        isModalOpen: true,
        title: title,
        subTitle: errorMessage,
        isShowBothButton: false,
        leftButtonText: "Okay",
        onClickLeftButton: () => {
          dispatch(clearMessageError());
          navigation.goBack?.();
        },
      }));
    },
    [setIsDisplayError, dispatch],
  );

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // ✅ 2. Handle Initial Fetch Errors (using unwrap)
  useEffect(() => {
    if (!isMountedRef.current) return;
    dispatch(resetMessageState());

    const load = async () => {
      if (!isMountedRef.current) return;

      try {
        if (type === "TASK" && taskId) {
          await dispatch(
            fetchTaskMessages({
              taskId: taskId,
              limit: DEFAULT_RECENT_TASK_LIMIT,
              skip: 0,
            }),
          ).unwrap();
        }

        if (type === "PROJECT" && projectId) {
          await dispatch(
            fetchProjectMessages({
              projectId: projectId,
              limit: DEFAULT_RECENT_TASK_LIMIT,
              skip: 0,
            }),
          ).unwrap();
        }
      } catch (error) {
        triggerErrorModal("Failed to load messages", error);
      }
    };

    load();
  }, [type, taskId, projectId, dispatch, triggerErrorModal]);

  // ✅ 2b. Catch-all: watch the slice-level error directly, for any case where
  // `state.message.taskError`/`projectError` gets set outside the explicit
  // try/catch paths below (e.g. a dispatch fired from somewhere else that
  // touches this same slice). Guarded so it won't double-fire on top of the
  // catch blocks below for the SAME failure — see note underneath the file.
  useEffect(() => {
    if (!msgError) return;
    triggerErrorModal(
      type === "TASK" ? "Task messages error" : "Project messages error",
      msgError,
    );
  }, [msgError, type, triggerErrorModal]);

  useEffect(() => {
    if (type === "TASK") {
      setRecentMessages(taskMessages);
      setMessageCount(totalTaskCount);
    } else {
      setRecentMessages(projectMessages);
      setMessageCount(totalMessageCount);
    }
  }, [taskMessages, projectMessages, totalMessageCount, totalTaskCount, type]);

  // ✅ 3. Handle Refresh Errors
  const fetchMessages = useCallback(async () => {
    try {
      if (type == "TASK" && taskId) {
        await dispatch(
          fetchTaskMessages({
            taskId: taskId,
            limit: DEFAULT_RECENT_TASK_LIMIT,
            skip: 0,
          }),
        ).unwrap();
      }

      if (type == "PROJECT" && projectId) {
        await dispatch(
          fetchProjectMessages({
            projectId: projectId,
            limit: DEFAULT_RECENT_TASK_LIMIT,
            skip: 0,
          }),
        ).unwrap();
      }
    } catch (error) {
      triggerErrorModal("Refresh Failed", error);
    }
  }, [type, taskId, projectId, dispatch, triggerErrorModal]);

  // ✅ 4. Handle Sending Errors
  const handleSendMessage = async () => {
    if (!messageText.trim() || isCompleted) return; // Extra safety check
    try {
      await onSendMessage({
        message: messageText,
        type: type,
        taskId: taskId,
        projectId: projectId,
      });
      setMessageText("");
    } catch (error: any) {
      console.log("Error sending message:", error);
      triggerErrorModal("Send Failed", error);
    }
  };

  // ✅ 5. Handle Delete Errors
  const onDeleteMessage = useCallback(
    async (messageId: string) => {
      try {
        await dispatch(
          deleteMessage({ messageId, isTask: type === "TASK" }),
        ).unwrap();
        fetchMessages();
      } catch (error) {
        triggerErrorModal("Action Not Allowed", error);
      }
    },
    [dispatch, fetchMessages, type, triggerErrorModal],
  );

  // --- FLATLIST RENDER HELPERS ---
  const slicedMessages = recentMessages?.slice(0, DEFAULT_RECENT_TASK_LIMIT);

  const renderMessageItem = useCallback(
    ({ item, index }: { item: MessageProps; index: number }) => {
      const isAllowToDelete = !isProjectTask
        ? isTaskCreator
        : isAdmin || isEditor;

      return (
        <MessageCard
          msg={item}
          isLast={index === slicedMessages.length - 1}
          baseSize={baseSize}
          fs={fs}
          currentUserId={currentUserId}
          onDeleteMessage={onDeleteMessage}
          setGlobalMenu={setGlobalMenu}
          isAllowToDelete={isAllowToDelete}
          isProjectTask={isProjectTask}
          isCompleted={isCompleted}
        />
      );
    },
    [
      slicedMessages?.length,
      baseSize,
      fs,
      type,
      currentUserId,
      isTaskCreator,
      isAdmin,
      isEditor,
      onDeleteMessage,
      setGlobalMenu,
    ],
  );

  const renderEmptyList = () => (
    <Box width={baseSize * 0.92} my={baseSize * 0.01} shadow={2}>
      <Box
        width={baseSize * 0.9}
        my={baseSize * 0.01}
        alignItems="center"
        justifyContent="center"
      >
        <Text color="coolGray.700">
          {msgLoading ? "Loading..." : "No messages yet"}
        </Text>
      </Box>
    </Box>
  );

  return (
    <Box flex={1} width={"100%"}>
      <VStack
        flex={1}
        width="100%"
        mb={adjustSizeToResolveZoomInIssue(baseSize * 0.05)}
      >
        {/* --- HEADER --- */}
        <HStack
          justifyContent="space-between"
          alignItems="center"
          mb={adjustSizeToResolveZoomInIssue(baseSize * 0.03)}
        >
          <HStack
            alignItems="center"
            space={adjustSizeToResolveZoomInIssue(baseSize * 0.035)}
          >
            <Text
              fontSize={adjustSizeToResolveZoomInIssue(fs.title)}
              fontWeight="700"
              color="coolGray.900"
            >
              Recent Messages
            </Text>
            <Center
              bg="indigo.500"
              px={adjustSizeToResolveZoomInIssue(baseSize * 0.02)}
              py={adjustSizeToResolveZoomInIssue(baseSize * 0.002)}
              rounded="xl"
            >
              <Text
                color="white"
                fontSize={adjustSizeToResolveZoomInIssue(fs.subTitle)}
                fontWeight="700"
              >
                {messageCount}
              </Text>
            </Center>
          </HStack>
          <Pressable onPress={onClickViewAll}>
            <Text
              fontSize={adjustSizeToResolveZoomInIssue(fs.subTitle)}
              color="indigo.500"
              fontWeight="600"
            >
              View all →
            </Text>
          </Pressable>
        </HStack>

        {/* --- FLATLIST REPLACES SCROLLVIEW --- */}
        <Box
          rounded="2xl"
          m={1}
          flex={1}
          bgColor={"white"}
          borderRadius={"xl"}
          shadow={1}
        >
          <FlatList
            data={slicedMessages}
            keyExtractor={(item) => item.messageId}
            renderItem={renderMessageItem}
            ListEmptyComponent={renderEmptyList}
            contentContainerStyle={{
              rowGap: adjustSizeToResolveZoomInIssue(baseSize * 0.02),
              marginHorizontal: adjustSizeToResolveZoomInIssue(baseSize * 0.01),
              paddingVertical: adjustSizeToResolveZoomInIssue(baseSize * 0.05),
            }}
            showsVerticalScrollIndicator={false}
            scrollEnabled={false}
          />
        </Box>

        {/* --- SEND MESSAGE INPUT BOX --- */}
        <HStack
          w="100%"
          space={adjustSizeToResolveZoomInIssue(baseSize * 0.03)}
          alignItems="center"
          mt={adjustSizeToResolveZoomInIssue(baseSize * 0.03)}
        >
          <HStack
            flex={1}
            bg={isCompleted ? "coolGray.100" : "white"} // ✅ Gray out if completed
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
                fontSize: fs.subTitle,
                color: isCompleted ? "#9CA3AF" : "#111827", // ✅ Gray text if completed
                paddingVertical: adjustSizeToResolveZoomInIssue(
                  baseSize * 0.02,
                ),
              }}
              placeholder={
                isCompleted
                  ? `Chat closed ( ${type == "PROJECT" ? "Project" : "Task"} Completed)`
                  : `Write a message...`
              } // ✅ Dynamic Placeholder
              placeholderTextColor="#9CA3AF"
              value={messageText}
              onChangeText={setMessageText}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              multiline
              editable={!isCompleted} // ✅ Disable typing if completed
            />
          </HStack>

          <Pressable
            bg={isCompleted ? "coolGray.400" : "indigo.600"} // ✅ Gray out button if completed
            p={adjustSizeToResolveZoomInIssue(baseSize * 0.03)}
            borderRadius="xl"
            onPress={handleSendMessage}
            isDisabled={msgLoading || !messageText.trim() || isCompleted} // ✅ Disable press if completed
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
      </VStack>
    </Box>
  );
};

export default RecentMessages;
