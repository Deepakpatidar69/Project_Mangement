import { Ionicons } from "@expo/vector-icons";
import { Box, HStack, Icon, Pressable, Text } from "native-base";
import React from "react";
import { ActivityIndicator } from "react-native";
import { adjustSizeToResolveZoomInIssue } from "../utils/Helper";

interface LoadMoreButtonProps {
  currentCount: number;
  totalCount: number;
  isLoading: boolean;
  onLoadMore: () => void;
  // ✅ Added "Member" to the allowed types
  type?: "Project" | "Task" | "Message" | "Member";
  fontSize: number;
}

export const FooterLoadMoreButton: React.FC<LoadMoreButtonProps> = ({
  currentCount,
  totalCount,
  isLoading,
  fontSize,
  onLoadMore,
  type = "Project", // Defaults to "Project" if not provided
}) => {
  const hasMore = currentCount < totalCount;

  // Plural label for the "no more X" message — lowercase + "s".
  // Covers Project -> projects, Task -> tasks, Message -> messages, Member -> members.
  const pluralLabel = `${type.toLowerCase()}s`;

  if (isLoading && currentCount == 0) return null;

  if (isLoading && currentCount > 0) {
    return (
      <Box py={5} alignItems="center">
        <ActivityIndicator
          size={adjustSizeToResolveZoomInIssue(fontSize * 2.5)}
          color="#5B3FFF"
        />
      </Box>
    );
  }

  if (!hasMore && currentCount > 0) {
    return (
      <Box py={6} alignItems="center">
        <Text
          fontSize={adjustSizeToResolveZoomInIssue(fontSize)}
          color="coolGray.300"
        >
          {`— No more ${pluralLabel} —`}
        </Text>
      </Box>
    );
  }

  if (currentCount > 0) {
    return (
      <Pressable onPress={onLoadMore} mx={10} my={4}>
        {({ isPressed }) => (
          <HStack
            alignItems="center"
            justifyContent="center"
            space={1.5}
            py={3}
            borderRadius={99}
            borderWidth={1.5}
            borderColor="#5B3FFF"
            bg={isPressed ? "rgba(91,63,255,0.12)" : "rgba(91,63,255,0.05)"}
          >
            <Icon
              as={Ionicons}
              name="chevron-down-outline"
              size={fontSize}
              color="#5B3FFF"
            />
            <Text fontSize={fontSize} fontWeight="700" color="#5B3FFF">
              Load More
            </Text>
          </HStack>
        )}
      </Pressable>
    );
  }

  return null;
};
