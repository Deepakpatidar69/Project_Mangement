// src/utils/authUtils.js
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import auth from "@react-native-firebase/auth";
import { AppDispatch } from "../store";
import { googleAuthUser } from "../store/slices/authSlice";

/**
 * Configure Google Sign-In.
 * Call this once when your app starts.
 */
export const configureGoogleSignIn = () => {
  GoogleSignin.configure({
    // REMEMBER: Get this exact Web Client ID from the Firebase console -> Authentication -> Sign-in Method -> Google -> Web SDK Configuration
    webClientId: "775966853971-kdlmtm6g9p9tnb66l58t7f5jgm4jalsu.apps.googleusercontent.com",
  });
};

/**
 * Handle Google Sign-In flow
 */
export const signInWithGoogle = async (dispatch: AppDispatch) => {
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

    // 1. Capture the full response
    const response = await GoogleSignin.signIn();

    // 2. Check if the sign-in was successful
    if (response.type === "success") {
      const { idToken } = response.data;

      if (!idToken) {
        throw new Error("No ID token found in the response.");
      }

      const { accessToken } = await GoogleSignin.getTokens();
      const googleCredential = auth.GoogleAuthProvider.credential(
        idToken,
        accessToken,
      );

      // 3. Sign-in the user with Firebase
      const userCredential =
        await auth().signInWithCredential(googleCredential);
      const user = userCredential.user;


      console.log("Firebase User Info:", user.toJSON());

      // 4. Format the names exactly as your Prisma schema requires
      const fullName = user.displayName || "Google User";
      const nameParts = fullName.split(" ");
      const firstName = nameParts[0];
      const lastName =
        nameParts?.length > 1 ? nameParts.slice(1).join(" ") : null;



      // 5. Call your Redux Slice to sync with your Node/Prisma backend
      // Using .unwrap() throws an error if the backend request fails
      const backendResponse = await dispatch(
        googleAuthUser({
          email: user.email || "",
          firstName,
          lastName,
          fullName,
          googleId: user.uid, // Firebase UID
          profileImgUrl: user.photoURL || undefined,
        }),
      ).unwrap();

    

      // Return the backend data if you need it in the UI
      return backendResponse;
    } else {
      throw new Error(`Sign-in was ${response.type}`);
    }
  } catch (error) {
    console.error("Google Sign-In Error:", error);
    throw error; // Rethrow so the UI can handle the error
  }
};

/**
 * Handle Sign Out for both Firebase and Google
 */
export const signOutUser = async () => {
  try {
    await auth().signOut();
    await GoogleSignin.revokeAccess();
  } catch (error) {
    console.error("Sign Out Error:", error);
    throw error;
  }
};

/**
 * Subscribe to Firebase Auth state changes
 * @param {function} callback - Function to run when user state changes
 */
export const subscribeToAuthState = (callback : any) => {
  return auth().onAuthStateChanged(callback);
};
