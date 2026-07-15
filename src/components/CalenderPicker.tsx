import React, { useState } from "react";
import { Box, HStack, Pressable, Icon, Text, Button } from "native-base";
import { Platform } from "react-native";
// @ts-ignore
import { Feather } from "react-native-vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { adjustSizeToResolveZoomInIssue } from "../utils/Helper";

// ─── Shared Constants & Formatters ────────────────────────────────────────────
export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
export const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const formatDatePicker = (d: Date) =>
  `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;
export const formatTime = (d: Date) => {
  let h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
};

// ─── Shared Component ─────────────────────────────────────────────────────────
export default function CalendarPicker({
  selectedDate,
  onSelect,
  onClose,
  fs,
}: {
  selectedDate: Date;
  onSelect: (d: Date) => void;
  /** Optional — when provided, a "Close" button renders side-by-side with
   * "Confirm Date & Time". Omit this prop to keep the original
   * single-button layout (e.g. CreateTaskScreen's inline usage). */
  onClose?: () => void;
  fs: {
    /**
     * @default 16
     */
    iconSize: number;
    /**
     * @default 28
     */
    titleTextSize?: number;
    /**
     * @default 18
     */
    subTitleTextSize?: number;
    /**
     * @default 22
     */
    inputTextSize?: number;
  };
}) {
  const [activeDate, setActiveDate] = useState(new Date(selectedDate));
  const [viewYear, setViewYear] = useState(activeDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(activeDate.getMonth());
  const [showNativeTimePicker, setShowNativeTimePicker] = useState(false);

  // ✅ ADDED: replaces the top-of-screen toast. Rendered inline below the
  // "Confirm Date & Time" button instead, so the error sits right where
  // the user is already looking.
  const [timeError, setTimeError] = useState<string | null>(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else setViewMonth((m) => m - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else setViewMonth((m) => m + 1);
  };

  const cells = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const onTimeChange = (event: any, selectedTime?: Date) => {
    setShowNativeTimePicker(Platform.OS === "ios");
    if (selectedTime) {
      const newDate = new Date(activeDate);
      newDate.setHours(
        selectedTime.getHours(),
        selectedTime.getMinutes(),
        0,
        0,
      );
      // ✅ CHANGED: no more auto-validation here. Picking a time, valid or
      // not, just updates activeDate silently. The past-time check now
      // lives only in the "Confirm Date & Time" button's onPress below —
      // error should show ONLY when the user taps Confirm, not while
      // they're still picking.
      setActiveDate(newDate);
    }
  };

  const handleConfirmPress = () => {
    // ✅ ADDED: this is now the ONLY place the past-time validation runs.
    if (activeDate < new Date()) {
      setTimeError("You cannot select a time in the past.");
      return;
    }
    setTimeError(null);
    onSelect(activeDate);
  };

  return (
    <Box
      mt={2}
      borderWidth={1}
      borderColor="#E0E0E0"
      borderRadius="xl"
      p={3}
      bg="white"
    >
      <HStack justifyContent="space-between" alignItems="center" mb={3}>
        <Pressable onPress={prevMonth} p={1}>
          <Icon
            as={Feather}
            name="chevron-left"
            size={adjustSizeToResolveZoomInIssue(fs?.iconSize ?? 16)}
            color={
              new Date(viewYear, viewMonth, 1) <= today ? "#BDBDBD" : "#1A1A2E"
            }
          />
        </Pressable>
        <Text
          fontSize={adjustSizeToResolveZoomInIssue(fs?.titleTextSize ?? 28)}
          fontWeight="700"
          color="#1A1A2E"
        >
          {MONTHS[viewMonth]} {viewYear}
        </Text>
        <Pressable onPress={nextMonth} p={1}>
          <Icon
            as={Feather}
            name="chevron-right"
            size={adjustSizeToResolveZoomInIssue(fs.iconSize ?? 14)}
            color="#1A1A2E"
          />
        </Pressable>
      </HStack>
      <HStack justifyContent="space-between" mb={1} w="100%">
        {DAYS.map((d) => (
          <Box key={d} w="14.28%" alignItems="center">
            <Text
              fontSize={adjustSizeToResolveZoomInIssue(
                fs?.subTitleTextSize ?? 18,
              )}
              color="#9E9E9E"
              fontWeight="500"
            >
              {d}
            </Text>
          </Box>
        ))}
      </HStack>
      <Box style={{ flexDirection: "row", flexWrap: "wrap", width: "100%" }}>
        {cells.map((day, idx) => {
          if (!day)
            return (
              <Box key={`e-${idx}`} w="14.28%" style={{ aspectRatio: 1 }} />
            );
          const cellDate = new Date(viewYear, viewMonth, day);
          const isPast = cellDate < today;
          const isSelected =
            activeDate.getDate() === day &&
            activeDate.getMonth() === viewMonth &&
            activeDate.getFullYear() === viewYear;
          return (
            <Pressable
              key={day}
              w="14.28%"
              alignItems="center"
              justifyContent="center"
              disabled={isPast}
              style={{ aspectRatio: 1 }}
              onPress={() => {
                const newDate = new Date(activeDate);
                newDate.setFullYear(viewYear, viewMonth, day);
                if (
                  newDate.toDateString() === today.toDateString() &&
                  newDate < new Date()
                ) {
                  newDate.setHours(today.getHours(), today.getMinutes() + 5);
                }
                setActiveDate(newDate);
              }}
            >
              <Box
                w="80%"
                borderRadius="full"
                bg={isSelected ? "#5B3FFF" : "transparent"}
                alignItems="center"
                justifyContent="center"
                style={{ aspectRatio: 1 }}
              >
                <Text
                  fontSize={adjustSizeToResolveZoomInIssue(
                    fs?.inputTextSize ?? 22,
                  )}
                  fontWeight={isSelected ? "700" : "400"}
                  color={isSelected ? "white" : isPast ? "#D6D6D6" : "#1A1A2E"}
                >
                  {day}
                </Text>
              </Box>
            </Pressable>
          );
        })}
      </Box>
      <Box h="1px" bg="#F5F5F5" my={3} />
      <HStack justifyContent="space-between" alignItems="center" mb={4}>
        <Text
          fontSize={adjustSizeToResolveZoomInIssue(fs?.subTitleTextSize ?? 18)}
          fontWeight="600"
          color="#1A1A2E"
        >
          Select Time
        </Text>
        <Pressable
          onPress={() => setShowNativeTimePicker(true)}
          bg="#F4F3FF"
          px={4}
          py={2}
          borderRadius="lg"
          borderWidth={1}
          borderColor="#5B3FFF"
        >
          <HStack space={2} alignItems="center">
            <Icon
              as={Feather}
              name="clock"
              size={fs.iconSize}
              color="#5B3FFF"
            />
            <Text color="#5B3FFF" fontWeight="700">
              {formatTime(activeDate)}
            </Text>
          </HStack>
        </Pressable>
      </HStack>
      {showNativeTimePicker && (
        <DateTimePicker
          value={activeDate}
          mode="time"
          display="clock"
          is24Hour={false}
          onChange={onTimeChange}
        />
      )}
      <HStack space={"3%"} width={"100%"}>
        {/* ── Close (only rendered when onClose is provided) ── */}
        {onClose && (
          <Button
            flex={0.3}
            onPress={onClose}
            bg="coolGray.100"
            borderRadius="lg"
            _text={{ color: "coolGray.700" }}
            _pressed={{ bg: "coolGray.200" }}
          >
            Close
          </Button>
        )}

        <Button
          flex={onClose ?  0.7: 1}
          onPress={handleConfirmPress}
          bg="#5B3FFF"
          borderRadius="lg"
          _pressed={{ opacity: 0.8 }}
        >
          Confirm Date & Time
        </Button>
      </HStack>

      {/* ── Inline error (replaces the old top-of-screen toast) ── */}
      {timeError && (
        <Text
          fontSize={
            adjustSizeToResolveZoomInIssue(fs?.subTitleTextSize ?? 18) * 0.7
          }
          color="#C62828"
          textAlign="center"
          mt={2}
        >
          {timeError}
        </Text>
      )}
    </Box>
  );
}
