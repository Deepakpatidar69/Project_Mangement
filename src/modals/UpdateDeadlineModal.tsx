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
import CalendarPicker, {
  formatDatePicker,
  formatTime,
} from "../components/CalenderPicker";
import { isDisplayErrorMessageAtom } from "../utils/Constent";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../store";
import { clearProjectError } from "../store/slices/ProjectSlice";
import { clearTaskError } from "../store/slices/TaskSlice";

// ─── Props ──────────────────────────────────────────────────────────────────
export interface UpdateDeadlineModalProps {
  /** Controls whether the modal is visible */
  isModalOpen: boolean;

  /** Closes the modal and resets its state */
  onClose: () => void;

  /** Determines whether the deadline belongs to a project or a task */
  type: "PROJECT" | "TASK";

  /** unique identifier this is a projectId or taskId (required when type is "TASK" | "PROJECT") */
  uniqueId?: string;

  /** Current deadline shown when the modal opens
   * @default new Date()
   */
  currentDeadline?: Date | undefined;

  /** Height of the modal container
   * @default 100
   */
  compoHeight?: number;

  /** Width of the modal container
   * @default 100
   */
  compoWidth?: number;

  /** Called after the deadline has been successfully updated.
   * Can be sync or async — if it returns a rejected promise or throws,
   * the shared error modal is shown instead of closing this modal. */
  onSuccess?: (newDeadline: Date) => void | Promise<void>;

  /** Multipliers used to calculate sizes based on the component dimensions */
  fontSizeMultiplier?: {
    /** Multiplier for the title text size
     * @default 0.05
     */
    titleTextSize?: number;

    /** Multiplier for the button text size
     * @default 0.032
     */
    buttonTextSize?: number;

    /** Multiplier for the border radius
     * @default 0.04
     */
    borderRadius?: number;
  };

  /** Custom colors used by the modal and action buttons */
  colorConfig?: {
    /** Modal background color
     * @default "white"
     */
    bgColor?: string;

    /** Title text color
     * @default "coolGray.900"
     */
    titleColor?: string;

    /** Cancel button text color
     * @default "coolGray.700"
     */
    cancelButtonTextColor?: string;

    /** Confirm button text color
     * @default "white"
     */
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

  /** Font sizes used by the embedded CalendarPicker */
  calenderPickerFontSize?: {
    /** Calendar section icon size */
    sectionIcon?: number;

    /** Calendar section title size */
    sectionTitle?: number;

    /** Calendar section subtitle size */
    sectionSub?: number;

    /** Date/time input text size */
    input?: number;
  };
}

export default function UpdateDeadlineModal({
  isModalOpen,
  onClose,
  onSuccess,
  uniqueId,
  type,
  currentDeadline = new Date(),
  compoHeight = 100,
  compoWidth = 100,
  fontSizeMultiplier,
  colorConfig,
}: UpdateDeadlineModalProps) {
  const dispatch = useDispatch<AppDispatch>();

  const [, setErrorModal] = useAtom(isDisplayErrorMessageAtom);

  const normalizedDeadline =
    currentDeadline instanceof Date
      ? currentDeadline
      : currentDeadline
        ? new Date(currentDeadline)
        : new Date();

  const [pendingDate, setPendingDate] = useState<Date>(normalizedDeadline);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Local error is kept ONLY for simple client-side validation (deadline in
  // the past). Any failure coming back from the actual update call (i.e.
  // the slice/backend, via onSuccess) goes to the shared error modal below.
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ✅ ADDED: drives the two-stage flow. false = collapsed field showing the
  // current/pending date+time (Stage 1). true = CalendarPicker expanded
  // (Stage 2). Starts collapsed every time the modal opens.
  const [showCalendar, setShowCalendar] = useState(false);

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
  const buttonHeight = adjustSizeToResolveZoomInIssue(baseSize * 0.12);

  const outerPadding = adjustSizeToResolveZoomInIssue(baseSize * 0.05);
  const sectionGap = adjustSizeToResolveZoomInIssue(baseSize * 0.03);

  // fs object shape CalendarPicker expects.
  const calendarFs = {
    titleTextSize: adjustSizeToResolveZoomInIssue(baseSize * 0.05),
    iconSize: adjustSizeToResolveZoomInIssue(baseSize * 0.08),
    inputTextSize: adjustSizeToResolveZoomInIssue(baseSize * 0.05),
    subTitleTextSize: adjustSizeToResolveZoomInIssue(baseSize * 0.04),
  };

  const handleConfirm = async () => {
    if (pendingDate <= new Date()) {
      setSubmitError("Deadline cannot be in the past.");
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);

    try {
      // Support onSuccess being sync or async so a rejected/throwing
      // slice call surfaces here instead of silently closing the modal.
      await Promise.resolve(onSuccess?.(pendingDate));
      onClose();
    } catch (err: any) {
      onClose?.();
      setErrorModal((prev) => ({
        ...prev,
        isDisplay: true,
        title: "Couldn't update deadline",
        subtitle:
          typeof err === "string"
            ? err
            : (err?.message ??
              "Something went wrong while updating the deadline. Please try again."),
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
    setPendingDate(normalizedDeadline); // ✅ FIX: reset to the normalized Date, not the raw (possibly string) prop
    setSubmitError(null);
    setShowCalendar(false); // also collapse back to Stage 1 on cancel
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
            space={sectionGap}
          >
            {/* ── Title ── */}
            <Text
              fontSize={titleSize}
              fontWeight="700"
              color={colorConfig?.titleColor ?? "coolGray.900"}
              textAlign="center"
            >
              Update Deadline
            </Text>

            {/* ── Stage 1: collapsed date/time field ──
                Styled the same way as CreateTaskScreen's deadline button:
                calendar icon + date, divider, clock icon + time, all
                inside a bordered Pressable. Tapping it expands the
                calendar (Stage 2) below. Always shows `pendingDate`, so
                once the user picks something in the calendar and it
                collapses back, this field reflects the NEW selection, not
                the original currentDeadline. */}
            {!showCalendar && (
              <Pressable
                onPress={() => setShowCalendar(true)}
                borderWidth={1.5}
                borderColor="#5B3FFF"
                borderRadius="xl"
                px={3}
                py={3}
              >
                <HStack alignItems="center" justifyContent="space-between">
                  <HStack alignItems="center" space={2} flex={1}>
                    <Icon
                      as={Feather}
                      name="calendar"
                      size={calendarFs.iconSize * 0.6}
                      color="#5B3FFF"
                    />
                    <Text
                      fontSize={calendarFs.inputTextSize * 0.8}
                      fontWeight="600"
                      color="#1A1A2E"
                    >
                      {formatDatePicker(pendingDate)}
                    </Text>
                  </HStack>
                  <Box
                    w="1px"
                    h={calendarFs.inputTextSize * 1.1}
                    bg="#E0E0E0"
                    mx={2}
                  />
                  <HStack alignItems="center" space={2}>
                    <Icon
                      as={Feather}
                      name="clock"
                      size={calendarFs.iconSize * 0.6}
                      color="#9E9E9E"
                    />
                    <Text
                      fontSize={calendarFs.inputTextSize * 0.8}
                      color="#757575"
                    >
                      {formatTime(pendingDate)}
                    </Text>
                  </HStack>
                  <Icon
                    as={Feather}
                    name="edit-2"
                    size={calendarFs.iconSize * 0.5}
                    color="#9E9E9E"
                    ml={2}
                  />
                </HStack>
              </Pressable>
            )}

            {/* ── Stage 2: expanded calendar + time picker ──
                CalendarPicker's own internal "Confirm Date & Time" button
                calls onSelect — we treat that as "selection finalized for
                this step", so we update pendingDate AND collapse back to
                Stage 1. The modal's own separate Confirm button (below)
                is still the only thing that finalizes the actual update. */}
            {showCalendar && (
              <CalendarPicker
                selectedDate={pendingDate}
                onSelect={(d) => {
                  setPendingDate(d);
                  setShowCalendar(false); // ✅ ADDED: collapse back to Stage 1 after picking
                }}
                onClose={() => setShowCalendar(false)}
                fs={calendarFs}
              />
            )}

            {/* ── Inline error (client-side validation only) ── */}
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
                Only shown in Stage 1 — while the calendar is expanded,
                CalendarPicker's own Confirm button is the active action;
                showing both at once is confusing and visually crowded. */}
            {!showCalendar && (
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
                    bgColor:
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
                    bgColor:
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
