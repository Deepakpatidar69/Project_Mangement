import React, { useEffect, useMemo, useState } from "react";
import { Alert, Linking } from "react-native";
import {
  Avatar,
  Badge,
  Box,
  HStack,
  Icon,
  Pressable,
  ScrollView,
  Text,
  View,
  VStack,
} from "native-base";
// @ts-ignore
import Ionicons from "react-native-vector-icons/Ionicons";
// react-native-svg is the standard lightweight way to draw charts in RN
// without pulling in a heavier charting lib. If it's not installed yet:
//   yarn add react-native-svg   (or) npm i react-native-svg
import Svg, { Circle, Path } from "react-native-svg";
import { useSetAtom } from "jotai";
import { useNavigation } from "@react-navigation/native";
import { AppLoaderAtom } from "../../utils/Constent"; // Ensure this path is correct
import { useContainerDimensions } from "../../hooks/OnlayoutHooks";
import { CommonDetailHeader } from "../../components/CommonDetailHeader";
import { AuthProps, AuthProvider, Gender } from "../../store/slices/types";
import { adjustSizeToResolveZoomInIssue } from "../../utils/Helper";

// ─────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────

type ProfileTab = "OVERVIEW" | "ACTIVITY" | "PROJECTS" | "TASKS";

interface Scale {
  // Typography
  fsXs: number; // captions / small labels
  fsSm: number; // body text
  fsMd: number; // sub headings / section titles
  fsLg: number; // profile name
  fsXl: number; // stat highlight numbers

  // Spacing
  spXs: number;
  spSm: number;
  spMd: number;
  spLg: number;

  // Icon sizes
  iconSm: number;
  iconMd: number;

  // Component sizing
  avatarSize: number;
  bannerHeight: number;
  cardRadius: number;
}

interface UserProfileSectionProps {
  user: AuthProps | null;
  onTapBack?: () => void;
  isActive?: boolean;
  onTapEditProfile: () => void;
}

interface StatCardDef {
  label: string;
  value: number;
  icon: string;
  bg: string;
  iconColor: string;
}

// A single wedge of data for the pie/donut chart.
interface PieDatum {
  label: string;
  value: number;
  color: string;
}

const TABS: { key: ProfileTab; label: string }[] = [
  { key: "OVERVIEW", label: "Overview" },
  { key: "ACTIVITY", label: "Activity" },
  { key: "PROJECTS", label: "Projects" },
  { key: "TASKS", label: "Tasks" },
];

// ─────────────────────────────────────────────────────────────────────────
// Small formatting helpers
// ─────────────────────────────────────────────────────────────────────────

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatGender(gender?: Gender | null) {
  switch (gender) {
    case "MALE":
      return "Male";
    case "FEMALE":
      return "Female";
    case "OTHER":
      return "Other";
    case "PREFER_NOT_TO_SAY":
      return "Prefer not to say";
    default:
      return "—";
  }
}

function formatLocation(user: AuthProps | null) {
  if (!user) return "";
  return [user.city, user.state, user.country].filter(Boolean).join(", ");
}

// Same as formatDate but keeps the time component — used for timestamps
// like lastLoginAt / emailVerifiedAt where "when" matters, not just the day.
function formatDateTime(dateStr?: string | null) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatAuthProvider(provider?: AuthProvider | string | null) {
  if (!provider) return "—";
  const str = String(provider);
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function getInitials(user: AuthProps) {
  const first = user.firstName?.charAt(0) ?? "";
  const last = user.lastName?.charAt(0) ?? "";
  return `${first}${last}`.toUpperCase();
}

// ─────────────────────────────────────────────────────────────────────────
// Pie / donut chart — pure SVG, no external chart dependency beyond
// react-native-svg. Renders a legend alongside the chart with each
// segment's share of the total as a percentage.
// ─────────────────────────────────────────────────────────────────────────

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  };
}

function describeSlice(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
) {
  // A full-circle slice (single non-zero segment) can't be drawn as one
  // arc path (start === end), so fall back to a plain circle for that case
  // at the call site instead of hitting this helper.
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return [
    "M",
    cx,
    cy,
    "L",
    start.x,
    start.y,
    "A",
    r,
    r,
    0,
    largeArcFlag,
    0,
    end.x,
    end.y,
    "Z",
  ].join(" ");
}

function PieChart({
  data,
  size,
  scale,
}: {
  data: PieDatum[];
  size: number;
  scale: Scale;
}) {
  const total = data.reduce((sum, d) => sum + Math.max(d.value, 0), 0);
  const radius = size / 2;
  const holeRadius = radius * 0.58; // turns the pie into a donut

  const slices = useMemo(() => {
    if (total <= 0) return [];
    let cumulativeAngle = 0;
    return data
      .filter((d) => d.value > 0)
      .map((d) => {
        const angle = (d.value / total) * 360;
        const startAngle = cumulativeAngle;
        const endAngle = cumulativeAngle + angle;
        cumulativeAngle = endAngle;
        return { ...d, startAngle, endAngle };
      });
  }, [data, total]);

  const isSingleSlice = slices.length === 1;

  return (
    <HStack alignItems="center" space={scale.spMd}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {total <= 0 ? (
          <Circle cx={radius} cy={radius} r={radius} fill="#E5E7EB" />
        ) : isSingleSlice ? (
          <Circle cx={radius} cy={radius} r={radius} fill={slices[0].color} />
        ) : (
          slices.map((slice) => (
            <Path
              key={slice.label}
              d={describeSlice(
                radius,
                radius,
                radius,
                slice.startAngle,
                slice.endAngle,
              )}
              fill={slice.color}
            />
          ))
        )}
        {/* donut hole */}
        <Circle cx={radius} cy={radius} r={holeRadius} fill="white" />
      </Svg>

      <VStack space={scale.spXs} flex={1}>
        {data.map((d) => (
          <HStack
            key={d.label}
            alignItems="center"
            justifyContent="space-between"
          >
            <HStack alignItems="center" space={scale.spXs} flexShrink={1}>
              <Box
                w={2.5}
                h={2.5}
                borderRadius="full"
                bg={d.color}
                flexShrink={0}
              />
              <Text
                fontSize={scale.fsXs}
                color="coolGray.600"
                numberOfLines={1}
              >
                {d.label}
              </Text>
            </HStack>
            <Text fontSize={scale.fsXs} fontWeight="700" color="coolGray.800">
              {total > 0 ? `${Math.round((d.value / total) * 100)}%` : "0%"}
            </Text>
          </HStack>
        ))}
      </VStack>
    </HStack>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Reusable row for the Personal Information card
// ─────────────────────────────────────────────────────────────────────────

function InfoRow({
  icon,
  label,
  value,
  scale,
}: {
  icon: string;
  label: string;
  value: string;
  scale: Scale;
}) {
  return (
    <HStack alignItems="center" justifyContent="space-between">
      <HStack alignItems="center" space={scale.spSm}>
        <Icon
          as={Ionicons}
          name={icon}
          size={scale.iconSm}
          color="coolGray.400"
        />
        <Text fontSize={scale.fsSm} color="coolGray.500">
          {label}
        </Text>
      </HStack>
      <Text fontSize={scale.fsSm} fontWeight="600" color="coolGray.800">
        {value}
      </Text>
    </HStack>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Reusable stat-card grid, used by both the Projects and Tasks tabs
// ─────────────────────────────────────────────────────────────────────────

function StatCardGrid({
  stats,
  scale,
}: {
  stats: StatCardDef[];
  scale: Scale;
}) {
  return (
    <HStack flexWrap="wrap" justifyContent="space-between">
      {stats.map((stat) => (
        <Box
          key={stat.label}
          width="48%"
          bg={stat.bg}
          borderRadius={scale.cardRadius}
          p={scale.spSm}
          mb={scale.spSm}
        >
          <HStack justifyContent="space-between" alignItems="flex-start">
            <VStack>
              <Text fontSize={scale.fsXl} fontWeight="700" color="coolGray.800">
                {stat.value}
              </Text>
              <Text fontSize={scale.fsXs} color="coolGray.500">
                {stat.label}
              </Text>
            </VStack>
            <Icon
              as={Ionicons}
              name={stat.icon}
              size={scale.iconSm}
              color={stat.iconColor}
            />
          </HStack>
        </Box>
      ))}
    </HStack>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────

function UserProfileSection({
  user,
  isActive = true,
  onTapBack,
  onTapEditProfile,
}: UserProfileSectionProps) {
  const { containerDimensions, onLayout } = useContainerDimensions();
  const [activeTab, setActiveTab] = useState<ProfileTab>("OVERVIEW");

  const setDisplayAppLoader = useSetAtom(AppLoaderAtom);
  const navigation = useNavigation<any>();

  const handleChangePassword = () => {
    // Rename "ChangePassword" to match your actual route name if different.
    navigation.navigate("ChangePassword");
  };

  const handleSocialLink = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Unable to open link", url);
      }
    } catch (err) {
      Alert.alert("Something went wrong", "Could not open this link.");
    }
  };

  // ── Global loader control, same pattern as DashBoardSection ─────────────
  useEffect(() => {
    if (!isActive) return;

    if (containerDimensions.baseSize === 0) {
      setDisplayAppLoader({ isLoading: true, message: "Profile Loading" });
      return;
    }

    setDisplayAppLoader({ isLoading: false, message: "" });
  }, [containerDimensions.baseSize, setDisplayAppLoader, isActive]);

  useEffect(() => {
    return () => {
      setDisplayAppLoader({ isLoading: false, message: "" });
    };
  }, [setDisplayAppLoader]);

  const { width, height, baseSize } = containerDimensions;

  const scale = useMemo<Scale | null>(() => {
    if (baseSize === 0) return null;

    const newBaseSize = baseSize * 1.2;

    return {
      fsXs: newBaseSize * 0.028,
      fsSm: newBaseSize * 0.032,
      fsMd: newBaseSize * 0.038,
      fsLg: newBaseSize * 0.048,
      fsXl: newBaseSize * 0.056,

      spXs: newBaseSize * 0.01,
      spSm: newBaseSize * 0.02,
      spMd: newBaseSize * 0.035,
      spLg: newBaseSize * 0.05,

      iconSm: newBaseSize * 0.045,
      iconMd: newBaseSize * 0.06,

      avatarSize: newBaseSize * 0.22,
      bannerHeight: height * 0.16,
      cardRadius: newBaseSize * 0.035,
    };
  }, [baseSize, height]);

  // Donut size, derived the same way the rest of the scale values are.
  const pieSize = useMemo(() => {
    if (baseSize === 0) return 0;
    return Math.round(baseSize * 0.42);
  }, [baseSize]);

  if (!user) return null;

  const location = formatLocation(user);

  const socialLinks = [
    {
      key: "linkedin",
      url: user.linkedinUrl,
      icon: "logo-linkedin",
      label: "LinkedIn",
    },
    {
      key: "github",
      url: user.githubUrl,
      icon: "logo-github",
      label: "GitHub",
    },
    {
      key: "twitter",
      url: user.twitterUrl,
      icon: "logo-twitter",
      label: "Twitter",
    },
    {
      key: "website",
      url: user.website,
      icon: "globe-outline",
      label: "Website",
    },
    {
      key: "portfolio",
      url: user.portfolioUrl,
      icon: "briefcase-outline",
      label: "Portfolio",
    },
  ].filter((s): s is typeof s & { url: string } => !!s.url);

  // Overview tab summary cards (unchanged)
  const statCards: StatCardDef[] = [
    {
      label: "Projects",
      value: user.stats?.totalProjects ?? 0,
      icon: "folder-outline",
      bg: "indigo.50",
      iconColor: "coolGray.500",
    },
    {
      label: "Tasks Completed",
      value: user.stats?.completedTasks ?? 0,
      icon: "checkmark-circle-outline",
      bg: "green.50",
      iconColor: "coolGray.500",
    },
    {
      label: "Assigned Projects",
      value: user.stats?.totalAssignProjects ?? 0,
      icon: "layers-outline",
      bg: "amber.50",
      iconColor: "coolGray.500",
    },
    {
      label: "Comments",
      value: user.stats?.totalComments ?? 0,
      icon: "chatbubble-outline",
      bg: "purple.50",
      iconColor: "coolGray.500",
    },
  ];

  // Projects tab — Assigned / Created / Completed / In Progress / All
  // NOTE: assumes these keys exist on user.stats — adjust to match your
  // actual API response if the field names differ.
  const projectStatCards: StatCardDef[] = [
    {
      label: "Assigned",
      value: user.stats?.totalAssignProjects ?? 0,
      icon: "person-add-outline",
      bg: "indigo.50",
      iconColor: "indigo.600",
    },
    {
      label: "Created",
      value: user.stats?.totalMyProjects ?? 0,
      icon: "add-circle-outline",
      bg: "purple.50",
      iconColor: "purple.600",
    },
    {
      label: "In Progress",
      value: user.stats?.pendingProjects ?? 0,
      icon: "time-outline",
      bg: "amber.50",
      iconColor: "amber.600",
    },
    {
      label: "Completed",
      value: user.stats?.completedProjects ?? 0,
      icon: "checkmark-done-outline",
      bg: "green.50",
      iconColor: "green.600",
    },
    {
      label: "All Projects",
      value: user.stats?.totalProjects|| 0,
      icon: "folder-outline",
      bg: "coolGray.100", 
      iconColor: "coolGray.600",
    },
  ];

  // Donut breakdown for the Projects tab — reuses the same underlying
  // numbers as projectStatCards, just recolored for the chart legend.
  const projectPieData: PieDatum[] = [
    {
      label: "Assigned",
      value: user.stats?.totalAssignProjects ?? 0,
      color: "#6366F1",
    },
    {
      label: "Created",
      value: user.stats?.totalMyProjects ?? 0,
      color: "#A855F7",
    },
    {
      label: "In Progress",
      value: user.stats?.pendingProjects ?? 0,
      color: "#F59E0B",
    },
    {
      label: "Completed",
      value: user.stats?.completedProjects ?? 0,
      color: "#22C55E",
    },
  ];

  // Tasks tab — Total / In Progress / Completed
  // NOTE: same assumption — confirm totalTasks / inProgressTasks exist on
  // your stats shape.
  const taskStatCards: StatCardDef[] = [
    {
      label: "Total Tasks",
      value: user.stats?.totalTasks ?? 0,
      icon: "list-outline",
      bg: "indigo.50",
      iconColor: "indigo.600",
    },
    {
      label: "In Progress",
      value: user.stats?.pendingTasks ?? 0,
      icon: "time-outline",
      bg: "amber.50",
      iconColor: "amber.600",
    },
    {
      label: "Completed",
      value: user.stats?.completedTasks ?? 0,
      icon: "checkmark-done-outline",
      bg: "green.50",
      iconColor: "green.600",
    },
  ];

  // Donut breakdown for the Tasks tab. "Pending" fills in whatever's left
  // of the total once in-progress and completed are accounted for, so the
  // three wedges always add up to the reported total.
  const totalTasks = user.stats?.totalTasks ?? 0;
  const inProgressTasks = user.stats?.pendingTasks ?? 0;
  const completedTasks = user.stats?.completedTasks ?? 0;
  const otherTasks = Math.max(totalTasks - inProgressTasks - completedTasks, 0);

  const taskPieData: PieDatum[] = [
    { label: "Completed", value: completedTasks, color: "#22C55E" },
    { label: "In Progress", value: inProgressTasks, color: "#F59E0B" },
    { label: "Pending", value: otherTasks, color: "#CBD5E1" },
  ];

  return (
    <View flex={1} justifyContent={"center"} alignItems={"center"} px={"1%"}>
      <Box width={"100%"} height={"100%"} onLayout={onLayout}>
        {scale && (
          <VStack width={width} height={height}>
            <CommonDetailHeader
              title="Profile"
              subtitle="View and manage your personal information"
              onTabBackButton={() => {
                onTapBack?.();
              }}
              showEdit
              onEdit={onTapEditProfile}
              showMenuBar={false}
              fs={width}
            />

            <ScrollView
              width="100%"
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: height * 0.08 }}
            >
              {/* ── Profile card ─────────────────────────────────────── */}
              <Box
                width="100%"
                bg="white"
                borderRadius={scale.cardRadius}
                overflow="hidden"
                shadow={1}
                mb={scale.spMd}
              >
                <Box height={scale.bannerHeight} bg="indigo.900" />

                <VStack
                  px={scale.spMd}
                  pb={scale.spMd}
                  mt={-(scale.avatarSize / 2)}
                >
                  <Box>
                    <Avatar
                      size={scale.avatarSize}
                      source={
                        user.profileImgUrl
                          ? { uri: user.profileImgUrl }
                          : undefined
                      }
                      bgColor={"indigo.400"}
                      borderWidth={3}
                      borderColor="white"
                      _text={{
                        fontSize: adjustSizeToResolveZoomInIssue(
                          scale.fsXl * 1.1,
                        ),
                      }}
                    >
                      {getInitials(user)}
                    </Avatar>
                  </Box>

                  <VStack mt={scale.spSm} space={scale.spXs / 2}>
                    <HStack
                      alignItems="center"
                      space={scale.spXs}
                      flexWrap="wrap"
                    >
                      <Text
                        fontSize={scale.fsLg}
                        fontWeight="700"
                        color="coolGray.900"
                      >
                        {user.fullName}
                      </Text>
                      {user.designation ? (
                        <Badge
                          bg="indigo.100"
                          _text={{
                            color: "indigo.700",
                            fontSize: scale.fsXs,
                            fontWeight: "600",
                          }}
                          borderRadius={scale.spXs * 2}
                          px={scale.spSm}
                        >
                          {user.designation}
                        </Badge>
                      ) : null}
                    </HStack>

                    {user.bio ? (
                      <Text
                        fontSize={scale.fsSm}
                        color="coolGray.500"
                        mt={scale.spXs}
                      >
                        {user.bio}
                      </Text>
                    ) : null}
                  </VStack>

                  {/* Contact rows */}
                  <VStack mt={scale.spMd} space={scale.spXs * 1.5}>
                    <HStack alignItems="center" space={scale.spSm}>
                      <Icon
                        as={Ionicons}
                        name="mail-outline"
                        size={scale.iconSm}
                        color="coolGray.400"
                      />
                      <Text fontSize={scale.fsSm} color="coolGray.600">
                        {user.email}
                      </Text>
                    </HStack>

                    {user.phone ? (
                      <HStack alignItems="center" space={scale.spSm}>
                        <Icon
                          as={Ionicons}
                          name="call-outline"
                          size={scale.iconSm}
                          color="coolGray.400"
                        />
                        <Text fontSize={scale.fsSm} color="coolGray.600">
                          {user.phone}
                        </Text>
                      </HStack>
                    ) : null}

                    {location ? (
                      <HStack alignItems="center" space={scale.spSm}>
                        <Icon
                          as={Ionicons}
                          name="location-outline"
                          size={scale.iconSm}
                          color="coolGray.400"
                        />
                        <Text fontSize={scale.fsSm} color="coolGray.600">
                          {location}
                        </Text>
                      </HStack>
                    ) : null}

                    <HStack alignItems="center" space={scale.spSm}>
                      <Icon
                        as={Ionicons}
                        name="time-outline"
                        size={scale.iconSm}
                        color="coolGray.400"
                      />
                      <Text fontSize={scale.fsSm} color="coolGray.600">
                        Member since {formatDate(user.createdAt)}
                      </Text>
                    </HStack>
                  </VStack>

                  {/* Stat cards — overview summary */}
                  <Box mt={scale.spMd}>
                    <StatCardGrid stats={statCards} scale={scale} />
                  </Box>
                </VStack>
              </Box>

              {/* ── Tabs ─────────────────────────────────────────────── */}
              <HStack
                width="100%"
                bg="white"
                borderRadius={scale.cardRadius}
                px={scale.spSm}
                mb={scale.spMd}
              >
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <HStack space={scale.spMd}>
                    {TABS.map((tab) => {
                      const active = activeTab === tab.key;
                      return (
                        <Pressable
                          key={tab.key}
                          onPress={() => setActiveTab(tab.key)}
                          py={scale.spSm}
                        >
                          <VStack alignItems="center" space={scale.spXs / 2}>
                            <Text
                              fontSize={scale.fsSm}
                              fontWeight={active ? "700" : "500"}
                              color={active ? "indigo.700" : "coolGray.500"}
                            >
                              {tab.label}
                            </Text>
                            <Box
                              height={0.5}
                              width="100%"
                              bg={active ? "indigo.600" : "transparent"}
                              borderRadius="full"
                            />
                          </VStack>
                        </Pressable>
                      );
                    })}
                  </HStack>
                </ScrollView>
              </HStack>

              {/* ── Tab content ──────────────────────────────────────── */}
              {activeTab === "OVERVIEW" && (
                <VStack space={scale.spMd}>
                  {/* About Me + Skills */}
                  <Box
                    bg="white"
                    borderRadius={scale.cardRadius}
                    p={scale.spMd}
                  >
                    <Text
                      fontSize={scale.fsMd}
                      fontWeight="700"
                      color="coolGray.800"
                      mb={scale.spSm}
                    >
                      About Me
                    </Text>
                    <Text
                      fontSize={scale.fsSm}
                      color="coolGray.600"
                      lineHeight={scale.fsSm * 1.5}
                    >
                      {user.bio || "No bio added yet."}
                    </Text>

                    {user.skills?.length > 0 && (
                      <>
                        <Text
                          fontSize={scale.fsMd}
                          fontWeight="700"
                          color="coolGray.800"
                          mt={scale.spMd}
                          mb={scale.spSm}
                        >
                          Skills
                        </Text>
                        <HStack flexWrap="wrap" space={scale.spXs}>
                          {user.skills.map((skill, index) => (
                            <Badge
                              key={index}
                              bg="indigo.50"
                              _text={{
                                color: "indigo.700",
                                fontSize: scale.fsXs,
                                fontWeight: "600",
                              }}
                              borderRadius={scale.spXs * 2}
                              px={scale.spSm}
                              py={scale.spXs / 2}
                              mb={scale.spXs}
                            >
                              {skill}
                            </Badge>
                          ))}
                        </HStack>
                      </>
                    )}
                  </Box>

                  {/* Personal Information */}
                  <Box
                    bg="white"
                    borderRadius={scale.cardRadius}
                    p={scale.spMd}
                  >
                    <Text
                      fontSize={scale.fsMd}
                      fontWeight="700"
                      color="coolGray.800"
                      mb={scale.spSm}
                    >
                      Personal Information
                    </Text>
                    <VStack space={scale.spSm}>
                      <InfoRow
                        icon="person-outline"
                        label="Full Name"
                        value={user.fullName}
                        scale={scale}
                      />
                      <InfoRow
                        icon="calendar-outline"
                        label="Date of Birth"
                        value={formatDate(user.dateOfBirth)}
                        scale={scale}
                      />
                      <InfoRow
                        icon="male-female-outline"
                        label="Gender"
                        value={formatGender(user.gender)}
                        scale={scale}
                      />
                      <InfoRow
                        icon="language-outline"
                        label="Language"
                        value={user.language || "—"}
                        scale={scale}
                      />
                      <InfoRow
                        icon="globe-outline"
                        label="Timezone"
                        value={user.timezone || "—"}
                        scale={scale}
                      />
                    </VStack>
                  </Box>

                  {/* Professional Information */}
                  {(user.designation ||
                    user.department ||
                    user.company ||
                    user.employeeId ||
                    user.experience != null ||
                    user.joiningDate) && (
                    <Box
                      bg="white"
                      borderRadius={scale.cardRadius}
                      p={scale.spMd}
                    >
                      <Text
                        fontSize={scale.fsMd}
                        fontWeight="700"
                        color="coolGray.800"
                        mb={scale.spSm}
                      >
                        Professional Information
                      </Text>
                      <VStack space={scale.spSm}>
                        <InfoRow
                          icon="briefcase-outline"
                          label="Designation"
                          value={user.designation || "—"}
                          scale={scale}
                        />
                        <InfoRow
                          icon="business-outline"
                          label="Department"
                          value={user.department || "—"}
                          scale={scale}
                        />
                        <InfoRow
                          icon="storefront-outline"
                          label="Company"
                          value={user.company || "—"}
                          scale={scale}
                        />
                        <InfoRow
                          icon="card-outline"
                          label="Employee ID"
                          value={user.employeeId || "—"}
                          scale={scale}
                        />
                        <InfoRow
                          icon="trending-up-outline"
                          label="Experience"
                          value={
                            user.experience != null
                              ? `${user.experience} yrs`
                              : "—"
                          }
                          scale={scale}
                        />
                        <InfoRow
                          icon="calendar-outline"
                          label="Joining Date"
                          value={formatDate(user.joiningDate)}
                          scale={scale}
                        />
                      </VStack>
                    </Box>
                  )}

                  {/* Address */}
                  {(user.address ||
                    user.city ||
                    user.state ||
                    user.country ||
                    user.zipCode) && (
                    <Box
                      bg="white"
                      borderRadius={scale.cardRadius}
                      p={scale.spMd}
                    >
                      <Text
                        fontSize={scale.fsMd}
                        fontWeight="700"
                        color="coolGray.800"
                        mb={scale.spSm}
                      >
                        Address
                      </Text>
                      <VStack space={scale.spSm}>
                        <InfoRow
                          icon="home-outline"
                          label="Address"
                          value={user.address || "—"}
                          scale={scale}
                        />
                        <InfoRow
                          icon="business-outline"
                          label="City"
                          value={user.city || "—"}
                          scale={scale}
                        />
                        <InfoRow
                          icon="map-outline"
                          label="State"
                          value={user.state || "—"}
                          scale={scale}
                        />
                        <InfoRow
                          icon="flag-outline"
                          label="Country"
                          value={user.country || "—"}
                          scale={scale}
                        />
                        <InfoRow
                          icon="pin-outline"
                          label="Zip Code"
                          value={user.zipCode || "—"}
                          scale={scale}
                        />
                      </VStack>
                    </Box>
                  )}

                  {/* Social Links */}
                  {socialLinks.length > 0 && (
                    <Box
                      bg="white"
                      borderRadius={scale.cardRadius}
                      p={scale.spMd}
                    >
                      <Text
                        fontSize={scale.fsMd}
                        fontWeight="700"
                        color="coolGray.800"
                        mb={scale.spSm}
                      >
                        Social Links
                      </Text>
                      <VStack space={scale.spSm}>
                        {socialLinks.map((link) => (
                          <Pressable
                            key={link.key}
                            onPress={() => handleSocialLink(link.url)}
                          >
                            <HStack
                              alignItems="center"
                              justifyContent="space-between"
                            >
                              <HStack alignItems="center" space={scale.spSm}>
                                <Icon
                                  as={Ionicons}
                                  name={link.icon}
                                  size={scale.iconSm}
                                  color="indigo.600"
                                />
                                <Text
                                  fontSize={scale.fsSm}
                                  color="coolGray.700"
                                >
                                  {link.label}
                                </Text>
                              </HStack>
                              <Icon
                                as={Ionicons}
                                name="open-outline"
                                size={scale.fsSm}
                                color="coolGray.400"
                              />
                            </HStack>
                          </Pressable>
                        ))}
                      </VStack>
                    </Box>
                  )}

                  {/* Change password */}
                  <Pressable onPress={handleChangePassword}>
                    <Box
                      bg="indigo.50"
                      borderRadius={scale.cardRadius}
                      p={scale.spMd}
                    >
                      <HStack
                        alignItems="center"
                        justifyContent="space-between"
                      >
                        <HStack alignItems="center" space={scale.spSm} flex={1}>
                          <Icon
                            as={Ionicons}
                            name="lock-closed-outline"
                            size={scale.iconMd}
                            color="indigo.700"
                          />
                          <VStack flexShrink={1}>
                            <Text
                              fontSize={scale.fsSm}
                              fontWeight="700"
                              color="indigo.800"
                            >
                              Change Password
                            </Text>
                            <Text fontSize={scale.fsXs} color="indigo.500">
                              Update your password to keep your account secure.
                            </Text>
                          </VStack>
                        </HStack>
                        <Icon
                          as={Ionicons}
                          name="chevron-forward"
                          size={scale.iconSm}
                          color="indigo.400"
                        />
                      </HStack>
                    </Box>
                  </Pressable>
                </VStack>
              )}

              {/* ── Projects tab ─────────────────────────────────────── */}
              {activeTab === "PROJECTS" && (
                <VStack space={scale.spMd}>
                  <Box
                    bg="white"
                    borderRadius={scale.cardRadius}
                    p={scale.spMd}
                  >
                    <Text
                      fontSize={scale.fsMd}
                      fontWeight="700"
                      color="coolGray.800"
                      mb={scale.spSm}
                    >
                      Project Stats
                    </Text>
                    <StatCardGrid stats={projectStatCards} scale={scale} />
                  </Box>

                  {/* Distribution donut for the Projects tab */}
                  <Box
                    bg="white"
                    borderRadius={scale.cardRadius}
                    p={scale.spMd}
                  >
                    <Text
                      fontSize={scale.fsMd}
                      fontWeight="700"
                      color="coolGray.800"
                      mb={scale.spSm}
                    >
                      Project Distribution
                    </Text>
                    <PieChart
                      data={projectPieData}
                      size={pieSize}
                      scale={scale}
                    />
                  </Box>
                </VStack>
              )}

              {/* ── Tasks tab ────────────────────────────────────────── */}
              {activeTab === "TASKS" && (
                <VStack space={scale.spMd}>
                  <Box
                    bg="white"
                    borderRadius={scale.cardRadius}
                    p={scale.spMd}
                  >
                    <Text
                      fontSize={scale.fsMd}
                      fontWeight="700"
                      color="coolGray.800"
                      mb={scale.spSm}
                    >
                      Task Stats
                    </Text>
                    <StatCardGrid stats={taskStatCards} scale={scale} />
                  </Box>

                  {/* Distribution donut for the Tasks tab */}
                  <Box
                    bg="white"
                    borderRadius={scale.cardRadius}
                    p={scale.spMd}
                  >
                    <Text
                      fontSize={scale.fsMd}
                      fontWeight="700"
                      color="coolGray.800"
                      mb={scale.spSm}
                    >
                      Task Distribution
                    </Text>
                    <PieChart data={taskPieData} size={pieSize} scale={scale} />
                  </Box>
                </VStack>
              )}

              {activeTab === "ACTIVITY" && (
                <Box
                  borderRadius={scale.cardRadius}
                  p={scale.spLg}
                  alignItems="center"
                >
                  <Text fontSize={scale.fsSm} color="coolGray.400">
                      coming soon...
                  </Text>
                </Box>
              )}
            </ScrollView>
          </VStack>
        )}
      </Box>
    </View>
  );
}

export default UserProfileSection;
