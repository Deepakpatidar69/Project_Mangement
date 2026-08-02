export enum NavigatorEnum {
  Auth_Screen = "AuthScreen",
  Home_Screen = "HomeScreen",
  Project_Screen = "ProjectScreen",
  Private_Task_Screen = "PrivateTaskScreen",
}

export type SCREEN_TYPE =
  | "DASHBOARD_SCREEN"
  | "CREATE_TASK_SCREEN"
  | "PRIVATE_TASK_SCREEN"
  | "PROJECT_SCREEN"
  | "PROFILE_SCREEN"
  | "CREATE_PROJECT"
  | "ProjectTaskScreen"
  | "Change Password";

// Routing/RouteStackProps.ts

import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { ProjectProps } from "../store/slices/types";

/**
 * All screens and their route parameters.
 * If a screen does not require params, use `undefined`.
 */
export type RouteStackParamStack = {
  // =========================
  // Auth Screens
  // =========================
  AuthScreen: undefined;
  LoginScreen: undefined;
  SignupScreen: undefined;
  HomeScreen: undefined;
  CreateProjectScreen: {
    onBack: () => void;
  };
  CreateTaskScreen: {
    taskType: "PROJECT" | "TASK";
    project?: ProjectProps;
    onBack: () => void;
  };
  ProjectDetail: {
    projectId: string;
  };
  TaskDetail: {
    taskId: string;
    projectId?: string;
  };
  ProjectTaskList: {
    projectId: string;
  };
  MessageListScreen: {
    type: "PROJECT" | "TASK" | "PROJECT_TASK";
    loginUserRole: "ADMIN" | "EDITOR" | "VIEWER" | "CREATOR";
    taskId?: string;
    projectId?: string;
  };
  ChangePasswordScreen: undefined;
  ForgotPasswordScreen: undefined;
  TransferOwnerShipScreen: undefined;
  DeleteAccountScreen: undefined;
};

// ======================================================
// Helpful Type Aliases
// ======================================================

/**
 * Navigation type for any screen.
 *
 * Example:
 * const navigation =
 *   useNavigation<ScreenNavigationProps<"ProjectDetail">>();
 */
export type ScreenNavigationProps<T extends keyof RouteStackParamStack> =
  NativeStackNavigationProp<RouteStackParamStack, T>;

/**
 * Route type for any screen.
 *
 * Example:
 * const route = useRoute<ScreenRouteProps<"ProjectDetail">>();
 */
export type ScreenRouteProps<T extends keyof RouteStackParamStack> = RouteProp<
  RouteStackParamStack,
  T
>;
