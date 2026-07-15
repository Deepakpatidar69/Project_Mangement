import React, { useEffect, useState } from "react";
import { Box, HStack, ScrollView, VStack } from "native-base";
import { RecentProjectsSection } from "./RecentProjectSection";
import { ProgressCard } from "./ProgressCard";
import AppHeader from "../../components/AppHeader";
import { AuthProps } from "../../store/slices/types";
import { useContainerDimensions } from "../../hooks/OnlayoutHooks";
import { RecentTaskSection } from "./RecentTaskSection";
import { useSetAtom } from "jotai";
import { AppLoaderAtom } from "../../utils/Constent"; // Ensure this path is correct

function DashBoardSection({
  user,
  onTapViewALLProjects,
  onTapViewAllTasks,
  onTapProfileIcon,
  onClickCreateProject,
  onClickCreateTask,
  isActive = true, // <-- 1. Add isActive prop
}: {
  user: AuthProps | null;
  onTapProfileIcon: () => void;
  onTapViewAllTasks: () => void;
  onTapViewALLProjects: () => void;
  onClickCreateTask: () => void;
  onClickCreateProject: () => void;
  isActive?: boolean; // <-- 1. Add isActive prop
}) {
  const { containerDimensions, onLayout } = useContainerDimensions();

  const [headerContainerDimention, setHeaderContainerDimention] = useState<{
    height: number;
    width: number;
    baseSize: number;
  }>({ baseSize: 0, height: 0, width: 0 });

  // 2. Initialize the global loader setter
  const setDisplayAppLoader = useSetAtom(AppLoaderAtom);

  // ── layout fix & Global Loader Control ────────────────────────────────────
  useEffect(() => {
    // 3. STOP if this screen is hiding in the background
    if (!isActive) return;

    // Show loader if dimensions are not yet calculated
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

    // Hide global loader once calculated
    setDisplayAppLoader({ isLoading: false, message: "" });
  }, [containerDimensions.baseSize, setDisplayAppLoader, isActive]);

  // Failsafe cleanup
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
            <AppHeader
              continerDimention={headerContainerDimention}
              title={user!.fullName}
              subtitle="Let's make today productive!"
              user={user!}
              onTapProfile={() => onTapProfileIcon()}
            />

            {/* 2. Progress Cards Row */}
            <HStack
              height={"25%"}
              width={"100%"}
              bg={"transparent"}
              justifyContent="space-between"
              space={"2%"}
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

            <Box mt={"2%"} flex={1}>
              <ScrollView
                width={"100%"}
                contentContainerStyle={{
                  paddingBottom: containerDimensions.height * 0.08,
                }}
              >
                <VStack width={"100%"}>
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
