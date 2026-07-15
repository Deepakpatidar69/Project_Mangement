import { commonModalProps } from "../modals/CommonModel";
import { UpdateDeadlineModalProps } from "../modals/UpdateDeadlineModal";
import { UpdateRoleModalProps } from "../modals/UpdateMemberRole";
import { UpdatePriorityModalProps } from "../modals/UpdatePriorityModal";
import {
  AppLoaderProps,
  MemberAtomProps,
  MessageAtomProps,
} from "./props.utils";

export const TASK_DELETE_TITLE = "Confirm Deletion";
export const TASK_DELETE_SUBTITLE =
  "Are you sure you want to delete this task?";
export const TASK_DELETE_NOTE = "Once deleted, this item cannot be recovered.";

export const PROJECT_DELETE_TITLE = "Confirm Deletion";
export const PROJECT_DELETE_SUBTITLE =
  "Are you sure you want to completely delete this project? All tasks and data inside this project will be permanently removed.";
export const PROJECT_DELETE_NOTE =
  "Once deleted, this item cannot be recovered.";

export const DELETE_RIGHT_TEXT = "Confirm Delete";
export const DELETE_LEFT_TEXT = "Cancel";

export const MARK_COMPLETE_TASK_TITLE = "Mark as Complete";
export const MARK_COMPLETE_TASK_SUBTITLE =
  "Are you sure you want to mark this task as finished?";
export const MARK_COMPLETE_TASK_NOTE =
  "The task will be moved to your completed list.";

export const MARK_COMPLETE_PROJECT_TITLE = "Mark as Complete";
export const MARK_COMPLETE_PROJECT_SUBTITLE =
  "Are you sure you want to mark this project as finished?";
export const MARK_COMPLETE_PROJECT_NOTE =
  "All active tasks within this project will also be marked as complete.";

export const MARK_COMPLETE_LEFT_BUTTON = "Cancel";
export const MARK_COMPLETE_RIGHT_BUTTON = "Mark Complete";
export const MARK_INCOMPLETE_RIGHT_BUTTON = "Mark InComplete";

export const MARK_INCOMPLETE_PROJECT_TITLE = "Mark as Incomplete";

export const MARK_INCOMPLETE_PROJECT_SUBTITLE =
  "Are you sure you want to mark this project as incomplete?";

export const MARK_INCOMPLETE_PROJECT_NOTE =
  "After mark them incomplete you and the members of this project there are allow to edit details.";

export const MARK_INCOMPLETE_TASK_TITLE = "Mark as Incomplete";

export const MARK_INCOMPLETE_TASK_SUBTITLE =
  "Are you sure you want to mark this task as incomplete?";

export const MARK_INCOMPLETE_TASK_NOTE =
  "After mark them incomplete you can allow to edit details of this task..";

export const MessageAtomDefaultProps: MessageAtomProps = {
  uniqueId: "",
  dueDate: null,
  status: true,
  isDisplayMessageModal: false,
  type: undefined,
  title: "",
  onTapSendMessage: () => {},
  onTapCancel: () => {},
};

export const MemberAtomDefaultProps: MemberAtomProps = {
  isDisplay: false,
  projectId: "",
  onClose: () => {},
  onSuccess: () => {},
};

export const commonModalDefaultProps: commonModalProps = {
  isModalOpen: false,
  onClickLeftButton: () => {},
  subTitle: "",
  title: "",
  img: "",
  isShowBothButton: false,
  leftButtonText: "",
  note: "",
  onClickRightButton: () => {},
  rightButtonText: "",
};

export const updateDeadlineModalDefaultProps: UpdateDeadlineModalProps = {
  isModalOpen: false,
  onClose: () => {},
  type: "PROJECT",
};

export const updatePriorityModalDefaultProps: UpdatePriorityModalProps = {
  isModalOpen: false,
  onClose: () => {},
  type: "PROJECT",
  isProjectTask: false,
};

export const updateMemberRoleModalDeafultProps: UpdateRoleModalProps = {
  isModalOpen: false,
  onClose: () => {},
};

export const AppLoaderDefultProps: AppLoaderProps = {
  isLoading: false,
  message: "",
};

export const ErrorModalDefaultProps: commonModalProps = {
  isModalOpen: false,
  leftButtonText: "Close",
  onClickLeftButton: () => {},
  subTitle: "internal server error try after some time later",
  title: "Server Error",
};
