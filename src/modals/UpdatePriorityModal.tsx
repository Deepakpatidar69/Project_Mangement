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
import { PriorityLevel } from "../store/slices/types";
import { isDisplayErrorMessageAtom } from "../utils/Constent";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../store";
import { clearProjectError } from "../store/slices/ProjectSlice";
import { clearTaskError } from "../store/slices/TaskSlice";

const PRIORITIES = [
  {
    value: "HIGH",
    label: "High",
    iconName: "arrow-up-right",
    iconColor: "#C62828",
    borderColor: "#C62828",
    selectedBg: "#FFEBEE",
  },
  {
    value: "MEDIUM",
    label: "Medium",
    iconName: "minus-circle",
    iconColor: "#F9A825",
    borderColor: "#F9A825",
    selectedBg: "#FFF8E1",
  },
  {
    value: "LOW",
    label: "Low",
    iconName: "flag",
    iconColor: "#2E7D32",
    borderColor: "#2E7D32",
    selectedBg: "#E8F5E9",
  },
  {
    value: "URGENT",
    label: "Urgent",
    iconName: "zap",
    iconColor: "#4527A0",
    borderColor: "#4527A0",
    selectedBg: "#EDE7F6",
  },
] as const;

const getPriorityMeta = (value: PriorityLevel) =>
  PRIORITIES.find((p) => p.value === value) ?? PRIORITIES[1]; // fallback: MEDIUM

// ─── Props ──────────────────────────────────────────────────────────────────
export interface UpdatePriorityModalProps {
  isModalOpen: boolean;
  onClose: () => void;
  type: "PROJECT" | "TASK";
  isProjectTask?: boolean;
  taskId?: string;
  projectId?: string;
  currentPriority?: PriorityLevel;
  compoHeight?: number;
  compoWidth?: number;
  /** Called after a priority selection is confirmed.
   * Can be sync or async — if it returns a rejected promise or throws,
   * the shared error modal is shown instead of closing this modal. */
  onSuccess?: (newPriority: PriorityLevel) => void | Promise<void>;
  fontSizeMultiplier?: {
    /** @default 0.05 */
    titleTextSize?: number;
    /** @default 0.032 */
    buttonTextSize?: number;
    /** @default 0.04 */
    borderRadius?: number;
  };
  colorConfig?: {
    /** @default "white" */
    bgColor?: string;
    /** @default "coolGray.900" */
    titleColor?: string;
    /** @default "coolGray.700" */
    cancelButtonTextColor?: string;
    /** @default "white" */
    confirmButtonTextColor?: string;
    /** Cancel button background color
     * @default "coolGray.100"
     */
    cancelButtonBgColor?: string;

    /** Confirm button background color
     * @default "indigo.600"
     */
    confirmButtonBgColor?: string;

    /** Confirm button background color while pressed
     * @default "indigo.700"
     */
    pressedConfirmButtonBgColor?: string;

    /** Cancel button background color while pressed
     * @default "coolGray.200"
     */
    pressedCancelButtonBgColor?: string;
  };
}

export default function UpdatePriorityModal({
  isModalOpen,
  onClose,
  onSuccess,
  currentPriority = "MEDIUM",
  compoHeight = 100,
  compoWidth = 100,
  fontSizeMultiplier,
  colorConfig,
}: UpdatePriorityModalProps) {
  const [, setErrorModal] = useAtom(isDisplayErrorMessageAtom);

  const dispatch = useDispatch<AppDispatch>();

  const [pendingPriority, setPendingPriority] =
    useState<PriorityLevel>(currentPriority);
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

  const currentMeta = getPriorityMeta(pendingPriority);

  const handleConfirm = async () => {
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      // Support onSuccess being sync or async so a rejected/throwing
      // slice call surfaces here instead of silently closing the modal.
      await Promise.resolve(onSuccess?.(pendingPriority));
      onClose();
    } catch (err: any) {
      onClose?.();

      setErrorModal((prev) => ({
        ...prev,
        isDisplay: true,
        title: "Couldn't update priority",
        subtitle:
          typeof err === "string"
            ? err
            : (err?.message ??
              "Something went wrong while updating the priority. Please try again."),
        onClickLeftButton: () => {
          dispatch(clearProjectError());
          dispatch(clearTaskError());
        },
      }));
    } finally {
      setIsSubmitting(false);
      onClose?.();
    }
  };

  const handleCancel = () => {
    if (isSubmitting) return; // don't let a backdrop/cancel tap interrupt an in-flight save
    setPendingPriority(currentPriority); // reset any unsaved picking back to the original
    setSubmitError(null);
    setShowOptions(false); // also collapse back to Stage 1 on cancel
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
              Update Priority
            </Text>

            {/* ── Stage 1: collapsed priority field ──
                Tappable field showing the current/pending priority — icon
                + label, bordered in the priority's own color, with a
                small edit hint. Tapping it expands the selectable grid
                (Stage 2) below. Always reflects `pendingPriority`, so
                once the user picks something in Stage 2 and it collapses
                back, this field shows the NEW selection, not the original
                currentPriority. */}
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

            {/* ── Stage 2: expanded selectable priority grid ──
                Same 2x2 layout/styling as CreateTaskScreen's priority
                picker. Tapping an option sets pendingPriority AND
                collapses back to Stage 1 immediately — selection itself
                doesn't finalize the update; the modal's own Confirm
                button (below, Stage 1 only) does that. */}
            {showOptions && (
              <VStack space={2}>
                <HStack
                  width={"100%"}
                  justifyContent="space-between"
                  space={"2%"}
                >
                  {PRIORITIES.slice(0, 2).map((opt) => {
                    const selected = pendingPriority === opt.value;
                    return (
                      <Pressable
                        key={opt.value}
                        flex={1}
                        onPress={() => {
                          setPendingPriority(opt.value as PriorityLevel);
                          setShowOptions(false); // collapse back to Stage 1 after picking
                        }}
                        borderWidth={selected ? 1.5 : 1}
                        borderColor={selected ? opt.borderColor : "#E0E0E0"}
                        borderRadius="xl"
                        bg={selected ? opt.selectedBg : "white"}
                        py={3}
                        alignItems="center"
                      >
                        <HStack alignItems="center" space={1}>
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
                        </HStack>
                      </Pressable>
                    );
                  })}
                </HStack>
                <HStack
                  width={"100%"}
                  justifyContent="space-between"
                  space={"2%"}
                >
                  {PRIORITIES.slice(2, 4).map((opt) => {
                    const selected = pendingPriority === opt.value;
                    return (
                      <Pressable
                        key={opt.value}
                        flex={1}
                        onPress={() => {
                          setPendingPriority(opt.value as PriorityLevel);
                          setShowOptions(false);
                        }}
                        borderWidth={selected ? 1.5 : 1}
                        borderColor={selected ? opt.borderColor : "#E0E0E0"}
                        borderRadius="xl"
                        bg={selected ? opt.selectedBg : "white"}
                        py={3}
                        alignItems="center"
                      >
                        <HStack alignItems="center" space={1}>
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
                        </HStack>
                      </Pressable>
                    );
                  })}
                </HStack>

                {/* Close button for Stage 2 — lets the user back out of
                    picking without forcing a selection, same idea as the
                    Close button added to CalendarPicker. */}
                <Pressable
                  onPress={() => setShowOptions(false)}
                  alignItems="center"
                  py={2}
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

            {/* ── Cancel / Confirm (side-by-side) ──
                Only shown in Stage 1 — same reasoning as
                UpdateDeadlineModal: while the option grid is expanded,
                showing a separate Cancel/Confirm row would be confusing
                since picking an option already collapses back. */}
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
