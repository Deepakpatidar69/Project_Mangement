export type MessageAtomProps = {
  uniqueId: string;
  isDisplayMessageModal: boolean;
  type: "TASK" | "PROJECT" | undefined;
  title: string;
  status: boolean;
  dueDate: Date | null;
  backdropColor?: string;
  backgroundColor?: string;
  onTapSendMessage?: ({
    message,
    projectId,
    taskId,
    type,
  }: {
    message: string;
    taskId?: string;
    type: "PROJECT" | "TASK";
    projectId?: string;
  }) => void;
  onTapCancel?: () => void;
};

export interface MenuOption {
  id: string;
  label: string;
  icon: string;
  iconColor?: string;
  textColor?: string;
  bgNormalColor?: string;
  bgPressedColor?: string;
  isVisible: boolean;
  onPress: () => void;
  isDisable ?: boolean;
}

export interface GlobalMenuState {
  isOpen: boolean;
  x: number;
  y: number;
  iconWidth: number;
  minWidth: number; // Added minWidth
  options: MenuOption[];
}

export interface AppLoaderProps {
  isLoading: boolean;
  message: string;
}
