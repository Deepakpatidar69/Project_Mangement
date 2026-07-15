import auth from "@react-native-firebase/auth";
import { AppDispatch } from "../store";
import { githubAuthUser } from "../store/slices/authSlice";
import { authorize } from "react-native-app-auth";

const githubOAuthConfig = {
  clientId: "Ov23lilj7XyeemaGdiHE",
  redirectUrl: "https://project-manager-cc11f.firebaseapp.com/__/auth/handler", // must match your GitHub OAuth App settings
  scopes: ["read:user", "user:email"],
  serviceConfiguration: {
    authorizationEndpoint: "https://github.com/login/oauth/authorize",
    tokenEndpoint: "https://github.com/login/oauth/access_token",
  },
};

export const getGithubAccessToken = async (): Promise<string | null> => {
  try {
    const result = await authorize(githubOAuthConfig);
    return result.accessToken;
  } catch (err) {
    console.log("GitHub OAuth cancelled or failed:", err);
    return null;
  }
};

export const signInWithGithub = async (
  dispatch: AppDispatch,
  githubAccessToken: string, // You must pass the token obtained from your OAuth flow
) => {
  try {
    // 1. Create a Firebase credential with the GitHub token
    const githubCredential =
      auth.GithubAuthProvider.credential(githubAccessToken);

    // 2. Sign-in the user with Firebase
    const userCredential = await auth().signInWithCredential(githubCredential);
    const user = userCredential.user;

    // 3. Format the names (GitHub users often only have a username)
    const fullName = user.displayName || "GitHub User";
    const nameParts = fullName.split(" ");
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : null;

    // 4. Handle GitHub's private email feature
    // If a user hides their email on GitHub, Firebase might return null.
    const email = user.email || `${user.uid}@github-private.local`;

    // 5. Call your Redux Slice to sync with your Node/Prisma backend
    const backendResponse = await dispatch(
      githubAuthUser({
        email,
        firstName,
        lastName,
        fullName,
        githubId: user.uid, // Firebase UID acts as the unique GitHub ID
        profileImgUrl: user.photoURL || undefined,
      }),
    ).unwrap();

    return backendResponse;
  } catch (error) {
    console.error("GitHub Sign-In Error:", error);
    throw error; // Rethrow so the UI can handle the error
  }
};
