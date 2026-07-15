import React, { useEffect, useMemo, useState } from "react";
import {
  Actionsheet,
  Avatar,
  Box,
  Button,
  FormControl,
  HStack,
  Icon,
  Pressable,
  ScrollView,
  Text,
  View,
  VStack,
} from "native-base";
import { Keyboard, Platform, TextInput } from "react-native";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
// @ts-ignore
import Ionicons from "react-native-vector-icons/Ionicons";
// @ts-ignore
import { Feather } from "react-native-vector-icons";
import { launchImageLibrary } from "react-native-image-picker";
import { useSetAtom } from "jotai";
import { AppLoaderAtom, MAX_BIO_LENGTH } from "../../utils/Constent"; // Ensure this path is correct
import { useContainerDimensions } from "../../hooks/OnlayoutHooks";
import { CommonDetailHeader } from "../../components/CommonDetailHeader";
import { AuthProps, Gender } from "../../store/slices/types";
import { adjustSizeToResolveZoomInIssue } from "../../utils/Helper";

// ─────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────

// Every plain text field (name, phone, links, etc.) is capped at this
// length. Bio is the one exception — it uses MAX_BIO_LENGTH instead.
const MAX_FIELD_LENGTH = 50;

// ─────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────

interface Scale {
  fsXs: number;
  fsSm: number;
  fsMd: number;
  fsLg: number;

  spXs: number;
  spSm: number;
  spMd: number;
  spLg: number;

  iconSm: number;
  iconMd: number;

  avatarSize: number;
  cardRadius: number;
  inputHeight: number;
}

// Fields the user is actually allowed to edit — everything system-owned
// (userId, email, authProvider, googleId/githubId, verification flags,
// timestamps, stats) is intentionally excluded from this shape.
export interface EditableProfileFields {
  firstName: string;
  lastName: string;

  phone: string;
  profileImgUrl: string;

  bio: string;

  designation: string;
  department: string;
  company: string;
  employeeId: string;
  experience: string; // kept as string for the input, parsed to number on save
  joiningDate: string; // "YYYY-MM-DD" or ""

  dateOfBirth: string; // "YYYY-MM-DD" or ""
  gender: Gender | "";

  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;

  language: string;
  timezone: string;
  website: string;

  skills: string[];

  githubUrl: string;
  linkedinUrl: string;
  twitterUrl: string;
  portfolioUrl: string;

  isProfilePublic: boolean;
}

interface EditProfileSectionProps {
  user: AuthProps | null;
  onTapBack: () => void;
  // Now receives the picked image (uri + optional file info) so the parent
  // can handle the actual upload; the field's local preview is updated
  // immediately inside this component regardless.
  onTapChangeAvatar: (asset?: {
    uri: string;
    fileName?: string;
    type?: string;
  }) => void;
  onSave: (data: EditableProfileFields) => void | Promise<void>;
  isSaving?: boolean;
  isActive?: boolean;
}

const GENDER_OPTIONS: { label: string; value: Gender }[] = [
  { label: "Male", value: "MALE" },
  { label: "Female", value: "FEMALE" },
  { label: "Other", value: "OTHER" },
  { label: "Prefer not to say", value: "PREFER_NOT_TO_SAY" },
];

// ─────────────────────────────────────────────────────────────────────────
// Date helpers — keep the field as a "YYYY-MM-DD" string in form state,
// convert to/from a real Date only at the picker boundary.
// ─────────────────────────────────────────────────────────────────────────

function parseDateString(value: string): Date {
  if (!value) return new Date();
  const parsed = new Date(`${value}T00:00:00`);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDisplayDate(value: string): string {
  if (!value) return "";
  const d = parseDateString(value);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ─────────────────────────────────────────────────────────────────────────
// Reusable section wrapper + labeled input
// ─────────────────────────────────────────────────────────────────────────

function SectionCard({
  title,
  scale,
  children,
}: {
  title: string;
  scale: Scale;
  children: React.ReactNode;
}) {
  return (
    <Box
      bg="white"
      borderRadius={scale.cardRadius}
      p={scale.spMd}
      mb={scale.spMd}
    >
      <Text
        fontSize={scale.fsMd}
        fontWeight="700"
        color="coolGray.800"
        mb={scale.spSm}
      >
        {title}
      </Text>
      <VStack space={scale.spSm}>{children}</VStack>
    </Box>
  );
}

// Plain-text field built on RN's own TextInput (avoids native-base's
// buggy Input/TextArea type overloads entirely). Capped at
// MAX_FIELD_LENGTH characters by default; pass `maxLength` to override.
function FieldInput({
  label,
  value,
  onChangeText,
  scale,
  placeholder,
  keyboardType,
  flex,
  maxLength = MAX_FIELD_LENGTH,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  scale: Scale;
  placeholder?: string;
  keyboardType?: "default" | "numeric" | "phone-pad" | "email-address";
  flex?: number;
  maxLength?: number;
}) {
  return (
    <FormControl flex={flex}>
      <FormControl.Label
        _text={{ fontSize: scale.fsXs, color: "coolGray.500" }}
      >
        {label}
      </FormControl.Label>
      <Box
        borderWidth={1}
        borderColor="coolGray.200"
        bg="coolGray.50"
        borderRadius={scale.cardRadius * 0.6}
        height={scale.inputHeight}
        justifyContent="center"
        px={scale.spSm}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          keyboardType={keyboardType ?? "default"}
          maxLength={maxLength}
          style={{
            fontSize: scale.fsSm,
            color: "#1F2937",
            padding: 0,
          }}
        />
      </Box>
    </FormControl>
  );
}

// Tappable "input" that opens the native date picker. Displays a
// human-readable date but stores/returns a "YYYY-MM-DD" string.
function DateField({
  label,
  value,
  onChange,
  scale,
  placeholder = "Select date",
  maximumDate,
  minimumDate,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  scale: Scale;
  placeholder?: string;
  maximumDate?: Date;
  minimumDate?: Date;
}) {
  const [open, setOpen] = useState(false);

  const handleChange = (event: DateTimePickerEvent, selected?: Date) => {
    // Android fires "dismissed" on cancel; iOS keeps the picker mounted
    // inline so we close manually via the Done button flow below.
    if (Platform.OS === "android") {
      setOpen(false);
      if (event.type === "set" && selected) {
        onChange(toDateString(selected));
      }
      return;
    }
    if (selected) {
      onChange(toDateString(selected));
    }
  };

  return (
    <FormControl>
      <FormControl.Label
        _text={{ fontSize: scale.fsXs, color: "coolGray.500" }}
      >
        {label}
      </FormControl.Label>
      <Pressable onPress={() => setOpen(true)}>
        <HStack
          alignItems="center"
          justifyContent="space-between"
          borderWidth={1}
          borderColor="coolGray.200"
          bg="coolGray.50"
          borderRadius={scale.cardRadius * 0.6}
          height={scale.inputHeight}
          px={scale.spSm}
        >
          <Text
            fontSize={scale.fsSm}
            color={value ? "coolGray.800" : "coolGray.400"}
          >
            {value ? formatDisplayDate(value) : placeholder}
          </Text>
          <Icon
            as={Ionicons}
            name="calendar-outline"
            size={scale.iconSm}
            color="coolGray.400"
          />
        </HStack>
      </Pressable>

      {open && (
        <DateTimePicker
          value={parseDateString(value)}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handleChange}
          maximumDate={maximumDate}
          minimumDate={minimumDate}
        />
      )}

      {/* iOS spinner stays mounted until dismissed explicitly */}
      {open && Platform.OS === "ios" && (
        <HStack justifyContent="flex-end" mt={scale.spXs}>
          <Pressable onPress={() => setOpen(false)}>
            <Text
              fontSize={scale.fsSm}
              fontWeight="700"
              color="indigo.600"
              px={scale.spSm}
              py={scale.spXs / 2}
            >
              Done
            </Text>
          </Pressable>
        </HStack>
      )}
    </FormControl>
  );
}

// Tappable "input" that opens a bottom sheet (Actionsheet) of options.
// Unlike native-base's Select, the entire field — not just the chevron
// icon — is wrapped in a single Pressable, so tapping anywhere on it
// opens the sheet.
function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
  scale,
  placeholder = "Select",
}: {
  label: string;
  value: T | "";
  options: { label: string; value: T }[];
  onChange: (v: T) => void;
  scale: Scale;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const selectedLabel = options.find((o) => o.value === value)?.label;

  return (
    <FormControl>
      <FormControl.Label
        _text={{ fontSize: scale.fsXs, color: "coolGray.500" }}
      >
        {label}
      </FormControl.Label>

      <Pressable onPress={() => setOpen(true)}>
        {({ isPressed }) => (
          <HStack
            alignItems="center"
            justifyContent="space-between"
            borderWidth={1}
            borderColor="coolGray.200"
            bg={isPressed ? "coolGray.100" : "coolGray.50"}
            borderRadius={scale.cardRadius * 0.6}
            height={scale.inputHeight}
            px={scale.spSm}
          >
            <Text
              fontSize={scale.fsSm}
              fontWeight={selectedLabel ? "semibold" : "normal"}
              color={selectedLabel ? "coolGray.900" : "coolGray.400"}
            >
              {selectedLabel ?? placeholder}
            </Text>
            <Feather name="chevron-down" size={scale.iconSm} color="#6B7280" />
          </HStack>
        )}
      </Pressable>

      <Actionsheet isOpen={open} onClose={() => setOpen(false)}>
        <Actionsheet.Content>
          <Text
            fontSize={scale.fsSm}
            fontWeight="700"
            color="coolGray.800"
            alignSelf="flex-start"
            px={scale.spSm}
            pb={scale.spSm}
          >
            {label}
          </Text>
          {options.map((opt) => {
            const selected = opt.value === value;
            return (
              <Actionsheet.Item
                key={opt.value}
                onPress={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                bg={selected ? "indigo.50" : undefined}
                _text={{
                  color: selected ? "indigo.600" : "coolGray.900",
                  fontWeight: selected ? "bold" : "normal",
                }}
                endIcon={
                  selected ? (
                    <Feather
                      name="check"
                      size={scale.iconSm * 0.85}
                      color="#4F46E5"
                    />
                  ) : undefined
                }
              >
                {opt.label}
              </Actionsheet.Item>
            );
          })}
        </Actionsheet.Content>
      </Actionsheet>
    </FormControl>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────

function toEditableFields(user: AuthProps | null): EditableProfileFields {
  return {
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",

    phone: user?.phone ?? "",
    profileImgUrl: user?.profileImgUrl ?? "",

    bio: user?.bio ?? "",

    designation: user?.designation ?? "",
    department: user?.department ?? "",
    company: user?.company ?? "",
    employeeId: user?.employeeId ?? "",
    experience: user?.experience != null ? String(user.experience) : "",
    joiningDate: user?.joiningDate ? user.joiningDate.slice(0, 10) : "",

    dateOfBirth: user?.dateOfBirth ? user.dateOfBirth.slice(0, 10) : "",
    // Guard against any unexpected value (null/undefined/invalid string)
    // ever reaching native-base's Select as something other than "" or a
    // known Gender — that mismatch is what typically throws/warns.
    gender:
      user?.gender && GENDER_OPTIONS.some((g) => g.value === user.gender)
        ? user.gender
        : "",

    address: user?.address ?? "",
    city: user?.city ?? "",
    state: user?.state ?? "",
    country: user?.country ?? "",
    zipCode: user?.zipCode ?? "",

    language: user?.language ?? "",
    timezone: user?.timezone ?? "",
    website: user?.website ?? "",

    skills: user?.skills ?? [],

    githubUrl: user?.githubUrl ?? "",
    linkedinUrl: user?.linkedinUrl ?? "",
    twitterUrl: user?.twitterUrl ?? "",
    portfolioUrl: user?.portfolioUrl ?? "",

    isProfilePublic: user?.isProfilePublic ?? false,
  };
}

// ─────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────

export const EditProfileSection = ({
  user,
  onTapBack,
  onTapChangeAvatar,
  onSave,
  isSaving = false,
  isActive = true,
}: EditProfileSectionProps) => {
  const { containerDimensions, onLayout } = useContainerDimensions();
  const setDisplayAppLoader = useSetAtom(AppLoaderAtom);

  const [fields, setFields] = useState<EditableProfileFields>(() =>
    toEditableFields(user),
  );
  const [skillDraft, setSkillDraft] = useState("");

  // Re-sync local form state whenever a fresh user object arrives from the
  // slice (e.g. after navigating in, or after a save completes).
  useEffect(() => {
    setFields(toEditableFields(user));
  }, [user]);

  // ── Global loader control ────────────────────────────────────────────
  useEffect(() => {
    if (!isActive) return;

    if (containerDimensions.baseSize === 0) {
      setDisplayAppLoader({ isLoading: true, message: "Loading" });
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

    const newBaseSize = baseSize * 1.4;
    return {
      fsXs: adjustSizeToResolveZoomInIssue(newBaseSize * 0.028),
      fsSm: adjustSizeToResolveZoomInIssue(newBaseSize * 0.032),
      fsMd: adjustSizeToResolveZoomInIssue(newBaseSize * 0.038),
      fsLg: adjustSizeToResolveZoomInIssue(newBaseSize * 0.048),

      spXs: adjustSizeToResolveZoomInIssue(newBaseSize * 0.01),
      spSm: adjustSizeToResolveZoomInIssue(newBaseSize * 0.02),
      spMd: adjustSizeToResolveZoomInIssue(newBaseSize * 0.035),
      spLg: adjustSizeToResolveZoomInIssue(newBaseSize * 0.05),

      iconSm: adjustSizeToResolveZoomInIssue(newBaseSize * 0.045),
      iconMd: adjustSizeToResolveZoomInIssue(newBaseSize * 0.06),

      avatarSize: adjustSizeToResolveZoomInIssue(newBaseSize * 0.24),
      cardRadius: adjustSizeToResolveZoomInIssue(newBaseSize * 0.035),
      inputHeight: adjustSizeToResolveZoomInIssue(newBaseSize * 0.1),
    };
  }, [baseSize]);

  const setField = <K extends keyof EditableProfileFields>(
    key: K,
    value: EditableProfileFields[K],
  ) => {
    setFields((prev) => ({ ...prev, [key]: value }));
  };

  const addSkill = () => {
    const trimmed = skillDraft.trim();
    if (!trimmed) return;
    if (fields.skills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      setSkillDraft("");
      return;
    }
    setField("skills", [...fields.skills, trimmed]);
    setSkillDraft("");
  };

  const removeSkill = (skill: string) => {
    setField(
      "skills",
      fields.skills.filter((s) => s !== skill),
    );
  };

  const handleSave = () => {
    Keyboard.dismiss();
    onSave(fields);
  };

  // Opens the device's photo library, previews the picked image locally,
  // and hands the asset up to the parent (via onTapChangeAvatar) so it can
  // handle the actual upload/storage.
  const handleChangeAvatar = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: "photo",
        selectionLimit: 1,
        quality: 0.8,
      });

      if (result.didCancel) return;

      if (result.errorCode) {
        console.error("Image picker error:", result.errorMessage);
        return;
      }

      const asset = result.assets?.[0];
      if (!asset?.uri) return;

      // Immediate local preview
      setField("profileImgUrl", asset.uri);

      // Let the parent handle the actual upload
      onTapChangeAvatar({
        uri: asset.uri,
        fileName: asset.fileName,
        type: asset.type,
      });
    } catch (err) {
      console.error("handleChangeAvatar error:", err);
    }
  };

  if (!user) return null;

  return (
    <View flex={1} justifyContent={"center"} alignItems={"center"} px={"1%"}>
      <Box width={"100%"} height={"100%"} onLayout={onLayout}>
        {scale && (
          <VStack width={width} height={height}>
            <CommonDetailHeader
              title="Edit Profile"
              subtitle="Update your personal information"
              onTabBackButton={onTapBack}
              showEdit={false}
              showMenuBar={false}
              fs={width}
            />

            <ScrollView
              width="100%"
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: height * 0.1 }}
            >
              {/* Avatar */}
              <VStack alignItems="center" mt={scale.spMd} mb={scale.spMd}>
                <Box>
                  <Avatar
                    size={scale.avatarSize}
                    source={
                      fields.profileImgUrl
                        ? { uri: fields.profileImgUrl }
                        : undefined
                    }
                    borderWidth={3}
                    borderColor="white"
                    _text={{
                        fontSize : adjustSizeToResolveZoomInIssue(scale.fsLg* 1.2)
                    }}
                  >
                    {`${fields.firstName?.charAt(0) ?? ""}${fields.lastName?.charAt(0) ?? ""}`.toUpperCase()}
                  </Avatar>
                  <Pressable
                    onPress={handleChangeAvatar}
                    position="absolute"
                    bottom={0}
                    right={0}
                    bg="indigo.600"
                    borderRadius="full"
                    p={scale.spXs}
                    borderWidth={2}
                    borderColor="white"
                  >
                    <Icon
                      as={Ionicons}
                      name="camera"
                      size={scale.fsSm}
                      color="white"
                    />
                  </Pressable>
                </Box>
                <Text
                  fontSize={scale.fsXs}
                  color="coolGray.400"
                  mt={scale.spXs}
                >
                  Tap the camera icon to change photo
                </Text>
              </VStack>

              {/* Basic Information */}
              <SectionCard title="Basic Information" scale={scale}>
                <HStack space={scale.spSm}>
                  <FieldInput
                    label="First Name"
                    value={fields.firstName}
                    onChangeText={(v) => setField("firstName", v)}
                    scale={scale}
                    flex={1}
                  />
                  <FieldInput
                    label="Last Name"
                    value={fields.lastName}
                    onChangeText={(v) => setField("lastName", v)}
                    scale={scale}
                    flex={1}
                  />
                </HStack>
                <FieldInput
                  label="Phone"
                  value={fields.phone}
                  onChangeText={(v) => setField("phone", v)}
                  scale={scale}
                  keyboardType="phone-pad"
                  placeholder="+91 98765 43210"
                />

                {/* Bio — the one field that uses MAX_BIO_LENGTH instead
                    of the shared MAX_FIELD_LENGTH, since it's meant to
                    hold a short paragraph rather than a single value. */}
                <FormControl>
                  <HStack
                    justifyContent="space-between"
                    alignItems="center"
                    mb={scale.spXs / 2}
                  >
                    <FormControl.Label
                      _text={{ fontSize: scale.fsXs, color: "coolGray.500" }}
                      mb={0}
                    >
                      Bio
                    </FormControl.Label>
                    <Text fontSize={scale.fsXs} color="coolGray.400">
                      {fields.bio.length}/{MAX_BIO_LENGTH}
                    </Text>
                  </HStack>
                  <Box
                    borderWidth={1}
                    borderColor="coolGray.200"
                    bg="coolGray.50"
                    borderRadius={scale.cardRadius * 0.6}
                    px={scale.spSm}
                    py={scale.spXs}
                  >
                    <TextInput
                      value={fields.bio}
                      onChangeText={(v) =>
                        setField("bio", v.slice(0, MAX_BIO_LENGTH))
                      }
                      placeholder="Tell people a little about yourself"
                      placeholderTextColor="#9CA3AF"
                      multiline
                      maxLength={MAX_BIO_LENGTH}
                      numberOfLines={4}
                      textAlignVertical="top"
                      style={{
                        fontSize: scale.fsSm,
                        color: "#1F2937",
                        minHeight: scale.inputHeight * 2.2,
                        padding: 0,
                      }}
                    />
                  </Box>
                </FormControl>
              </SectionCard>

              {/* Professional */}
              <SectionCard title="Professional" scale={scale}>
                <FieldInput
                  label="Designation"
                  value={fields.designation}
                  onChangeText={(v) => setField("designation", v)}
                  scale={scale}
                />
                <HStack space={scale.spSm}>
                  <FieldInput
                    label="Department"
                    value={fields.department}
                    onChangeText={(v) => setField("department", v)}
                    scale={scale}
                    flex={1}
                  />
                  <FieldInput
                    label="Company"
                    value={fields.company}
                    onChangeText={(v) => setField("company", v)}
                    scale={scale}
                    flex={1}
                  />
                </HStack>
                <HStack space={scale.spSm}>
                  <FieldInput
                    label="Employee ID"
                    value={fields.employeeId}
                    onChangeText={(v) => setField("employeeId", v)}
                    scale={scale}
                    flex={1}
                  />
                  <FieldInput
                    label="Experience (yrs)"
                    value={fields.experience}
                    onChangeText={(v) =>
                      setField("experience", v.replace(/[^0-9]/g, ""))
                    }
                    scale={scale}
                    keyboardType="numeric"
                    flex={1}
                  />
                </HStack>

                {/* Joining Date — native date picker, capped at today */}
                <DateField
                  label="Joining Date"
                  value={fields.joiningDate}
                  onChange={(v) => setField("joiningDate", v)}
                  scale={scale}
                  maximumDate={new Date()}
                />
              </SectionCard>

              {/* Personal */}
              <SectionCard title="Personal" scale={scale}>
                {/* Date of Birth — native date picker, capped so a future
                    date can't be picked */}
                <DateField
                  label="Date of Birth"
                  value={fields.dateOfBirth}
                  onChange={(v) => setField("dateOfBirth", v)}
                  scale={scale}
                  maximumDate={new Date()}
                />

                {/* Gender — tapping ANYWHERE on the field (not just the
                    chevron) opens a bottom sheet of options, same pattern
                    as the DateField above. */}
                <SelectField
                  label="Gender"
                  value={fields.gender}
                  options={GENDER_OPTIONS}
                  onChange={(v) => setField("gender", v)}
                  scale={scale}
                  placeholder="Select gender"
                />
                <HStack space={scale.spSm}>
                  <FieldInput
                    label="Language"
                    value={fields.language}
                    onChangeText={(v) => setField("language", v)}
                    scale={scale}
                    flex={1}
                  />
                  <FieldInput
                    label="Timezone"
                    value={fields.timezone}
                    onChangeText={(v) => setField("timezone", v)}
                    scale={scale}
                    flex={1}
                  />
                </HStack>
                <FieldInput
                  label="Website"
                  value={fields.website}
                  onChangeText={(v) => setField("website", v)}
                  scale={scale}
                  placeholder="https://"
                />
              </SectionCard>

              {/* Address */}
              <SectionCard title="Address" scale={scale}>
                <FieldInput
                  label="Address"
                  value={fields.address}
                  onChangeText={(v) => setField("address", v)}
                  scale={scale}
                />
                <HStack space={scale.spSm}>
                  <FieldInput
                    label="City"
                    value={fields.city}
                    onChangeText={(v) => setField("city", v)}
                    scale={scale}
                    flex={1}
                  />
                  <FieldInput
                    label="State"
                    value={fields.state}
                    onChangeText={(v) => setField("state", v)}
                    scale={scale}
                    flex={1}
                  />
                </HStack>
                <HStack space={scale.spSm}>
                  <FieldInput
                    label="Country"
                    value={fields.country}
                    onChangeText={(v) => setField("country", v)}
                    scale={scale}
                    flex={1}
                  />
                  <FieldInput
                    label="Zip Code"
                    value={fields.zipCode}
                    onChangeText={(v) => setField("zipCode", v)}
                    scale={scale}
                    keyboardType="numeric"
                    flex={1}
                  />
                </HStack>
              </SectionCard>

              {/* Skills */}
              <SectionCard title="Skills" scale={scale}>
                <HStack space={scale.spSm} alignItems="center">
                  <Box
                    flex={1}
                    borderWidth={1}
                    borderColor="coolGray.200"
                    bg="coolGray.50"
                    borderRadius={scale.cardRadius * 0.6}
                    height={scale.inputHeight}
                    justifyContent="center"
                    px={scale.spSm}
                  >
                    <TextInput
                      value={skillDraft}
                      onChangeText={setSkillDraft}
                      onSubmitEditing={addSkill}
                      placeholder="Add a skill and press enter"
                      placeholderTextColor="#9CA3AF"
                      maxLength={MAX_FIELD_LENGTH}
                      style={{
                        fontSize: scale.fsSm,
                        color: "#1F2937",
                        padding: 0,
                      }}
                    />
                  </Box>
                  <Pressable
                    onPress={addSkill}
                    bg="indigo.600"
                    borderRadius={scale.cardRadius * 0.6}
                    height={scale.inputHeight}
                    width={scale.inputHeight}
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Icon
                      as={Ionicons}
                      name="add"
                      size={scale.iconMd}
                      color="white"
                    />
                  </Pressable>
                </HStack>

                {fields.skills.length > 0 && (
                  <HStack flexWrap="wrap" space={scale.spXs}>
                    {fields.skills.map((skill) => (
                      <HStack
                        key={skill}
                        alignItems="center"
                        bg="indigo.50"
                        borderRadius={scale.spXs * 2}
                        px={scale.spSm}
                        py={scale.spXs / 2}
                        mb={scale.spXs}
                        space={scale.spXs}
                      >
                        <Text
                          fontSize={scale.fsXs}
                          fontWeight="600"
                          color="indigo.700"
                        >
                          {skill}
                        </Text>
                        <Pressable
                          onPress={() => removeSkill(skill)}
                          hitSlop={6}
                        >
                          <Icon
                            as={Ionicons}
                            name="close"
                            size={scale.fsXs}
                            color="indigo.400"
                          />
                        </Pressable>
                      </HStack>
                    ))}
                  </HStack>
                )}
              </SectionCard>

              {/* Social Links */}
              <SectionCard title="Social Links" scale={scale}>
                <FieldInput
                  label="LinkedIn URL"
                  value={fields.linkedinUrl}
                  onChangeText={(v) => setField("linkedinUrl", v)}
                  scale={scale}
                />
                <FieldInput
                  label="GitHub URL"
                  value={fields.githubUrl}
                  onChangeText={(v) => setField("githubUrl", v)}
                  scale={scale}
                />
                <FieldInput
                  label="Twitter URL"
                  value={fields.twitterUrl}
                  onChangeText={(v) => setField("twitterUrl", v)}
                  scale={scale}
                />
                <FieldInput
                  label="Portfolio URL"
                  value={fields.portfolioUrl}
                  onChangeText={(v) => setField("portfolioUrl", v)}
                  scale={scale}
                />
              </SectionCard>

              <Button
                onPress={handleSave}
                isLoading={isSaving}
                isLoadingText="Saving..."
                bg="indigo.600"
                borderRadius={scale.cardRadius}
                height={scale.inputHeight * 1.1}
                _text={{ fontSize: scale.fsSm, fontWeight: "700" }}
                mb={scale.spMd}
              >
                Save Changes
              </Button>
            </ScrollView>
          </VStack>
        )}
      </Box>
    </View>
  );
};
