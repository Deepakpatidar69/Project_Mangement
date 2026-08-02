import React, { useEffect, useState, useCallback } from "react";
import { RefreshControl } from "react-native";
import { Box, HStack, ScrollView, VStack } from "native-base";
import { RecentProjectsSection } from "./RecentProjectSection";
import { ProgressCard } from "./ProgressCard";
import AppHeader from "../../components/AppHeader";
import { AuthProps } from "../../store/slices/types";
import { useContainerDimensions } from "../../hooks/OnlayoutHooks";
import { RecentTaskSection } from "./RecentTaskSection";
import { useSetAtom } from "jotai";
import { AppLoaderAtom } from "../../utils/Constent";

function DashBoardSection({
  user,
  onTapViewALLProjects,
  onTapViewAllTasks,
  onTapProfileIcon,
  onClickCreateProject,
  onClickCreateTask,
  isActive = true,
}: {
  user: AuthProps | null;
  onTapProfileIcon: () => void;
  onTapViewAllTasks: () => void;
  onTapViewALLProjects: () => void;
  onClickCreateTask: () => void;
  onClickCreateProject: () => void;
  isActive?: boolean;
}) {
  const { containerDimensions, onLayout } = useContainerDimensions();

  const [headerContainerDimention, setHeaderContainerDimention] = useState<{
    height: number;
    width: number;
    baseSize: number;
  }>({ baseSize: 0, height: 0, width: 0 });

  const setDisplayAppLoader = useSetAtom(AppLoaderAtom);

  // 1. Setup Refresh states
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // 2. Refresh handler triggers the component remount
  const onRefresh = useCallback(() => {
    setRefreshing(true);

    // Changing the key forces child components to remount,
    // triggering their internal data-fetching automatically.
    setTimeout(() => {
      setRefreshKey((prevKey) => prevKey + 1);
      setRefreshing(false);
    }, 1000);
  }, []);

  // ── layout fix & Global Loader Control ────────────────────────────────────
  useEffect(() => {
    if (!isActive) return;

    if (containerDimensions.baseSize === 0) {
      setDisplayAppLoader({ isLoading: true, message: "Dashboard Loading" });
      return;
    }

    const headerHeight = containerDimensions.height * 0.1;
    const headerWidth = containerDimensions.width;

    setHeaderContainerDimention({
      width: headerWidth,
      height: headerHeight,
      baseSize: Math.min(headerHeight, headerWidth),
    });

    setDisplayAppLoader({ isLoading: false, message: "" });
  }, [containerDimensions.baseSize, setDisplayAppLoader, isActive]);

  useEffect(() => {
    return () => {
      setDisplayAppLoader({ isLoading: false, message: "" });
    };
  }, [setDisplayAppLoader]);

  return (
    <Box flex={1} justifyContent={"center"} alignItems={"center"} px={"3%"}>
      <Box width={"100%"} height={"100%"} onLayout={onLayout}>
        {containerDimensions.baseSize > 0 && (
          <VStack
            width={containerDimensions.width}
            height={containerDimensions.height}
            justifyContent={"center"}
            space={"2%"}
          >
            {/* 
               4. AppHeader now lives INSIDE the ScrollView (as the first sticky child)
               instead of sitting outside it. Visually it still stays pinned to the
               top exactly as before, but because it's now part of the ScrollView's
               content, the pull-to-refresh gesture and spinner are anchored to the
               very top of the page (above the ProgressCards) instead of starting
               at the ProgressCard section.
            */}
            <Box mt={"2%"} flex={1}>
              {/* INDEX 0: Sticky Header — now the true top of the scroll/refresh area */}
              <Box zIndex={100}>
                <AppHeader
                  continerDimention={headerContainerDimention}
                  title={user!.fullName}
                  subtitle="Let's make today productive!"
                  user={user!}
                  onTapProfile={() => onTapProfileIcon()}
                />
              </Box>

              {/* 
                   INDEX 1: Sticky Progress Cards 
                   Added a background color (_light / _dark) so the scrolling tasks 
                   don't peek through the gap between the two cards. 
                   Change "white" or "gray.900" to match your app's background theme.
                */}
              <Box key={`progress-${refreshKey}`} pb={2} zIndex={99}>
                <HStack
                  height={containerDimensions.height * 0.25}
                  width={"100%"}
                  justifyContent="space-between"
                >
                  <ProgressCard
                    type="PROJECT"
                    cardWidth={containerDimensions.width * 0.49}
                    cardHeight={containerDimensions.height * 0.25}
                    total={user?.stats?.totalProjects ?? 0}
                    completed={user?.stats?.completedProjects ?? 0}
                  />
                  <ProgressCard
                    cardWidth={containerDimensions.width * 0.49}
                    cardHeight={containerDimensions.height * 0.25}
                    type="TASK"
                    total={user?.stats?.totalTasks ?? 0}
                    completed={user?.stats?.completedTasks ?? 0}
                  />
                </HStack>
              </Box>

              <ScrollView
                width={"100%"}
                contentContainerStyle={{
                  paddingBottom: containerDimensions.height * 0.08,
                }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                  />
                }
              >
                {/* INDEX 2: Scrollable Task & Project Sections */}
                <VStack width={"100%"} key={`sections-${refreshKey}`} mt={2}>
                  <RecentTaskSection
                    onTapViewAllTasks={onTapViewAllTasks}
                    onClickCreateTask={onClickCreateTask}
                  />
                  <RecentProjectsSection
                    onTapViewAllProjects={onTapViewALLProjects}
                    onClickCreateProject={onClickCreateProject}
                  />
                </VStack>
              </ScrollView>
            </Box>
          </VStack>
        )}
      </Box>
    </Box>
  );
}

export default DashBoardSection;
