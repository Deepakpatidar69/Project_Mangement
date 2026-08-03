import React, { useRef } from "react";
import { View } from "react-native";
import { HStack, VStack, Pressable, Text, Icon, Box } from "native-base";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { adjustSizeToResolveZoomInIssue, getInsetTop } from "../utils/Helper";
import { useContainerDimensions } from "../hooks/OnlayoutHooks";
import { useAtom } from "jotai";
import { globalMenuAtom } from "../utils/Constent"; // Ensure this path matches where your atom is stored
import { MenuOption } from "../utils/props.utils";

interface CommonDetailHeaderProps {
  title: string;
  subtitle?: string; // Optional so you can omit it if needed
  onTabBackButton: () => void;
  onEdit?: () => void;
  showEdit?: boolean;
  fs: number;
  showMenuBar?: boolean;
  isEditButtonDisable?: boolean;
  menuOption?: MenuOption[];
  // New props for Leave Project
  showLeaveButton?: boolean;
  onTapLeaveButton?: () => void;
}

export function CommonDetailHeader({
  title,
  subtitle,
  onTabBackButton,
  onEdit,
  showEdit,
  fs,
  showMenuBar = true,
  menuOption,
  isEditButtonDisable = false,
  showLeaveButton = false, // Default is false
  onTapLeaveButton,
}: CommonDetailHeaderProps) {
  const { containerDimensions, onLayout } = useContainerDimensions();
  const [, setGlobalMenu] = useAtom(globalMenuAtom);
  const triggerRef = useRef<View>(null);

  return (
    <Box>
      <HStack
        bg={"white"}
        width={"100%"}
        px={adjustSizeToResolveZoomInIssue(fs * 0.02)}
        pb={adjustSizeToResolveZoomInIssue(fs * 0.05)}
        pt={getInsetTop()}
        borderBottomWidth={1}
        borderBottomColor="coolGray.100"
        alignItems="center"
        space={3}
        shadow={2}
        zIndex={100}
        onLayout={onLayout}
      >
        <>
          {/* Back Button */}
          <Pressable
            w={adjustSizeToResolveZoomInIssue(fs * 0.12)}
            h={adjustSizeToResolveZoomInIssue(fs * 0.12)}
            rounded="full"
            bg="coolGray.100"
            alignItems="center"
            justifyContent="center"
            onPress={onTabBackButton}
            _pressed={{
              bg: "coolGray.200",
              style: {
                transform: [{ scale: 0.9 }],
              },
            }}
          >
            <Icon
              as={Ionicons}
              name="arrow-back-outline"
              size={adjustSizeToResolveZoomInIssue(fs * 0.08)}
              color="coolGray.900"
            />
          </Pressable>

          {/* Title & Subtitle Container */}
          <VStack flex={1}>
            <Text
              fontSize={adjustSizeToResolveZoomInIssue(fs * 0.06)}
              fontWeight="800"
              color="coolGray.900"
              letterSpacing="-0.2"
            >
              {title}
            </Text>
            {subtitle ? (
              <Text
                fontSize={adjustSizeToResolveZoomInIssue(fs * 0.028)}
                color="coolGray.400"
                isTruncated
              >
                {subtitle}
              </Text>
            ) : null}
          </VStack>

          {/* Actions (Leave, Edit & Menu) */}
          <HStack space={2} alignItems="center">
            {/* Leave Project Button */}
            {showLeaveButton && (
              <Pressable
                alignItems="center"
                justifyContent="center"
                onPress={onTapLeaveButton}
                w={adjustSizeToResolveZoomInIssue(fs * 0.1)}
                h={adjustSizeToResolveZoomInIssue(fs * 0.1)}
              >
                <Icon
                  as={MaterialCommunityIcons}
                  name="logout" // Great icon for leaving/exiting
                  size={adjustSizeToResolveZoomInIssue(fs * 0.08)}
                  color="error.500" // Red color to denote leaving/destructive action
                />
              </Pressable>
            )}

            {/* Edit Button */}
            {showEdit && (
              <Pressable
                isDisabled={isEditButtonDisable}
                alignItems="center"
                justifyContent="center"
                onPress={onEdit}
                w={adjustSizeToResolveZoomInIssue(fs * 0.1)}
                h={adjustSizeToResolveZoomInIssue(fs * 0.1)}
              >
                <Icon
                  as={MaterialCommunityIcons}
                  name="pencil-box-multiple"
                  size={adjustSizeToResolveZoomInIssue(fs * 0.1)}
                  color={isEditButtonDisable ? "coolGray.200" : "indigo.500"}
                />
              </Pressable>
            )}

            {/* Menu Bar */}
            {showMenuBar && (menuOption?.length || 0) > 0 && (
              <View ref={triggerRef}>
                <Pressable
                  onPress={() => {
                    triggerRef.current?.measureInWindow(
                      (x, y, width, height) => {
                        setGlobalMenu({
                          isOpen: true,
                          x: x,
                          y: y + height, // Display right below the header icon
                          iconWidth: width,
                          minWidth: adjustSizeToResolveZoomInIssue(
                            containerDimensions.width * 0.45,
                          ),
                          options: menuOption!,
                        });
                      },
                    );
                  }}
                  w={adjustSizeToResolveZoomInIssue(fs * 0.1)}
                  h={adjustSizeToResolveZoomInIssue(fs * 0.1)}
                  alignItems="center"
                  justifyContent="center"
                >
                  <Icon
                    as={Ionicons}
                    name="ellipsis-vertical"
                    size={adjustSizeToResolveZoomInIssue(fs * 0.06)}
                    color="coolGray.700"
                  />
                </Pressable>
              </View>
            )}
          </HStack>
        </>
      </HStack>
    </Box>
  );
}
