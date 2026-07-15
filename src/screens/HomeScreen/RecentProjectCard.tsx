import React from "react";
import {
  Box,
  HStack,
  VStack,
  Text,
  Icon,
  Pressable,
  Progress,
} from "native-base";
import { Ionicons } from "@expo/vector-icons";
import { ProjectProps } from "../../store/slices/types";
import { useContainerDimensions } from "../../hooks/OnlayoutHooks";



export interface ProjectCardProps {
  project: ProjectProps;
  colorTheme?: "purple" | "blue" | "green" | "orange";
  onPress?: () => void;
  onOptionsPress?: () => void;
}

export const ProjectCard = ({
  project,
  colorTheme = "purple",
  onPress,
  onOptionsPress,
}: ProjectCardProps) => {
  const { containerDimensions, onLayout } = useContainerDimensions();


  // 1. Calculate the progress percentage safely
  const percentage =
    project.totalTasksCount > 0
      ? Math.round((project.completedTaskCount / project.totalTasksCount) * 100)
      : 0;

  // 2. Dynamic Theme Configuration matching your UI colors
  const getThemeConfig = () => {
    switch (colorTheme) {
      case "blue":
        return {
          bg: "rgba(59, 130, 246, 0.1)",
          iconColor: "#3B82F6",
          progressScheme: "blue",
          defaultIcon: "code-slash",
        };
      case "green":
        return {
          bg: "rgba(34, 197, 94, 0.1)",
          iconColor: "#22C55E",
          progressScheme: "emerald",
          defaultIcon: "bag-handle",
        };
      case "orange":
        return {
          bg: "rgba(249, 115, 22, 0.1)",
          iconColor: "#F97316",
          progressScheme: "orange",
          defaultIcon: "layers",
        };
      case "purple":
      default:
        return {
          bg: "rgba(91, 63, 255, 0.1)",
          iconColor: "#5B3FFF",
          progressScheme: "indigo",
          defaultIcon: "grid",
        };
    }
  };

  const theme = getThemeConfig();

  return (
    <Box width={"100%"} justifyContent={"flex-start"} onLayout={onLayout}>
      {containerDimensions.baseSize > 0 && (
        <Box width={"100%"} justifyContent={"center"} alignItems={"center"}>
          <Pressable width={"100%"} justifyContent={"center"} bg={"red.200"} onPress={onPress}>
            <Box
              w="100%" // Fixed width for horizontal scrolling
              bg="white"
              p={4}
              mr={4} // Margin right for spacing in the scroll list
              rounded="2xl"
              borderWidth={1}
              borderColor="gray.100"
              shadow={1}
              style={{ shadowColor: "rgba(0,0,0,0.05)" }}
            >
              {/* Top Row: Icon & 3-Dot Menu */}
              <HStack
                justifyContent="space-between"
                alignItems="flex-start"
                mb={4}
              >
                <Box
                  w={10}
                  h={10}
                  rounded="xl"
                  bg={theme.bg}
                  justifyContent="center"
                  alignItems="center"
                >
                  <Icon
                    as={Ionicons}
                    name={theme.defaultIcon as any}
                    size="md"
                    color={theme.iconColor}
                  />
                </Box>
                <Pressable onPress={onOptionsPress} p={1}>
                  <Icon
                    as={Ionicons}
                    name="ellipsis-vertical"
                    size="sm"
                    color="gray.400"
                  />
                </Pressable>
              </HStack>

              {/* Middle Row: Titles & Task Count */}
              <VStack space={1} mb={4}>
                <Text
                  fontSize="md"
                  fontWeight="bold"
                  color="gray.800"
                  numberOfLines={1}
                >
                  {project.projectHeader}
                </Text>
             
                <Text fontSize="xs" color="gray.400" fontWeight="medium">
                  {project.totalTasksCount} Tasks
                </Text>
              </VStack>

              {/* Bottom Row: Progress Bar & Percentage */}
              <HStack alignItems="center" space={2}>
                <Box flex={1}>
                  <Progress
                    value={percentage}
                    size="xs"
                    colorScheme={theme.progressScheme}
                    bg="gray.100"
                  />
                </Box>
                <Text fontSize="xs" color="gray.500" fontWeight="bold">
                  {percentage}%
                </Text>
              </HStack>
            </Box>
          </Pressable>
        </Box>
      )}
    </Box>
  );
};
