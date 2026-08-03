import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
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
import { API_BASE_URL } from "@env";
import { Text, TextInput } from "react-native";

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
        // MUST come after origin.props to force the override
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
        // MUST come after origin.props to force the override for TextInput
        allowFontScaling: false,
        maxFontSizeMultiplier: 1,
      });
    };
    (TextInput as any).__fontScalePatched = true;
  }
};

disableFontScalingGlobally();

// NativeBase Failsafes
// ✅ FIX: Moved from `baseStyle` to `defaultProps`.
// Native props like allowFontScaling only get passed down via defaultProps.
const customTheme = extendTheme({
  components: {
    Text: {
      defaultProps: {
        allowFontScaling: false,
        maxFontSizeMultiplier: 1,
      },
    },
    Heading: {
      defaultProps: {
        allowFontScaling: false,
        maxFontSizeMultiplier: 1,
      },
    },
    Input: {
      defaultProps: {
        allowFontScaling: false,
        maxFontSizeMultiplier: 1,
      },
    },
  },
});

export default function App() {
  useNetworkManager();

  useEffect(() => {
    configureGoogleSignIn();

    const unsubscribe = subscribeToAuthState((currentUser: any) => {
  
    });

    return () => unsubscribe();
  }, []);

  return (
    <Provider store={store}>
      <KeyboardProvider>
        <NativeBaseProvider theme={customTheme}>
          <AppContainer>
            <ApplicationNavigation />
          </AppContainer>
          <StatusBar hidden />
        </NativeBaseProvider>
      </KeyboardProvider>
    </Provider>
  );
}
