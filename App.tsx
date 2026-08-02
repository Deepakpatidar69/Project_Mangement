import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { NativeBaseProvider } from "native-base";
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

export default function App() {
  // 1. Initialize Network Listener
  useNetworkManager();


  useEffect(() => {
    // 2. Configure Google Sign-In globally on mount
    configureGoogleSignIn();

    // 3. Set up the Firebase auth listener
    // Note: Because your Node/Prisma backend handles the real session via loadUser(),
    // this Firebase listener is strictly for tracking Google's internal state.
    const unsubscribe = subscribeToAuthState((currentUser: any) => {
      console.log(
        "Firebase Auth State: ",
        currentUser
          ? `Logged in as ${currentUser.email}`
          : "No Firebase user signed in",
      );
    });

    // Cleanup the listener when the component unmounts
    return () => unsubscribe();
  }, []);


  console.log(`--------------------------------------------------`);
  console.log(`--------------------------------------------------`);
  console.log(`--------------------------------------------------`);
  console.log(`--------------------------------------------------`);
  console.log(`Api Base Url is for the App.tsx ::: ${API_BASE_URL}`);
  console.log(`--------------------------------------------------`);
  console.log(`--------------------------------------------------`);
  console.log(`--------------------------------------------------`);

  return (
    <Provider store={store}>
      <KeyboardProvider>
        <NativeBaseProvider>
          <AppContainer>
            <ApplicationNavigation />
          </AppContainer>
          <StatusBar hidden />
        </NativeBaseProvider>
      </KeyboardProvider>
    </Provider>
  );
}
