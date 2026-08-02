import { View } from "react-native";
import { MemberProps } from "../../store/slices/types";
import { ROLE_CONFIG } from "../utils/screen.utils";
import { adjustSizeToResolveZoomInIssue } from "../../utils/Helper";
import {
  getMemberOptions,
  openUniversalMenu,
} from "../../modals/ActionMenu.Options.utile";
import { useRef } from "react";
import { Avatar, Box, HStack, Pressable, Text, VStack } from "native-base";
import { Feather } from "@expo/vector-icons";

interface MemberCardProps {
  item: MemberProps;
  baseSize: number;
  meta: number;
  subTitleSize: number;
  avatarSize: number;
  isAdmin: boolean;
  isCurrentUser: boolean;
  setGlobalMenu: any;
  isProjectCompleted: boolean;
  onUpdateRole: (item: MemberProps) => void;
  onRemoveUser: (item: MemberProps) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const AVATAR_PALETTE = [
  "#8B5CF6",
  "#10B981",
  "#F59E0B",
  "#3B82F6",
  "#EF4444",
  "#EC4899",
  "#0EA5E9",
  "#14B8A6",
];
const getAvatarColor = (name: string): string =>
  AVATAR_PALETTE[name.charCodeAt(0) % AVATAR_PALETTE.length];

export const MemberCard = ({
  item,
  baseSize,
  meta,
  subTitleSize,
  avatarSize,
  isAdmin,
  isCurrentUser,
  setGlobalMenu,
  onUpdateRole,
  onRemoveUser,
  isProjectCompleted = false,
}: MemberCardProps) => {
  const triggerRef = useRef<View>(null);
  const roleConfig = ROLE_CONFIG[item.role] ?? ROLE_CONFIG.VIEWER;
  const iconSize = adjustSizeToResolveZoomInIssue(baseSize * 0.06);

  // Get the first letter dynamically for the fallback text
  const firstLetter = item.memberName
    ? item.memberName.charAt(0).toUpperCase()
    : "U";

  const handleOpenMenu = () => {
    openUniversalMenu({
      triggerRef: triggerRef,
      setGlobalMenu: setGlobalMenu,
      minWidth: adjustSizeToResolveZoomInIssue(baseSize * 0.45),
      options: getMemberOptions({
        isAdmin,
        item,
        onUpdateRole,
        onRemoveUser,
      }),
    });
  };

  return (
    <Box
      width={"100%"}
      mx={"1%"}
      justifyContent={"center"}
      alignItems={"center"}
    >
      <HStack
        width={"96%"}
        bg="white"
        px="5%"
        py="4%"
        borderRadius="2xl"
        alignItems="center"
        space={3}
        shadow={1}
        position="relative"
      >
        <Avatar
          bg={isCurrentUser ? "indigo.500" : getAvatarColor(item.memberName)}
          size={adjustSizeToResolveZoomInIssue(baseSize * 0.13)}
          justifyContent="center"
          alignItems="center"
          borderWidth={2}
          borderColor="white"
          shadow={1}
          // Safely apply the source ONLY if the URL actually exists
          source={
               { uri: item.assignedMember.profileImageUrl }
          }
        >
          <Text
            color="white"
            fontSize={adjustSizeToResolveZoomInIssue(baseSize * 0.07)}
            fontWeight="semibold"
          >
            {firstLetter}
          </Text>
        </Avatar>

        <VStack flex={1} space={0.5}>
          <Text
            fontSize={subTitleSize}
            fontWeight="bold"
            color="coolGray.900"
            numberOfLines={1}
          >
            {item.memberName}
          </Text>
          <Text fontSize={meta} color="coolGray.500" numberOfLines={1}>
            {item.memberEmail}
          </Text>
        </VStack>

        <Box
          bg={roleConfig.bg}
          px={adjustSizeToResolveZoomInIssue(baseSize * 0.025)}
          py={adjustSizeToResolveZoomInIssue(baseSize * 0.008)}
          rounded="md"
        >
          <Text fontSize={meta} fontWeight="700" color={roleConfig.color}>
            {roleConfig.label}
          </Text>
        </Box>

        {isAdmin && !isCurrentUser && (
          <View ref={triggerRef}>
            <Pressable
              p={1}
              ml={1}
              borderRadius="full"
              disabled={isProjectCompleted}
              _pressed={{
                bg: isProjectCompleted ? "#F9FAFB" : "#E5E7EB",
              }}
              onPress={handleOpenMenu}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Feather
                name="more-vertical"
                size={iconSize * 0.8}
                color={isProjectCompleted ? "#D1D5DB" : "#374151"}
              />
            </Pressable>
          </View>
        )}
      </HStack>
    </Box>
  );
};
