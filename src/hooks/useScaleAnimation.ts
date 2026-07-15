import { useRef } from "react";
import { Animated } from "react-native";

export const useScaleAnimation = (pressedScale = 0.95, defaultScale = 1) => {

    const scaleValue = useRef(new Animated.Value(defaultScale)).current;

  // 2. Animate down on press in
  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: pressedScale,
      useNativeDriver: true,
      speed: 20,
      bounciness: 10,
    }).start();
  };

  // 3. Animate back up on press out
  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: defaultScale,
      useNativeDriver: true,
      speed: 20,
      bounciness: 10,
    }).start();
  };

  // Return exactly what your components need
  return { scaleValue, handlePressIn, handlePressOut };
};
