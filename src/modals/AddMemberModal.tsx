import React, { useEffect, useState } from "react";
import { Platform, TextInput } from "react-native";
import {
  Box,
  Text,
  HStack,
  VStack,
  Pressable,
  Spinner,
  KeyboardAvoidingView,
  Select,
} from "native-base";
// @ts-ignore
import { Feather } from "react-native-vector-icons";
import { useAtom } from "jotai";
import { useDispatch } from "react-redux";
import { adjustSizeToResolveZoomInIssue } from "../utils/Helper";
import { AppDispatch } from "../store";
import { fetchSearchResult } from "../api/api.call";
import { addMember, clearMemberError } from "../store/slices/MemberSlice";
import { isDisplayErrorMessageAtom } from "../utils/Constent";

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
  projectId: string;
  /** Height of the modal card (exactly this height) */
  compHeight: number;
  /** Width of the modal card (exactly this width) */
  compWidth: number;
  /** Called when the user taps X or Cancel */
  onClose: () => void;
  /** Called after a successful addMember dispatch */
  onSuccess: () => void;
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
  const dispatch = useDispatch<AppDispatch>();
  const [, setErrorModal] = useAtom(isDisplayErrorMessageAtom);

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
      setSearchResults([]);
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
    // Simple client-side validation stays inline (not a backend error)
    if (!userId.trim()) {
      setError("Please search and select a user first.");
      return;
    }
    try {
      setLoading(true);
      setError("");
      await dispatch(
        addMember({ projectId, memberEmail: userId, role }),
      ).unwrap();
      onSuccess();
    } catch (err: any) {
      onClose?.();

      setErrorModal((prev) => ({
        ...prev,
        isDisplay: true,
        title: "Couldn't add member",
        subtitle:
          typeof err === "string"
            ? err
            : (err?.message ??
              "Something went wrong while adding this member. Please try again."),
        onClickLeftButton: () => {
          dispatch(clearMemberError());
        },
      }));
    } finally {
      setLoading(false);
      onClose?.();
    }
  };

  // ── Make sure the modal doesn't linger after this component unmounts ──────
  useEffect(() => {
    return () => {
      setErrorModal((prev) => ({ ...prev, isDisplay: false }));
    };
  }, [setErrorModal]);

  if (!isOpen) return null;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: "center",
        alignItems: "center",
        zIndex: 999,
        backgroundColor: backdropColor,
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

        {/* Content Area - Uses a unified content spacing to eliminate sparse gaps */}
        <VStack height={"95%"} width={"100%"} px={"3%"} pb={"2%"} space={"2%"}>
          {/* Header Layout */}
          <VStack space={"2%"} width={"100%"} height={"10%"}>
            <HStack justifyContent="space-between" alignItems="center">
              <Text fontSize={titleSize} fontWeight="bold" color="coolGray.900">
                Add New Member
              </Text>
              <Pressable
                onPress={onClose}
                bg="coolGray.100"
                borderRadius="full"
                p={2}
              >
                <Feather name="x" size={iconSize} color="#374151" />
              </Pressable>
            </HStack>
            <Box h={0.5} bg="coolGray.100" />
          </VStack>

          {/* Form Input Block - Organized beautifully without blank gaps */}
          <VStack width={"100%"} height={"65%"} space={"2%"}>
            {/* Search Box Component Layout */}
            <Box height={"35%"} width={"100%"}>
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
                borderColor="coolGray.200"
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
                  style={{
                    flex: 1,
                    fontSize: bodySize,
                    color: "#111827",
                    paddingVertical: Platform.OS === "ios" ? 4 : 0,
                  }}
                />
                {searchLoading && <Spinner size="sm" color="coolGray.400" />}
              </HStack>

              {/* Float Overlayed Results Panel - Drops beautifully over content below safely */}
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
                  zIndex={30}
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
            <Box overflow={"hidden"} height={"35%"} width={"100%"}>
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
              overflow={"hidden"}
              height={"25%"}
              width={"100%"}
              bg="blue.50"
              borderRadius="xl"
              px={"3%"}
              py={"2%"}
              alignItems="center"
              space={"2%"}
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

            {/* Form Validation Errors (inline, client-side only) */}
            {!!error && (
              <Text
                color="red.500"
                fontSize={smallSize}
                textAlign="center"
                fontWeight="medium"
              >
                {error}
              </Text>
            )}
          </VStack>

          {/* Core Submit / Decline Actions Footing row */}
          <HStack
            height={"20%"}
            width={"100%"}
            justifyContent={"center"}
            alignItems={"center"}
            space={"5%"}
          >
            {/* Confirmation CTA */}
            <Box
              height={"100%"}
              justifyContent={"center"}
              alignItems={"center"}
            >
              <Pressable onPress={handleAdd} isDisabled={loading}>
                {({ isPressed }) => (
                  <Box
                    bg={loading || isPressed ? "primary.700" : "primary.500"}
                    borderRadius="xl"
                    py={"6%"}
                    px={"8%"}
                    justifyContent="center"
                    alignItems="center"
                  >
                    <HStack space={2} alignItems="center">
                      {loading ? (
                        <Spinner size="sm" color="white" />
                      ) : (
                        <Feather
                          name="user-plus"
                          size={adjustSizeToResolveZoomInIssue(iconSize * 0.85)}
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
            <Box
              height={"100%"}
              justifyContent={"center"}
              alignItems={"center"}
            >
              <Pressable onPress={onClose}>
                {({ isPressed }) => (
                  <Box
                    borderWidth={1.5}
                    borderColor={isPressed ? "coolGray.400" : "coolGray.300"}
                    borderRadius="xl"
                    py={"6%"}
                    px={"8%"}
                    justifyContent="center"
                    alignItems="center"
                    bg={isPressed ? "coolGray.50" : "white"}
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
    </KeyboardAvoidingView>
  );
};

export default AddMemberModal;
