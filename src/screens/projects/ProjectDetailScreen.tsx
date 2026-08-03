// screens/projects/ProjectDetailScreen.tsx

import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  FontAwesome,
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
  Octicons,
} from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  Box,
  HStack,
  VStack,
  Text,
  Pressable,
  Icon,
  Avatar as NBAvatar,
  Divider,
  Center,
} from "native-base";
import { RefreshControl } from "react-native"; // <-- 1. Import RefreshControl

import { RootState, AppDispatch } from "../../store";
import { RouteStackParamStack } from "../../appNavigator/navigator.utils";
import { useContainerDimensions } from "../../hooks/OnlayoutHooks";
import { adjustSizeToResolveZoomInIssue } from "../../utils/Helper";
import {
  clearProjectError,
  fetchProjectById,
} from "../../store/slices/ProjectSlice";
import { fetchTaskForProject } from "../../store/slices/TaskSlice";
import { ProjectProps, TaskProps } from "../../store/slices/types";
import { formatDate, PRIORITY_CONFIG } from "../../utils/Helper";
import { getStatus, ROLE_CONFIG } from "../utils/screen.utils";
import { CommonDetailHeader } from "../../components/CommonDetailHeader";
import {
  onOpenAddMemberModal,
  onOpenMessageModel,
  onTapDeadlineUpdateModal,
  onTapDeleteButton,
  onTapMarkComplete,
  onTapUpdatePriority,
} from "../../modals/model.utils";
import RecentMessages from "../../components/DisplayRecentMessage";
import UpdateProject from "./UpdateProject";
import ProjectTeamMembers from "../member/ProjectMembers";
import ProjectMembersList from "../member/ProjectMemberList";
import { DEFAULT_RECENT_TASK_LIMIT } from "../../utils/Constent";
import { MenuOption } from "../../utils/props.utils";
import { useSetAtom } from "jotai";
import { AppLoaderAtom, isDisplayErrorMessageAtom } from "../../utils/Constent";
import { getProjectMenuOptions } from "../../modals/ActionMenu.Options.utile";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { clearProjectMessages } from "../../store/slices/MessageSlice";

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ProjectDetailScreen({ route }: any) {
  const navigation =
    useNavigation<NativeStackNavigationProp<RouteStackParamStack>>();
  const { projectId } = route.params;
  const dispatch = useDispatch<AppDispatch>();

  // ─── Layout ──────────────────────────────────────────────────────────────
  const { containerDimensions, onLayout } = useContainerDimensions();
  const baseSize = containerDimensions.width;

  const [isDisplayMemberList, setIsDisplayMemberList] =
    useState<boolean>(false);
  const [isDisplayUpdateComponent, setIsDisplayUpdateComponent] =
    useState<boolean>(false);

  // Memoised font-size scale — recalculates only when baseSize changes
  const fs = useMemo(
    () => ({
      header: adjustSizeToResolveZoomInIssue(baseSize * 0.065),
      title: adjustSizeToResolveZoomInIssue(baseSize * 0.045),
      subTitle: adjustSizeToResolveZoomInIssue(baseSize * 0.04),
      meta: adjustSizeToResolveZoomInIssue(baseSize * 0.03),
      icon: adjustSizeToResolveZoomInIssue(baseSize * 0.1),
    }),
    [baseSize],
  );

  // ─── Redux State ──────────────────────────────────────────────────────────
  const {
    singleProject,
    loading,
    error: projectError,
  } = useSelector((state: RootState) => state.project);

  const {
    projectTasks,
    loading: taskLoading,
    error: taskError,
  } = useSelector((state: RootState) => state.task);

  const { user } = useSelector((state: RootState) => state.auth);

  const project = singleProject as ProjectProps | null;
  const tasks = (projectTasks.tasks ?? []) as TaskProps[];
  const isCompleted = project?.status || false;

  // ─── Global Loader Logic ──────────────────────────────────────────────────
  const setDisplayAppLoader = useSetAtom(AppLoaderAtom);
  const setErrorModal = useSetAtom(isDisplayErrorMessageAtom);

  // ─── Refresh Logic ───────────────────────────────────────────────────────
  // 2. Setup states for pulling to refresh
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // 3. Create the refresh handler
  const onRefresh = useCallback(() => {
    setRefreshing(true);

    // Re-fetch the project and task data via Redux
    dispatch(fetchProjectById(projectId));
    dispatch(
      fetchTaskForProject({
        fetchType: "ALL",
        projectId: projectId,
        limit: DEFAULT_RECENT_TASK_LIMIT,
      }),
    );

    // Increment key to remount child components so they fetch their data independently
    setTimeout(() => {
      setRefreshKey((prevKey) => prevKey + 1);
      setRefreshing(false);
    }, 1000);
  }, [dispatch, projectId]);
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (loading || taskLoading || containerDimensions.baseSize === 0) {
      setDisplayAppLoader({ isLoading: true, message: "Loading Project..." });
    } else {
      setDisplayAppLoader({ isLoading: false, message: "" });
    }
  }, [loading, taskLoading, containerDimensions.baseSize, setDisplayAppLoader]);

  // Failsafe cleanup for loader
  useEffect(() => {
    return () => {
      setDisplayAppLoader({ isLoading: false, message: "" });
    };
  }, [setDisplayAppLoader]);

  // ── Show global error modal whenever the slice reports a project error ────────
  useEffect(() => {
    if (!projectError) return;

    setErrorModal((prev) => ({
      ...prev,
      isModalOpen: true,
      title: "Something went wrong",
      subTitle:
        typeof projectError === "string"
          ? projectError
          : ((projectError as any)?.message ??
            "Unable to load this project. Please try again."),
      onClickLeftButton: () => {
        dispatch(clearProjectError());
        navigation.goBack();
      },
    }));
  }, [projectError, setErrorModal, navigation, dispatch]);

  // ─── Actions ──────────────────────────────────────────────────────────────
  const onHandleClickMessageButton = () => {
    if (!project) return;
    onOpenMessageModel({
      deadline: project.projectDeadline!,
      isDisplay: true,
      status: project.status!,
      title: project.projectHeader,
      type: "PROJECT",
      uniqueId: project.projectId,
    });
  };

  const onHandleClickAddMember = () => {
    onOpenAddMemberModal({ isDisplay: true, projectId: projectId });
  };

  useEffect(() => {
    if (projectId) {
      dispatch(clearProjectMessages());

      dispatch(fetchProjectById(projectId));
      dispatch(
        fetchTaskForProject({
          fetchType: "ALL",
          projectId: projectId,
          limit: DEFAULT_RECENT_TASK_LIMIT,
        }),
      );
    }
  }, [projectId, dispatch]);

  const onClickMarkCompleted = () => {
    if (!project) return;
    onTapMarkComplete({
      type: "PROJECT",
      projectId: project.projectId,
      isComplete: project?.status ?? false,
    });
  };

  const onClickDeleteProject = async () => {
    if (!project) return;

    await onTapDeleteButton({
      type: "PROJECT",
      projectId: project.projectId,
      onSuccess: () => {
        navigation.goBack();
      },
    });
  };

  const onClickViewAllTask = () => {
    if (!project) return;
    navigation.navigate("ProjectTaskList", {
      projectId: project.projectId,
    });
  };

  const onClickUpdateDeadline = async () => {
    if (!project) return;
    await onTapDeadlineUpdateModal({
      currentDeadline: project.projectDeadline,
      type: "PROJECT",
      projectId: project.projectId,
    });
  };

  const onClickUpdatePriority = async () => {
    if (!project) return;
    await onTapUpdatePriority({
      currentPriority: project.priority,
      type: "PROJECT",
      projectId: project.projectId,
    });
  };

  const projectMenuOption: MenuOption[] = getProjectMenuOptions({
    isCompleted: isCompleted,
    onClickDelete: onClickDeleteProject,
    onClickMarkComplete: onClickMarkCompleted,
    onClickUpdate: () => setIsDisplayUpdateComponent(true),
  });

  // ─── Guards ──────────────────────────────────────────────────────────────

  if (!loading && !project && !projectError) {
    return (
      <Center flex={1}>
        <Text style={{ color: "#9CA3AF" }}>Project not found</Text>
      </Center>
    );
  }

  if (containerDimensions.baseSize === 0 || !project) {
    return <Box flex={1} bg="coolGray.50" onLayout={onLayout} />;
  }

  // ─── Derived State ───────────────────────────────────────────────────────
  const isAdmin = project.userRole === "ADMIN";
  const isEditor = project.userRole === "EDITOR";

  const priorityCfg =
    PRIORITY_CONFIG[project.priority] ?? PRIORITY_CONFIG.MEDIUM;

  const projectStatus = getStatus(project.status, project.projectDeadline);

  if (isDisplayMemberList) {
    return (
      <Box
        flex={1}
        width={"100%"}
        justifyContent={"center"}
        alignItems={"center"}
      >
        <ProjectMembersList
          isAdmin={isAdmin}
          onAddMember={onHandleClickAddMember}
          onClose={() => setIsDisplayMemberList(false)}
          project={project}
          isProjectCompleted={isCompleted}
          currentUserId={user!.userId}
        />
      </Box>
    );
  }

  if (isDisplayUpdateComponent) {
    return (
      <Box flex={1} bg="coolGray.50">
        <Box width={"100%"} height={"100%"} shadow={2}>
          <Box width={"100%"} height={"100%"} justifyContent={"center"}>
            <UpdateProject
              onCancel={() => setIsDisplayUpdateComponent(false)}
              onSuccess={() => setIsDisplayUpdateComponent(false)}
            />
          </Box>
        </Box>
      </Box>
    );
  }

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <Box flex={1} bg="coolGray.50" onLayout={onLayout}>
      {/* ── Header ── */}
      <CommonDetailHeader
        title="Project Details"
        subtitle="Here's everything about this project."
        onTabBackButton={() => navigation.goBack()}
        showEdit={isAdmin}
        isEditButtonDisable={isCompleted}
        onEdit={() => setIsDisplayUpdateComponent(true)}
        fs={baseSize}
        showMenuBar={isAdmin}
        menuOption={projectMenuOption}
      />

      <KeyboardAwareScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bottomOffset={20}
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: containerDimensions.height * 0.05,
          paddingHorizontal: "4%",
        }}
        // 4. Attach RefreshControl here
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* 5. Wrap everything in a VStack with a key to force complete remounts */}
        <VStack width="100%" key={`project-content-${refreshKey}`}>
          {/* ══════════════════════════════════════════
                 SECTION 1 — Project Hero Card
          ══════════════════════════════════════════ */}
          <Box
            bg="white"
            rounded="2xl"
            p={adjustSizeToResolveZoomInIssue(baseSize * 0.05)}
            mt={adjustSizeToResolveZoomInIssue(baseSize * 0.03)}
            mb={adjustSizeToResolveZoomInIssue(baseSize * 0.05)}
            shadow={1}
          >
            {/* Status pill */}
            <HStack
              bg={projectStatus.background}
              px={adjustSizeToResolveZoomInIssue(baseSize * 0.02)}
              py={adjustSizeToResolveZoomInIssue(baseSize * 0.015)}
              rounded="full"
              alignSelf="flex-end"
              alignItems="center"
              space={1.5}
            >
              <Box w={1.5} h={1.5} rounded="full" bg={projectStatus.color} />
              <Text
                fontSize={fs.meta}
                fontWeight="600"
                color={projectStatus.color}
              >
                {projectStatus.status}
              </Text>
            </HStack>
            <HStack
              space={adjustSizeToResolveZoomInIssue(baseSize * 0.05)}
              alignItems="flex-start"
            >
              {/* Folder Icon */}
              <Center
                w={adjustSizeToResolveZoomInIssue(baseSize * 0.2)}
                h={adjustSizeToResolveZoomInIssue(baseSize * 0.2)}
                rounded="2xl"
                bg="indigo.50"
                flexShrink={0}
              >
                <Icon
                  as={Ionicons}
                  name="folder-open"
                  size={adjustSizeToResolveZoomInIssue(baseSize * 0.12)}
                  color="indigo.500"
                />
              </Center>

              {/* Title + Status */}
              <VStack flex={1} space={1}>
                <Text
                  fontSize={adjustSizeToResolveZoomInIssue(fs.header * 0.8)}
                  fontWeight="800"
                  color="coolGray.900"
                  lineHeight="sm"
                >
                  {project.projectHeader}
                </Text>
                <Text
                  fontSize={adjustSizeToResolveZoomInIssue(fs.subTitle)}
                  color="coolGray.500"
                  lineHeight="md"
                >
                  {project.projectDesc}
                </Text>
              </VStack>
            </HStack>
          </Box>

          {/* ══════════════════════════════════════════
                 SECTION 2 — Project Creator Section
          ══════════════════════════════════════════ */}
          <Box
            bg="white"
            rounded="2xl"
            mb={adjustSizeToResolveZoomInIssue(baseSize * 0.05)}
            py={adjustSizeToResolveZoomInIssue(baseSize * 0.05)}
            px={adjustSizeToResolveZoomInIssue(baseSize * 0.05)}
            shadow={1}
            overflow="hidden"
          >
            <VStack
              justifyContent={"center"}
              space={adjustSizeToResolveZoomInIssue(baseSize * 0.05)}
            >
              <Text
                fontSize={adjustSizeToResolveZoomInIssue(baseSize * 0.045)}
                fontWeight="700"
                color="coolGray.900"
              >
                Project Creator
              </Text>

              {/* Admin row */}
              <HStack
                flex={1}
                width={"100%"}
                justifyContent={"space-between"}
                alignItems="center"
                space={adjustSizeToResolveZoomInIssue(baseSize * 0.05)}
              >
                <HStack
                  alignItems="center"
                  space={adjustSizeToResolveZoomInIssue(baseSize * 0.04)}
                  flex={1}
                >
                  <NBAvatar
                    w={fs.icon}
                    h={fs.icon}
                    bg="indigo.500"
                    source={{ uri: project.admin?.profileImageUrl }}
                  >
                    {project.admin?.fullName?.charAt(0) || "A"}
                  </NBAvatar>
                  <VStack
                    justifyContent={"center"}
                    alignItems={"flex-start"}
                    flex={1}
                  >
                    <Text
                      fontSize={fs.subTitle}
                      fontWeight="700"
                      color="coolGray.900"
                      isTruncated
                    >
                      {project.admin.fullName}
                    </Text>
                    <Text fontSize={fs.meta} color="coolGray.500" isTruncated>
                      {project.admin?.email}
                    </Text>
                  </VStack>
                </HStack>
                <VStack justifyContent={"center"} alignItems={"flex-end"}>
                  <Text
                    fontSize={fs.subTitle}
                    fontWeight="700"
                    color="coolGray.900"
                  >
                    Role
                  </Text>
                  <Text
                    fontSize={fs.meta}
                    color={ROLE_CONFIG[project.userRole].color}
                  >
                    {project.userRole}
                  </Text>
                </VStack>
              </HStack>
            </VStack>
          </Box>

          {/* ══════════════════════════════════════════
                 SECTION 3 — Stats Grid
          ══════════════════════════════════════════ */}
          <Box
            bg="white"
            rounded="2xl"
            mb={adjustSizeToResolveZoomInIssue(baseSize * 0.05)}
            shadow={1}
            overflow="hidden"
          >
            {/* Row 1 */}
            <HStack
              divider={<Divider orientation="vertical" bg="coolGray.100" />}
            >
              {[
                {
                  action: FontAwesome,
                  icon: "tasks",
                  iconColor: "indigo.500",
                  value: project.totalTasksCount,
                  label: "Tasks",
                },
                {
                  action: MaterialIcons,
                  icon: "message",
                  iconColor: "indigo.500",
                  value: project.messageCount,
                  label: "Messages",
                },
              ].map((stat) => (
                <VStack
                  key={stat.label}
                  flex={1}
                  alignItems="center"
                  py={adjustSizeToResolveZoomInIssue(baseSize * 0.05)}
                  space={1}
                >
                  <Text
                    fontSize={adjustSizeToResolveZoomInIssue(fs.subTitle * 1.2)}
                    fontWeight="800"
                    color="coolGray.900"
                  >
                    {stat.value}
                  </Text>
                  <HStack
                    justifyContent={"center"}
                    alignItems={"center"}
                    space={"5%"}
                  >
                    <Icon
                      as={stat.action ?? Ionicons}
                      name={stat.icon as any}
                      size={adjustSizeToResolveZoomInIssue(fs.icon * 0.6)}
                      color={stat.iconColor}
                    />

                    <Text fontSize={fs.subTitle} color="coolGray.500">
                      {stat.label}
                    </Text>
                  </HStack>
                </VStack>
              ))}
            </HStack>

            <Divider bg="coolGray.100" />

            {/* Row 2 */}
            <HStack
              divider={<Divider orientation="vertical" bg="coolGray.100" />}
            >
              {[
                {
                  action: Ionicons,
                  icon: "people-outline",
                  iconColor: "indigo.500",
                  value: project.membersCount,
                  label: "Members",
                },
                {
                  action: Octicons,
                  icon: "tasklist",
                  iconColor: "green.500",
                  value: project.completedTaskCount,
                  label: "Completed",
                },
              ].map((stat) => (
                <VStack
                  key={stat.label}
                  flex={1}
                  alignItems="center"
                  py={adjustSizeToResolveZoomInIssue(baseSize * 0.05)}
                  space={1}
                >
                  <Text
                    fontSize={adjustSizeToResolveZoomInIssue(fs.subTitle * 1.2)}
                    fontWeight="800"
                    color="coolGray.900"
                  >
                    {stat.value}
                  </Text>
                  <HStack
                    justifyContent={"center"}
                    alignItems={"center"}
                    space={"5%"}
                  >
                    <Icon
                      as={stat.action ?? Ionicons}
                      name={stat.icon as any}
                      size={adjustSizeToResolveZoomInIssue(fs.icon * 0.6)}
                      color={stat.iconColor}
                    />

                    <Text fontSize={fs.subTitle} color="coolGray.500">
                      {stat.label}
                    </Text>
                  </HStack>
                </VStack>
              ))}
            </HStack>
          </Box>

          {/* ══════════════════════════════════════════
                 SECTION 4 — Priority / Deadline / Created
          ══════════════════════════════════════════ */}
          <Box
            bg="white"
            rounded="2xl"
            mb={adjustSizeToResolveZoomInIssue(baseSize * 0.05)}
            shadow={1}
            overflow="hidden"
          >
            <HStack
              divider={<Divider orientation="vertical" bg="coolGray.100" />}
            >
              {/* Priority */}
              <VStack
                p={adjustSizeToResolveZoomInIssue(baseSize * 0.02)}
                space={adjustSizeToResolveZoomInIssue(baseSize * 0.01)}
                alignItems={"center"}
                flex={1}
              >
                {isAdmin && (
                  <Box position={"absolute"} right={0} top={1}>
                    <Pressable
                      isDisabled={isCompleted}
                      alignItems="center"
                      justifyContent="center"
                      onPress={onClickUpdatePriority}
                    >
                      <Icon
                        as={FontAwesome}
                        name="pencil-square-o"
                        size={adjustSizeToResolveZoomInIssue(fs.icon * 0.7)}
                        color={isCompleted ? "coolGray.200" : "indigo.500"}
                      />
                    </Pressable>
                  </Box>
                )}
                <Text fontSize={fs.meta} color="coolGray.400">
                  Priority
                </Text>
                <HStack alignItems="center" space={1.5}>
                  <Icon
                    as={Ionicons}
                    name={priorityCfg.icon}
                    size={adjustSizeToResolveZoomInIssue(fs.icon * 0.6)}
                    color={priorityCfg.color}
                  />
                  <Text
                    fontSize={fs.subTitle}
                    fontWeight="700"
                    color={priorityCfg.color}
                  >
                    {project.priority?.charAt(0) +
                      project.priority?.slice(1).toLowerCase()}{" "}
                  </Text>
                </HStack>
              </VStack>

              {/* Deadline */}
              <VStack
                p={adjustSizeToResolveZoomInIssue(baseSize * 0.02)}
                space={adjustSizeToResolveZoomInIssue(baseSize * 0.01)}
                alignItems={"center"}
                flex={1}
              >
                {isAdmin && (
                  <Box position={"absolute"} right={0} top={1}>
                    <Pressable
                      isDisabled={isCompleted}
                      alignItems="center"
                      justifyContent="center"
                      onPress={onClickUpdateDeadline}
                    >
                      <Icon
                        as={FontAwesome}
                        name="pencil-square-o"
                        size={adjustSizeToResolveZoomInIssue(fs.icon * 0.7)}
                        color={isCompleted ? "coolGray.200" : "indigo.500"}
                      />
                    </Pressable>
                  </Box>
                )}

                <Text fontSize={fs.meta} color="coolGray.400">
                  Deadline
                </Text>
                <HStack
                  alignItems="center"
                  space={adjustSizeToResolveZoomInIssue(baseSize * 0.01)}
                >
                  <Icon
                    as={Ionicons}
                    name="calendar-outline"
                    size={adjustSizeToResolveZoomInIssue(fs.icon * 0.6)}
                    color="indigo.500"
                  />
                  <Text
                    fontSize={adjustSizeToResolveZoomInIssue(fs.meta * 0.9)}
                    fontWeight="700"
                    color={
                      projectStatus.status === "Overdue"
                        ? projectStatus.color
                        : "coolGray.900"
                    }
                  >
                    {formatDate(project.projectDeadline)}
                  </Text>
                </HStack>
              </VStack>

              {/* Created At */}
              <VStack
                p={adjustSizeToResolveZoomInIssue(baseSize * 0.02)}
                space={adjustSizeToResolveZoomInIssue(baseSize * 0.01)}
                alignItems={"center"}
                flex={1}
              >
                <Text fontSize={fs.meta} color="coolGray.400">
                  Created At
                </Text>
                <HStack
                  alignItems="center"
                  space={adjustSizeToResolveZoomInIssue(baseSize * 0.01)}
                >
                  <Icon
                    as={Ionicons}
                    name="calendar-clear-outline"
                    size={adjustSizeToResolveZoomInIssue(fs.icon * 0.6)}
                    color="indigo.500"
                  />
                  <Text
                    width={"70%"}
                    fontSize={adjustSizeToResolveZoomInIssue(fs.meta * 0.85)}
                    fontWeight="700"
                    color="coolGray.900"
                  >
                    {formatDate(project.createdAt, true)}
                  </Text>
                </HStack>
              </VStack>
            </HStack>
          </Box>

          {/* ══════════════════════════════════════════
                 SECTION 5 — Quick Actions
          ══════════════════════════════════════════ */}
          <Text
            fontSize={fs.title}
            fontWeight="700"
            color="coolGray.900"
            mb={adjustSizeToResolveZoomInIssue(baseSize * 0.05)}
          >
            Quick Actions
          </Text>

          <HStack
            bg="white"
            rounded="2xl"
            mb={adjustSizeToResolveZoomInIssue(baseSize * 0.05)}
            shadow={1}
            divider={<Divider orientation="vertical" bg="coolGray.100" />}
          >
            {[
              {
                icon: "person-add-outline",
                iconColor: "blue.500",
                label: "Add Member",
                onPress: onHandleClickAddMember,
                show: isAdmin,
              },
              {
                iconType: MaterialIcons,
                icon: "post-add",
                iconColor: "green.500",
                label: "Create Task",
                onPress: () => {
                  navigation.navigate("CreateTaskScreen", {
                    taskType: "PROJECT",
                    project: project,
                    onBack: () => {
                      navigation.goBack();
                    },
                  });
                },
                show: isAdmin || isEditor,
              },
              {
                iconType: MaterialCommunityIcons,
                icon: "message-plus",
                iconColor: "indigo.500",
                label: "Messages",
                onPress: () => {
                  console.log(`Create Messages is Call`);
                  onHandleClickMessageButton();
                },
                show: true,
              },
              {
                iconType: FontAwesome,
                icon: "edit",
                iconColor: "amber.500",
                label: "Edit Project",
                onPress: () => {
                  setIsDisplayUpdateComponent(true);
                },
                show: isAdmin,
              },
            ]
              .filter((a) => a.show)
              .map((action) => (
                <Pressable
                  disabled={isCompleted}
                  key={action.label}
                  flex={1}
                  onPress={action.onPress}
                >
                  {({ isPressed }) => (
                    <VStack
                      alignItems="center"
                      py={adjustSizeToResolveZoomInIssue(baseSize * 0.02)}
                      space={adjustSizeToResolveZoomInIssue(baseSize * 0.03)}
                      opacity={isPressed ? 0.7 : 1}
                    >
                      <Icon
                        as={action.iconType ?? Ionicons}
                        name={action.icon as any}
                        size={adjustSizeToResolveZoomInIssue(fs.icon * 0.8)}
                        color={isCompleted ? "coolGray.200" : action.iconColor}
                      />
                      <Text
                        fontSize={fs.meta}
                        fontWeight="600"
                        color="coolGray.700"
                        textAlign="center"
                      >
                        {action.label}
                      </Text>
                    </VStack>
                  )}
                </Pressable>
              ))}
          </HStack>

          {/* ══════════════════════════════════════════
                 SECTION 6 — Recent Tasks
          ══════════════════════════════════════════ */}
          <HStack
            justifyContent="space-between"
            alignItems="center"
            mb={adjustSizeToResolveZoomInIssue(baseSize * 0.05)}
          >
            <Text fontSize={fs.title} fontWeight="700" color="coolGray.900">
              Recent Tasks
            </Text>
            <Pressable onPress={onClickViewAllTask}>
              <Text fontSize={fs.subTitle} color="indigo.500" fontWeight="600">
                View all tasks →
              </Text>
            </Pressable>
          </HStack>

          {taskError ? (
            <Box
              bg="white"
              rounded="2xl"
              p={adjustSizeToResolveZoomInIssue(baseSize * 0.1)}
              alignItems="center"
              shadow={1}
              mb={adjustSizeToResolveZoomInIssue(baseSize * 0.05)}
            >
              <Text color="red.500" fontWeight="bold" textAlign="center">
                {taskError}
              </Text>
            </Box>
          ) : !tasks.length ? (
            <Box
              bg="white"
              rounded="2xl"
              p={adjustSizeToResolveZoomInIssue(baseSize * 0.1)}
              alignItems="center"
              shadow={1}
              mb={adjustSizeToResolveZoomInIssue(baseSize * 0.05)}
            >
              <Text color="coolGray.400" fontSize={fs.meta * 1.4}>
                No tasks yet
              </Text>
            </Box>
          ) : (
            <Box
              bg="white"
              rounded="2xl"
              shadow={1}
              overflow="hidden"
              mb={adjustSizeToResolveZoomInIssue(baseSize * 0.05)}
            >
              {tasks?.slice(0, DEFAULT_RECENT_TASK_LIMIT).map((task, index) => {
                const tPriority =
                  PRIORITY_CONFIG[task.priority] ?? PRIORITY_CONFIG.MEDIUM;

                return (
                  <Pressable
                    key={task.taskId}
                    onPress={() =>
                      navigation.navigate("TaskDetail", {
                        taskId: task.taskId,
                        projectId: project.projectId,

                      })
                    }
                  >
                    {({ isPressed }) => (
                      <HStack
                        alignItems="center"
                        px={"2%"}
                        py={adjustSizeToResolveZoomInIssue(baseSize * 0.035)}
                        borderBottomWidth={index !== tasks.length - 1 ? 1 : 0}
                        borderBottomColor="coolGray.100"
                        space={"4%"}
                        width={"100%"}
                        opacity={isPressed ? 0.7 : 1}
                      >
                        {/* Priority flag */}
                        <Box
                          width={"10%"}
                          justifyContent={"center"}
                          alignItems={"center"}
                        >
                          <Icon
                            as={FontAwesome}
                            name="tasks"
                            size={adjustSizeToResolveZoomInIssue(fs.icon * 0.6)}
                            color={"indigo.500"}
                          />
                        </Box>

                        {/* Task name */}
                        <Box
                          width={"36%"}
                          justifyContent={"center"}
                          alignItems={"flex-start"}
                        >
                          <Text
                            fontSize={adjustSizeToResolveZoomInIssue(
                              fs.subTitle,
                            )}
                            fontWeight="600"
                            color="coolGray.900"
                            isTruncated
                            noOfLines={1}
                          >
                            {task.taskHeader}
                          </Text>
                        </Box>

                        <Box
                          width={"30%"}
                          justifyContent={"center"}
                          alignItems={"center"}
                        >
                          <VStack
                            width={"100%"}
                            justifyContent={"center"}
                            alignItems={"center"}
                            space={adjustSizeToResolveZoomInIssue(
                              baseSize * 0.02,
                            )}
                          >
                            {/* Deadline */}
                            <HStack
                              width={"100%"}
                              justifyContent={"center"}
                              alignItems="center"
                              space={adjustSizeToResolveZoomInIssue(
                                baseSize * 0.02,
                              )}
                            >
                              <Icon
                                as={Ionicons}
                                name="calendar-outline"
                                size={adjustSizeToResolveZoomInIssue(
                                  fs.icon * 0.45,
                                )}
                                color="coolGray.400"
                              />
                              <Text fontSize={fs.meta} color="coolGray.500">
                                {formatDate(task.taskDeadline)}
                              </Text>
                            </HStack>

                            <HStack
                              width={"100%"}
                              justifyContent={"center"}
                              alignItems={"center"}
                              space={baseSize * 0.04}
                            >
                              {/* Priority badge */}
                              <Box
                                bg={tPriority.bg}
                                px={adjustSizeToResolveZoomInIssue(
                                  baseSize * 0.02,
                                )}
                                py={adjustSizeToResolveZoomInIssue(
                                  baseSize * 0.008,
                                )}
                                rounded="md"
                              >
                                <Text
                                  fontSize={fs.meta}
                                  fontWeight="700"
                                  color={tPriority.color}
                                >
                                  {task.priority?.charAt(0) +
                                    task.priority?.slice(1).toLowerCase()}
                                </Text>
                              </Box>

                              {/* Comment count */}
                              <HStack alignItems="center" space={1}>
                                <Icon
                                  as={MaterialIcons}
                                  name="message"
                                  size={adjustSizeToResolveZoomInIssue(
                                    fs.icon * 0.55,
                                  )}
                                  color="coolGray.400"
                                />
                                <Text fontSize={fs.meta} color="coolGray.500">
                                  {task.messageCount ?? 0}
                                </Text>
                              </HStack>
                            </HStack>
                          </VStack>
                        </Box>
                        <Box
                          width={"10%"}
                          justifyContent={"flex-end"}
                          alignItems={"center"}
                        >
                          <Icon
                            as={Ionicons}
                            name="chevron-forward-outline"
                            size={adjustSizeToResolveZoomInIssue(fs.icon * 0.8)}
                            color="violet.500"
                          />
                        </Box>
                      </HStack>
                    )}
                  </Pressable>
                );
              })}
            </Box>
          )}

          {/* ══════════════════════════════════════════
                 SECTION 7 — Recent Messages
          ══════════════════════════════════════════ */}
          <RecentMessages
            type="PROJECT"
            baseSize={baseSize}
            fs={fs}
            projectId={project.projectId}
            currentUserId={user?.userId}
            isCompleted={project.status}
            loginUserRole={project.userRole}
          />

          {/* ══════════════════════════════════════════
                 SECTION 8 — Team Members
          ══════════════════════════════════════════ */}
          <ProjectTeamMembers
            projectId={project.projectId}
            userId={user!.userId}
            isAdmin={isAdmin}
            baseSize={baseSize}
            fs={fs}
            onClickViewAll={() => setIsDisplayMemberList(true)}
            isProjectCompleted={isCompleted}
          />
        </VStack>
      </KeyboardAwareScrollView>
    </Box>
  );
}
