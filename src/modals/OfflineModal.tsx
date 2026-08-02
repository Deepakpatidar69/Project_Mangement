import React from "react";

import { Box, Text, VStack, Pressable } from "native-base";
import LottieView from "lottie-react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { adjustSizeToResolveZoomInIssue } from "../utils/Helper";
import { getAnimationAssets } from "../AssetsMapping/AssetMap";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OfflineModalProps {
  /** Controls visibility */
  isOpen: boolean;

  /** Height of the modal card (exactly this height) */
  compHeight: number;

  /** Width of the modal card (exactly this width) */
  compWidth: number;

  /** Called when the user taps Cancel — should set isOpen to false in the parent */
  onClose: () => void;

  /**
   * Lottie animation source. Pass a local require(...) json
   * e.g. require("../assets/lottie/no-internet.json")
   * or a remote uri object e.g. { uri: "https://..." }
   */
  lottieSource: string;

  /** Main heading shown under the animation */
  title?: string;

  /** Body message shown under the title */
  message?: string;

  /** Label for the dismiss button */
  cancelLabel?: string;

  /** Card background – default white */
  backgroundColor?: string;

  /** Overlay scrim color – default dark semi-transparent */
  backdropColor?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

const OfflineModal: React.FC<OfflineModalProps> = ({
  isOpen,
  compHeight,
  compWidth,
  onClose,
  lottieSource,
  title = "You're Offline",
  message = "Please check your internet connection and try again.",
  cancelLabel = "Cancel",
  backgroundColor = "#ffffff",
  backdropColor = "rgba(12, 12, 12, 0.65)",
}) => {
  // ── Scale calculations derived directly from dimensions ─────────────────────
  const baseSize = Math.min(compHeight, compWidth);
  const titleSize = adjustSizeToResolveZoomInIssue(baseSize * 0.065);
  const bodySize = adjustSizeToResolveZoomInIssue(baseSize * 0.04);
  const buttonSize = adjustSizeToResolveZoomInIssue(baseSize * 0.06);
  const lottieSize = compHeight * 0.5;

  if (!isOpen) return null;

  return (
    <Box
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 999,
        backgroundColor: backdropColor,
      }}
    >
      <KeyboardAwareScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bottomOffset={20}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {/* ── Main Modal Card Frame ── */}
        <Box
          width={compWidth}
          height={compHeight}
          bg={backgroundColor}
          borderRadius="3xl"
          overflow="hidden"
          shadow={6}
        >
          {/* Content Area */}
          <VStack
            height={"95%"}
            width={"100%"}
            px={"6%"}
            pb={"4%"}
            space={"3%"}
            alignItems="center"
            justifyContent="center"
          >
            {/* Lottie Animation */}
            <Box
              width={lottieSize}
              height={lottieSize}
              justifyContent="center"
              alignItems="center"
            >
              <LottieView
                source={getAnimationAssets(lottieSource)}
                autoPlay
                loop
                style={{ width: lottieSize * 0.8, height: lottieSize * 0.8 }}
              />
            </Box>

            <VStack
              height={adjustSizeToResolveZoomInIssue(
                compHeight * 0.95 - lottieSize,
              )}
              width={"100%"}
              space={"2%"}
              alignItems={"center"}
            >
              {/* Title */}
              <Text
                fontSize={titleSize}
                fontWeight="bold"
                color="coolGray.900"
                textAlign="center"
              >
                {title}
              </Text>

              {/* Offline Message */}
              <Text
                fontSize={bodySize}
                color="coolGray.500"
                textAlign="center"
                px={"4%"}
              >
                {message}
              </Text>

              {/* Cancel / Dismiss Action */}
              <Box
                position={"absolute"}
                bottom={0}
                left={0}
                right={0}
                justifyContent={"center"}
                alignItems={"center"}
              >
                <Pressable onPress={onClose}>
                  {({ isPressed }) => (
                    <Box
                      bg={isPressed ? "red.700" : "red.500"}
                      borderRadius="xl"
                      py={"2%"}
                      px={"10%"}
                      justifyContent="center"
                      alignItems="center"
                    >
                      <Text
                        fontSize={buttonSize}
                        fontWeight="semibold"
                        color="white"
                      >
                        {cancelLabel}
                      </Text>
                    </Box>
                  )}
                </Pressable>
              </Box>
            </VStack>
          </VStack>
        </Box>
      </KeyboardAwareScrollView>
    </Box>
  );
};

export default OfflineModal;
