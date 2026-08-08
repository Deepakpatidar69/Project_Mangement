import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { Box, Icon, Pressable, Text } from "native-base";
import React from "react";
import { adjustSizeToResolveZoomInIssue } from "../utils/Helper";

interface ListEmptyComponentProps {
  onClickCreate: () => void;
  type?: "PROJECT" | "TASK" | undefined;
  taskType?: "PRIVATE" | "PROJECT" | undefined;
  projectType?: "CREATED" | "ASSIGNED" | undefined;
  fetchType : "ALL" |"IN_PROGRESS"|"COMPLETED"
  fontSize: number;
  isProjectCompleted ?: boolean;
}

export const ListEmptyComponent = ({
  fontSize,
  onClickCreate,
  taskType = undefined,
  projectType = undefined,
  type = undefined,
  fetchType,
  isProjectCompleted = false
}: ListEmptyComponentProps) => {
  

  return (
    <Box
      bg="white"
      borderRadius={24}
      py={12}
      px={6}
      alignItems="center"
      borderWidth={1}
      borderColor="gray.200"
      borderStyle="dashed"
      mt={4}
    >
      <Box bg="rgba(91,63,255,0.1)" p={4} borderRadius={999} mb={4}>
        <Icon
          as={type == "TASK" ? FontAwesome : Ionicons}
          name={type == "TASK" ? "tasks" : "folder-outline"}
          size={adjustSizeToResolveZoomInIssue(fontSize * 1.2)}
          color="#5B3FFF"
        />
      </Box>

      <Text
        fontSize={fontSize}
        fontWeight="700"
        color="coolGray.800"
        textAlign="center"
        mb={2}
      >
        {`No ${type == "PROJECT" ? "Project" : "Task"} Found`}
      </Text>

      <Text
        fontSize={fontSize}
        color="coolGray.400"
        textAlign="center"
        lineHeight={fontSize * 1.5}
        mb={6}
      >
        {type == "TASK"
          ? taskType === "PRIVATE"
            ? "You haven't created any tasks yet. Tap the + button to get started."
            : "No tasks are available in this project."
          : projectType === "CREATED"
            ? "You haven't created any projects yet. Tap the + button to get started."
            : fetchType == "COMPLETED"
              ? "You haven't been completed any assigned projects yet."
              : "You haven't been assigned to any projects yet."}
      </Text>

      {fetchType !== "COMPLETED" &&
        (projectType === "CREATED" || type === "TASK") && (
          <Pressable isDisabled={isProjectCompleted} onPress={() => onClickCreate()}>
            {({ isPressed }) => (
              <Box
                bg={ isProjectCompleted ? "coolGray.200" :isPressed ? "#4a30e0" : "#5B3FFF"}
                px={7}
                py={3}
                borderRadius={99}
              >
                <Text
                  fontSize={adjustSizeToResolveZoomInIssue(fontSize * 0.85)}
                  fontWeight="700"
                  color="white"
                >
                  {`+ Create New ${type == "PROJECT" ? "Project" : "Task"}`}
                </Text>
              </Box>
            )}
          </Pressable>
        )}
    </Box>
  );
};

export default ListEmptyComponent;
