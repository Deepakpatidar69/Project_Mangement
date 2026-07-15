import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { FlatList, LayoutChangeEvent } from "react-native";
import { Box, HStack, Pressable, Text, View, VStack } from "native-base";
// @ts-ignore - no declaration file for react-native-vector-icons
import { Feather } from "react-native-vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { AppDispatch, RootState } from "../../store";
import { TaskProps, ProjectProps } from "../../store/slices/types";
import {
  clearTaskError,
  fetchTaskForProject,
} from "../../store/slices/TaskSlice";
import {
  clearProjectError,
  fetchProjectById,
} from "../../store/slices/ProjectSlice";
import { useContainerDimensions } from "../../hooks/OnlayoutHooks";
import {
  adjustSizeToResolveZoomInIssue,
  getInsetTop,
} from "../../utils/Helper";
import { RouteStackParamStack } from "../../appNavigator/navigator.utils";

import FilterTabBar from "../../components/FilterTabBar";
import { TaskCard } from "./TaskCard";
import { TaskListSkeleton } from "./TaskCardSkeleton";
import { FooterLoadMoreButton } from "../../components/FooterLoadMoreButton";
import ListEmptyComponent from "../../components/ListEmptyComponent";
import LottieView from "lottie-react-native";
import { getAnimationAssets } from "../../AssetsMapping/AssetMap";
import { useAtom, useSetAtom } from "jotai";
import { AppLoaderAtom, isDisplayErrorMessageAtom } from "../../utils/Constent"; // Ensure this path is correct
import { Ionicons } from "@expo/vector-icons";

// ─── Route params ──────────────────────────────────────────────────────────
type ProjectTaskListRoute = RouteProp<RouteStackParamStack, "ProjectTaskList">;

export default function ProjectTaskList() {
  const route = useRoute<ProjectTaskListRoute>();
  const { projectId } = route.params;

  const navigation =
    useNavigation<NativeStackNavigationProp<RouteStackParamStack>>();
  const dispatch = useDispatch<AppDispatch>();

  const { containerDimensions, onLayout } = useContainerDimensions();
  const baseSize = containerDimensions.baseSize;

  const headerTitleSize = adjustSizeToResolveZoomInIssue(baseSize * 0.065);
  const meta = adjustSizeToResolveZoomInIssue(baseSize * 0.035);
  const iconSize = adjustSizeToResolveZoomInIssue(baseSize * 0.06);

  const safeTop = getInsetTop();

  const tabContainerDimention = useMemo(() => {
    const { width, height, baseSize } = containerDimensions;
    if (baseSize === 0) return { baseSize: 0, height: 0, width: 0 };
    const tabWidth = width;
    const tabHeight = height * 0.15;
    return {
      width: tabWidth,
      height: tabHeight,
      baseSize: Math.min(tabHeight, tabWidth),
    };
  }, [containerDimensions]);

  const [skeletonContainerHeight, setSkeletonContainerHeight] =
    useState<number>(0);
  const onListSlotLayout = useCallback((e: LayoutChangeEvent) => {
    setSkeletonContainerHeight(e.nativeEvent.layout.height);
  }, []);

  // Card width, computed once — same 96% effective width as before.
  const cardWidth = useMemo(
    () => containerDimensions.width * 0.96,
    [containerDimensions.width],
  );

  // ─── Redux state ──────────────────────────────────────────────────────────
  const {
    singleProject,
    loading: projectLoading,
    error: projectError,
  } = useSelector((state: RootState) => state.project);
  const {
    projectTasks: { tasks: projectTasks, totalTasks: totalProjectTasks },
    loading: tasksLoading,
    error: tasksError,
  } = useSelector((state: RootState) => state.task);
  const { user } = useSelector((state: RootState) => state.auth);

  const project = singleProject as ProjectProps | null;

  const [tasks, setTasks] = useState<TaskProps[]>([]);
  const [search, setSearch] = useState<string>("");
  const [fetchType, setFetchType] = useState<
    "COMPLETED" | "IN_PROGRESS" | "ALL"
  >("ALL");

  const pageRef = useRef({ limit: 5, skip: 0 });
  const [page, setPage] = useState(0);

  const [initialLoadDone, setInitialLoadDone] = useState(false);

  // ─── Global Loader Logic ──────────────────────────────────────────────────
  const setDisplayAppLoader = useSetAtom(AppLoaderAtom);
  const [, setErrorModal] = useAtom(isDisplayErrorMessageAtom);

  useEffect(() => {
    if (containerDimensions.baseSize === 0) {
      setDisplayAppLoader({ isLoading: true, message: "Loading Tasks" });
    } else {
      setDisplayAppLoader({ isLoading: false, message: "" });
    }
  }, [tasksLoading, containerDimensions.baseSize, setDisplayAppLoader]);

  // Failsafe cleanup for loader
  useEffect(() => {
    return () => {
      setDisplayAppLoader({ isLoading: false, message: "" });
    };
  }, [setDisplayAppLoader]);

  // ─── Effects ──────────────────────────────────────────────────────────────
  const loadProject = useCallback(() => {
    if (projectId) {
      dispatch(fetchProjectById(projectId));
    }
  }, [projectId, dispatch]);

  useEffect(() => {
    if (projectId) {
      !singleProject && loadProject();
    }
  }, [projectId, singleProject, loadProject]);

  const loadTasks = useCallback(() => {
    if (!projectId) return;
    dispatch(
      fetchTaskForProject({
        projectId,
        fetchType,
        limit: pageRef.current.limit,
        skip: pageRef.current.skip,
      }),
    );
  }, [projectId, fetchType, dispatch]);

  useEffect(() => {
    if (!projectId) return;
    if (projectLoading) return;
    if (!project) return;

    let isActive = true;

    dispatch(
      fetchTaskForProject({
        projectId,
        fetchType,
        limit: pageRef.current.limit,
        skip: pageRef.current.skip,
      }),
    ).finally(() => {
      if (isActive) setInitialLoadDone(true);
    });

    return () => {
      isActive = false;
    };
  }, [projectId, projectLoading, project, fetchType, page, dispatch]);

  useEffect(() => {
    setTasks(projectTasks);
  }, [projectTasks]);

  // ─── Show shared error modal whenever the project or task slice errors ───
  useEffect(() => {
    const error = projectError || tasksError;
    if (!error) return;

    setErrorModal((prev) => ({
      ...prev,
      isDisplay: true,
      title: "Something went wrong",
      subtitle:
        typeof error === "string"
          ? error
          : "We couldn't load this project's tasks. Please try again.",
      onClickLeftButton: () => {
        dispatch(clearProjectError());
        dispatch(clearTaskError());
        navigation.goBack?.();
      },
    }));
  }, [projectError, tasksError, setErrorModal, loadProject, loadTasks]);

  // ─── Make sure the modal doesn't linger after this screen unmounts ───
  useEffect(() => {
    return () => {
      setErrorModal((prev) => ({ ...prev, isDisplay: false }));
    };
  }, [setErrorModal]);

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleTabChange = useCallback(
    (newFetchType: "COMPLETED" | "IN_PROGRESS" | "ALL") => {
      if (newFetchType === fetchType) return;
      setFetchType(newFetchType);
      setPage(0);
      pageRef.current.skip = 0;
      setInitialLoadDone(false);
    },
    [fetchType],
  );

  const handleLoadMore = useCallback(() => {
    if (tasksLoading) return;
    pageRef.current = {
      limit: pageRef.current.limit,
      skip: pageRef.current.skip + pageRef.current.limit,
    };
    setPage((p) => p + 1);
  }, [tasksLoading]);

  const filteredTasks = useMemo(() => {
    if (!search.trim()) return tasks;
    return tasks.filter((item) =>
      item.taskHeader.toLowerCase().includes(search.toLowerCase()),
    );
  }, [tasks, search]);

  const onPressTask = (task: TaskProps) => {
    navigation.navigate("TaskDetail", { taskId: task.taskId });
  };

  const onClickCreateTask = () => {
    navigation.navigate("CreateTaskScreen", {
      taskType: "PROJECT",
      project: project!,
      onBack: () => navigation.goBack(),
    });
  };

  const renderItem = useCallback(
    ({ item }: { item: TaskProps }) => (
      <TaskCard
        task={item}
        width={cardWidth}
        onPress={() => onPressTask(item)}
        onToggleCheck={() => console.log(`Press on toggle Check`)}
      />
    ),
    [cardWidth],
  );

  const showTaskSkeleton = !initialLoadDone || (tasksLoading && page === 0);

  const isCompleted = singleProject?.status;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <View
      flex={1}
      justifyContent={"center"}
      alignItems={"center"}
      bg="coolGray.50"
    >
      <Box width={"100%"} height={"100%"} onLayout={onLayout}>
        {/* Render content only when container dimensions are ready */}
        {containerDimensions.baseSize > 0 && (
          <VStack width={"100%"} height={"100%"} space="2%">
            <Box
              width="100%"
              bg="white"
              px="3%"
              pt={safeTop}
              pb="5%"
              borderBottomWidth={1}
              borderBottomColor="coolGray.100"
            >
              <HStack width="100%" alignItems="center" mb="6%">
                <Pressable
                  onPress={() => navigation.goBack()}
                  w={adjustSizeToResolveZoomInIssue(
                    containerDimensions.baseSize * 0.12,
                  )}
                  h={adjustSizeToResolveZoomInIssue(
                    containerDimensions.baseSize * 0.12,
                  )}
                  rounded="full"
                  bg="coolGray.100"
                  alignItems="center"
                  justifyContent="center"
                  _pressed={{
                    bg: "coolGray.200",
                    style: {
                      transform: [{ scale: 0.9 }],
                    },
                  }}
                >
                  <Feather
                    name="arrow-left"
                    size={iconSize * 1.2}
                    color="#374151"
                  />
                </Pressable>
              </HStack>

              <Text
                fontSize={headerTitleSize}
                fontWeight="700"
                color="coolGray.900"
                numberOfLines={1}
                letterSpacing="-0.3"
              >
                {project?.projectHeader ?? "Project Tasks"}
              </Text>

              {project?.projectDesc ? (
                <Text
                  fontSize={meta}
                  color="coolGray.500"
                  numberOfLines={2}
                  mt="1.5%"
                >
                  {project.projectDesc}
                </Text>
              ) : null}

              <Box position={"absolute"} mt={safeTop} right={"4%"}>
                <Pressable
                  onPress={onClickCreateTask}
                  p={"4%"}
                  justifyContent={"center"}
                  alignItems={"center"}
                  px={"5%"}
                  disabled={isCompleted}
                  borderRadius={"lg"}
                  mt={safeTop}
                  right={
                    isCompleted
                      ? 0
                      : adjustSizeToResolveZoomInIssue(
                          containerDimensions.baseSize * 0.02,
                        )
                  }
                  _pressed={{
                    bgColor: "#372deb",
                    style: {
                      transform: [{ scale: 0.85 }],
                    },
                  }}
                >
                  {isCompleted ? (
                    <Ionicons
                      name="add-circle"
                      color="#777777"
                      size={adjustSizeToResolveZoomInIssue(
                        containerDimensions.baseSize * 0.15,
                      )}
                      style={{
                        position: "absolute",
                        width: adjustSizeToResolveZoomInIssue(
                          containerDimensions.baseSize * 0.2,
                        ),
                        height: adjustSizeToResolveZoomInIssue(
                          containerDimensions.baseSize * 0.2,
                        ),
                        textAlign: "center",
                        textAlignVertical: "center",
                      }}
                    />
                  ) : (
                    <LottieView
                      source={getAnimationAssets("ADD_TASK6")}
                      autoPlay
                      loop
                      duration={3000}
                      style={{
                        position: "absolute",
                        width: adjustSizeToResolveZoomInIssue(
                          containerDimensions.baseSize * 0.2,
                        ),
                        height: adjustSizeToResolveZoomInIssue(
                          containerDimensions.baseSize * 0.2,
                        ),
                      }}
                    />
                  )}
                </Pressable>
              </Box>
            </Box>

            <Box
              flex={1}
              px={containerDimensions.width * 0.02}
              width="100%"
              pt="2%"
              position="relative"
              zIndex={1000}
            >
              <Box width="100%" zIndex={1000} mb={"2%"}>
                <FilterTabBar
                  callFrom="TASK"
                  search={search}
                  containerDimentions={{
                    height: tabContainerDimention.height,
                    width: containerDimensions.width * 0.96,
                    baseSize: tabContainerDimention.baseSize,
                  }}
                  currentFetchType={fetchType}
                  onChangeFetchType={handleTabChange}
                  setSearch={setSearch}
                  allCount={singleProject?.totalTasksCount || 0}
                  completedCount={singleProject?.completedTaskCount || 0}
                  pendingCount={
                    (singleProject?.totalTasksCount || 0) -
                    (singleProject?.completedTaskCount || 0)
                  }
                />
              </Box>

              <Box flex={1} width="100%" onLayout={onListSlotLayout}>
                {showTaskSkeleton ? (
                  <TaskListSkeleton
                    containerHeight={skeletonContainerHeight}
                    containerWidth={cardWidth}
                    visibleCount={3}
                  />
                ) : (
                  <FlatList
                    data={filteredTasks}
                    keyExtractor={(item) => item.taskId}
                    renderItem={renderItem}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{
                      paddingTop: containerDimensions.height * 0.01,
                      paddingBottom: containerDimensions.height * 0.02,
                      rowGap: containerDimensions.height * 0.01,
                    }}
                    initialNumToRender={8}
                    maxToRenderPerBatch={10}
                    windowSize={5}
                    removeClippedSubviews={true}
                    ListFooterComponent={
                      <FooterLoadMoreButton
                        currentCount={filteredTasks.length}
                        fontSize={containerDimensions.width * 0.04}
                        isLoading={tasksLoading && page > 0}
                        onLoadMore={handleLoadMore}
                        totalCount={singleProject?.totalTasksCount || 0}
                        type="Task"
                      />
                    }
                    ListEmptyComponent={
                      <ListEmptyComponent
                        fontSize={containerDimensions.width * 0.045}
                        onClickCreate={onClickCreateTask}
                        projectType={undefined}
                        taskType="PROJECT"
                        type="TASK"
                        fetchType={fetchType}
                        isProjectCompleted={isCompleted}
                      />
                    }
                  />
                )}
              </Box>
            </Box>
          </VStack>
        )}
      </Box>
    </View>
  );
}
