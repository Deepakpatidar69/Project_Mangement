import { Foundation, Ionicons } from "@expo/vector-icons";
import { MemberRole, PriorityLevel } from "../../store/slices/types";
import { Animated } from "react-native";
import { useRef } from "react";

export const PRIORITY_FLAG_COLOR: Record<PriorityLevel, string> = {
  LOW: "#10B981",
  MEDIUM: "#F59E0B",
  HIGH: "#EF4444",
  URGENT: "#7C3AED",
};

export const ROLE_CONFIG: Record<
  MemberRole,
  { label: string; bg: string; color: string }
> = {
  ADMIN: { label: "Admin", bg: "#EEF2FF", color: "#6366F1" },
  EDITOR: { label: "Editor", bg: "#FEF3C7", color: "#B45309" },
  VIEWER: { label: "Viewer", bg: "#F0FDF4", color: "#15803D" },
  CREATOR: { label: "Creator", bg: "#F0FDF4", color: "#15803D" },
};

const Status_Config = {
  INPROGRESS: {
    status: "In Progress",
    background: "#FEF3C7",
    color: "#B45309",
    iconName: "time-outline",
    iconType: Ionicons,
  },
  COMPLETED: {
    status: "Completed",
    background: "green.200",
    color: "green.600",
    iconName: "checkmark-circle",
    iconType: Ionicons,
  },
  OVERDUE: {
    status: "Overdue",
    background: "red.200",
    color: "red.600",
    iconName: "alert",
    iconType: Foundation,
  },
};

export const getStatus = (status: boolean, deadline: Date) => {
  const deadlineDate = new Date(deadline);

  const status1 = status
    ? "COMPLETED"
    : new Date() > deadlineDate
      ? "OVERDUE"
      : "INPROGRESS";

  return Status_Config[status1];
};


  