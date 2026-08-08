import { useEffect, useCallback } from "react";
import { AppState, Platform, StatusBar, Keyboard } from "react-native";
import SystemNavigationBar from "react-native-system-navigation-bar";

export function useHideHardwareNavigationButton() {
  const applyHideNavigation = useCallback(async () => {
    StatusBar.setHidden(true, "none");
    if (Platform.OS === "android") {
      try {
        await SystemNavigationBar.stickyImmersive();
      } catch (error) {
        console.log("Error setting immersive mode:", error);
      }
    }
  }, []);

  useEffect(() => {
    // Hide immediately on app launch
    applyHideNavigation();

    // Re-hide when app comes back from background
    const appStateSub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        setTimeout(applyHideNavigation, 200);
      }
    });

    // Android kicks the app out of immersive mode when the
    // keyboard opens — re-apply once it's shown and again once it closes
    const keyboardShowSub = Keyboard.addListener("keyboardDidShow", () => {
      setTimeout(applyHideNavigation, 200);
    });
    const keyboardHideSub = Keyboard.addListener("keyboardDidHide", () => {
      setTimeout(applyHideNavigation, 200);
    });

    return () => {
      appStateSub.remove();
      keyboardShowSub.remove();
      keyboardHideSub.remove();
    };
  }, [applyHideNavigation]);
}
