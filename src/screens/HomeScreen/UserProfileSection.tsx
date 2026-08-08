import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  Alert,
  Linking,
  RefreshControl,
  UIManager,
  Platform,
} from "react-native";
import {
  Avatar,
  Badge,
  Box,
  Button,
  Modal,
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
import Svg, { Circle, Path } from "react-native-svg";
import { useSetAtom } from "jotai";
import { useNavigation } from "@react-navigation/native";
import { launchImageLibrary, Asset } from "react-native-image-picker";
import { useDispatch } from "react-redux";
import { AppLoaderAtom } from "../../utils/Constent";
import { useContainerDimensions } from "../../hooks/OnlayoutHooks";
import { CommonDetailHeader } from "../../components/CommonDetailHeader";
import { AuthProps, AuthProvider, Gender } from "../../store/slices/types";
import { adjustSizeToResolveZoomInIssue } from "../../utils/Helper";
import { RouteStackParamStack } from "../../appNavigator/navigator.utils";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  fetchUserProfileThunk,
  loadUser,
  updateProfileImageThunk,
} from "../../store/slices/authSlice";

// Import logout utility
import { onLogoutUser } from "../auth/auth.utils";

// Enable LayoutAnimation for Android (Kept for other potential UI animations)
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ─────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────

// ✅ Added "SETTINGS" to ProfileTab
type ProfileTab = "OVERVIEW" | "ACTIVITY" | "PROJECTS" | "TASKS" | "SETTINGS";

interface Scale {
  fsXs: number;
  fsSm: number;
  fsMd: number;
  fsLg: number;
  fsXl: number;
  spXs: number;
  spSm: number;
  spMd: number;
  spLg: number;
  iconSm: number;
  iconMd: number;
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

interface PieDatum {
  label: string;
  value: number;
  color: string;
}

// ✅ Added "Settings" to the TABS array
const TABS: { key: ProfileTab; label: string }[] = [
  { key: "OVERVIEW", label: "Overview" },
  { key: "ACTIVITY", label: "Activity" },
  { key: "PROJECTS", label: "Projects" },
  { key: "TASKS", label: "Tasks" },
  { key: "SETTINGS", label: "Settings" },
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

function getInitials(user: AuthProps) {
  const first = user.firstName?.charAt(0) ?? "";
  const last = user.lastName?.charAt(0) ?? "";
  return `${first}${last}`.toUpperCase();
}

// ─────────────────────────────────────────────────────────────────────────
// Components
// ─────────────────────────────────────────────────────────────────────────

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(angleRad), y: cy + r * Math.sin(angleRad) };
}

function describeSlice(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
) {
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
  const holeRadius = radius * 0.58;

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

function StatCardGrid({
  stats,
  scale,
  type = "child",
}: {
  stats: StatCardDef[];
  scale: Scale;
  type?: "parent" | "child";
}) {
  return (
    <HStack flexWrap="wrap" justifyContent="space-between">
      {stats.map((stat) => (
        <Box
          key={stat.label}
          width={type == "parent" ? "30%" : "48%"}
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
            <Box
              position={"absolute"}
              top={0}
              right={0}
              borderRadius={"full"}
              bg={stat.bg}
            >
              <Icon
                as={Ionicons}
                name={stat.icon}
                size={scale.iconSm}
                color={stat.iconColor}
              />
            </Box>
          </HStack>
        </Box>
      ))}
    </HStack>
  );
}

interface SettingOptionProps {
  icon: string;
  label: string;
  description: string;
  colorScheme: string;
  onPress: () => void;
  scale: Scale;
}

// Reusable component for the settings dropdown items
function SettingOption({
  icon,
  label,
  description,
  colorScheme,
  onPress,
  scale,
}: SettingOptionProps) {
  return (
    <Pressable onPress={onPress}>
      {({ isPressed }) => (
        <Box
          bg={isPressed ? `${colorScheme}.100` : `${colorScheme}.50`}
          borderRadius={scale.cardRadius}
          p={scale.spMd}
          style={{ transform: [{ scale: isPressed ? 0.98 : 1 }] }}
        >
          <HStack alignItems="center" justifyContent="space-between">
            <HStack alignItems="center" space={scale.spSm} flex={1}>
              <Icon
                as={Ionicons}
                name={icon}
                size={scale.iconMd}
                color={`${colorScheme}.700`}
              />
              <VStack flexShrink={1}>
                <Text
                  fontSize={scale.fsSm}
                  fontWeight="700"
                  color={`${colorScheme}.800`}
                >
                  {label}
                </Text>
                <Text fontSize={scale.fsXs} color={`${colorScheme}.500`}>
                  {description}
                </Text>
              </VStack>
            </HStack>
            <Icon
              as={Ionicons}
              name="chevron-forward"
              size={scale.iconSm}
              color={`${colorScheme}.400`}
            />
          </HStack>
        </Box>
      )}
    </Pressable>
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

  const dispatch = useDispatch<any>();

  // State variables for Modal logic
  const [selectedImage, setSelectedImage] = useState<Asset | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Refresh State
  const [refreshing, setRefreshing] = useState(false);

  const setDisplayAppLoader = useSetAtom(AppLoaderAtom);
  const navigation =
    useNavigation<NativeStackNavigationProp<RouteStackParamStack>>();

  const handleChangePassword = () => {
    navigation.navigate("ChangePasswordScreen" as any);
  };

  const handleTransferOwnership = () => {
    navigation.navigate("TransferOwnerShipScreen" as any);
  };

  const handleDeleteAccount = () => {
    navigation.navigate("DeleteAccountScreen" as any);
  };

  const handleLogout = () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out of your account?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log Out",
          style: "destructive",
          onPress: async () => {
            setDisplayAppLoader({ isLoading: true, message: "Logging out..." });
            try {
              await onLogoutUser(dispatch);
              navigation.reset({
                index: 0,
                routes: [{ name: "LoginScreen" as any }],
              });
            } catch (err) {
              Alert.alert("Error", "Failed to log out properly.");
            } finally {
              setDisplayAppLoader({ isLoading: false, message: "" });
            }
          },
        },
      ],
      { cancelable: true },
    );
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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await dispatch(fetchUserProfileThunk());
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } finally {
      setRefreshing(false);
    }
  }, [dispatch]);

  const handleSelectImage = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: "photo",
        selectionLimit: 1,
        quality: 0.8,
      });
      if (result.didCancel || result.errorCode || !result.assets?.[0]?.uri)
        return;

      const asset = result.assets[0];
      if (asset.fileSize && asset.fileSize > 204800) {
        Alert.alert(
          "Image too large",
          "Please select an image smaller than 200 KB.",
        );
        return;
      }
      setSelectedImage(asset);
      setShowPreviewModal(true);
    } catch (err) {
      console.error("handleSelectImage error:", err);
      Alert.alert("Error", "Failed to select image.");
    }
  };

  const handleConfirmUpdate = async () => {
    if (!selectedImage) return;

    setShowPreviewModal(false);
    setDisplayAppLoader({ isLoading: true, message: "Uploading image..." });

    try {
      await dispatch(
        updateProfileImageThunk({
          uri: selectedImage.uri as string,
          type: selectedImage.type || "image/jpeg",
          name: selectedImage.fileName || "profile.jpg",
        }),
      ).unwrap();

      setShowSuccessModal(true);
    } catch (err) {
      Alert.alert("Error", err as string);
    } finally {
      setDisplayAppLoader({ isLoading: false, message: "" });
      setSelectedImage(null);
    }
  };

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

  const statCards: StatCardDef[] = [
    {
      label: "Projects",
      value: user.stats?.totalProjects ?? 0,
      icon: "folder-outline",
      bg: "indigo.50",
      iconColor: "coolGray.500",
    },
    {
      label: "Tasks",
      value: user.stats?.totalTasks ?? 0,
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
  ];

  const projectStatCards: StatCardDef[] = [
    {
      label: "All Projects",
      value: user.stats?.totalProjects || 0,
      icon: "folder-outline",
      bg: "coolGray.100",
      iconColor: "coolGray.600",
    },
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
      value: user.stats?.completedAssignProjects ?? 0,
      icon: "checkmark-done-outline",
      bg: "green.50",
      iconColor: "green.600",
    },
  ];

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
              onTabBackButton={() => onTapBack?.()}
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
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
            >
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
                  <Box position="relative" alignSelf="flex-start">
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

                    <Pressable
                      position="absolute"
                      bottom={1}
                      right={1}
                      bg="indigo.600"
                      p={1.5}
                      borderRadius="full"
                      borderWidth={2}
                      borderColor="white"
                      shadow={2}
                      onPress={handleSelectImage}
                      _pressed={{ opacity: 0.7, bg: "indigo.700" }}
                    >
                      <Icon
                        as={Ionicons}
                        name="camera"
                        size={scale.iconSm * 0.8}
                        color="white"
                      />
                    </Pressable>
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

                  <Box mt={scale.spMd}>
                    <StatCardGrid
                      stats={statCards}
                      scale={scale}
                      type={"parent"}
                    />
                  </Box>
                </VStack>
              </Box>

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

              {activeTab === "OVERVIEW" && (
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
                </VStack>
              )}

              {/* ✅ NEW SETTINGS TAB */}
              {activeTab === "SETTINGS" && (
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
                      mb={scale.spMd}
                    >
                      Account Settings
                    </Text>
                    <VStack space={scale.spSm}>
                      <SettingOption
                        icon="lock-closed-outline"
                        label="Change Password"
                        description="Update your password to keep your account secure."
                        colorScheme="indigo"
                        onPress={handleChangePassword}
                        scale={scale}
                      />
                      <SettingOption
                        icon="swap-horizontal-outline"
                        label="Transfer Ownership"
                        description="Transfer your account or project ownership to another user."
                        colorScheme="indigo"
                        onPress={handleTransferOwnership}
                        scale={scale}
                      />
                      <SettingOption
                        icon="log-out-outline"
                        label="Log Out"
                        description="Safely sign out of your account on this device."
                        colorScheme="orange"
                        onPress={handleLogout}
                        scale={scale}
                      />
                      <SettingOption
                        icon="trash-outline"
                        label="Delete Account"
                        description="Permanently remove your account and data. This cannot be undone."
                        colorScheme="red"
                        onPress={handleDeleteAccount}
                        scale={scale}
                      />
                    </VStack>
                  </Box>
                </VStack>
              )}

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

            {/* Profile Image Preview Modal */}
            <Modal
              isOpen={showPreviewModal}
              onClose={() => setShowPreviewModal(false)}
            >
              <Modal.Content maxWidth="400px">
                <Modal.CloseButton />
                <Modal.Header>Preview Image</Modal.Header>
                <Modal.Body alignItems="center" py={6}>
                  <Avatar
                    source={{ uri: selectedImage?.uri }}
                    size="2xl"
                    bg="indigo.100"
                    borderWidth={3}
                    borderColor="indigo.500"
                  />
                </Modal.Body>
                <Modal.Footer>
                  <Button.Group space={2} flex={1} w="100%">
                    <Button
                      flex={1}
                      variant="outline"
                      colorScheme="indigo"
                      onPress={handleSelectImage}
                    >
                      Change Image
                    </Button>
                    <Button
                      flex={1}
                      colorScheme="indigo"
                      onPress={handleConfirmUpdate}
                    >
                      Update Image
                    </Button>
                  </Button.Group>
                </Modal.Footer>
              </Modal.Content>
            </Modal>

            {/* Profile Image Success Modal */}
            <Modal
              isOpen={showSuccessModal}
              onClose={() => setShowSuccessModal(false)}
            >
              <Modal.Content maxWidth="400px">
                <Modal.CloseButton />
                <Modal.Header borderBottomWidth="0">Success</Modal.Header>
                <Modal.Body alignItems="center" pb={6}>
                  <Icon
                    as={Ionicons}
                    name="checkmark-circle"
                    size="6xl"
                    color="green.500"
                    mb={4}
                  />
                  <Text
                    fontSize="md"
                    textAlign="center"
                    color="coolGray.700"
                    fontWeight="500"
                  >
                    Profile image updated successfully!
                  </Text>
                </Modal.Body>
                <Modal.Footer borderTopWidth="0" justifyContent="center">
                  <Button
                    colorScheme="indigo"
                    onPress={() => setShowSuccessModal(false)}
                    w="100%"
                  >
                    Done
                  </Button>
                </Modal.Footer>
              </Modal.Content>
            </Modal>
          </VStack>
        )}
      </Box>
    </View>
  );
}

export default UserProfileSection;
