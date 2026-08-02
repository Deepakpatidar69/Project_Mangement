import React, { useCallback, useEffect, useRef, useState } from "react";
import { TextInput, FlatList, Keyboard } from "react-native";
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
} from "../store/slices/MessageSlice";
import { MessageProps } from "../store/slices/types";
import { onSendMessage } from "../modals/model.utils";
import {
  DEFAULT_RECENT_TASK_LIMIT,
  globalMenuAtom,
  isDisplayErrorMessageAtom,
} from "../utils/Constent";
import { adjustSizeToResolveZoomInIssue } from "../utils/Helper";
import { useNavigation } from "@react-navigation/native";
import { RouteStackParamStack } from "../appNavigator/navigator.utils";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAtom } from "jotai";
import { MessageCard } from "../screens/message/MessageCard";
import {
  onUpdateGlobalStateForProject,
  onUpdateGlobalStateForTask,
} from "../utils/GlobalStateUpdateUtils";

export interface RecentMessagesProps {
  type: "PROJECT" | "TASK" | "PROJECT_TASK";
  baseSize: number;
  fs: any;
  taskId?: string;
  projectId?: string;
  currentUserId?: string;
  isCompleted?: boolean;
  loginUserRole: "ADMIN" | "EDITOR" | "VIEWER" | "CREATOR";
}

const RecentMessages = ({
  type,
  baseSize,
  fs,
  taskId,
  projectId,
  currentUserId,
  isCompleted = false,
  loginUserRole,
}: RecentMessagesProps) => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RouteStackParamStack>>();

  const [messageText, setMessageText] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [recentMessages, setRecentMessages] = useState<MessageProps[]>([]);
  const [messageCount, setMessageCount] = useState<number>(0);

  // ✅ Added local loading state for sending a message
  const [isSending, setIsSending] = useState(false);

  const inputRef = useRef<TextInput>(null);

  const dispatch = useDispatch<AppDispatch>();
  const [, setGlobalMenu] = useAtom(globalMenuAtom);
  const [, setIsDisplayError] = useAtom(isDisplayErrorMessageAtom);

  const onClickViewAll = () => {
    navigation.navigate("MessageListScreen", {
      type: type as "PROJECT" | "TASK",
      projectId: projectId,
      taskId: taskId,
      loginUserRole: loginUserRole,
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

  useEffect(() => {
    if (!isMountedRef.current) return;

    const load = async () => {
      if (!isMountedRef.current) return;

      try {
        if ((type === "TASK" || type === "PROJECT_TASK") && taskId) {
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

  useEffect(() => {
    if (!msgError) return;
    triggerErrorModal(
      type === "TASK" ? "Task messages error" : "Project messages error",
      msgError,
    );
  }, [msgError, type, triggerErrorModal]);

  useEffect(() => {
    if (type === "TASK" || type === "PROJECT_TASK") {
      setRecentMessages(taskMessages);
      setMessageCount(totalTaskCount);
    } else {
      setRecentMessages(projectMessages);
      setMessageCount(totalMessageCount);
    }
  }, [taskMessages, projectMessages, totalMessageCount, totalTaskCount, type]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || isCompleted) return;
    try {
      setIsSending(true); // ✅ Trigger sending spinner
      await onSendMessage({
        message: messageText,
        type: type as "PROJECT" | "TASK",
        taskId: taskId,
        projectId: projectId,
      });
      setMessageText("");
      Keyboard.dismiss();
    } catch (error: any) {
      console.log("Error sending message:", error);
      triggerErrorModal("Send Failed", error);
    } finally {
      setIsSending(false); // ✅ Stop sending spinner
    }
  };

  const onDeleteMessage = useCallback(
    async (messageId: string) => {
      try {
        await dispatch(
          deleteMessage({ messageId, isTask: type === "TASK" }),
        ).unwrap();

        if (type === "PROJECT") {
          await onUpdateGlobalStateForProject({
            entity: "MESSAGE",
            action: "DELETE",
          });
        } else {
          await onUpdateGlobalStateForTask({
            entity: "MESSAGE",
            action: "DELETE",
          });
        }
      } catch (error) {
        triggerErrorModal("Action Not Allowed", error);
      }
    },
    [dispatch, type, triggerErrorModal],
  );

  const slicedMessages = recentMessages?.slice(0, DEFAULT_RECENT_TASK_LIMIT);

  const renderMessageItem = useCallback(
    ({ item, index }: { item: MessageProps; index: number }) => {
      const isMessageCreator = item.messageSender.userId === currentUserId;

      let isAllowToDelete = false;

      if (type === "PROJECT" || type === "PROJECT_TASK") {
        isAllowToDelete =
          loginUserRole === "ADMIN" ||
          (loginUserRole === "EDITOR" && isMessageCreator);
      } else {
        isAllowToDelete = loginUserRole === "CREATOR";
      }

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
          isCompleted={isCompleted}
          messageType={
            type
            // type === "PROJECT"
            //   ? "PROJECT"
            //   : type === "PROJECT_TASK"
            //     ? "PROJECT_TASK"
            //     : "TASK"
          }
        />
      );
    },
    [
      slicedMessages?.length,
      baseSize,
      fs,
      type,
      currentUserId,
      onDeleteMessage,
      setGlobalMenu,
      isCompleted,
      loginUserRole,
    ],
  );

  // ✅ Replaced text with visual spinner component for Empty List loading
  const renderEmptyList = () => (
    <Center width="100%" py={adjustSizeToResolveZoomInIssue(baseSize * 0.05)}>
      {msgLoading ? (
        <HStack space={3} alignItems="center">
          <Spinner color="indigo.500" />
          <Text
            color="coolGray.700"
            fontSize={adjustSizeToResolveZoomInIssue(fs.subTitle)}
          >
            Loading messages...
          </Text>
        </HStack>
      ) : (
        <Text
          color="coolGray.500"
          fontSize={adjustSizeToResolveZoomInIssue(fs.subTitle)}
        >
          No messages yet
        </Text>
      )}
    </Center>
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

        {/* --- FLATLIST --- */}
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
            bg={isCompleted ? "coolGray.100" : "white"}
            borderRadius="xl"
            borderWidth={1}
            borderColor={isFocused ? "indigo.500" : "coolGray.200"}
            alignItems="center"
            px={adjustSizeToResolveZoomInIssue(baseSize * 0.05)}
            py={adjustSizeToResolveZoomInIssue(baseSize * 0.02)}
          >
            <TextInput
              ref={inputRef}
              style={{
                flex: 1,
                fontSize: fs.subTitle,
                color: isCompleted ? "#9CA3AF" : "#111827",
                paddingVertical: adjustSizeToResolveZoomInIssue(
                  baseSize * 0.02,
                ),
              }}
              placeholder={
                isCompleted
                  ? `Chat closed (${type == "PROJECT" ? "Project" : "Task"} Completed)`
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
            // ✅ Bind disabled state to local isSending so users can't spam send
            isDisabled={isSending || !messageText.trim() || isCompleted}
            _disabled={{ opacity: 0.6 }}
            _pressed={{ bg: "indigo.700" }}
          >
            {/* ✅ Spinner now binds to isSending instead of global msgLoading */}
            {isSending ? (
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
