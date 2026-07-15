import React from "react";
import { Box, Text, HStack, Pressable } from "native-base";
// @ts-ignore
import { Feather } from "react-native-vector-icons";
import { adjustSizeToResolveZoomInIssue, getScreenDimensions } from "../utils/Helper";
import { MenuOption } from "../utils/props.utils";



export interface FloatingActionMenuProps {
  isOpen: boolean;
  onClose: () => void;
  options: MenuOption[];
  minWidth: number ;
  top?: number | string;
  right?: number | string;
}

export const FloatingActionMenu: React.FC<FloatingActionMenuProps> = ({
  isOpen,
  onClose,
  options,
  minWidth,
  top,
  right,
}) => {

  const {screenHeight, screenWidth} = getScreenDimensions();

  if (!isOpen) return null;

  const visibleOptions = options.filter((opt) => opt.isVisible);

  if (visibleOptions.length === 0) return null;

  return (
    <>
      {/* Massive Backdrop to catch close clicks near the list item */}
      <Pressable
        position="absolute"
        width={screenWidth * 3}
        height={screenHeight * 3}
        top={-screenHeight}
        left={-screenWidth}
        onPress={onClose}
        zIndex={10000}
      />

      {/* Dynamic Floating Box Design */}
      <Box
        position="absolute"
        right={right ?? 0}
        top={top ?? "100%"}
        bg="white"
        shadow={4}
        borderRadius="xl"
        borderWidth={1}
        borderColor="coolGray.200"
        minWidth={minWidth}
        zIndex={100000}
        overflow="hidden"
      >
        {visibleOptions.map((option, index) => (
          <React.Fragment key={option.id}>
            <Pressable
              isDisabled={option.isDisable}
              px={adjustSizeToResolveZoomInIssue(minWidth * 0.05)}
              py={adjustSizeToResolveZoomInIssue(minWidth * 0.05)}
              bg={option.isDisable ? "coolGray.50" :(option.bgNormalColor || "white")}
              _pressed={{ bg: option.bgPressedColor || "coolGray.100" }}
              onPress={() => {
                onClose(); // Close menu first
                option.onPress(); // Trigger action
              }}
            >
              <HStack alignItems="center" space={2}>
                <Feather
                  name={option.icon}
                  size={adjustSizeToResolveZoomInIssue(minWidth * 0.12)}
                  color={
                    option.isDisable ? "#b8bbc1" : option.iconColor || "#374151"
                  }
                />
                <Text
                  fontSize={adjustSizeToResolveZoomInIssue(minWidth * 0.08)}
                  color={
                    option.isDisable
                      ? "coolGray.300"
                      : option.textColor || "coolGray.800"
                  }
                  fontWeight="medium"
                >
                  {option.label}
                </Text>
              </HStack>
            </Pressable>

            {/* Add divider line if it's not the last item */}
            {index < visibleOptions.length - 1 && (
              <Box height="1px" bg="coolGray.200" width="100%" />
            )}
          </React.Fragment>
        ))}
      </Box>
    </>
  );
};

