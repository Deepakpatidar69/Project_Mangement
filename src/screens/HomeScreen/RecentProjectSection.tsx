import React, { useEffect } from "react";
import {
  View,
  Pressable,
  FlatList,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useDispatch, useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import { useSetAtom } from "jotai";
import { AppDispatch, RootState } from "../../store";
import { clearProjectError, fetchDashboardProjects } from "../../store/slices/ProjectSlice";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteStackParamStack } from "../../appNavigator/navigator.utils";
import { useContainerDimensions } from "../../hooks/OnlayoutHooks";
import {
  adjustSizeToResolveZoomInIssue,
  getShortText,
} from "../../utils/Helper";
import { ProjectProps } from "../../store/slices/types";
import { Ionicons } from "@expo/vector-icons";
import { Box, HStack, Icon, Text } from "native-base";
import { getStatus } from "../utils/screen.utils";
import { isDisplayErrorMessageAtom } from "../../utils/Constent"; // adjust path to where you defined this atom
import AppLoader from "../../components/CustomLoader";

// ─── Theme Map ────────────────────────────────────────────────────────────────

const THEMES = {
  purple: {
    gradient: ["#2d1f6e", "#4c3abf"] as [string, string],
    progressStart: "#c7b6ff",
    progressEnd: "#ffffff",
    avatarBg: "rgba(167,139,250,0.35)",
    icon: "grid-outline" as const,
  },
  blue: {
    gradient: ["#0d3060", "#1a6fda"] as [string, string],
    progressStart: "#7cc4ff",
    progressEnd: "#ffffff",
    avatarBg: "rgba(96,165,250,0.35)",
    icon: "code-slash-outline" as const,
  },
  green: {
    gradient: ["#063d28", "#10a06a"] as [string, string],
    progressStart: "#6effd5",
    progressEnd: "#a7f3d0",
    avatarBg: "rgba(52,211,153,0.35)",
    icon: "bag-handle-outline" as const,
  },
  orange: {
    gradient: ["#5c2e00", "#d47e00"] as [string, string],
    progressStart: "#fcd58a",
    progressEnd: "#fff4c2",
    avatarBg: "rgba(251,191,36,0.35)",
    icon: "layers-outline" as const,
  },
} as const;

type ThemeKey = keyof typeof THEMES;
const THEME_CYCLE: ThemeKey[] = ["purple", "blue", "green", "orange"];

// ─── ProjectCard ──────────────────────────────────────────────────────────────

interface ProjectCardProps {
  project: ProjectProps;
  cardWidth: number;
  colorTheme?: ThemeKey;
  onTapProject: (projectId: string) => void;
}

const ProjectRaw = ({
  project,
  cardWidth,
  colorTheme = "purple",
  onTapProject,
}: ProjectCardProps) => {
  const theme = THEMES[colorTheme];

  const creatorName = project.admin?.fullName ?? "Unknown";
  const creatorInitial = creatorName?.charAt(0).toUpperCase();
  const avatarUri = project.admin?.profileImgUrl;

  const percentage =
    project.totalTasksCount > 0
      ? Math.round((project.completedTaskCount / project.totalTasksCount) * 100)
      : 0;

  const projectStatus = getStatus(project.status, project.projectDeadline);

  const baseSize = cardWidth;

  return (
    <Pressable
      onPress={() => onTapProject(project.projectId)}
      style={({ pressed }) => ({
        width: cardWidth,
        opacity: pressed ? 0.88 : 1,
        transform: [{ scale: pressed ? 0.97 : 1 }],
      })}
    >
      <LinearGradient
        colors={theme.gradient}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: "100%",
          borderRadius: baseSize * 0.1,
          padding: baseSize * 0.1,
          paddingBottom: baseSize * 0.1,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.18)",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.28,
          shadowRadius: 16,
        }}
      >
        {/* Decorative ghost circle */}
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: -40,
            right: -40,
            width: 120,
            height: 120,
            borderRadius: 60,
            backgroundColor: "rgba(255,255,255,0.09)",
          }}
        />
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            bottom: -30,
            left: -20,
            width: baseSize * 0.5,
            height: baseSize * 0.5,
            borderRadius: 40,
            backgroundColor: "rgba(255,255,255,0.05)",
          }}
        />

        {/* ── Row 1: Icon + Status Badge ── */}
        <View
          style={{
            width: "100%",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 14,
          }}
        >
          {/* Icon box */}
          <View
            style={{
              width: baseSize * 0.25,
              height: baseSize * 0.25,
              borderRadius: baseSize * 0.08,
              backgroundColor: "rgba(255,255,255,0.15)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.22)",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Ionicons
              name={theme.icon}
              size={adjustSizeToResolveZoomInIssue(baseSize * 0.15)}
              color="rgba(255,255,255,0.92)"
            />
          </View>

          {projectStatus && (
            <HStack
              bg={projectStatus.background}
              px={adjustSizeToResolveZoomInIssue(baseSize * 0.02)}
              py={adjustSizeToResolveZoomInIssue(baseSize * 0.01)}
              rounded="full"
              alignItems="center"
              space={adjustSizeToResolveZoomInIssue(baseSize * 0.01)}
              // height={adjustSizeToResolveZoomInIssue(baseSize * 0.055)}
            >
              <Icon
                as={projectStatus.iconType}
                name={projectStatus.iconName}
                size={adjustSizeToResolveZoomInIssue(baseSize * 0.085)}
                color={projectStatus.color}
              />
              <Text
                style={{
                  fontSize: adjustSizeToResolveZoomInIssue(baseSize * 0.06),
                  fontWeight: "600",
                  color: projectStatus.color,
                }}
              >
                {projectStatus.status}
              </Text>
            </HStack>
          )}
        </View>

        {/* ── Row 2: Title + Task Count ── */}
        <View style={{ marginBottom: baseSize * 0.05 }}>
          <Text
            numberOfLines={1}
            style={{
              fontSize: adjustSizeToResolveZoomInIssue(baseSize * 0.08),
              fontWeight: "700",
              color: "#ffffff",
              marginBottom: adjustSizeToResolveZoomInIssue(baseSize * 0.05),
            }}
          >
            {getShortText(project.projectHeader, 50)}
          </Text>
          <Text
            style={{
              fontSize: adjustSizeToResolveZoomInIssue(baseSize * 0.065),
              color: "rgba(255,255,255,0.5)",
              fontWeight: "500",
            }}
          >
            {project.totalTasksCount} tasks · {project.completedTaskCount} done
          </Text>
        </View>

        {/* ── Row 3: Progress Bar ── */}
        <View style={{ marginBottom: baseSize * 0.05 }}>
          {/* Labels */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: baseSize * 0.02,
            }}
          >
            <Text
              style={{
                fontSize: adjustSizeToResolveZoomInIssue(baseSize * 0.056),
                fontWeight: "600",
                color: "rgba(255,255,255,0.55)",
              }}
            >
              Progress
            </Text>
            <Text
              style={{
                fontSize: adjustSizeToResolveZoomInIssue(baseSize * 0.05),
                fontWeight: "700",
                color: "rgba(255,255,255,0.85)",
              }}
            >
              {percentage}%
            </Text>
          </View>

          {/* Track */}
          <View
            style={{
              height: baseSize * 0.03,
              borderRadius: baseSize * 0.1,
              backgroundColor: "rgba(255,255,255,0.15)",
              overflow: "hidden",
            }}
          >
            <LinearGradient
              colors={[theme.progressStart, theme.progressEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                height: "100%",
                width: `${percentage}%`,
                borderRadius: baseSize * 0.1,
              }}
            />
          </View>
        </View>

        {/* ── Divider ── */}
        <View
          style={{
            height: 1,
            backgroundColor: "rgba(255,255,255,0.1)",
            marginBottom: baseSize * 0.05,
          }}
        />

        {/* ── Row 4: Admin Info ── */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: baseSize * 0.05,
          }}
        >
          {/* Avatar */}
          {avatarUri ? (
            <Image
              source={{ uri: avatarUri }}
              style={{
                width: baseSize * 0.18,
                height: baseSize * 0.18,
                borderRadius: baseSize * 0.1,
                borderWidth: 1.5,
                borderColor: "rgba(255,255,255,0.3)",
              }}
            />
          ) : (
            <View
              style={{
                width: baseSize * 0.18,
                height: baseSize * 0.18,
                borderRadius: baseSize * 0.1,
                backgroundColor: theme.avatarBg,
                borderWidth: 1.5,
                borderColor: "rgba(255,255,255,0.25)",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontSize: adjustSizeToResolveZoomInIssue(baseSize * 0.08),
                  fontWeight: "700",
                  color: "#fff",
                }}
              >
                {creatorInitial}
              </Text>
            </View>
          )}

          {/* Name + label */}
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text
              style={{
                fontSize: adjustSizeToResolveZoomInIssue(baseSize * 0.06),
                color: "rgba(255,255,255,0.4)",
                marginBottom: 1,
              }}
            >
              Admin
            </Text>
            <Text
              numberOfLines={1}
              style={{
                fontSize: adjustSizeToResolveZoomInIssue(baseSize * 0.065),
                fontWeight: "600",
                color: "rgba(255,255,255,0.9)",
              }}
            >
              {creatorName}
            </Text>
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  );
};

// ─── RecentProjectsSection ────────────────────────────────────────────────────

export const RecentProjectsSection = ({
  onTapViewAllProjects,
  onClickCreateProject,
}: {
  onTapViewAllProjects: () => void;
  onClickCreateProject: () => void;
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation =
    useNavigation<NativeStackNavigationProp<RouteStackParamStack>>();

  const { latestProjects, projectLoading, projectError } = useSelector(
    (state: RootState) => state.project.dashboard,
  );

  const { containerDimensions, onLayout } = useContainerDimensions();

  // Global error modal setter
  const setErrorModal = useSetAtom(isDisplayErrorMessageAtom);

  // 2 cards visible + slight peek of 3rd
  const CARD_WIDTH =
    containerDimensions.width > 0 ? containerDimensions.width * 0.52 : 180;

  const fontSize = adjustSizeToResolveZoomInIssue(
    containerDimensions.baseSize * 0.055,
  );

  const isEmpty = !latestProjects || latestProjects.length === 0;

  useEffect(() => {
    dispatch(fetchDashboardProjects());
  }, [dispatch]);

  // ── Show global error modal whenever the slice reports a project error ─────
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
            "Unable to fetch projects. Please try again."),
      onClickLeftButton: () => {
        dispatch(clearProjectError());
        navigation.goBack?.();
      },
    }));
  }, [projectError, setErrorModal, navigation]);

  const onTapProject = (projectId: string) => {
    navigation.navigate("ProjectDetail", { projectId: projectId });
  };
  // ── renderItem ──────────────────────────────────────────────────────────────
  const renderItem = ({
    item,
    index,
  }: {
    item: ProjectProps;
    index: number;
  }) => (
    <ProjectRaw
      project={item}
      cardWidth={CARD_WIDTH}
      colorTheme={THEME_CYCLE[index % THEME_CYCLE.length]}
      onTapProject={onTapProject}
    />
  );

  // ── keyExtractor ────────────────────────────────────────────────────────────
  const keyExtractor = (item: ProjectProps) => item.projectId;

  // ── Empty state ─────────────────────────────────────────────────────────────
  const ListEmptyComponent = () => (
    <View
      style={{
        width: containerDimensions.width || 300,
        paddingVertical: 32,
        backgroundColor: "#fff",
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderStyle: "dashed",
      }}
    >
      <Ionicons
        name="folder-open-outline"
        size={40}
        color="#d1d5db"
        style={{ marginBottom: 12 }}
      />
      <Text
        style={{
          fontSize: 14,
          color: "#9ca3af",
          marginBottom: 16,
        }}
      >
        No projects found.
      </Text>
      <Pressable
        onPress={onClickCreateProject}
        style={({ pressed }) => [
          // 1. Static base styles
          {
            backgroundColor: "#5B3FFF", // Hex code for violet-600
            paddingHorizontal: "5%",
            paddingVertical: "2%",
            borderRadius: 20,
          },
          // 2. Dynamic styles applied only when pressed
          pressed && {
            opacity: 0.7,
            transform: [{ scale: 0.9 }],
          },
        ]}
      >
        <Text
          style={{
            color: "#fff",
            fontSize: 13,
            fontWeight: "700",
          }}
        >
          + Create New Project
        </Text>
      </Pressable>
    </View>
  );

  return (
    <View style={{ width: "100%" }} onLayout={onLayout}>
      {containerDimensions.width > 0 && (
        <View style={{ width: "100%" }}>
          {/* ── Header ── */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <Text
              style={{
                fontSize: fontSize,
                fontWeight: "700",
                color: "#111827",
              }}
            >
              Recent Projects
            </Text>
            <Pressable onPress={onTapViewAllProjects}>
              <Text
                fontSize={fontSize * 0.85}
                color={"violet.600"}
                fontWeight={"500"}
              >
                View All
              </Text>
            </Pressable>
          </View>

          {/* ── Body ── */}
          {projectLoading ? (
            <Box
              bg={"white"}
              borderRadius={adjustSizeToResolveZoomInIssue(
                containerDimensions.width * 0.04,
              )}
              borderWidth={adjustSizeToResolveZoomInIssue(
                containerDimensions.width * 0.005,
              )}
              borderColor={"coolGray.100"}
              py={adjustSizeToResolveZoomInIssue(
                containerDimensions.width * 0.1,
              )}
              alignItems={"center"}
            >
              <AppLoader
                isLoading
                fullScreen={false}
                message="project loading"
              />
            </Box>
          ) : (
            <FlatList
              data={latestProjects ?? []}
              keyExtractor={keyExtractor}
              renderItem={renderItem}
              horizontal
              // Nothing to scroll through when there are no projects — the
              // empty card just sits centered and static instead of behaving
              // like a (non-functional) horizontal scroller.
              scrollEnabled={!isEmpty}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={
                isEmpty
                  ? {
                      width: "100%",
                      justifyContent: "center",
                      alignItems: "center",
                    }
                  : {
                      paddingRight: CARD_WIDTH * 0.1,
                      columnGap: CARD_WIDTH * 0.05,
                    }
              }
              ListEmptyComponent={ListEmptyComponent}
              snapToInterval={isEmpty ? undefined : CARD_WIDTH} // card + marginRight
              snapToAlignment="start"
              decelerationRate="fast"
              style={{
                backgroundColor: "transparent",
                width: "100%",
              }}
            />
          )}
        </View>
      )}
    </View>
  );
};
