// components/HomeScreenNavigation.tsx
import React, { useRef, useState, useEffect } from "react";
import {
  Animated,
  TouchableOpacity,
  Dimensions,
  FlatList,
  Easing,
} from "react-native";
import { Box, VStack, Icon, Text, Pressable } from "native-base";
import LottieView from "lottie-react-native";
import { HomeScreenNavigationType } from "../utils/HomeScreenNavigationTypes";
import {
  adjustSizeToResolveZoomInIssue,
  getResposiveBoxSize,
} from "../utils/Helper";
import { SCREEN_TYPE } from "./navigator.utils"; // Adjust path if needed
import { getAnimationAssets } from "../AssetsMapping/AssetMap";
import { useScaleAnimation } from "../hooks/useScaleAnimation";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");

// How long the fly-out open/close animation takes. Kept short and
// deterministic (timing, not spring) so the buttons land — and become
// reliably tappable — quickly instead of settling slowly via physics.
const OPEN_DURATION = 220;
const CLOSE_DURATION = 150;

// --- ISOLATED COMPONENT FOR STANDARD TABS ---
const StandardTabItem = ({
  item,
  isActive,
  boxSize,
  hSpacingPx,
  onPress,
}: any) => {
  const { scaleValue, handlePressIn, handlePressOut } = useScaleAnimation();

  return (
    <Pressable
      width={boxSize}
      height={boxSize}
      marginX={hSpacingPx * 0.5}
      justifyContent={"center"}
      alignItems={"center"}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      borderRadius={"full"} // <-- FIX 1: Keeps the press ripple effect circular
      onPress={onPress}
      _pressed={{ opacity: 0.8, bg: "rgba(161, 148, 231, 0.1)" }}
    >
      <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
        <VStack
          width={boxSize}
          height={boxSize}
          alignItems={"center"}
          justifyContent={"center"}
          space={1}
          bg={isActive ? "rgba(91, 63, 255, 0.1)" : "transparent"}
          borderRadius={"full"} // <-- FIX 2: Makes the active background a perfect circle
          overflow={"hidden"}
        >
          <Icon
            as={item.iconType}
            name={isActive ? (item.activeIcon as any) : (item.icon as any)}
            size={adjustSizeToResolveZoomInIssue(boxSize * 0.42)}
            color={isActive ? "#5B3FFF" : "#A0A0AB"}
          />
          {isActive && (
            <Box
              w={adjustSizeToResolveZoomInIssue(boxSize * 0.09)}
              h={adjustSizeToResolveZoomInIssue(boxSize * 0.09)}
              borderRadius={"full"}
              bg={"#5B3FFF"}
              mt={"2px"}
            />
          )}
        </VStack>
      </Animated.View>
    </Pressable>
  );
};
const HomeScreenNavigation = ({
  currentScreenName,
  containerHeight,
  containerWidth,
  onChangeScreen,
}: {
  currentScreenName: SCREEN_TYPE;
  containerHeight: number;
  containerWidth: number;
  onChangeScreen: (screen: SCREEN_TYPE) => void;
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const rotateAnim = useRef(new Animated.Value(0)).current;
  const colorAnim = useRef(new Animated.Value(0)).current;
  const lottieRef = useRef<LottieView>(null);

  useEffect(() => {
    if (isMenuOpen) {
      lottieRef.current?.reset();
      lottieRef.current?.pause();
      return;
    }
    lottieRef.current?.resume();
  }, [isMenuOpen]);

  useEffect(() => {
    // if (currentScreenName !== "DASHBOARD_SCREEN" && isMenuOpen) {
    resetMenuInstantly();
    // }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentScreenName]);

  // Closes the menu immediately with no animation, and — critically —
  // stops any in-flight open/close animation first. Without stopAnimation(),
  // a spring/timing started by a previous toggle can still be mid-flight and
  // will overwrite this setValue() on its very next frame, which is exactly
  // what caused the button to look "stuck" halfway open/closed.
  const resetMenuInstantly = () => {
    rotateAnim.stopAnimation();
    colorAnim.stopAnimation();
    rotateAnim.setValue(0);
    colorAnim.setValue(0);
    setIsMenuOpen(false);
  };

  const handleToggleMenu = () => {
    const opening = !isMenuOpen;
    const toValue = opening ? 1 : 0;
    setIsMenuOpen(opening);

    // stopAnimation() first so a tap that interrupts an in-flight animation
    // (e.g. tapping the FAB again before it's finished opening) reliably
    // reverses from wherever it currently is, instead of the old animation
    // continuing to drive the value out from under the new one.
    rotateAnim.stopAnimation(() => {
      Animated.timing(rotateAnim, {
        toValue,
        duration: opening ? OPEN_DURATION : CLOSE_DURATION,
        easing: opening
          ? Easing.out(Easing.back(1.2))
          : Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });

    colorAnim.stopAnimation(() => {
      Animated.timing(colorAnim, {
        toValue,
        duration: opening ? OPEN_DURATION : CLOSE_DURATION,
        easing: Easing.linear,
        useNativeDriver: false,
      }).start();
    });
  };

  const baseSize = Math.min(containerHeight, containerWidth);

  const { boxHeight, boxSize, hSpacingPx } = getResposiveBoxSize({
    containerHeight: containerHeight,
    containerWidth: containerWidth,
    numCols: 5,
    numRows: 1,
    horizontalSpacing: 0.01,
  });

  // Identify the center item outside the render cycle so we can render it absolutely
  const centerItem = HomeScreenNavigationType.find(
    (item) => item.isCenterButton,
  );
  // Center button (and its Create Task / Create Project fly-out) is now
  // always shown on every screen, not just the dashboard.
  const showCenterButton = true;

  // --- HELPER: RENDER CENTER BUTTON (Now removed from FlatList margins) ---
  const renderCenterButton = (item: any) => {
    const totalSubActions = item.subActions?.length || 0;
    const maxSpread = 130;

    return (
      <Box
        width={boxSize}
        height={boxSize}
        justifyContent={"center"}
        alignItems={"center"}
      >
        <Box
          position={"absolute"}
          top={-40}
          width={boxSize}
          height={boxSize}
          justifyContent={"center"}
          alignItems={"center"}
          zIndex={10}
          // Android: elevation controls paint/touch order between siblings,
          // zIndex alone is not enough. Keep this above the nav bar's own
          // elevation (12) at all times so the fly-out is never buried
          // beneath it.
          style={{ elevation: 16 }}
        >
          <Animated.View
            style={{
              position: "absolute",
              alignItems: "center",
              justifyContent: "center",
              zIndex: isMenuOpen ? 20 : 1,
              // Bump elevation above the FAB itself while open, so the
              // sub-action buttons win touch priority over the FAB in the
              // small window where they still visually overlap it early in
              // the animation.
              elevation: isMenuOpen ? 20 : 1,
              pointerEvents: isMenuOpen ? "auto" : "none",
            }}
          >
            {item.subActions?.map((action: any, index: number) => {
              const offsetX =
                totalSubActions <= 1
                  ? 0
                  : -65 + index * (maxSpread / (totalSubActions - 1));

              return (
                <Animated.View
                  key={action.label}
                  style={{
                    position: "absolute",
                    alignItems: "center",
                    transform: [
                      {
                        translateX: rotateAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, offsetX],
                        }),
                      },
                      {
                        translateY: rotateAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, -75],
                        }),
                      },
                      {
                        scale: rotateAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 1],
                          extrapolate: "clamp",
                        }),
                      },
                    ],
                    opacity: rotateAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 1],
                      extrapolate: "clamp",
                    }),
                  }}
                >
                  <TouchableOpacity
                    activeOpacity={0.8}
                    // Generous hitSlop so a tap that lands slightly outside
                    // the icon's own bounds — very likely mid-animation,
                    // while it's still travelling toward its resting spot
                    // — still registers.
                    hitSlop={{ top: 24, bottom: 24, left: 24, right: 24 }}
                    onPress={() => {
                      resetMenuInstantly();
                      onChangeScreen(action.screenType as SCREEN_TYPE);
                    }}
                  >
                    <VStack alignItems={"center"} space={1}>
                      <Box
                        borderRadius={"full"}
                        bg={"white"}
                        justifyContent={"center"}
                        alignItems={"center"}
                        padding={baseSize * 0.15}
                        shadow={5}
                        style={{
                          shadowColor: "#5B3FFF",
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: 0.2,
                          shadowRadius: 8,
                          elevation: 20,
                        }}
                      >
                        <Icon
                          as={action.iconType}
                          name={action.icon as any}
                          size={baseSize * 0.35}
                          color={"#5B3FFF"}
                        />
                      </Box>
                      <Box bg={"#2D2D2D"} px={2} py={1} borderRadius={12}>
                        <Text
                          fontSize={baseSize * 0.12}
                          fontWeight={"bold"}
                          color={"white"}
                        >
                          {action.label}
                        </Text>
                      </Box>
                    </VStack>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </Animated.View>

          {/* MAIN FAB BUTTON */}
          <Animated.View style={{ zIndex: 5, elevation: 5 }}>
            <TouchableOpacity activeOpacity={0.9} onPress={handleToggleMenu}>
              <Box
                width={adjustSizeToResolveZoomInIssue(containerWidth * 0.2)}
                height={adjustSizeToResolveZoomInIssue(containerWidth * 0.2)}
                borderRadius={"full"}
                backgroundColor={"white"}
                justifyContent={"center"}
                alignItems={"center"}
                shadow={1}
              >
                <LottieView
                  ref={lottieRef}
                  source={getAnimationAssets("CENTER_BUTTON")}
                  autoPlay={true}
                  loop={true}
                  style={{ width: "100%", height: "100%" }}
                />
              </Box>
            </TouchableOpacity>
          </Animated.View>
        </Box>
      </Box>
    );
  };

  // --- FLATLIST RENDER ITEM ---
  const renderItem = ({ item }: { item: any }) => {
    const isActive = currentScreenName === item.screen;
    const isCenterButton = item?.isCenterButton;

    if (isCenterButton) {
      // TRICK: We always return an EMPTY box here to preserve the spacing in the FlatList.
      // We will render the actual center button absolutely on top of the list so it doesn't get clipped.
      return (
        <Box width={boxSize} height={boxSize} marginX={hSpacingPx * 0.5} />
      );
    }

    return (
      <StandardTabItem
        item={item}
        isActive={isActive}
        boxSize={boxSize}
        hSpacingPx={hSpacingPx}
        onPress={() => {
          if (isMenuOpen) resetMenuInstantly();
          onChangeScreen(item.screen as SCREEN_TYPE);
        }}
      />
    );
  };

  return (
    containerHeight &&
    containerWidth &&
    baseSize &&
    boxHeight > 1 && (
      <Box
        position={"absolute"}
        bottom={0}
        left={0}
        right={0}
        alignItems={"center"}
        bg={"transparent"}
        overflow={"visible"}
      >
        {isMenuOpen && (
          // Full-screen backdrop above the nav bar: tapping anywhere out
          // here closes the menu instantly (no lingering half-open state).
          <Pressable
            onPress={resetMenuInstantly}
            style={{
              position: "absolute",
              bottom: containerHeight,
              left: 0,
              width: SCREEN_WIDTH,
              height: Math.max(SCREEN_HEIGHT - containerHeight, 0),
              zIndex: 8,
              elevation: 8,
            }}
          />
        )}

        {/* 1. THE FLATLIST (Handles the background and standard items) */}
        <Box
          height={containerHeight}
          width={containerWidth}
          bg={"white"}
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.18,
            shadowRadius: 10,
            elevation: 12,
          }}
        >
          <FlatList
            data={HomeScreenNavigationType}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            horizontal={true}
            scrollEnabled={false}
            contentContainerStyle={{
              flex: 1,
              justifyContent: "space-between",
              alignItems: "center",
              paddingHorizontal: 16,
              paddingBottom: 8,
            }}
          />
        </Box>

        {/* 2. THE FLOATING CENTER BUTTON (Overlayed on top so it doesn't get clipped) */}
        {showCenterButton && centerItem && (
          <Box
            position="absolute"
            bottom={0}
            left={0}
            right={0}
            height={containerHeight}
            alignItems="center"
            justifyContent="center"
            pointerEvents="box-none" // Essential: lets taps pass through the empty space around the button
            zIndex={99}
            // Must beat the FlatList Box's elevation (12) or Android will
            // paint/hit-test the nav bar above this overlay regardless of
            // zIndex, making the FAB and its fly-out untappable.
            style={{ elevation: 24 }}
          >
            {renderCenterButton(centerItem)}
          </Box>
        )}
      </Box>
    )
  );
};

export default HomeScreenNavigation;
