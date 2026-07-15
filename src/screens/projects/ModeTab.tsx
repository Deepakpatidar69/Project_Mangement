import React from "react";
import { Animated } from "react-native";
import { Box, Text, Pressable } from "native-base";
import { useScaleAnimation } from "../../hooks/useScaleAnimation";

export const ModeTab = ({
  mode,
  projectMode,
  handleModeChange,
  switchFontSize,
}: {
  mode: "CREATED" | "ASSIGNED";
  projectMode: string;
  handleModeChange: (mode: "CREATED" | "ASSIGNED") => void;
  switchFontSize: number | string;
}) => {
  const { scaleValue, handlePressIn, handlePressOut } = useScaleAnimation();

  return (
    <Pressable
      flex={1}
      onPress={() => handleModeChange(mode)}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      {({ isPressed }) => (
        <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
          <Box
            py={2}
            mx={"4%"}
            borderRadius={10}
            alignItems="center"
            bg={
              projectMode === mode
                ? "white"
                : isPressed
                  ? "coolGray.100"
                  : "white"
            }
            shadow={projectMode === mode ? 1 : 0}
          >
            <Text
              fontSize={switchFontSize}
              fontWeight={projectMode === mode ? "700" : "500"}
              color={projectMode === mode ? "#5B3FFF" : "coolGray.400"}
            >
              {mode === "CREATED" ? "My Projects" : "Assigned"}
            </Text>
          </Box>
        </Animated.View>
      )}
    </Pressable>
  );
};
