import React, { useCallback, useEffect, useRef, useState } from "react";
import { Box, Text, HStack, VStack, Pressable } from "native-base";
// @ts-ignore
import { Feather } from "react-native-vector-icons";
import { FlatList, LayoutChangeEvent } from "react-native";
import { useAtom } from "jotai";
import {
  adjustSizeToResolveZoomInIssue,
  getInsetTop,
} from "../../utils/Helper";
import { useContainerDimensions } from "../../hooks/OnlayoutHooks";
import { MemberProps, ProjectProps } from "../../store/slices/types";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../store";
import { clearMemberError, fetchMembers } from "../../store/slices/MemberSlice";
import {
  globalMenuAtom,
  isDisplayErrorMessageAtom,
} from "../../utils/Constent";
import { MemberListSkeleton } from "./MemberListSkeleton";
import LottieView from "lottie-react-native";
import { getAnimationAssets } from "../../AssetsMapping/AssetMap";
import AppLoader from "../../components/CustomLoader";
import { MemberCard } from "./MemberCard";
import {
  handleRemoveMember,
  onTapMemberRoleUpdate,
} from "../../modals/model.utils";
import { Ionicons } from "@expo/vector-icons";
import { FooterLoadMoreButton } from "../../components/FooterLoadMoreButton";

export interface ProjectMembersListProps {
  project: ProjectProps;
  currentUserId: string;
  isAdmin: boolean;
  onClose: () => void;
  onAddMember: () => void;
  backgroundColor?: string;
  isProjectCompleted: boolean;
}

const PAGE_LIMIT = 3;

// ─── Component ────────────────────────────────────────────────────────────────

const ProjectMembersList: React.FC<ProjectMembersListProps> = ({
  project,
  currentUserId,
  isAdmin,
  onClose,
  onAddMember,
  backgroundColor = "#F9FAFB",
  isProjectCompleted = false,
}) => {
  const { members, loading, error, totalMembersCount } = useSelector(
    (state: RootState) => state.member,
  );
  const dispatch = useDispatch<AppDispatch>();

  const [, setGlobalMenu] = useAtom(globalMenuAtom);
  const [, setErrorModal] = useAtom(isDisplayErrorMessageAtom);

  const { containerDimensions, onLayout } = useContainerDimensions();
  const baseSize = containerDimensions.baseSize;

  const headerTitleSize = adjustSizeToResolveZoomInIssue(baseSize * 0.05);
  const titleSize = adjustSizeToResolveZoomInIssue(baseSize * 0.055);
  const subTitleSize = adjustSizeToResolveZoomInIssue(baseSize * 0.04);
  const meta = adjustSizeToResolveZoomInIssue(baseSize * 0.035);
  const iconSize = adjustSizeToResolveZoomInIssue(baseSize * 0.06);
  const avatarSize = adjustSizeToResolveZoomInIssue(baseSize * 0.12);

  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [headerDim, setHeaderDim] = useState({ height: 0, width: 0 });
  const [skeletonContainerHeight, setSkeletonContainerHeight] = useState(0);
  const prevHeaderDimRef = useRef({ height: 0, width: 0 });

  const pageRef = useRef({ limit: PAGE_LIMIT, skip: 0 });
  const [page, setPage] = useState(0);

  const onHeaderLayout = useCallback((e: LayoutChangeEvent) => {
    const { height, width } = e.nativeEvent.layout;
    if (
      prevHeaderDimRef.current.height === height &&
      prevHeaderDimRef.current.width === width
    )
      return;
    prevHeaderDimRef.current = { height, width };
    setHeaderDim({ height, width });
  }, []);

  useEffect(() => {
    if (containerDimensions.height === 0) return;
    const remaining = containerDimensions.height - headerDim.height;
    setSkeletonContainerHeight(remaining > 0 ? remaining : 0);
  }, [containerDimensions.height, headerDim.height]);

  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // ─── INITIAL LOAD ───
  useEffect(() => {
    if (!isMountedRef.current || !project) return;

    pageRef.current = { limit: PAGE_LIMIT, skip: 0 };
    setPage(0);
    setInitialLoadDone(false);

    const load = async () => {
      if (!isMountedRef.current) return;
      await dispatch(
        fetchMembers({
          projectId: project.projectId,
          limit: PAGE_LIMIT,
          skip: 0,
        }),
      );
      if (isMountedRef.current) setInitialLoadDone(true);
    };

    load();
  }, [project, dispatch]);

  // ─── LOAD MORE LISTENER ───
  useEffect(() => {
    if (page === 0 || !project) return;

    dispatch(
      fetchMembers({
        projectId: project.projectId,
        limit: pageRef.current.limit,
        skip: pageRef.current.skip,
      }),
    );
  }, [page, project, dispatch]);

  const handleLoadMore = useCallback(() => {
    if (loading) return;
    pageRef.current = {
      limit: pageRef.current.limit,
      skip: pageRef.current.skip + pageRef.current.limit,
    };
    setPage((p) => p + 1);
  }, [loading]);

  // ─── PULL TO REFRESH ───
  const onRefresh = useCallback(async () => {
    if (!project) return;
    setIsRefreshing(true);
    setPage(0);
    pageRef.current.skip = 0;

    try {
      await dispatch(
        fetchMembers({
          projectId: project.projectId,
          limit: PAGE_LIMIT,
          skip: 0,
        }),
      );
    } finally {
      if (isMountedRef.current) {
        setIsRefreshing(false);
      }
    }
  }, [project, dispatch]);

  // ─── MODALS & ACTIONS ───
  useEffect(() => {
    if (!error) return;

    setErrorModal((prev) => ({
      ...prev,
      isDisplay: true,
      title: "Something went wrong",
      subtitle:
        typeof error === "string"
          ? error
          : "We couldn't load the members list. Please try again.",
      onClickLeftButton: () => {
        dispatch(clearMemberError());
      },
    }));
  }, [error, setErrorModal, dispatch]);

  useEffect(() => {
    return () => {
      setErrorModal((prev) => ({ ...prev, isDisplay: false }));
    };
  }, [setErrorModal]);

  const safeTop = getInsetTop();

  const closeGlobalMenu = () =>
    setGlobalMenu((prev: any) => ({ ...prev, isOpen: false }));

  // ✅ 1. Memoized Role Update
  const onUpdateRole = useCallback(async (item: MemberProps) => {
    await onTapMemberRoleUpdate({
      currentRole: item.role,
      memberId: item.memberId,
      projectId: item.projectId,
    });
  }, []);

  // ✅ 2. Memoized Render Item to prevent massive re-renders
  const renderMember = useCallback(
    ({ item }: { item: MemberProps }) => {
      const isCurrentUser = item.assignedMemberId === currentUserId;

      return (
        <MemberCard
          item={item}
          baseSize={baseSize}
          meta={meta}
          subTitleSize={subTitleSize}
          avatarSize={avatarSize}
          isAdmin={isAdmin}
          isCurrentUser={isCurrentUser}
          setGlobalMenu={setGlobalMenu}
          onUpdateRole={onUpdateRole}
          onRemoveUser={handleRemoveMember}
          isProjectCompleted={isProjectCompleted}
        />
      );
    },
    [
      baseSize,
      meta,
      subTitleSize,
      avatarSize,
      isAdmin,
      currentUserId,
      setGlobalMenu,
      onUpdateRole,
      isProjectCompleted,
    ],
  );

  // ✅ 3. Stable separator (Replaces buggy rowGap: "8%")
  const renderSeparator = useCallback(
    () => <Box height={adjustSizeToResolveZoomInIssue(baseSize * 0.04)} />,
    [baseSize],
  );

  const actualMembersCount = totalMembersCount ?? project?.membersCount ?? 0;

  // ✅ 4. Memoized Footer to stop it from flashing/unmounting
  const renderFooter = useCallback(
    () => (
      <FooterLoadMoreButton
        currentCount={members?.length || 0}
        fontSize={adjustSizeToResolveZoomInIssue(baseSize * 0.04)}
        isLoading={loading && page > 0}
        onLoadMore={handleLoadMore}
        totalCount={actualMembersCount}
        type="Member"
      />
    ),
    [
      members?.length,
      baseSize,
      loading,
      page,
      handleLoadMore,
      actualMembersCount,
    ],
  );

  const showInitialSkeleton =
    (!initialLoadDone && !isRefreshing) ||
    (loading && page === 0 && !isRefreshing);

  const isCompleted = project?.status;

  if (error || !project) return <Box flex={1} bg={backgroundColor} />;

  return (
    <Box flex={1} width={"100%"} bg={backgroundColor}>
      <Box width="100%" height="100%" onLayout={onLayout}>
        {containerDimensions.baseSize === 0 ? (
          <AppLoader isLoading message="members loading" fullScreen />
        ) : (
          <VStack flex={1} width="100%" height="100%" space="2%">
            <Box
              width="100%"
              bg="white"
              px="5%"
              pt={safeTop}
              borderBottomRadius="3xl"
              shadow={2}
              onLayout={onHeaderLayout}
            >
              {/* Header Implementation stays exactly the same */}
              <HStack
                width="100%"
                justifyContent="space-between"
                alignItems="center"
                pb="4%"
              >
                <Pressable
                  onPress={onClose}
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
                    style: { transform: [{ scale: 0.9 }] },
                  }}
                >
                  <Feather
                    name="arrow-left"
                    size={iconSize * 1.2}
                    color="#374151"
                  />
                </Pressable>

                {isAdmin && (
                  <Box
                    position={"absolute"}
                    mt={safeTop}
                    right={"4%"}
                    flexDirection={"row"}
                    alignItems={"center"}
                  >
                    <Pressable
                      onPress={onAddMember}
                      p={"4%"}
                      justifyContent={"center"}
                      alignItems={"center"}
                      isDisabled={isCompleted}
                      px={"5%"}
                      borderRadius={"lg"}
                      right={
                        isCompleted
                          ? 0
                          : adjustSizeToResolveZoomInIssue(
                              containerDimensions.baseSize * 0.02,
                            )
                      }
                      _pressed={{
                        bgColor: "#372deb",
                        style: { transform: [{ scale: 0.85 }] },
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
                              containerDimensions.baseSize * 0.3,
                            ),
                            height: adjustSizeToResolveZoomInIssue(
                              containerDimensions.baseSize * 0.3,
                            ),
                            textAlign: "center",
                            textAlignVertical: "center",
                          }}
                        />
                      ) : (
                        <LottieView
                          source={getAnimationAssets("ADD_MEMBER")}
                          autoPlay
                          loop
                          duration={3000}
                          style={{
                            position: "absolute",
                            width: adjustSizeToResolveZoomInIssue(
                              containerDimensions.baseSize * 0.3,
                            ),
                            height: adjustSizeToResolveZoomInIssue(
                              containerDimensions.baseSize * 0.3,
                            ),
                          }}
                        />
                      )}
                    </Pressable>
                  </Box>
                )}
              </HStack>
              <VStack width="100%" space="5%">
                <Text
                  fontSize={headerTitleSize}
                  fontWeight="semibold"
                  color="coolGray.600"
                  numberOfLines={1}
                >
                  {project.projectHeader}
                </Text>
                <Text fontSize={meta} color="coolGray.500" numberOfLines={2}>
                  {project.projectDesc}
                </Text>
              </VStack>
              <HStack width="100%" mt="4%" mb="2%" alignItems="center">
                <Box bg="indigo.50" px="3%" py="2%" borderRadius="lg">
                  <Text fontSize={meta} fontWeight="bold" color="indigo.600">
                    {actualMembersCount} Members
                  </Text>
                </Box>
              </HStack>
            </Box>

            <Box flex={1} px="4%" width="100%" pt="2%" position="relative">
              <HStack
                px="2%"
                pb="4%"
                alignItems="center"
                justifyContent="space-between"
              >
                <Text
                  fontSize={titleSize}
                  fontWeight="bold"
                  color="coolGray.800"
                >
                  Team Members
                </Text>
              </HStack>

              {showInitialSkeleton ? (
                <Box
                  height={skeletonContainerHeight}
                  width={"100%"}
                  alignItems={"center"}
                  justifyContent={"center"}
                >
                  <MemberListSkeleton
                    baseSize={baseSize}
                    avatarSize={avatarSize}
                    height={skeletonContainerHeight}
                    width={containerDimensions.width * 0.96}
                    visibleCount={PAGE_LIMIT}
                  />
                </Box>
              ) : (
                <FlatList
                  data={members}
                  // ✅ 5. Bulletproof key extractor prevents duplicate crashes
                  keyExtractor={(item, index) => `${item.memberId}-${index}`}
                  renderItem={renderMember}
                  onScroll={closeGlobalMenu}
                  refreshing={isRefreshing}
                  onRefresh={onRefresh}
                  showsVerticalScrollIndicator={false}
                  // ✅ 6. Using ItemSeparatorComponent instead of rowGap
                  ItemSeparatorComponent={renderSeparator}
                  contentContainerStyle={{
                    paddingBottom: adjustSizeToResolveZoomInIssue(
                      baseSize * 0.1,
                    ),
                    paddingHorizontal: adjustSizeToResolveZoomInIssue(
                      baseSize * 0.02,
                    ),
                  }}
                  // ✅ 7. Memoized Footer to preserve scroll UI
                  ListFooterComponent={renderFooter}
                />
              )}
            </Box>
          </VStack>
        )}
      </Box>
    </Box>
  );
};

export default ProjectMembersList;
