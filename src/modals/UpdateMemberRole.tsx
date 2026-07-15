import React, { useState } from "react";
import {
  Box,
  VStack,
  HStack,
  Text,
  Pressable,
  Spinner,
  Icon,
} from "native-base";
// @ts-ignore
import { Feather } from "react-native-vector-icons";
import { useAtom } from "jotai";
import { adjustSizeToResolveZoomInIssue } from "../utils/Helper";
import { MemberRole } from "../store/slices/types";
import { isDisplayErrorMessageAtom } from "../utils/Constent";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../store";
import { clearProjectError } from "../store/slices/ProjectSlice";

// ─── Role options ───────────────────────────────────────────────────────────
const ROLES = [
  {
    value: "ADMIN",
    label: "Admin",
    iconName: "shield",
    iconColor: "#C62828",
    borderColor: "#C62828",
    selectedBg: "#FFEBEE",
  },
  {
    value: "EDITOR",
    label: "Editor",
    iconName: "edit",
    iconColor: "#0288D1",
    borderColor: "#0288D1",
    selectedBg: "#E1F5FE",
  },
  {
    value: "VIEWER",
    label: "Viewer",
    iconName: "eye",
    iconColor: "#2E7D32",
    borderColor: "#2E7D32",
    selectedBg: "#E8F5E9",
  },
] as const;

const getRoleMeta = (value: MemberRole) =>
  ROLES.find((r) => r.value === value) ?? ROLES[2]; // fallback: VIEWER

// ─── Props ──────────────────────────────────────────────────────────────────
export interface UpdateRoleModalProps {
  isModalOpen: boolean;
  onClose: () => void;
  currentRole?: MemberRole;
  compoHeight?: number;
  compoWidth?: number;
  /** Called after a role selection is confirmed.
   * Can be sync or async — if it returns a rejected promise or throws,
   * the shared error modal is shown instead of closing this modal. */
  onSuccess?: (newRole: MemberRole) => void | Promise<void>;
  fontSizeMultiplier?: {
    /** @default 0.065 */
    titleTextSize?: number;
    /** @default 0.05 */
    buttonTextSize?: number;
    /** @default 0.04 */
    borderRadius?: number;
  };
  colorConfig?: {
    bgColor?: string;
    titleColor?: string;
    cancelButtonTextColor?: string;
    confirmButtonTextColor?: string;
    cancelButtonBgColor?: string;
    confirmButtonBgColor?: string;
    pressedConfirmButtonBgColor?: string;
    pressedCancelButtonBgColor?: string;
  };
}

export default function UpdateRoleModal({
  isModalOpen,
  onClose,
  onSuccess,
  currentRole = "VIEWER",
  compoHeight = 100,
  compoWidth = 100,
  fontSizeMultiplier,
  colorConfig,
}: UpdateRoleModalProps) {
  const [, setErrorModal] = useAtom(isDisplayErrorMessageAtom);

  const dispatch = useDispatch<AppDispatch>();

  const [pendingRole, setPendingRole] = useState<MemberRole>(currentRole);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [showOptions, setShowOptions] = useState(false);

  const baseSize = Math.min(compoHeight, compoWidth);

  const titleSize = adjustSizeToResolveZoomInIssue(
    baseSize * (fontSizeMultiplier?.titleTextSize ?? 0.065),
  );
  const buttonTextSize = adjustSizeToResolveZoomInIssue(
    baseSize * (fontSizeMultiplier?.buttonTextSize ?? 0.05),
  );
  const borderRadius = adjustSizeToResolveZoomInIssue(
    baseSize * (fontSizeMultiplier?.borderRadius ?? 0.04),
  );
  const buttonHeight = adjustSizeToResolveZoomInIssue(baseSize * 0.14);

  const outerPadding = adjustSizeToResolveZoomInIssue(baseSize * 0.06);
  const sectionGap = adjustSizeToResolveZoomInIssue(baseSize * 0.05);

  const fieldIconSize = adjustSizeToResolveZoomInIssue(baseSize * 0.06);
  const fieldTextSize = adjustSizeToResolveZoomInIssue(baseSize * 0.05);
  const optionIconSize = adjustSizeToResolveZoomInIssue(baseSize * 0.045);
  const optionTextSize = adjustSizeToResolveZoomInIssue(baseSize * 0.04);

  const currentMeta = getRoleMeta(pendingRole);

  const handleConfirm = async () => {
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      // Support onSuccess being sync or async so a rejected/throwing
      // slice call surfaces here instead of silently closing the modal.
      await Promise.resolve(onSuccess?.(pendingRole));
      onClose();
    } catch (err: any) {
      onClose?.();
      setErrorModal((prev) => ({
        ...prev,
        isDisplay: true,
        title: "Couldn't update role",
        subtitle:
          typeof err === "string"
            ? err
            : (err?.message ??
              "Something went wrong while updating the member's role. Please try again."),
        onClickLeftButton: () => {
          dispatch(clearProjectError());
        },
      }));
    } finally {
      setIsSubmitting(false);
      onClose?.();
    }
  };

  const handleCancel = () => {
    if (isSubmitting) return;
    setPendingRole(currentRole);
    setSubmitError(null);
    setShowOptions(false);
    onClose();
  };

  return (
    isModalOpen && (
      <Box
        position={"absolute"}
        justifyContent={"center"}
        alignItems={"center"}
        top={0}
        left={0}
        right={0}
        bottom={0}
        zIndex={999}
        backgroundColor={"rgba(0,0,0,0.2)"}
      >
        <Box
          width={compoWidth}
          maxHeight={compoHeight}
          bg={colorConfig?.bgColor ?? "white"}
          rounded={borderRadius}
          shadow={3}
        >
          <VStack
            width={"100%"}
            px={outerPadding}
            py={outerPadding}
            space={sectionGap * 1.2}
          >
            {/* ── Title ── */}
            <Text
              fontSize={titleSize}
              fontWeight="700"
              color={colorConfig?.titleColor ?? "coolGray.900"}
              textAlign="center"
            >
              Update Member Role
            </Text>

            {/* ── Stage 1: Collapsed Role Field ── */}
            {!showOptions && (
              <Pressable
                onPress={() => setShowOptions(true)}
                borderWidth={1.5}
                borderColor={currentMeta.borderColor}
                borderRadius="xl"
                bg={currentMeta.selectedBg}
                px={3}
                py={3}
              >
                <HStack alignItems="center" justifyContent="space-between">
                  <HStack alignItems="center" space={2} flex={1}>
                    <Icon
                      as={Feather}
                      name={currentMeta.iconName as any}
                      size={fieldIconSize}
                      color={currentMeta.iconColor}
                    />
                    <Text
                      fontSize={fieldTextSize}
                      fontWeight="700"
                      color={currentMeta.iconColor}
                    >
                      {currentMeta.label}
                    </Text>
                  </HStack>
                  <Icon
                    as={Feather}
                    name="edit-2"
                    size={fieldIconSize * 0.7}
                    color="#9E9E9E"
                  />
                </HStack>
              </Pressable>
            )}

            {/* ── Stage 2: Expanded Role List ── */}
            {showOptions && (
              <VStack space={3}>
                {/* 
                  IMPORTANT: The .filter() here removes "ADMIN" from the choices 
                  so no one can ever select it. 
                */}
                {ROLES.filter((r) => r.value !== "ADMIN").map((opt) => {
                  const selected = pendingRole === opt.value;
                  return (
                    <Pressable
                      key={opt.value}
                      onPress={() => {
                        setPendingRole(opt.value as MemberRole);
                        setShowOptions(false); // collapse back to Stage 1
                      }}
                      borderWidth={selected ? 1.5 : 1}
                      borderColor={selected ? opt.borderColor : "#E0E0E0"}
                      borderRadius="xl"
                      bg={selected ? opt.selectedBg : "white"}
                      py={3}
                      px={4}
                      alignItems="center"
                    >
                      <HStack alignItems="center" space={2} width="100%">
                        <Icon
                          as={Feather}
                          name={opt.iconName as any}
                          size={optionIconSize}
                          color={opt.iconColor}
                        />
                        <Text
                          fontSize={optionTextSize}
                          fontWeight={selected ? "700" : "500"}
                          color={selected ? opt.iconColor : "#1A1A2E"}
                        >
                          {opt.label}
                        </Text>
                        {selected && (
                          <Box flex={1} alignItems="flex-end">
                            <Icon
                              as={Feather}
                              name="check"
                              size={optionIconSize}
                              color={opt.iconColor}
                            />
                          </Box>
                        )}
                      </HStack>
                    </Pressable>
                  );
                })}

                {/* Close Options Button */}
                <Pressable
                  onPress={() => setShowOptions(false)}
                  alignItems="center"
                  py={2}
                  mt={1}
                  bg={colorConfig?.cancelButtonBgColor ?? "coolGray.200"}
                  _pressed={{
                    bgColor:
                      colorConfig?.pressedCancelButtonBgColor ?? "coolGray.300",
                  }}
                  borderRadius={"xl"}
                >
                  <Text
                    fontSize={optionTextSize}
                    color="coolGray.500"
                    fontWeight="600"
                  >
                    Close
                  </Text>
                </Pressable>
              </VStack>
            )}

            {/* ── Inline error (reserved for client-side validation, if added later) ── */}
            {submitError && (
              <Text
                fontSize={adjustSizeToResolveZoomInIssue(titleSize * 0.6)}
                color="#C62828"
                textAlign="center"
              >
                {submitError}
              </Text>
            )}

            {/* ── Cancel / Confirm (Stage 1 Only) ── */}
            {!showOptions && (
              <HStack width={"100%"} space={"4%"} justifyContent={"center"}>
                <Pressable
                  flex={1}
                  height={buttonHeight}
                  bg={colorConfig?.cancelButtonBgColor ?? "coolGray.100"}
                  rounded={borderRadius * 0.6}
                  justifyContent={"center"}
                  alignItems={"center"}
                  onPress={handleCancel}
                  isDisabled={isSubmitting}
                  opacity={isSubmitting ? 0.6 : 1}
                  _pressed={{
                    bg:
                      colorConfig?.pressedCancelButtonBgColor ?? "coolGray.200",
                  }}
                >
                  <Text
                    fontSize={buttonTextSize}
                    fontWeight="600"
                    color={colorConfig?.cancelButtonTextColor ?? "coolGray.700"}
                  >
                    Cancel
                  </Text>
                </Pressable>

                <Pressable
                  flex={1}
                  height={buttonHeight}
                  bg={colorConfig?.confirmButtonBgColor ?? "indigo.600"}
                  rounded={borderRadius * 0.6}
                  justifyContent={"center"}
                  alignItems={"center"}
                  onPress={handleConfirm}
                  isDisabled={isSubmitting}
                  opacity={isSubmitting ? 0.6 : 1}
                  _pressed={{
                    bg:
                      colorConfig?.pressedConfirmButtonBgColor ?? "indigo.700",
                  }}
                >
                  {isSubmitting ? (
                    <Spinner color="white" size="sm" />
                  ) : (
                    <Text
                      fontSize={buttonTextSize}
                      fontWeight="600"
                      color={colorConfig?.confirmButtonTextColor ?? "white"}
                    >
                      Confirm
                    </Text>
                  )}
                </Pressable>
              </HStack>
            )}
          </VStack>
        </Box>
      </Box>
    )
  );
}
