import React, { useEffect, useState } from "react";
import { Box, Text, View, Pressable } from "native-base";
import HomeScreenNavigation from "../../appNavigator/HomeScreenNavigation";
import { useContainerDimensions } from "../../hooks/OnlayoutHooks";
import {
  adjustSizeToResolveZoomInIssue,
  getInsetTop,
} from "../../utils/Helper";
import { useDispatch, useSelector } from "react-redux";
import { useAtom } from "jotai";
import { AppDispatch, RootState } from "../../store";
import {
  RouteStackParamStack,
  SCREEN_TYPE,
} from "../../appNavigator/navigator.utils";
import TaskList from "../tasks/TaskList";
import DashBoardSection from "./DashBoardSection";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import ProjectList from "../projects/ProjectLists";
import { AuthProps } from "../../store/slices/types";
import { clearAuthError } from "../../store/slices/authSlice";
import { isDisplayErrorMessageAtom } from "../../utils/Constent"; // adjust path to where you defined this atom
import UserProfile from "./ProfileScreen";
import { onLogoutUser } from "../auth/auth.utils";
import { useHideHardwareNavigationButton } from "../../hooks/useHideNavigation";

export default function NewHomeScreen() {
  const dispatch = useDispatch<AppDispatch>();

  const { containerDimensions, onLayout } = useContainerDimensions();

  const navigation =
    useNavigation<NativeStackNavigationProp<RouteStackParamStack>>();

        useHideHardwareNavigationButton();


  const { user, error } = useSelector((state: RootState) => state.auth);
  const loginUser = user as AuthProps | null;

  // Global error modal state (read + write, since this is the page that renders it)
  const [errorModal, setErrorModal] = useAtom(isDisplayErrorMessageAtom);

  const [navigationComponentSize, setNavigationComponentSize] = useState<{
    height: number;
    width: number;
  }>({ height: 0, width: 0 });

  const [currentScreen, setScreenName] =
    useState<SCREEN_TYPE>("DASHBOARD_SCREEN");

  // Track which screens have been mounted so we don't unmount them later (preserves state)
  const [visitedScreens, setVisitedScreens] = useState<SCREEN_TYPE[]>([
    "DASHBOARD_SCREEN",
  ]);

  const onChangeScreen = (screen: SCREEN_TYPE) => {
    console.log(`Screen is :: ${screen}`);
    if (screen == "CREATE_TASK_SCREEN") {
      navigation.navigate("CreateTaskScreen", {
        taskType: "TASK",
        onBack: () => {
          navigation.goBack();
        },
      });
    } else if (screen == "CREATE_PROJECT") {
      navigation.navigate("CreateProjectScreen", {
        onBack: () => navigation.goBack(),
      });
    } else {
      setScreenName(screen);
      // Add to visited screens if it's not already there
      if (!visitedScreens.includes(screen)) {
        setVisitedScreens((prev) => [...prev, screen]);
      }
    }
  };

  useEffect(() => {
    if (containerDimensions.baseSize == 0) return;

    const navigatiopnCompoHeight = adjustSizeToResolveZoomInIssue(
      containerDimensions.height * 0.1,
    );

    const navigatiopnCompoWidth = containerDimensions.width;

    setNavigationComponentSize({
      height: navigatiopnCompoHeight,
      width: navigatiopnCompoWidth,
    });
  }, [containerDimensions]);

  // ── Show the same global error modal for auth errors (e.g. session issues) ─
  useEffect(() => {
    if (!error.loadUserError) return;

    setErrorModal((prev) => ({
      ...prev,
      isModalOpen: true,
      title: "Something went wrong",
      subTitle:
        typeof error.loadUserError === "string"
          ? error.loadUserError
          : ((error.loadUserError as any)?.message ??
            "Please try again, later some time."),
      onClickLeftButton: () => {
        dispatch(clearAuthError());
      },
    }));
  }, [error, setErrorModal]);


  return (
    <View width={"100%"} height={"100%"} bg={"#F8F8FA"}>
      <Box width={"100%"} height={"100%"} onLayout={onLayout}>
        {containerDimensions.baseSize > 0 && (
          <Box
            pt={currentScreen === "PROFILE_SCREEN" ? undefined : getInsetTop()}
            width={containerDimensions.width}
            height={containerDimensions.height}
            bg={"#F8F8FA"}
          >

            {/* DASHBOARD SCREEN - Renders only if visited, hides if not active */}
            {visitedScreens.includes("DASHBOARD_SCREEN") && (
              <Box
                display={currentScreen === "DASHBOARD_SCREEN" ? "flex" : "none"}
                flex={1}
              >
                <DashBoardSection
                  onTapProfileIcon={() => onChangeScreen("PROFILE_SCREEN")}
                  onTapViewAllTasks={() =>
                    onChangeScreen("PRIVATE_TASK_SCREEN")
                  }
                  onTapViewALLProjects={() => onChangeScreen("PROJECT_SCREEN")}
                  onClickCreateTask={() => onChangeScreen("CREATE_TASK_SCREEN")}
                  onClickCreateProject={() => onChangeScreen("CREATE_PROJECT")}
                  user={loginUser}
                />
              </Box>
            )}

            {/* TASK LIST SCREEN - Renders only if visited, hides if not active */}
            {visitedScreens.includes("PRIVATE_TASK_SCREEN") && (
              <Box
                display={
                  currentScreen === "PRIVATE_TASK_SCREEN" ? "flex" : "none"
                }
                flex={1}
              >
                <TaskList
                  taskType="PRIVATE"
                  onTapProfile={() => onChangeScreen("PROFILE_SCREEN")}
                  onClickCreateTask={() => onChangeScreen("CREATE_TASK_SCREEN")}
                />
              </Box>
            )}

            {/* PROJECT LIST SCREEN - Renders only if visited, hides if not active */}
            {visitedScreens.includes("PROJECT_SCREEN") && (
              <Box
                display={currentScreen === "PROJECT_SCREEN" ? "flex" : "none"}
                flex={1}
              >
                <ProjectList
                  onTapProfile={() => onChangeScreen("PROFILE_SCREEN")}
                  onClickCreateProject={() => onChangeScreen("CREATE_PROJECT")}
                />
              </Box>
            )}

            {/* User Profile SCREEN - Renders only if visited, hides if not active */}
            {visitedScreens.includes("PROFILE_SCREEN") && (
              <Box
                display={currentScreen === "PROFILE_SCREEN" ? "flex" : "none"}
                flex={1}
              >
                <UserProfile
                  onTapBack={() => onChangeScreen("DASHBOARD_SCREEN")}
                  user={user}
                />
              </Box>
            )}

            {/* Bottom Navigation */}
            <Box
              width={navigationComponentSize.width}
              height={navigationComponentSize.height}
              bottom={0}
            >
              <HomeScreenNavigation
                currentScreenName={currentScreen}
                onChangeScreen={onChangeScreen}
                containerHeight={navigationComponentSize.height}
                containerWidth={navigationComponentSize.width}
              />
            </Box>
          </Box>
        )}
      </Box>
    </View>
  );
}
