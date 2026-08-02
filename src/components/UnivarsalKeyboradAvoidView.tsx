import React from "react";
import { Platform, StyleSheet } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

interface KeyboardWrapperProps {
  children: React.ReactNode;
}

export const KeyboardWrapper = ({ children }: KeyboardWrapperProps) => {
  return (
    <KeyboardAwareScrollView
      style={styles.container}
      // flexGrow ensures the content fills the screen when the keyboard is closed
      contentContainerStyle={styles.contentContainer}
      // Forces Android to actually use the library's math instead of the OS default
      enableOnAndroid={true}
      // Pushes the input an extra 100 pixels above the keyboard so it isn't cramped
      extraHeight={100}
      // Closes the keyboard if the user taps anywhere outside the text input
      keyboardShouldPersistTaps="handled"
      // Prevents the screen from jumping weirdly on iOS
      enableAutomaticScroll={Platform.OS === "ios"}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </KeyboardAwareScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff", // Change this to match your app's background
  },
  contentContainer: {
    flexGrow: 1,
  },
});
