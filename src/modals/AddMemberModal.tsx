import React, { useEffect, useState } from "react";
import { Platform, TextInput, Keyboard, ActivityIndicator } from "react-native";
import { Box, Text, HStack, VStack, Pressable, Select } from "native-base";
// @ts-ignore
import { Feather } from "react-native-vector-icons";
import { useDispatch } from "react-redux";
import { adjustSizeToResolveZoomInIssue } from "../utils/Helper";
import { AppDispatch } from "../store";
import { fetchSearchResult } from "../api/api.call";
import { addMember } from "../store/slices/MemberSlice";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { MemberRole } from "../store/slices/types";

// ─── Types ────────────────────────────────────────────────────────────────────

type Role = "VIEWER" | "EDITOR";

interface SearchUser {
  userId: string;
  fullName: string;
  email: string;
}

export interface AddMemberModalProps {
  /** Controls visibility */
  isOpen: boolean;
  /** Project to add the member to */
  projectId: string | null;
  /** Height of the modal card (exactly this height) */
  compHeight: number;
  /** Width of the modal card (exactly this width) */
  compWidth: number;
  /** Called when the user taps X or Cancel */
  onClose?: () => void;
  /** Called after a successful addMember dispatch */
  onSuccess?: ({
    email,
    projectId,
    role,
  }: {
    email: string;
    projectId: string;
    role: MemberRole;
  }) => void | Promise<void>; // Updated to support async Promises for loading state
  /** Card background – default white */
  backgroundColor?: string;
  /** Overlay scrim color – default dark semi-transparent */
  backdropColor?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const AVATAR_PALETTE = [
  "#8B5CF6", // purple
  "#10B981", // emerald
  "#F59E0B", // amber
  "#3B82F6", // blue
  "#EF4444", // red
  "#EC4899", // pink
  "#0EA5E9", // sky
  "#14B8A6", // teal
];

const getAvatarColor = (name: string): string =>
  AVATAR_PALETTE[name.charCodeAt(0) % AVATAR_PALETTE.length];

const getInitials = (name: string): string =>
  name
    .split(" ")
    .map((n) => n[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2);

// ─── Component ────────────────────────────────────────────────────────────────

const AddMemberModal: React.FC<AddMemberModalProps> = ({
  isOpen,
  projectId,
  compHeight,
  compWidth,
  onClose,
  onSuccess,
  backgroundColor = "#ffffff",
  backdropColor = "rgba(12, 12, 12, 0.65)",
}) => {
  // Form state
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState<Role>("VIEWER");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Search state
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [isUserSelected, setIsUserSelected] = useState(false);

  // ── Scale calculations derived directly from dimensions ─────────────────────
  const baseSize = Math.min(compHeight, compWidth);
  const titleSize = adjustSizeToResolveZoomInIssue(baseSize * 0.065);
  const labelSize = adjustSizeToResolveZoomInIssue(baseSize * 0.052);
  const bodySize = adjustSizeToResolveZoomInIssue(baseSize * 0.046);
  const smallSize = adjustSizeToResolveZoomInIssue(baseSize * 0.039);
  const iconSize = adjustSizeToResolveZoomInIssue(baseSize * 0.062);
  const buttonSize = adjustSizeToResolveZoomInIssue(baseSize * 0.05);
  const avatarSize = adjustSizeToResolveZoomInIssue(baseSize * 0.115);

  // ── Reset state on close ──────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) {
      setUserId("");
      setRole("VIEWER");
      setError("");
      setLoading(false);
      setSearchLoading(false);
      searchResults.length > 0 && setSearchResults([]);
      setIsUserSelected(false);
    }
  }, [isOpen]);

  // ── Debounced Search ──────────────────────────────────────────────────────
  useEffect(() => {
    if (isUserSelected || !userId.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setSearchLoading(true);
        const response = await fetchSearchResult(userId, 5);
        setSearchResults(response?.users ?? []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [userId, isUserSelected]);

  // ── Submit Logic ──────────────────────────────────────────────────────────
  const handleAdd = async () => {
    if (!userId.trim()) {
      setError("Please search and select a user first.");
      return;
    }
    if (loading) return;

    Keyboard.dismiss(); // Close keyboard on submit

    try {
      setLoading(true);
      setError("");

      await onSuccess!({ email: userId, role: role, projectId: projectId! });
      // Close the modal ONLY on success
    } catch (err: any) {
      // Instead of closing the modal, set the local error state
      const errorMessage =
        typeof err === "string"
          ? err
          : (err?.message ??
            "Something went wrong while adding this member. Please try again.");

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Box
      position="absolute"
      top={0}
      left={0}
      right={0}
      bottom={0}
      zIndex={999}
      bg={backdropColor}
    >
      <KeyboardAwareScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bottomOffset={20}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {/* ── Main Modal Card Frame ── */}
        <Box
          width={compWidth}
          height={compHeight}
          bg={backgroundColor}
          borderRadius="3xl"
          overflow="hidden"
          shadow={6}
        >
          {/* Drag Handle indicator top decoration */}
          <Box
            height={"5%"}
            width={"100%"}
            alignItems="center"
            pt={"1%"}
            pb={"1%"}
          >
            <Box w={10} h={1.5} bg="coolGray.300" borderRadius="full" />
          </Box>

          {/* Content Area */}
          <VStack
            height={"95%"}
            width={"100%"}
            px={"4%"}
            pb={"3%"}
            space={"2%"}
          >
            {/* Header Layout */}
            <VStack space={"2%"} width={"100%"} height={"10%"}>
              <HStack justifyContent="space-between" alignItems="center">
                <Text
                  fontSize={titleSize}
                  fontWeight="bold"
                  color="coolGray.900"
                >
                  Add New Member
                </Text>
                <Pressable
                  onPress={onClose}
                  bg="coolGray.100"
                  borderRadius="full"
                  p={2}
                  disabled={loading}
                >
                  <Feather name="x" size={iconSize} color="#374151" />
                </Pressable>
              </HStack>
              <Box h={0.5} bg="coolGray.100" />
            </VStack>

            {/* Form Input Block - Using Flex instead of hard percentages for better responsiveness */}
            <VStack width={"100%"} flex={1} space={"4%"} mt={"2%"}>
              {/* Search Box Component Layout */}
              <Box width={"100%"} zIndex={50}>
                <Text
                  fontSize={labelSize}
                  fontWeight="semibold"
                  color="coolGray.900"
                  mb={2}
                >
                  Search User
                </Text>

                <HStack
                  borderWidth={1}
                  borderColor={error ? "red.400" : "coolGray.200"}
                  borderRadius="xl"
                  bg="white"
                  px={3}
                  py={2}
                  alignItems="center"
                  space={2}
                >
                  <Feather name="search" size={iconSize} color="#9CA3AF" />
                  <TextInput
                    placeholder="Enter User ID, Name, or Email"
                    placeholderTextColor="#9CA3AF"
                    value={userId}
                    onChangeText={(text) => {
                      setUserId(text);
                      setError("");
                      setIsUserSelected(false);
                    }}
                    editable={!loading}
                    style={{
                      flex: 1,
                      fontSize: bodySize,
                      color: "#111827",
                      paddingVertical: Platform.OS === "ios" ? 4 : 0,
                    }}
                  />
                  {searchLoading && (
                    <ActivityIndicator size="small" color="#9CA3AF" />
                  )}
                </HStack>

                {/* ✨ IMPROVEMENT: Error Message placed directly under the search field */}
                {!!error && (
                  <HStack alignItems="center" space={1.5} mt={2} px={1}>
                    <Feather
                      name="alert-circle"
                      size={smallSize}
                      color="#ef4444"
                    />
                    <Text
                      color="red.500"
                      fontSize={smallSize}
                      fontWeight="medium"
                      flex={1}
                    >
                      {error}
                    </Text>
                  </HStack>
                )}

                {/* Float Overlayed Results Panel */}
                {searchResults.length > 0 && (
                  <Box
                    position="absolute"
                    top="100%"
                    left={0}
                    right={0}
                    mt={1}
                    borderWidth={1}
                    borderColor="coolGray.200"
                    borderRadius="xl"
                    bg="white"
                    shadow={5}
                    overflow="hidden"
                  >
                    {searchResults.slice(0, 3).map((user, idx) => (
                      <Pressable
                        key={user.userId}
                        onPress={() => {
                          setUserId(user.email);
                          setIsUserSelected(true);
                          setSearchResults([]);
                          setError("");
                        }}
                      >
                        {({ isPressed }) => (
                          <HStack
                            px={4}
                            py={3}
                            space={3}
                            alignItems="center"
                            bg={isPressed ? "coolGray.50" : "white"}
                            borderBottomWidth={
                              idx < searchResults.slice(0, 3).length - 1 ? 1 : 0
                            }
                            borderColor="coolGray.100"
                          >
                            <Box
                              w={avatarSize}
                              h={avatarSize}
                              borderRadius="full"
                              bg={getAvatarColor(user.fullName)}
                              justifyContent="center"
                              alignItems="center"
                            >
                              <Text
                                fontSize={adjustSizeToResolveZoomInIssue(
                                  avatarSize * 0.38,
                                )}
                                fontWeight="bold"
                                color="white"
                              >
                                {getInitials(user.fullName)}
                              </Text>
                            </Box>

                            <VStack flex={1} space={0.5}>
                              <Text
                                fontSize={bodySize}
                                fontWeight="bold"
                                color="coolGray.900"
                                numberOfLines={1}
                              >
                                {user.fullName}
                              </Text>
                              <Text
                                fontSize={smallSize}
                                color="coolGray.500"
                                numberOfLines={1}
                              >
                                {user.email}
                              </Text>
                            </VStack>

                            <Feather
                              name="chevron-right"
                              size={iconSize}
                              color="#9CA3AF"
                            />
                          </HStack>
                        )}
                      </Pressable>
                    ))}
                  </Box>
                )}
              </Box>

              {/* Native Select Role Box Container */}
              <Box width={"100%"} zIndex={10}>
                <Text
                  fontSize={labelSize}
                  fontWeight="semibold"
                  color="coolGray.900"
                  mb={2}
                >
                  Role
                </Text>
                <Select
                  selectedValue={role}
                  minWidth="100%"
                  accessibilityLabel="Choose Role"
                  placeholder="Choose Role"
                  fontSize={bodySize}
                  fontWeight="semibold"
                  color="coolGray.900"
                  borderWidth={1}
                  borderColor="coolGray.200"
                  borderRadius="xl"
                  bg="white"
                  py={3}
                  px={3}
                  isDisabled={loading}
                  _selectedItem={{
                    bg: "indigo.50",
                    _text: {
                      color: "indigo.600",
                      fontWeight: "bold",
                    },
                    endIcon: (
                      <Feather
                        name="check"
                        size={iconSize * 0.85}
                        color="#4F46E5"
                      />
                    ),
                  }}
                  dropdownIcon={
                    <Box pr={3}>
                      <Feather
                        name="chevron-down"
                        size={iconSize}
                        color="#6B7280"
                      />
                    </Box>
                  }
                  onValueChange={(itemValue) => setRole(itemValue as Role)}
                >
                  <Select.Item label="VIEWER" value="VIEWER" />
                  <Select.Item label="EDITOR" value="EDITOR" />
                </Select>
              </Box>

              {/* Info Message Banner Row */}
              <HStack
                width={"100%"}
                bg="blue.50"
                borderRadius="xl"
                px={"4%"}
                py={"4%"}
                alignItems="center"
                space={"3%"}
                mt="auto" // Pushes the banner to the bottom of the flex container
              >
                <Box
                  bg="blue.500"
                  borderRadius="full"
                  w={adjustSizeToResolveZoomInIssue(iconSize * 1.3)}
                  h={adjustSizeToResolveZoomInIssue(iconSize * 1.3)}
                  justifyContent="center"
                  alignItems="center"
                >
                  <Feather
                    name="info"
                    size={adjustSizeToResolveZoomInIssue(iconSize * 0.6)}
                    color="white"
                  />
                </Box>
                <Text flex={1} fontSize={smallSize} color="blue.700">
                  The member will have access to this project based on the
                  selected role.
                </Text>
              </HStack>
            </VStack>

            {/* Core Submit / Decline Actions Footing row */}
            <HStack
              height={"15%"}
              width={"100%"}
              justifyContent={"center"}
              alignItems={"center"}
              space={"5%"}
              mt={"2%"}
            >
              {/* Confirmation CTA */}
              <Box flex={1}>
                <Pressable
                  onPress={handleAdd}
                  isDisabled={loading || !userId.trim()}
                >
                  {({ isPressed }) => (
                    <Box
                      bg={
                        loading || !userId.trim()
                          ? "indigo.300" // Visually disable state
                          : isPressed
                            ? "indigo.700" // Pressed state
                            : "indigo.500" // Default state
                      }
                      borderRadius="xl"
                      py={"6%"}
                      justifyContent="center"
                      alignItems="center"
                    >
                      <HStack space={2} alignItems="center">
                        {loading ? (
                          <ActivityIndicator size={adjustSizeToResolveZoomInIssue(buttonSize * 1.2)} color="white" />
                        ) : (
                          <Feather
                            name="user-plus"
                            size={adjustSizeToResolveZoomInIssue(
                              iconSize * 0.85,
                            )}
                            color="white"
                          />
                        )}
                        <Text
                          fontSize={buttonSize}
                          fontWeight="semibold"
                          color="white"
                        >
                          Add Member
                        </Text>
                      </HStack>
                    </Box>
                  )}
                </Pressable>
              </Box>

              {/* Decline Action */}
              <Box flex={1}>
                <Pressable onPress={onClose} isDisabled={loading}>
                  {({ isPressed }) => (
                    <Box
                      borderWidth={1.5}
                      borderColor={isPressed ? "coolGray.400" : "coolGray.300"}
                      borderRadius="xl"
                      py={"6%"}
                      justifyContent="center"
                      alignItems="center"
                      bg={isPressed ? "coolGray.50" : "white"}
                      opacity={loading ? 0.5 : 1}
                    >
                      <Text
                        fontSize={buttonSize}
                        fontWeight="semibold"
                        color="coolGray.900"
                      >
                        Cancel
                      </Text>
                    </Box>
                  )}
                </Pressable>
              </Box>
            </HStack>
          </VStack>
        </Box>
      </KeyboardAwareScrollView>
    </Box>
  );
};

export default AddMemberModal;
