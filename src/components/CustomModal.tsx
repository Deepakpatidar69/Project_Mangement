import React from "react";
import {
  Modal,
  View,
  TouchableWithoutFeedback,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Box } from "native-base";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function CustomModal({
  visible,
  onClose,
  children,
  height = "50%",
  width = "100%",
}: any) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* 🔥 BACKDROP */}
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>

      {/* 🔥 CONTENT */}
      <View style={styles.centerContainer}>
        <Box
          bg="white"
          borderRadius="2xl"
          p={4}
          height={typeof height === "string" ? height : height * SCREEN_HEIGHT}
          width={typeof width === "string" ? width : width * SCREEN_WIDTH}
        >
          {children}
        </Box>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
