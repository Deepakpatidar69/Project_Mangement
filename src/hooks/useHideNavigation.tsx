import { useEffect, useCallback } from "react";
import { AppState, Platform, StatusBar } from "react-native";
import SystemNavigationBar from "react-native-system-navigation-bar";

export function useHideHardwareNavigationButton() {
  const applyHideNavigation = useCallback(async () => {
    SystemNavigationBar.navigationHide();
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
    // 1. Hide the hardware buttons immediately when the app launches
    applyHideNavigation();

    // 2. Re-hide them if the user switches apps and comes back (foreground)
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        setTimeout(() => {
          applyHideNavigation();
        }, 200); // Small delay ensures the OS is ready to accept the command
      }
    });

    // 3. Cleanup the listener
    return () => {
      subscription.remove();
    };
  }, [applyHideNavigation]);
}
