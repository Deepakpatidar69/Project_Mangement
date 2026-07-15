import { useEffect, useCallback } from "react";
import { AppState, Platform, StatusBar } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import SystemNavigationBar from "react-native-system-navigation-bar";

export function useHideHardwareNavigationButton() {
  const applyHideNavigation = useCallback(async () => {
    SystemNavigationBar.navigationHide();
    StatusBar.setHidden(true, "none");

    // Android-specific navigation bar hiding
    if (Platform.OS === "android") {
      try {
        await SystemNavigationBar.stickyImmersive();
      } catch (err) {
        console.error(
          "Err At :: useHideNavigation :: useHideHardwareNavigationButton ::  setting immersive mode:",
          err,
        );
      }
    }
  }, []);

  useEffect(() => {
    applyHideNavigation();

    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        setTimeout(() => {
          applyHideNavigation();
        }, 200);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [applyHideNavigation]);

  useFocusEffect(
    useCallback(() => {
      setTimeout(applyHideNavigation, 200);
    }, [applyHideNavigation]),
  );
}
