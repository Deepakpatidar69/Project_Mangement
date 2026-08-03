import auth from "@react-native-firebase/auth";
import { authorize } from "react-native-app-auth";
import { githubAuthUser } from "../store/slices/authSlice";
import { AppDispatch } from "../store";

const githubAuthConfig = {
  redirectUrl: process.env.GITHUB_REDIRECT_URL || "projectmanager://oauth", // TODO :: change for release build
  clientId: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  scopes: ["user", "user:email"],
  serviceConfiguration: {
    authorizationEndpoint: "https://github.com/login/oauth/authorize",
    tokenEndpoint: "https://github.com/login/oauth/access_token",
    revocationEndpoint: `https://github.com/settings/connections/applications/${process.env.GITHUB_CLIENT_ID}`,
  },
};

type GithubEmail = {
  email: string;
  primary: boolean;
  verified: boolean;
  visibility: string | null;
};

/**
 * GitHub doesn't always return an email on the /user endpoint
 * (e.g. if the user has "Keep my email address private" enabled).
 * This hits /user/emails directly using the access token to get
 * the actual primary + verified email.
 */
const fetchGithubPrimaryEmail = async (
  accessToken: string,
): Promise<string | null> => {
  try {
    const response = await fetch("https://api.github.com/user/emails", {
      headers: {
        Authorization: `token ${accessToken}`,
        Accept: "application/vnd.github+json",
      },
    });

    if (!response.ok) {
      console.warn("Failed to fetch GitHub emails:", response.status);
      return null;
    }

    const emails: GithubEmail[] = await response.json();

    // Prefer the primary + verified email, fall back to any verified one
    const primaryEmail = emails.find((e) => e.primary && e.verified);
    const anyVerifiedEmail = emails.find((e) => e.verified);

    return primaryEmail?.email || anyVerifiedEmail?.email || null;
  } catch (err) {
    console.error("Error fetching GitHub emails:", err);
    return null;
  }
};

/**
 * Handle GitHub Sign-In flow
 */
export const signInWithGitHub = async (dispatch: AppDispatch) => {
  try {
    // 1. Open the browser to the GitHub login page.
    const authState = await authorize(githubAuthConfig);

    // 2. Wrap the token for Firebase
    const githubCredential = auth.GithubAuthProvider.credential(
      authState.accessToken,
    );

    // 3. Authenticate with Firebase
    const userCredential = await auth().signInWithCredential(githubCredential);
    const user = userCredential.user;


    // 4. If Firebase/GitHub didn't give us an email, fetch it directly
    let email = user.email;
    if (!email) {
      email = await fetchGithubPrimaryEmail(authState.accessToken);
    }

    // 5. Format the names exactly as your Prisma schema requires
    const fallbackName = email ? email.split("@")[0] : "GitHub User";
    const fullName = user.displayName || fallbackName;
    const nameParts = fullName.split(" ");
    const firstName = nameParts[0];
    const lastName =
      nameParts?.length > 1 ? nameParts.slice(1).join(" ") : null;

    // 6. Call your Redux Slice to sync with your Node/Prisma backend
    const backendResponse = await dispatch(
      githubAuthUser({
        email: email || "",
        firstName,
        lastName,
        fullName,
        githubId: user.uid,
        profileImgUrl: user.photoURL || undefined,
      }),
    ).unwrap();

    return backendResponse;
  } catch (error: any) {
    if (
      error?.message?.includes("User cancelled flow") ||
      error?.message?.includes("User cancelled")
    ) {
      console.log("GitHub Sign-In: User cancelled the flow.");
      return null;
    }
    console.error("GitHub Sign-In Error:", error);
    throw error;
  }
};
