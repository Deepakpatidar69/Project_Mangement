import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { FlatList, RefreshControl } from "react-native";
import { Box, Pressable, View, VStack } from "native-base";
// @ts-ignore - no declaration file for react-native-vector-icons
import { Ionicons } from "react-native-vector-icons";
import { TaskProps } from "../../store/slices/types";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../store";
import { clearTaskError, fetchPrivateTask } from "../../store/slices/TaskSlice";
import AppHeader from "../../components/AppHeader";
import { useContainerDimensions } from "../../hooks/OnlayoutHooks";
import FilterTabBar from "../../components/FilterTabBar";
import { TaskCard } from "./TaskCard";
import { TaskListSkeleton } from "./TaskCardSkeleton";
import { FooterLoadMoreButton } from "../../components/FooterLoadMoreButton";
import ListEmptyComponent from "../../components/ListEmptyComponent";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteStackParamStack } from "../../appNavigator/navigator.utils";
import LottieView from "lottie-react-native";
import { getAnimationAssets } from "../../AssetsMapping/AssetMap";
import { useSetAtom } from "jotai";
import { AppLoaderAtom, isDisplayErrorMessageAtom } from "../../utils/Constent";

interface TaskListProps {
  taskType: "PRIVATE";
  projectId?: string;
  onTapProfile: () => void;
  onClickCreateTask: () => void;
  isActive?: boolean;
}

const TaskList = ({
  taskType,
  projectId,
  onTapProfile,
  onClickCreateTask,
  isActive = true,
}: TaskListProps) => {
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
  const dispatch = useDispatch<AppDispatch>();

  const {
    privateTasks: { tasks: privateTasks, totalTasks: totalPrivateTasks },
    loading: isLoading,
    error,
  } = useSelector((state: RootState) => state.task);

  console.log(`Totoal Private Tasks: ${totalPrivateTasks}, Fetched: ${privateTasks.length}`);

  const { user } = useSelector((state: RootState) => state.auth);
  const navigation =
    useNavigation<NativeStackNavigationProp<RouteStackParamStack>>();

  const [search, setSearch] = useState<string>("");
  const [fetchType, setfetchType] = useState<
    "COMPLETED" | "IN_PROGRESS" | "ALL"
  >("ALL");

  const pageRef = useRef({ limit: 10, skip: 0 });
  const [page, setPage] = useState(0);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // ── Handle Fetching & Tab Switching ────────────────────────────────────────
  useEffect(() => {
    let isActiveFetch = true;

    dispatch(
      fetchPrivateTask({
        fetchType: fetchType,
        limit: pageRef.current.limit,
        skip: pageRef.current.skip,
      }),
    ).finally(() => {
      if (isActiveFetch) setInitialLoadDone(true);
    });

    return () => {
      isActiveFetch = false;
    };
  }, [fetchType, page, dispatch]);

  // ── Show global error modal whenever the slice reports a task error ────────
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
            "Unable to fetch tasks. Please try again."),
      onClickLeftButton: () => {
        dispatch(clearTaskError());
      },
    }));
  }, [error, setErrorModal]);

  const handleTabChange = useCallback(
    (newFetchType: "COMPLETED" | "IN_PROGRESS" | "ALL") => {
      if (newFetchType === fetchType) return;
      setfetchType(newFetchType);
      setPage(0);
      pageRef.current.skip = 0;
      setInitialLoadDone(false);
    },
    [fetchType],
  );

  // ── PERFECTED LOAD MORE LOGIC ──────────────────────────────────────────────
  const handleLoadMore = useCallback(() => {
    // Prevent fetching if already loading OR if we've already fetched all tasks
    const hasFetchedAll =
      privateTasks &&
      totalPrivateTasks &&
      privateTasks.length >= totalPrivateTasks;

    if (isLoading || hasFetchedAll) return;

    pageRef.current = {
      limit: pageRef.current.limit,
      skip: pageRef.current.skip + pageRef.current.limit,
    };

    setPage((p) => p + 1);
  }, [isLoading, privateTasks, totalPrivateTasks]);

  // ── Pull-to-refresh handler ────────────────────────────────────────────────
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    pageRef.current = { limit: pageRef.current.limit, skip: 0 };

    try {
      await dispatch(
        fetchPrivateTask({
          fetchType: fetchType,
          limit: pageRef.current.limit,
          skip: 0,
        }),
      );
    } finally {
      setPage(0);
      setRefreshing(false);
    }
  }, [dispatch, fetchType]);

  // ── Layout fix & Global Loader Control ─────────────────────────────────────
  useEffect(() => {
    if (!isActive) return;

    if (containerDimensions.baseSize === 0) {
      setDisplayAppLoader({ isLoading: true, message: "Tasks Loading" });
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

  const filteredTasks = useMemo(() => {
    const sourceTasks =
      taskType === "PRIVATE" && privateTasks ? privateTasks : [];

    if (!search.trim()) return sourceTasks;

    return sourceTasks.filter((item) =>
      item.taskHeader.toLowerCase().includes(search.toLowerCase()),
    );
  }, [privateTasks, search, taskType]);

  const onPressTask = (task: TaskProps) => {
    navigation.navigate("TaskDetail", { taskId: task.taskId });
  };

  const renderItem = useCallback(
    ({ item }: { item: TaskProps }) => (
      <TaskCard
        task={item}
        width={containerDimensions.width}
        onPress={() => onPressTask(item)}
      />
    ),
    [containerDimensions],
  );

  const showInitialSpinner = !initialLoadDone || (isLoading && page === 0);

  // Boolean to determine if Load More button should be shown
  const hasMoreTasks = privateTasks.length < totalPrivateTasks;
  const isSearchEmpty = search.trim() === "";

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
              title={"Tasks"}
              subtitle="Manage and track all tasks!"
              user={user!}
              onTapProfile={onTapProfile}
            />

            <FilterTabBar
              callFrom="TASK"
              search={search}
              containerDimentions={tabContainerDimention}
              currentFetchType={fetchType}
              onChangeFetchType={handleTabChange}
              setSearch={setSearch}
              allCount={user!.stats?.totalTasks || 0}
              completedCount={user!.stats?.completedTasks || 0}
              pendingCount={user!.stats?.pendingTasks || 0}
            />

            {/* ================= TASK LIST ================= */}
            {showInitialSpinner ? (
              <Box
                height={skeletonContainerHeight}
                width={containerDimensions.width}
              >
                <TaskListSkeleton
                  containerHeight={skeletonContainerHeight}
                  containerWidth={containerDimensions.width}
                  visibleCount={3}
                />
              </Box>
            ) : (
              <FlatList
                data={filteredTasks}
                keyExtractor={(item) => item.taskId}
                renderItem={renderItem}
                showsVerticalScrollIndicator={false}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                  />
                }
                contentContainerStyle={{
                  paddingBottom: containerDimensions.height * 0.1,
                  rowGap: containerDimensions.height * 0.01,
                }}
                initialNumToRender={4}
                maxToRenderPerBatch={10}
                removeClippedSubviews={true}
                // ── PERFECTED LIST FOOTER COMPONENT ──
                ListFooterComponent={
                  isSearchEmpty && hasMoreTasks ? (
                    <FooterLoadMoreButton
                      currentCount={privateTasks.length} // using real data count, not filtered
                      fontSize={containerDimensions.width * 0.04}
                      isLoading={isLoading && page > 0}
                      onLoadMore={handleLoadMore}
                      totalCount={totalPrivateTasks}
                      type="Task"
                    />
                  ) : null
                }
                ListEmptyComponent={
                  <ListEmptyComponent
                    fontSize={containerDimensions.width * 0.045}
                    onClickCreate={onClickCreateTask}
                    projectType={undefined}
                    taskType={taskType}
                    type="TASK"
                    fetchType={fetchType}
                  />
                }
              />
            )}

            {/* Add Task Button */}
            <Box position={"absolute"} bottom={"2%"} right={"2%"}>
              <Pressable onPress={onClickCreateTask}>
                {({ isPressed }) => {
                  return (
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
                        source={getAnimationAssets("ADD_TASK")}
                        autoPlay
                        loop
                        duration={3000}
                        style={{
                          position: "absolute",
                          width: "120%",
                          height: "120%",
                        }}
                      />
                    </Box>
                  );
                }}
              </Pressable>
            </Box>
          </VStack>
        )}
      </Box>
    </View>
);
};

export default TaskList;
