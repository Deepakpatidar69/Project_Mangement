import React, { useEffect, useRef } from "react";
import { NativeBaseProvider, extendTheme } from "native-base";
import { Provider } from "react-redux";
import { store } from "./src/store";
import ApplicationNavigation from "./src/appNavigator/Navigation";
import { AppContainer } from "./src/screens/HomeScreen/AppContainer";
import { useNetworkManager } from "./src/hooks/NetInfoManager";
import {
  configureGoogleSignIn,
  subscribeToAuthState,
} from "./src/authentation/googleSignIn.utils";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { Text, TextInput, StatusBar } from "react-native";
import SystemNavigationBar from "react-native-system-navigation-bar";
import { Platform } from "react-native";
import { useHideHardwareNavigationButton } from "./src/hooks/useHideNavigation";

/**
 * ✅ REAL FIX for device font-scaling
 */
const disableFontScalingGlobally = () => {
  // @ts-ignore
  if (Text.render && !(Text as any).__fontScalePatched) {
    // @ts-ignore
    const oldTextRender = Text.render;
    // @ts-ignore
    Text.render = function (...args: any[]) {
      const origin = oldTextRender.call(this, ...args);
      return React.cloneElement(origin, {
        ...origin.props,
        allowFontScaling: false,
        maxFontSizeMultiplier: 1,
      });
    };
    (Text as any).__fontScalePatched = true;
  }

  // @ts-ignore
  if (TextInput.render && !(TextInput as any).__fontScalePatched) {
    // @ts-ignore
    const oldInputRender = TextInput.render;
    // @ts-ignore
    TextInput.render = function (...args: any[]) {
      const origin = oldInputRender.call(this, ...args);
      return React.cloneElement(origin, {
        ...origin.props,
        allowFontScaling: false,
        maxFontSizeMultiplier: 1,
      });
    };
    (TextInput as any).__fontScalePatched = true;
  }
};

disableFontScalingGlobally();

const customTheme = extendTheme({
  components: {
    Text: {
      defaultProps: { allowFontScaling: false, maxFontSizeMultiplier: 1 },
    },
    Heading: {
      defaultProps: { allowFontScaling: false, maxFontSizeMultiplier: 1 },
    },
    Input: {
      defaultProps: { allowFontScaling: false, maxFontSizeMultiplier: 1 },
    },
  },
});

export default function App() {
  useNetworkManager();

  // ✅ Single global call — handles launch, app-foreground, and keyboard events
  useHideHardwareNavigationButton();

  const reapplyHideNav = async () => {
    StatusBar.setHidden(true, "none");
    if (Platform.OS === "android") {
      try {
        await SystemNavigationBar.stickyImmersive();
      } catch (error) {
        console.log("Error setting immersive mode on nav change:", error);
      }
    }
  };

  useEffect(() => {
    configureGoogleSignIn();
    const unsubscribe = subscribeToAuthState((currentUser: any) => {});
    return () => unsubscribe();
  }, []);

  return (
    <Provider store={store}>
      <KeyboardProvider>
        <NativeBaseProvider theme={customTheme}>
          <AppContainer>

            <ApplicationNavigation onNavigationStateChange={reapplyHideNav} />
          </AppContainer>
        </NativeBaseProvider>
      </KeyboardProvider>
    </Provider>
  );
}
