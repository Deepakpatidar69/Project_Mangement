import { Clipboard } from "react-native";
import { MemberProps, MessageProps } from "../store/slices/types";
import { RefObject } from "react";
import { View } from "react-native";
import { GlobalMenuState, MenuOption } from "../utils/props.utils";

// 3. Define the props for the universal function
export interface OpenUniversalMenuProps {
  triggerRef: RefObject<View | any>; // Ref used for measuring
  setGlobalMenu: (state: GlobalMenuState) => void; // The state setter
  minWidth: number;
  options: MenuOption[];
  [key: string]: any;
}

// 4. The Universal Function with Types
export const openUniversalMenu = ({
  triggerRef,
  setGlobalMenu,
  minWidth,
  options,
}: OpenUniversalMenuProps) => {
  // Ensure the ref exists before trying to measure it
  if (!triggerRef.current) return;

  triggerRef.current.measureInWindow(
    (x: number, y: number, width: number, height: number) => {
      setGlobalMenu({
        isOpen: true,
        x: x,
        y: y + height,
        iconWidth: width,
        minWidth: minWidth,
        options: options.filter((option) => option.isVisible !== false),
      });
    },
  );
};

// This can live in the same file as your component, or a separate config file
export const getMessageMenuOptions = ({
  msg,
  canDeleteMessage,
  onDeleteMessage,
}: {
  msg: MessageProps;
  canDeleteMessage: boolean;
  onDeleteMessage: (messageId: string) => void;
}) => {
  return [
    {
      id: "writeComment",
      icon: "message-circle",
      isVisible: true,
      label: "Write Comment",
      onPress: () => {
        console.log("Write comment clicked");
      },
      bgNormalColor: "blue.50",
      bgPressedColor: "blue.100",
      iconColor: "#2563EB",
      textColor: "#1D4ED8",
    },
    {
      id: "copyMessage",
      icon: "copy",
      isVisible: true,
      label: "Copy Message",
      onPress: () => {
        Clipboard.setString(msg.message);
      },
      bgNormalColor: "coolGray.100",
      bgPressedColor: "coolGray.200",
      iconColor: "#374151",
      textColor: "#111827",
    },
    {
      id: "deleteMessage",
      icon: "trash-2",
      isVisible: canDeleteMessage,
      label: "Delete Message",
      onPress: () => {
        onDeleteMessage(msg.messageId);
      },
      bgNormalColor: "red.50",
      bgPressedColor: "red.100",
      iconColor: "#DC2626",
      textColor: "#B91C1C",
    },
  ];
};

interface GetMemberOptionsParams {
  isAdmin: boolean;
  item: MemberProps;
  onUpdateRole: (item: MemberProps) => void;
  onRemoveUser: (item: MemberProps) => void;
}

export const getMemberOptions = ({
  isAdmin,
  item,
  onUpdateRole,
  onRemoveUser,
}: GetMemberOptionsParams) => {
  return [
    {
      id: "update-role",
      icon: "edit-2",
      isVisible: isAdmin,
      label: "Update Role",
      onPress: () => onUpdateRole(item),
      bgNormalColor: "white",
      bgPressedColor: "coolGray.100",
      iconColor: "#374151",
      textColor: "coolGray.800",
    },
    {
      id: "remove-user",
      icon: "user-x",
      isVisible: isAdmin,
      label: "Remove User",
      onPress: () => onRemoveUser(item),
      bgNormalColor: "red.50",
      bgPressedColor: "red.200",
      iconColor: "#DC2626",
      textColor: "red.600",
    },
  ];
};

export const getProjectMenuOptions = ({
  isCompleted = false,
  onClickDelete,
  onClickMarkComplete,
  onClickUpdate,
}: {
  isCompleted?: boolean;
  onClickUpdate: () => void;
  onClickMarkComplete: () => void;
  onClickDelete: () => void;
}): MenuOption[] => {
  return [
    {
      id: "updateTask",
      icon: "edit-2",
      isVisible: true,
      label: "Edit Task",
      onPress: onClickUpdate,
      bgNormalColor: "coolGray.100",
      bgPressedColor: "coolGray.200",
      iconColor: "#374151", // gray-700
      textColor: "#111827", // gray-900
      isDisable: isCompleted,
    },
    {
      id: isCompleted ? "markIncomplete" : "markCompleted",
      icon: isCompleted ? "repeat" : "check-circle",
      isVisible: true,
      label: isCompleted ? "Mark as Incomplete" : "Mark as Complete",
      onPress: onClickMarkComplete,
      bgNormalColor: isCompleted ? "orange.50" : "green.50",
      bgPressedColor: isCompleted ? "orange.100" : "green.100",
      iconColor: isCompleted ? "#EA580C" : "#16A34A", // orange-600 : green-600
      textColor: isCompleted ? "#eb612a" : "#15803D", // orange-700 : green-700
    },
    {
      id: "deleteTask",
      icon: "trash-2",
      isVisible: true,
      isDisable: isCompleted,
      label: "Delete Task",
      onPress: onClickDelete,

      bgNormalColor: "red.50",
      bgPressedColor: "red.100",
      iconColor: "#DC2626", // red-600
      textColor: "#B91C1C", // red-700
    },
  ];
};

export const getTaskMenuOptions = ({
  isCompleted = false,
  onClickDelete,
  onClickMarkComplete,
  onClickUpdate,
}: {
  isCompleted?: boolean;
  onClickUpdate: () => void;
  onClickMarkComplete: () => void;
  onClickDelete: () => void;
}): MenuOption[] => {
  return [
    {
      id: "updateTask",
      icon: "edit-2",
      isVisible: true,
      label: "Edit Task",
      onPress: onClickUpdate,

      bgNormalColor: "coolGray.100",
      bgPressedColor: "coolGray.200",
      iconColor: "#374151", // gray-700
      textColor: "#111827", // gray-900
      isDisable: isCompleted,
    },
    {
      id: isCompleted ? "markIncomplete" : "markCompleted",
      icon: isCompleted ? "repeat" : "check-circle",
      isVisible: true,
      label: isCompleted ? "Mark as Incomplete" : "Mark as Complete",
      onPress: onClickMarkComplete,
      bgNormalColor: isCompleted ? "orange.50" : "green.50",
      bgPressedColor: isCompleted ? "orange.100" : "green.100",
      iconColor: isCompleted ? "#EA580C" : "#16A34A", // orange-600 : green-600
      textColor: isCompleted ? "#eb612a" : "#15803D", // orange-700 : green-700
    },
    {
      id: "deleteTask",
      icon: "trash-2",
      isVisible: true,
      label: "Delete Task",
      onPress: onClickDelete,
      isDisable: isCompleted,
      bgNormalColor: "red.50",
      bgPressedColor: "red.100",
      iconColor: "#DC2626", // red-600
      textColor: "#B91C1C", // red-700
    },
  ];
};
