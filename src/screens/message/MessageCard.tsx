// --- ISOLATED MESSAGE ITEM COMPONENT ---

import {
  Avatar,
  Box,
  HStack,
  Icon,
  Pressable,
  Text,
  VStack,
} from "native-base";
import { useRef } from "react";
import { Clipboard, View } from "react-native";
import { adjustSizeToResolveZoomInIssue } from "../../utils/Helper";
import { Ionicons } from "@expo/vector-icons";
import { MessageProps } from "../../store/slices/types";
import {
  getMessageMenuOptions,
  openUniversalMenu,
} from "../../modals/ActionMenu.Options.utile";

// This guarantees the useRef hook is tracked perfectly by React
interface MessageCardProps {
  msg: MessageProps;
  isLast: boolean;
  baseSize: number;
  fs: any;
  currentUserId?: string;
  isAllowToDelete?: boolean;
  onDeleteMessage: (id: string) => void;
  setGlobalMenu: any;
  messageType : "PROJECT" | "TASK" | "PROJECT_TASK";
  isCompleted : boolean;
}

// Helper function to format relative date/time
function getRelativeDate(iso: string): string {
  if (!iso) return "Just now";
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return "Just now";

  const mins = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);

  if (days === 0) {
    if (hours > 0) return `${hours}h ago`;
    if (mins > 0) return `${mins}m ago`;
    return "Just now";
  }
  if (days === 1) return "Yesterday";
  if (days > 1 && days < 7) return `${days}d ago`;

  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

// Role -> badge tint. "Creator" and admins get a warmer, more
// authoritative tint; everyone else gets a quiet neutral pill.
function getRoleBadgeColors(label: string) {
  const normalized = label.toLowerCase();

  if (normalized === "creator" || normalized === "admin") {
    return { bg: "amber.50", text: "amber.700" };
  }
  if (normalized === "editor") {
    return { bg: "indigo.50", text: "indigo.600" };
  }
  if (normalized === "unknown") {
    // A slightly darker gray for removed/unknown users
    return { bg: "coolGray.200", text: "coolGray.600" };
  }

  // Default fallback (e.g., for "Viewer")
  return { bg: "coolGray.100", text: "coolGray.500" };
}


export const MessageCard = ({
  msg,
  baseSize,
  fs,
  currentUserId,
  isAllowToDelete = false,
  onDeleteMessage,
  setGlobalMenu,
  isCompleted,
  messageType
}: MessageCardProps) => {
  const triggerRef = useRef<View>(null);

  const isMessageCreator = msg.messageSender?.userId === currentUserId;

  const firstLetter = msg.messageSender?.name
    ? msg.messageSender.name?.charAt(0).toUpperCase()
    : "U";


  const getLabelName = (messageType: "PROJECT" | "TASK" | "PROJECT_TASK") => {
    const role = msg.messageSender?.userRole;

    // If the user has been removed, their role will be undefined/null
    if (!role) {
      // If it's a private task, they are always the Creator by default.
      // Otherwise, they are an "Unknown" removed member.
      return messageType === "TASK" ? "Creator" : "Unknown";
    }

    // Capitalize the first letter and make the rest lowercase (e.g., "ADMIN" -> "Admin")
    return `${role.charAt(0).toUpperCase()}${role.slice(1).toLowerCase()}`;
  };

  const roleLabel = getLabelName(messageType);

  const roleBadge = getRoleBadgeColors(roleLabel);

  const handleOpenMenu = () => {
    openUniversalMenu({
      triggerRef: triggerRef,
      setGlobalMenu: setGlobalMenu,
      minWidth: adjustSizeToResolveZoomInIssue(baseSize * 0.45),
      options: getMessageMenuOptions({
        msg,
        canDeleteMessage: isAllowToDelete,
        onDeleteMessage,
      }),
    });
  };

  return (
    <Box
      mx={adjustSizeToResolveZoomInIssue(baseSize * 0.01)}
      borderRadius="2xl"
      bg="white"
      shadow={1}
      overflow="hidden"
    >
      <HStack>
        <HStack
          width={"98%"}
          borderLeftWidth={4}
          borderRadius={16}
          borderLeftColor={isMessageCreator ? "indigo.500" : "coolGray.100"}
          overflow="hidden"
          height={"100%"}
          space={3}
          alignItems="flex-start"
          p={adjustSizeToResolveZoomInIssue(baseSize * 0.045)}
        >
          {/* Menu Trigger Icon */}
          <Box
            position="absolute"
            top={adjustSizeToResolveZoomInIssue(baseSize * 0.025)}
            right={adjustSizeToResolveZoomInIssue(baseSize * 0.02)}
            zIndex={10}
          >
            <View ref={triggerRef}>
              <Pressable
                onPress={handleOpenMenu}
                w={adjustSizeToResolveZoomInIssue(baseSize * 0.09)}
                h={adjustSizeToResolveZoomInIssue(baseSize * 0.09)}
                borderRadius="full"
                isDisabled={isCompleted}
                alignItems="center"
                justifyContent="center"
                _pressed={{ bg: "coolGray.100" }}
              >
                <Icon
                  as={Ionicons}
                  name="ellipsis-vertical"
                  size={adjustSizeToResolveZoomInIssue(baseSize * 0.045)}
                  color={isCompleted ? "#dee1e7" : "#374151"}
                />
              </Pressable>
            </View>
          </Box>

          <Avatar
            bg={isMessageCreator ? "indigo.500" : "coolGray.400"}
            size={adjustSizeToResolveZoomInIssue(baseSize * 0.13)}
            justifyContent="center"
            alignItems="center"
            borderWidth={2}
            borderColor="white"
            shadow={1}
            source={{ uri: msg.messageSender?.profileImageUrl }}
          >
            <Text
              color="white"
              fontSize={adjustSizeToResolveZoomInIssue(baseSize * 0.07)}
              fontWeight="semibold"
            >
              {firstLetter}
            </Text>
          </Avatar>

          <VStack flex={1} space={1.5}>
            <HStack alignItems="center" space={2} pr={6}>
              <Text
                fontSize={fs.meta}
                fontWeight="700"
                color="coolGray.900"
                flexShrink={1}
                numberOfLines={1}
              >
                {msg.messageSender?.name || "Unknown User"}
              </Text>

              <Box
                bg={roleBadge.bg}
                px={adjustSizeToResolveZoomInIssue(baseSize * 0.02)}
                py={adjustSizeToResolveZoomInIssue(baseSize * 0.003)}
                borderRadius="full"
              >
                <Text
                  fontSize={fs.meta ? fs.meta * 0.85 : undefined}
                  fontWeight="600"
                  color={roleBadge.text}
                >
                  {roleLabel || "Unknown"}
                </Text>
              </Box>
            </HStack>

            <Text fontSize={fs.meta} color="coolGray.600" numberOfLines={2}>
              {msg.message}
            </Text>

            <HStack
              justifyContent="space-between"
              alignItems="center"
              mt={1}
              pt={2}
              borderTopWidth={1}
              borderTopColor="coolGray.50"
            >
              <HStack alignItems="center" space={1}>
                <Icon
                  as={Ionicons}
                  name="time-outline"
                  size={adjustSizeToResolveZoomInIssue(baseSize * 0.04)}
                  color="coolGray.300"
                />
                <Text
                  fontSize={fs.meta ? fs.meta * 0.9 : undefined}
                  color="coolGray.400"
                >
                  {getRelativeDate(msg.createdAt)}
                </Text>
              </HStack>

              {/* <HStack
                alignItems="center"
                space={1}
                bg="coolGray.50"
                px={adjustSizeToResolveZoomInIssue(baseSize * 0.025)}
                py={adjustSizeToResolveZoomInIssue(baseSize * 0.008)}
                borderRadius="full"
              >
                <Icon
                  as={Ionicons}
                  name="chatbubble-outline"
                  size={adjustSizeToResolveZoomInIssue(baseSize * 0.04)}
                  color="coolGray.400"
                />
                <Text
                  fontSize={fs.meta ? fs.meta * 0.9 : undefined}
                  color="coolGray.500"
                  fontWeight="600"
                >
                  {msg.commentCount}
                </Text>
              </HStack> */}
            </HStack>
          </VStack>
        </HStack>
      </HStack>
    </Box>
  );
};
