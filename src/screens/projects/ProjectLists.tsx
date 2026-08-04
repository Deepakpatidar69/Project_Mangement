import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { FlatList, RefreshControl } from "react-native";
import { Box, VStack, HStack, Text, Icon, Pressable, View } from "native-base";
import { useDispatch, useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AppDispatch, RootState } from "../../store";
import { RouteStackParamStack } from "../../appNavigator/navigator.utils";
import { useContainerDimensions } from "../../hooks/OnlayoutHooks";
import AppHeader from "../../components/AppHeader";
import FilterTabBar from "../../components/FilterTabBar";
import { ProjectCard, THEME_CYCLE } from "./ProjectCard";
import { ProjectListSkeleton } from "./ProjectCardSkeleton";
import { ProjectProps } from "../../store/slices/types";
import { adjustSizeToResolveZoomInIssue } from "../../utils/Helper";
import {
  clearProjectError,
  fetchAssignProjects,
  fetchCreatedProject,
} from "../../store/slices/ProjectSlice";
import { FooterLoadMoreButton } from "../../components/FooterLoadMoreButton";
import ListEmptyComponent from "../../components/ListEmptyComponent";
// @ts-ignore
import LottieView from "lottie-react-native";
import { getAnimationAssets } from "../../AssetsMapping/AssetMap";
import { useSetAtom } from "jotai";
import { AppLoaderAtom } from "../../utils/Constent"; // Ensure this path is correct
import { isDisplayErrorMessageAtom } from "../../utils/Constent"; // adjust path to where you defined this atom
import { ModeTab } from "./ModeTab";

interface ProjectListProps {
  onTapProfile: () => void;
  onClickCreateProject: () => void;
  isActive?: boolean;
}

const ProjectList = ({
  onTapProfile,
  onClickCreateProject,
  isActive = true,
}: ProjectListProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation =
    useNavigation<NativeStackNavigationProp<RouteStackParamStack>>();

  // ── Layout ────────────────────────────────────────────────────────────────
  const { containerDimensions, onLayout } = useContainerDimensions();
  const [headerContainerDimention, setHeaderContainerDimention] = useState<{
    height: number;
    width: number;
    baseSize: number;
  }>({ baseSize: 0, height: 0, width: 0 });

  const [tabContainerDimention, setTabContainerDimention] = useState<{
    height: number;
    width: number;
    baseSize: number;
  }>({ baseSize: 0, height: 0, width: 0 });

  const [skeletonContainerHeight, setSkeletonContainerHeight] =
    useState<number>(0);

  const setDisplayAppLoader = useSetAtom(AppLoaderAtom);
  const setErrorModal = useSetAtom(isDisplayErrorMessageAtom);

  const cardWidth = useMemo(
    () => containerDimensions.width,
    [containerDimensions.width],
  );

  const {
    createdProjects: {
      projects: createdProjectss,
      totalCount: totalCreatedProjects,
    },
    loading,
    assignProjects: {
      projects: assignProjectss,
      totalCount: totalAssignProjects,
    },
    error,
  } = useSelector((s: RootState) => s.project);
  const { user } = useSelector((s: RootState) => s.auth);

  // ── Local state ───────────────────────────────────────────────────────────
  const [projectMode, setProjectMode] = useState<"CREATED" | "ASSIGNED">(
    "CREATED",
  );
  const [search, setSearch] = useState("");
  const [fetchType, setFetchType] = useState<
    "COMPLETED" | "IN_PROGRESS" | "ALL"
  >("ALL");

  const pageRef = useRef({ limit: 10, skip: 0 });
  const [page, setPage] = useState(0);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // ── Handle Fetching & Tab Switching ────────────────────────────────────────
  useEffect(() => {
    let isActiveFetch = true;

    const fetchAction =
      projectMode === "CREATED" ? fetchCreatedProject : fetchAssignProjects;

    dispatch(
      fetchAction({
        fetchType: fetchType === "ALL" ? undefined : fetchType,
        limit: pageRef.current.limit,
        skip: pageRef.current.skip,
      }),
    ).finally(() => {
      if (isActiveFetch) setInitialLoadDone(true);
    });

    return () => {
      isActiveFetch = false;
    };
  }, [projectMode, fetchType, page, dispatch]);

  useEffect(() => {
    if (!error) return;

    setErrorModal((prev) => ({
      ...prev,
      isModalOpen: true,
      title: "Something went wrong",
      subTitle:
        typeof error === "string"
          ? error
          : ((error as any)?.message ??
            "Unable to fetch projects. Please try again."),
      onClickLeftButton: () => {
        dispatch(clearProjectError());
      },
    }));
  }, [error, setErrorModal]);

  // ── Reset helpers ─────────────────────────────────────────────────────────
  const resetPagination = () => {
    pageRef.current = { limit: 10, skip: 0 };
    setPage(0);
  };

  const handleModeChange = (mode: "CREATED" | "ASSIGNED") => {
    if (mode === projectMode) return;
    resetPagination();
    setProjectMode(mode);
    setSearch("");
    setFetchType("ALL");
    setInitialLoadDone(false);
  };

  const handleFetchTypeChange = (ft: "COMPLETED" | "IN_PROGRESS" | "ALL") => {
    if (ft === fetchType) return;
    resetPagination();
    setFetchType(ft);
    setInitialLoadDone(false);
  };

  // ── Derived list ──────────────────────────────────────────────────────────
  const activeProjects: ProjectProps[] =
    projectMode === "CREATED"
      ? (createdProjectss ?? [])
      : (assignProjectss ?? []);

  const isLoading = loading;

  const filteredProjects = useMemo(() => {
    if (!search.trim()) return activeProjects;
    return activeProjects.filter((p) =>
      p.projectHeader.toLowerCase().includes(search.toLowerCase()),
    );
  }, [activeProjects, search]);

  // ── Font sizes ────────────────────────────────────────────────────────────
  const w = containerDimensions.width;
  const switchFontSize = adjustSizeToResolveZoomInIssue(w * 0.036);

  // ── Variables for Load More Logic ─────────────────────────────────────────
  const currentTotalCount = projectMode === "CREATED" ? totalCreatedProjects : totalAssignProjects;
  const hasMoreProjects = activeProjects.length < currentTotalCount;
  const isSearchEmpty = search.trim() === "";

  // ── PERFECTED Manual load more ────────────────────────────────────────────
  const handleLoadMore = useCallback(() => {
    if (isLoading || !hasMoreProjects) return;

    pageRef.current = {
      limit: pageRef.current.limit,
      skip: pageRef.current.skip + pageRef.current.limit,
    };
    setPage((p) => p + 1);
  }, [isLoading, hasMoreProjects]);

  // ── Pull-to-refresh handler ───────────────────────────────────────────────
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    pageRef.current = { limit: pageRef.current.limit, skip: 0 };

    const fetchAction =
      projectMode === "CREATED" ? fetchCreatedProject : fetchAssignProjects;

    try {
      await dispatch(
        fetchAction({
          fetchType: fetchType === "ALL" ? undefined : fetchType,
          limit: pageRef.current.limit,
          skip: 0,
        }),
      );
    } finally {
      setPage(0);
      setRefreshing(false);
    }
  }, [dispatch, fetchType, projectMode]);

  // ── renderItem ────────────────────────────────────────────────────────────
  const renderItem = useCallback(
    ({ item, index }: { item: ProjectProps; index: number }) => (
      <ProjectCard
        project={item}
        colorTheme={THEME_CYCLE[index % THEME_CYCLE.length]}
        width={cardWidth}
        onPress={() =>
          navigation.navigate("ProjectDetail", { projectId: item.projectId })
        }
      />
    ),
    [cardWidth, navigation],
  );

  const keyExtractor = useCallback((item: ProjectProps) => item.projectId, []);

  // ── layout fix & Global Loader Control ────────────────────────────────────
  useEffect(() => {
    if (!isActive) return;

    if (containerDimensions.baseSize === 0) {
      setDisplayAppLoader({ isLoading: true, message: "Projects Loading" });
      return;
    }

    const headerHeight = containerDimensions.height * 0.1;
    const headerWidth = containerDimensions.width;
    const tabWidth = containerDimensions.width;
    const tabHeight = containerDimensions.height * 0.15;

    setSkeletonContainerHeight(
      containerDimensions.height - headerHeight - tabHeight,
    );

    setHeaderContainerDimention({
      width: headerWidth,
      height: headerHeight,
      baseSize: Math.min(headerHeight, headerWidth),
    });
    setTabContainerDimention({
      width: tabWidth,
      height: tabHeight,
      baseSize: Math.min(tabHeight, tabWidth),
    });

    setDisplayAppLoader({ isLoading: false, message: "" });
  }, [containerDimensions.baseSize, setDisplayAppLoader, isActive]);

  useEffect(() => {
    return () => {
      setDisplayAppLoader({ isLoading: false, message: "" });
    };
  }, [setDisplayAppLoader]);

  const showInitialSpinner = !initialLoadDone || (isLoading && page === 0);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View flex={1} justifyContent={"center"} alignItems={"center"} px={"3%"}>
      <Box width={"100%"} height={"100%"} onLayout={onLayout}>
        {containerDimensions.baseSize > 0 && (
          <VStack
            width={containerDimensions.width}
            height={containerDimensions.height}
            space={"2%"}
          >
            <AppHeader
              continerDimention={headerContainerDimention}
              title="Projects"
              subtitle="Manage and track all projects!"
              user={user!}
              onTapProfile={onTapProfile}
            />

            <HStack bg="transparent" borderRadius={12} p={1}>
              {(["CREATED", "ASSIGNED"] as const).map((mode) => (
                <ModeTab
                  key={mode}
                  mode={mode}
                  projectMode={projectMode}
                  handleModeChange={handleModeChange}
                  switchFontSize={switchFontSize}
                />
              ))}
            </HStack>

            <FilterTabBar
              callFrom="PROJECT"
              search={search}
              containerDimentions={tabContainerDimention}
              currentFetchType={fetchType}
              onChangeFetchType={handleFetchTypeChange}
              setSearch={setSearch}
              allCount={
                projectMode === "ASSIGNED"
                  ? user!.stats?.totalAssignProjects
                  : user!.stats?.totalMyProjects || 0
              }
              completedCount={
                projectMode === "ASSIGNED"
                  ? user!.stats?.completedAssignProjects
                  : user!.stats?.completedMyProjects || 0
              }
              pendingCount={
                projectMode === "ASSIGNED"
                  ? user!.stats?.pendingAssignProjects
                  : user!.stats?.pendingMyProjects || 0
              }
            />

            {/* ── List / Skeleton ── */}
            {showInitialSpinner ? (
              <Box
                height={skeletonContainerHeight}
                width={containerDimensions.width}
              >
                <ProjectListSkeleton
                  containerHeight={skeletonContainerHeight}
                  containerWidth={cardWidth}
                  visibleCount={4}
                />
              </Box>
            ) : (
              <FlatList
                data={filteredProjects}
                keyExtractor={keyExtractor}
                renderItem={renderItem}
                showsVerticalScrollIndicator={false}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                  />
                }
                contentContainerStyle={{
                  paddingBottom: containerDimensions.height * 0.04,
                  rowGap: containerDimensions.height * 0.012,
                }}
                initialNumToRender={8}
                maxToRenderPerBatch={10}
                windowSize={5}
                removeClippedSubviews={true}
                ListEmptyComponent={
                  <ListEmptyComponent
                    fontSize={containerDimensions.width * 0.05}
                    onClickCreate={onClickCreateProject}
                    projectType={projectMode}
                    type="PROJECT"
                    taskType={undefined}
                    fetchType={fetchType}
                  />
                }
                
                /* ── PERFECTED LIST FOOTER COMPONENT ── */
                ListFooterComponent={
                  isSearchEmpty && hasMoreProjects ? (
                    <FooterLoadMoreButton
                      currentCount={activeProjects.length} // using real data count
                      fontSize={containerDimensions.width * 0.04}
                      isLoading={isLoading && page > 0}
                      onLoadMore={handleLoadMore}
                      totalCount={currentTotalCount}
                      type="Project"
                    />
                  ) : null
                }
              />
            )}

            <Box position={"absolute"} bottom={"2%"} right={"2%"}>
              <Pressable onPress={onClickCreateProject}>
                {({ isPressed }) => (
                  <Box
                    w={containerDimensions.width * 0.2}
                    h={containerDimensions.width * 0.2}
                    bg={"#FFFFFF"}
                    borderRadius={"full"}
                    justifyContent={"center"}
                    alignItems={"center"}
                    style={{
                      transform: [{ scale: isPressed ? 0.9 : 1 }],
                      opacity: isPressed ? 0.9 : 1,
                    }}
                    shadow={1}
                  >
                    <LottieView
                      source={getAnimationAssets("ADD_PROJECT")}
                      autoPlay
                      loop
                      style={{
                        position: "absolute",
                        width: "100%",
                        height: "100%",
                      }}
                    />
                  </Box>
                )}
              </Pressable>
            </Box>
          </VStack>
        )}
      </Box>
    </View>
  );
};

export default ProjectList;