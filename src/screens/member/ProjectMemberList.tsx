import React, { useCallback, useEffect, useRef, useState } from "react";
import { Box, Text, HStack, VStack, Pressable, Spinner } from "native-base";
// @ts-ignore
import { Feather } from "react-native-vector-icons";
import { FlatList, Dimensions, View, LayoutChangeEvent } from "react-native";
import { useAtom } from "jotai";
import {
  adjustSizeToResolveZoomInIssue,
  getInsetTop,
} from "../../utils/Helper";
import { useContainerDimensions } from "../../hooks/OnlayoutHooks";
import { ROLE_CONFIG } from "../utils/screen.utils";
import { MemberProps, ProjectProps } from "../../store/slices/types";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../store";
import {
  clearMemberError,
  fetchMembers,
  removeMember,
} from "../../store/slices/MemberSlice";
import {
  DEFAULT_MEMBERS_LIMIT_ON_MEMBERSLIST,
  globalMenuAtom,
  isDisplayErrorMessageAtom,
} from "../../utils/Constent";
import { MemberListSkeleton } from "./MemberListSkeleton";
import LottieView from "lottie-react-native";
import { getAnimationAssets } from "../../AssetsMapping/AssetMap";
import AppLoader from "../../components/CustomLoader";
import { MemberCard } from "./MemberCard";
import { onTapMemberRoleUpdate } from "../../modals/model.utils";
import { Ionicons } from "@expo/vector-icons";

export interface ProjectMembersListProps {
  project: ProjectProps;
  currentUserId: string;
  isAdmin: boolean;
  onClose: () => void;
  onAddMember: () => void;
  backgroundColor?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

const ProjectMembersList: React.FC<ProjectMembersListProps> = ({
  project,
  currentUserId,
  isAdmin,
  onClose,
  onAddMember,
  backgroundColor = "#F9FAFB",
}) => {
  const [skip, setSkip] = useState<number>(0);
  const [selectedMember, setSelectedMember] = useState<MemberProps | null>(
    null,
  );

  const { members, loading, error } = useSelector(
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

  const [headerDim, setHeaderDim] = useState({ height: 0, width: 0 });
  const [skeletonContainerHeight, setSkeletonContainerHeight] = useState(0);
  const prevHeaderDimRef = useRef({ height: 0, width: 0 });

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

  const loadMembers = useCallback(async () => {
    if (!project) return;
    await dispatch(
      fetchMembers({
        projectId: project.projectId,
        limit: DEFAULT_MEMBERS_LIMIT_ON_MEMBERSLIST,
        skip: skip,
      }),
    );
    if (isMountedRef.current) setInitialLoadDone(true);
  }, [project, skip, dispatch]);

  useEffect(() => {
    if (!project) return;
    setInitialLoadDone(false);
    loadMembers();
  }, [project, skip, dispatch]);

  // ─── Show shared error modal whenever the member slice reports an error ───
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
        navigation.back?.();
      },
    }));
  }, [error, setErrorModal, loadMembers]);

  // ─── Make sure the modal doesn't linger after this screen unmounts ───
  useEffect(() => {
    return () => {
      setErrorModal((prev) => ({ ...prev, isDisplay: false }));
    };
  }, [setErrorModal]);

  const handleRemoveUser = ({
    memberId,
    projectId,
  }: {
    memberId: string;
    projectId: string;
  }) => {
    dispatch(removeMember({ memberId: memberId, projectId: projectId }));
  };

  const safeTop = getInsetTop();

  const closeGlobalMenu = () =>
    setGlobalMenu((prev: any) => ({ ...prev, isOpen: false }));

  const onUpdateRole = async (item: MemberProps) => {
    await onTapMemberRoleUpdate({
      currentRole: item.role,
      memberId: item.memberId,
      projectId: item.projectId,
    });
  };

  const onRemoveUser = (item: MemberProps) => {
    handleRemoveUser({ memberId: item.memberId, projectId: item.projectId });
  };

  const renderMember = ({ item }: { item: MemberProps }) => {
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
        onRemoveUser={onRemoveUser}
        isProjectCompleted={true}
      />
    );
  };

  const showInitialSkeleton = !initialLoadDone || (loading && skip === 0);

  const isCompleted = project.status;

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
                {isAdmin && (
                  <Box
                    position={"absolute"}
                    mt={safeTop}
                    right={"4%"}
                    flexDirection={"row"}
                    alignItems={"center"}
                  >
                    {/* ─── ADD TASK BUTTON ─── */}
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
                          source={getAnimationAssets("AddMember")}
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
                    {project.membersCount} Members
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
                    visibleCount={5}
                  />
                </Box>
              ) : (
                <FlatList
                  data={members}
                  keyExtractor={(item) => item.memberId}
                  renderItem={renderMember}
                  onScroll={closeGlobalMenu}
                  contentContainerStyle={{ paddingBottom: "5%", rowGap: "8%" }}
                  showsVerticalScrollIndicator={false}
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
