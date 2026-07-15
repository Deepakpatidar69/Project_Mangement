import React, { useState, useEffect } from "react";
import { TextInput, KeyboardAvoidingView, Platform } from "react-native";
import { Box, Text, HStack, VStack, Pressable, Icon } from "native-base";

import {
  Feather,
  MaterialCommunityIcons,
  // @ts-ignore
} from "react-native-vector-icons";
import { useSetAtom } from "jotai";
import {
  adjustSizeToResolveZoomInIssue,
  getScreenDimensions,
} from "../utils/Helper";
import { formatDate } from "../utils/Helper";
import { getStatus } from "../screens/utils/screen.utils";
import { isDisplayErrorMessageAtom } from "../utils/Constent"; // adjust path to where you defined this atom
import { clearMessageError } from "../store/slices/MessageSlice";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../store";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SendMessageModalProps {
  uniqueId: string;
  isOpen: boolean;
  type: "PROJECT" | "TASK";
  compHeight: number;
  compWidth: number;
  backgroundColor?: string;
  backdropColor?: string;
  title: string;
  status: boolean;
  dueDate: Date;
  onClose: () => void;
  onHandleSendMessage: ({
    message,
    projectId,
    taskId,
    type,
  }: {
    message: string;
    taskId?: string;
    type: "PROJECT" | "TASK";
    projectId?: string;
  }) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

const SendMessageModal: React.FC<SendMessageModalProps> = ({
  uniqueId,
  isOpen,
  compHeight,
  compWidth,
  type,
  title,
  status,
  dueDate,
  onClose,
  onHandleSendMessage,
  backdropColor = "rgba(0, 0, 0, 0.65)", // Matched AddMemberModal opacity
  backgroundColor = "#ffffff",
}) => {
  const [message, setMessage] = useState("");

  // Global error modal setter
  const setErrorModal = useSetAtom(isDisplayErrorMessageAtom);

  const dispatch = useDispatch<AppDispatch>();

  // Reset message when modal closes
  useEffect(() => {
    if (!isOpen) {
      setMessage("");
    }
  }, [isOpen]);

  const { screenHeight, screenWidth } = getScreenDimensions();

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    try {
      if (type == "TASK") {
        await onHandleSendMessage({
          message: message,
          type: type,
          taskId: uniqueId,
        });
      } else {
        await onHandleSendMessage({
          message: message,
          type: type,
          projectId: uniqueId,
        });
      }
      setMessage("");
      onClose(); // Automatically close after sending
    } catch (error: any) {
      console.log("Error sending message:", error);

      onClose?.();

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
          navigation.back?.();
        },
      }));
    }
  };

  const isProject = type === "PROJECT";
  const statusData = getStatus(status, dueDate);

  const baseSize = Math.min(compHeight, compWidth);
  const titleSize = adjustSizeToResolveZoomInIssue(baseSize * 0.065);
  const labelSize = adjustSizeToResolveZoomInIssue(baseSize * 0.052);
  const bodySize = adjustSizeToResolveZoomInIssue(baseSize * 0.046);
  const smallSize = adjustSizeToResolveZoomInIssue(baseSize * 0.039);
  const iconSize = adjustSizeToResolveZoomInIssue(baseSize * 0.062);
  const buttonSize = adjustSizeToResolveZoomInIssue(baseSize * 0.05);

  if (!isOpen || !uniqueId) return null;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{
        position: "absolute",
        height: screenHeight,
        width: screenWidth,
        justifyContent: "center",
        alignItems: "center",
        zIndex: 999,
        backgroundColor: "#00000033",
      }}
    >
      {/* ── Modal Card ── */}
      <Box
        width={compWidth}
        bg={backgroundColor}
        borderRadius="3xl"
        overflow="hidden"
        shadow={2}
      >
        {/* ── Drag Handle ─────────────────────────────────────────────────── */}
        <Box alignItems="center" pt={3} pb={1}>
          <Box w={10} h={1.5} bg="coolGray.300" borderRadius="full" />
        </Box>

        <VStack px={5} pb={6} space={5}>
          {/* ── Header ──────────────────────────────────────────────────────── */}
          <HStack justifyContent="space-between" alignItems="center" pt={2}>
            <Text fontSize={titleSize} fontWeight="bold" color="coolGray.900">
              Send Message
            </Text>
            <Pressable
              onPress={onClose}
              bg="coolGray.100"
              borderRadius="full"
              p={2}
            >
              <Feather name="x" size={iconSize} color="#374151" />
            </Pressable>
          </HStack>

          {/* ── Divider ─────────────────────────────────────────────────────── */}
          <Box h={0.5} bg="coolGray.100" />

          {/* ── Context Card (Project/Task Details) ───────────────────────── */}
          <Box
            borderWidth={1}
            borderColor="coolGray.200"
            borderRadius="xl"
            bg="coolGray.50"
            p={3}
          >
            <HStack space={3} alignItems="center">
              {/* Icon */}
              <Box
                bg="white"
                p={2.5}
                borderRadius="lg"
                borderWidth={1}
                borderColor="coolGray.200"
                shadow={1}
              >
                {isProject ? (
                  <Feather name="folder" size={iconSize} color="#4F46E5" />
                ) : (
                  <MaterialCommunityIcons
                    name="calendar-check-outline"
                    size={iconSize}
                    color="#F97316"
                  />
                )}
              </Box>

              {/* Info */}
              <VStack flex={1} space={0.5}>
                <Text
                  fontSize={smallSize}
                  fontWeight="medium"
                  color="coolGray.500"
                  textTransform="uppercase"
                >
                  {isProject ? "Project" : "Task"}
                </Text>
                <Text
                  fontSize={bodySize}
                  fontWeight="bold"
                  color="coolGray.900"
                  noOfLines={1}
                >
                  {title}
                </Text>
                <HStack alignItems="center" space={1} mt={1}>
                  <MaterialCommunityIcons
                    name="calendar-check-outline"
                    size={adjustSizeToResolveZoomInIssue(smallSize * 0.9)}
                    color="#6B7280"
                  />
                  <Text
                    fontSize={adjustSizeToResolveZoomInIssue(smallSize * 0.9)}
                    color="coolGray.500"
                  >
                    Deadline: {formatDate(dueDate, false) || "No date set"}
                  </Text>
                </HStack>
              </VStack>

              {/* Status Badge */}
              <HStack
                px={2}
                py={1.5}
                borderRadius="lg"
                bg={statusData.background}
                alignItems="center"
                justifyContent="center"
                space={1}
              >
                <Icon
                  as={statusData.iconType}
                  name={statusData.iconName}
                  size={adjustSizeToResolveZoomInIssue(smallSize * 1.1)}
                  color={statusData.color}
                />
                <Text
                  fontSize={adjustSizeToResolveZoomInIssue(smallSize * 0.85)}
                  fontWeight="600"
                  color={statusData.color}
                >
                  {statusData.status}
                </Text>
              </HStack>
            </HStack>
          </Box>

          {/* ── Message Input Area ────────────────────────────────────────── */}
          <VStack space={2}>
            <Text
              fontSize={labelSize}
              fontWeight="semibold"
              color="coolGray.900"
            >
              Message
            </Text>

            <Box
              borderWidth={1}
              borderColor="coolGray.200"
              borderRadius="xl"
              bg="white"
              overflow="hidden"
            >
              <TextInput
                style={{
                  minHeight: compHeight * 0.15, // Responsive height for textarea
                  width: "100%",
                  paddingHorizontal: 12,
                  paddingVertical: 12,
                  fontSize: bodySize,
                  color: "#111827",
                  textAlignVertical: "top",
                }}
                placeholder="Write your message..."
                placeholderTextColor="#9CA3AF"
                value={message}
                onChangeText={setMessage}
                multiline={true}
                maxLength={1000}
                autoCorrect={true}
              />

              {/* Textarea Footer Controls */}
              <HStack
                justifyContent="flex-end"
                alignItems="center"
                px={3}
                py={2}
                borderTopWidth={1}
                borderColor="coolGray.100"
                bg="coolGray.50"
              >
                <Text fontSize={smallSize} color="coolGray.400">
                  {message.length}/1000
                </Text>
              </HStack>
            </Box>
          </VStack>

          {/* ── Action Buttons ───────────────────────────────────────────────── */}
          <HStack space={3} mt={2}>
            {/* Send Message */}
            <Box flex={1}>
              <Pressable
                onPress={handleSendMessage}
                isDisabled={!message.trim()}
              >
                {({ isPressed }) => (
                  <Box
                    bg={
                      !message.trim()
                        ? "indigo.300"
                        : isPressed
                          ? "indigo.800"
                          : "indigo.600"
                    }
                    borderRadius="xl"
                    py={adjustSizeToResolveZoomInIssue(iconSize * 0.45)}
                    justifyContent="center"
                    alignItems="center"
                  >
                    <HStack space={2} alignItems="center">
                      <Feather
                        name="send"
                        size={adjustSizeToResolveZoomInIssue(iconSize * 0.85)}
                        color="white"
                      />
                      <Text
                        fontSize={buttonSize}
                        fontWeight="semibold"
                        color="white"
                      >
                        Send
                      </Text>
                    </HStack>
                  </Box>
                )}
              </Pressable>
            </Box>

            {/* Cancel */}
            <Box flex={1}>
              <Pressable onPress={onClose}>
                {({ isPressed }) => (
                  <Box
                    borderWidth={1.5}
                    borderColor={isPressed ? "coolGray.400" : "coolGray.300"}
                    borderRadius="xl"
                    py={adjustSizeToResolveZoomInIssue(iconSize * 0.45)}
                    justifyContent="center"
                    alignItems="center"
                    bg={isPressed ? "coolGray.50" : "white"}
                  >
                    <Text
                      fontSize={buttonSize}
                      fontWeight="semibold"
                      color="coolGray.900"
                    >
                      Cancel
                    </Text>
                  </Box>
                )}
              </Pressable>
            </Box>
          </HStack>
        </VStack>
      </Box>
    </KeyboardAvoidingView>
  );
};

export default SendMessageModal;
