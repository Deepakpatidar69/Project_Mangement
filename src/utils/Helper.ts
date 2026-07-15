import { Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DeviceInfo } from "react-native-device-info";

export const adjustSizeToResolveZoomInIssue = (size: number) => {
  if (size % 4 === 0) {
    return size + 1; // avoid multiples of 4
  }

  return size;
};

export const getScreenDimensions = (): {
  screenHeight: number;
  screenWidth: number;
  insetTop: number;
  insetBottom: number;
  baseSizeScreen: number;
} => {
  const screenHeight = Dimensions.get("screen").height;
  const screenWidth = Dimensions.get("screen").width;
  const insetTop = useSafeAreaInsets().top;
  const insetBottom = useSafeAreaInsets().bottom;
  const baseSizeScreen = Math.min(screenHeight, screenWidth);

  return {
    insetBottom,
    insetTop,
    screenHeight,
    screenWidth,
    baseSizeScreen,
  };
};

export const getInsetTop = () => {
  const { insetTop } = getScreenDimensions();

  return insetTop * 0.75;
};

export const isTablet = () => {
  return DeviceInfo.isTablet();
};

export const getShortText = (text: string, maxLength: number = 20) => {
  if (!text) return "";

  if (text.length <= maxLength) {
    return text;
  }

  return text.slice(0, maxLength) + "...";
};

export function getResposiveBoxSize({
  containerHeight,
  containerWidth,
  numCols,
  numRows,
  horizontalSpacing = 0.02,
  verticalSpacing = 0.02,
  rowGap = 0.01,
  columnGap = 0.01,
}: {
  containerWidth: number;
  containerHeight: number;
  numRows: number;
  numCols: number;
  horizontalSpacing?: number;
  verticalSpacing?: number;
  rowGap?: number;
  columnGap?: number;
}): {
  boxSize: number;
  rowGapPx: number;
  columnGapPx: number;
  hSpacingPx: number;
  vSpacingPx: number;
  boxWidth: number;
  boxHeight: number;
  totalWidthAquire: number;
  totalHeightAquire: number;
} {
  if (numRows <= 0 || numCols <= 0) {
    throw new Error("Rows and columns must be greater than 0");
  }

  // Convert spacing & gaps percentages to actual px
  const hSpacingPx = containerWidth * horizontalSpacing;
  const vSpacingPx = containerHeight * verticalSpacing;
  const rowGapPx = containerHeight * rowGap;
  const columnGapPx = containerWidth * columnGap;

  // Total spacing used
  const totalHSpace =
    hSpacingPx * (numCols + 1) + columnGapPx * (numCols - 1) * 2;
  const totalVSpace = vSpacingPx * (numRows + 1) + rowGapPx * (numRows - 1) * 2;

  // Available space for boxes
  const availableWidth = containerWidth - totalHSpace;
  const availableHeight = containerHeight - totalVSpace;

  const boxWidth = Math.floor(availableWidth / numCols);
  const boxHeight = Math.floor(availableHeight / numRows);

  // Final square box size
  const boxSize = Math.floor(Math.min(boxWidth, boxHeight));

  // ---- NEW ----
  // Total width/height that tiles themselves take
  const totalBoxesWidth = boxSize * numCols;
  const totalBoxesHeight = boxSize * numRows;

  // Total full layout (tiles + spacing + gaps)
  const totalWidthAquire =
    totalBoxesWidth +
    hSpacingPx * (numCols + 1) +
    columnGapPx * (numCols - 1) * 2;

  const totalHeightAquire =
    totalBoxesHeight +
    vSpacingPx * (numRows + 1) +
    rowGapPx * (numRows - 1) * 2;

  return {
    boxSize,
    rowGapPx,
    columnGapPx,
    hSpacingPx,
    vSpacingPx,
    boxWidth,
    boxHeight,
    totalWidthAquire,
    totalHeightAquire,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

import { PriorityLevel } from "../store/slices/types";

export const PRIORITY_CONFIG: Record<
  PriorityLevel,
  { label: string; color: string; bg: string; icon: any }
> = {
  LOW: {
    label: "Low",
    color: "#10B981",
    bg: "#D1FAE5",
    icon: "arrow-down-outline",
  },
  MEDIUM: {
    label: "Medium",
    color: "#F59E0B",
    bg: "#FEF3C7",
    icon: "remove-outline",
  },
  HIGH: {
    label: "High",
    color: "#EF4444",
    bg: "#FEE2E2",
    icon: "arrow-up-outline",
  },
  URGENT: {
    label: "Urgent",
    color: "#7C3AED",
    bg: "#EDE9FE",
    icon: "warning-outline",
  },
};

export function formatDate(date: string | Date, withTime = false): string {
  const d = new Date(date);
  const opts: Intl.DateTimeFormatOptions = withTime
    ? {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    : { day: "numeric", month: "short", year: "numeric" };
  return d.toLocaleString("en-US", opts);
}

export function timeAgo(date: string): string {
  const now = new Date();
  const d = new Date(date);
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) {
    const h = d.getHours() % 12 || 12;
    const m = d.getMinutes().toString().padStart(2, "0");
    const ampm = d.getHours() >= 12 ? "PM" : "AM";
    return `${h}:${m} ${ampm}`;
  }
  if (diff < 172800) return "Yesterday";
  return formatDate(date);
}
