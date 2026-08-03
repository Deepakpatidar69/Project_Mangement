import {
  atomStore,
  displayAddMemberModalAtom,
  DisplayCommonModalPopUpAtom,
  displayMessageModalAtom,
  isDeadlineUpdateModalAtom,
  isPriorityUpdateModalAtom,
  isUpdateMemberRoleModalAtom,
} from "../utils/Constent";
import { store } from "../store";
import { sendMessage } from "../store/slices/MessageSlice";
import {
  commonModalDefaultProps,
  DELETE_LEFT_TEXT,
  DELETE_RIGHT_TEXT,
  MARK_COMPLETE_LEFT_BUTTON,
  MARK_COMPLETE_PROJECT_NOTE,
  MARK_COMPLETE_PROJECT_SUBTITLE,
  MARK_COMPLETE_RIGHT_BUTTON,
  MARK_COMPLETE_TASK_NOTE,
  MARK_COMPLETE_TASK_SUBTITLE,
  MARK_COMPLETE_TITLE,
  MARK_INCOMPLETE_PROJECT_NOTE,
  MARK_INCOMPLETE_PROJECT_SUBTITLE,
  MARK_INCOMPLETE_RIGHT_BUTTON,
  MARK_INCOMPLETE_TASK_NOTE,
  MARK_INCOMPLETE_TASK_SUBTITLE,
  MARK_INCOMPLETE_TITLE,
  MemberAtomDefaultProps,
  MessageAtomDefaultProps,
  PROJECT_DELETE_NOTE,
  PROJECT_DELETE_SUBTITLE,
  PROJECT_DELETE_TITLE,
  TASK_DELETE_NOTE,
  TASK_DELETE_SUBTITLE,
  TASK_DELETE_TITLE,
  updateDeadlineModalDefaultProps,
  updateMemberRoleModalDeafultProps,
  updatePriorityModalDefaultProps,
} from "../utils/AppDefaultProps";
import {
  deleteProject,
  leaveProject,
  updateProjectDeadline,
  updateProjectPriority,
  updateProjectStats,
  updateProjectStatus,
} from "../store/slices/ProjectSlice";
import {
  deletePrivateTask,
  deleteProjectTask,
  updatePrivateTask,
  updatePrivateTaskDeadline,
  updatePrivateTaskPriority,
  updatePrivateTaskStatus,
  updateProjectTaskDeadline,
  updateProjectTaskPriority,
  updateProjectTaskStatus,
} from "../store/slices/TaskSlice";
import { getAssets } from "../AssetsMapping/AssetMap";
import { MemberProps, MemberRole, PriorityLevel } from "../store/slices/types";
import { formatDate } from "../utils/Helper";
import {
  addMember,
  removeMember,
  updateMemberRole,
} from "../store/slices/MemberSlice";
import { updateUserStats } from "../store/slices/authSlice";
import {
  removeRecentProject,
  removeRecentTask,
  updateRecentProject,
  updateRecentTask,
} from "../store/slices/DashboardSlice";
import {
  onUpdateGlobalStateForProject,
  onUpdateGlobalStateForTask,
} from "../utils/GlobalStateUpdateUtils";
import AddMemberModal from "./AddMemberModal";

/**
 * ------------------------------------------------------------------------------------------------------
 * --------------------------------------- FOR MESSAGE MODAL -----------------------------------------------
 * ------------------------------------------------------------------------------------------------------
 *
 */

export const onOpenMessageModel = async ({
  isDisplay,
  status,
  deadline,
  title,
  type,
  uniqueId,
}: {
  isDisplay: boolean;
  status: boolean;
  title: string;
  type: "TASK" | "PROJECT";
  deadline: Date;
  uniqueId: string;
}) => {
  atomStore.set(displayMessageModalAtom, {
    uniqueId: uniqueId,
    isDisplayMessageModal: true,
    title: title,
    type: type,
    dueDate: deadline,
    status: status,
    onTapCancel: onCloseMessageModal,
    onTapSendMessage: onSendMessage,
  });
};

export const onCloseMessageModal = () => {
  atomStore.set(displayMessageModalAtom, MessageAtomDefaultProps);
};

export const onSendMessage = async ({
  message,
  type,
  projectId,
  taskId,
}: {
  message: string;
  type: "PROJECT" | "TASK";
  projectId?: string;
  taskId?: string;
}) => {
  try {
    if (type === "PROJECT") {
      await store.dispatch(
        sendMessage({ message: message, projectId: projectId }),
      );
      await onUpdateGlobalStateForProject({
        entity: "MESSAGE",
        action: "CREATE",
      });
    } else {
      await store.dispatch(sendMessage({ message: message, taskId: taskId }));
      await onUpdateGlobalStateForTask({
        entity: "MESSAGE",
        action: "CREATE",
      });
    }
    onCloseMessageModal();
  } catch (error) {
    console.error(
      "Err At :: model.utils :: onSendMessage :: sending message :: ",
      error,
    );
  }
};

/**
 * ------------------------------------------------------------------------------------------------------
 * --------------------------------------- FOR ADD MEMBER -----------------------------------------------
 * ------------------------------------------------------------------------------------------------------
 *
 */

export const onCloseMemberModal = async () => {
  atomStore.set(displayAddMemberModalAtom, MemberAtomDefaultProps);
};

const onAddMember = async ({
  email,
  projectId,
  role,
}: {
  email: string;
  projectId: string;
  role: MemberRole;
}) => {
  await store
    .dispatch(
      addMember({ memberEmail: email, projectId: projectId, role: role }),
    )
    .unwrap();
  onUpdateGlobalStateForProject({ entity: "MEMBER", action: "CREATE" });
  onCloseMemberModal();
};

export const handleRemoveMember = async (member: MemberProps) => {
  await store.dispatch(
    removeMember({ projectId: member.projectId, memberId: member.memberId }),
  );
  await onUpdateGlobalStateForProject({
    entity: "MEMBER",
    action: "DELETE",
  });
};

export const onOpenAddMemberModal = async ({
  isDisplay,
  projectId,
}: {
  isDisplay: boolean;
  projectId: string;
}) => {
  atomStore.set(displayAddMemberModalAtom, {
    isOpen: isDisplay,
    projectId: projectId,
    compHeight: 0,
    compWidth: 0,
    onSuccess: onAddMember,
    onClose: onCloseMemberModal,
  });
};

/**
 * ------------------------------------------------------------------------------------------------------
 * ------------------------------------- FOR DELETE TASK & PROJECT --------------------------------------
 * ------------------------------------------------------------------------------------------------------
 *
 */

export const onCloseDeleteModal = async () => {
  atomStore.set(DisplayCommonModalPopUpAtom, commonModalDefaultProps);
};

export const onTapDeleteButton = async ({
  type,
  taskId,
  projectId,
  isProjecttask = false,
  onSuccess, // 1. Add onSuccess parameter
}: {
  type: "TASK" | "PROJECT";
  taskId?: string;
  projectId?: string;
  isProjecttask?: boolean;
  onSuccess?: () => void; // 2. Add type definition
}) => {
  // 3. Make this an async function so we can await it
  const rightButtonFunc = async () => {
    if (type == "PROJECT") {
      await onClickDeleteProject({ projectId: projectId! });
    } else {
      await onClickDeleteTask({
        taskId: taskId,
        projectId: projectId,
        isProjectTask: isProjecttask,
      });
    }
    onSuccess?.();
  };

  const titleText =
    type == "PROJECT" ? PROJECT_DELETE_TITLE : TASK_DELETE_TITLE;
  const subTitleText =
    type == "PROJECT" ? PROJECT_DELETE_SUBTITLE : TASK_DELETE_SUBTITLE;
  const noteText = type == "PROJECT" ? PROJECT_DELETE_NOTE : TASK_DELETE_NOTE;
  const rightButtonText = DELETE_RIGHT_TEXT;
  const leftButtonText = DELETE_LEFT_TEXT;

  const imgIcon = getAssets(
    type == "PROJECT" ? "DELETE_PROJECT" : "DELETE_TASK",
  );

  atomStore.set(DisplayCommonModalPopUpAtom, {
    isModalOpen: true,
    title: titleText,
    subTitle: subTitleText,
    leftButtonText: leftButtonText,
    rightButtonText: rightButtonText,
    img: imgIcon,
    note: noteText,
    isShowBothButton: true,
    // 4. Make the onClick async and use try/catch
    onClickRightButton: async () => {
      // 1. Instantly close the modal the millisecond the user taps "Delete"
      // This makes the app feel extremely fast and avoids state collisions.
      onCloseDeleteModal();

      try {
        await rightButtonFunc();
      } catch (error) {
        console.error("Deletion failed:", error);
        // Optional: If it fails, you can trigger an error modal or toast here
      }
    },
    onClickLeftButton: onCloseDeleteModal,
    colorConfig: {
      rightButtonBgColor: "red.500",
      rightButtonTextColor: "white",
      onPressRightButtonBgColor: "red.600",
      noteTextColor: "orange.400",
    },
  });
};

export const onClickDeleteTask = async ({
  taskId,
  isProjectTask,
  projectId,
}: {
  taskId?: string;
  isProjectTask?: boolean;
  projectId?: string;
}) => {
  if (isProjectTask) {
    await store
      .dispatch(
        deleteProjectTask({
          taskId: taskId as string,
          projectId: projectId as string,
        }),
      )
      .unwrap();
    await onUpdateGlobalStateForProject({
      entity: "TASK",
      action: "DELETE",
    });
  } else {
    await store.dispatch(deletePrivateTask(taskId as string)).unwrap();
    await store.dispatch(updateUserStats({ tasksCount: -1 }));
    await store.dispatch(removeRecentTask(taskId as string));
  }
};

export const onClickDeleteProject = async ({
  projectId,
}: {
  projectId: string;
}) => {
  await store.dispatch(deleteProject(projectId as string)).unwrap();
  await store.dispatch(updateUserStats({ projectsCount: -1 }));
  await store.dispatch(removeRecentProject(projectId));
};

/**
 * ------------------------------------------------------------------------------------------------------
 * ------------------------------------- FOR LEAVE PROJECT ----------------------------------------------
 * ------------------------------------------------------------------------------------------------------
 *
 */

export const onCloseLeaveProjectModal = async () => {
  atomStore.set(DisplayCommonModalPopUpAtom, commonModalDefaultProps);
};

export const onClickLeaveProject = async ({
  projectId,
  onSuccess, // Pass a navigation callback here
  onError, // Pass a toast/error callback here
}: {
  projectId: string;
  onSuccess?: () => void;
  onError?: (err: string) => void;
}) => {
  try {
    await store.dispatch(leaveProject(projectId)).unwrap();

    if (onSuccess) onSuccess();
  } catch (err: any) {
    if (onError) onError(err);
  }
};



export const onTapLeaveProject = async ({
  projectId,
  onSuccess,
}: {
  projectId: string;
  onSuccess?: () => void;
}) => {
  const rightButtonFunc = async () => {
    await onClickLeaveProject({ projectId });
    onSuccess?.();
  };

  atomStore.set(DisplayCommonModalPopUpAtom, {
    isModalOpen: true,
    title: "Leave Project", // You can move these to AppDefaultProps later if you wish
    subTitle: "Are you sure you want to leave this project?",
    leftButtonText: "Cancel",
    rightButtonText: "Leave",
    img: getAssets("DELETE_PROJECT"), // Using delete asset as a fallback, replace if you map a "LEAVE_PROJECT" asset
    note: "You will permanently lose access to all tasks and messages in this project.",
    isShowBothButton: true,
    onClickRightButton: async () => {
      onCloseLeaveProjectModal();

      try {
        await rightButtonFunc();
      } catch (error) {
        console.error("Leave project failed:", error);
      }
    },
    onClickLeftButton: onCloseLeaveProjectModal,
    colorConfig: {
      rightButtonBgColor: "red.500",
      rightButtonTextColor: "white",
      onPressRightButtonBgColor: "red.600",
      noteTextColor: "orange.400",
    },
  });
};

/**
 * ------------------------------------------------------------------------------------------------------
 * --------------------------------------- FOR UPDATE DEADLINE ------------------------------------------
 * ------------------------------------------------------------------------------------------------------
 *
 */

export const onCloseDeadlineUpdateModal = () => {
  atomStore.set(isDeadlineUpdateModalAtom, updateDeadlineModalDefaultProps);
};

export const onUpdateDeadline = async ({
  type,
  taskId,
  projectId,
  deadline,
  isProjectTask = false,
}: {
  deadline: Date;
  taskId?: string;
  projectId?: string;
  type: "PROJECT" | "TASK";
  isProjectTask?: boolean;
}) => {
  try {
    if (!taskId && !projectId) {
      return;
    }

    if (type === "PROJECT" && projectId) {
      store.dispatch(
        updateProjectDeadline({
          projectId: projectId,
          projectDeadline: deadline,
        }),
      );
    } else if (isProjectTask && projectId && taskId) {
      store.dispatch(
        updateProjectTaskDeadline({
          taskDeadline: deadline,
          taskId: taskId,
          projectId: projectId,
        }),
      );
    } else if (type === "TASK" && taskId) {
      store.dispatch(
        updatePrivateTaskDeadline({ taskId: taskId, taskDeadline: deadline }),
      );
    }
  } catch (error) {
    console.error(
      "Err At :: model.utils :: onUpdateProjectStatus :: sending message :: ",
      error,
    );

    // show Error popUp
  }
};

export const onTapDeadlineUpdateModal = async ({
  type,
  taskId,
  projectId,
  isProjectTask,
  currentDeadline,
}: {
  currentDeadline: Date;
  type: "PROJECT" | "TASK";
  projectId?: string;
  taskId?: string;
  isProjectTask?: boolean;
}) => {
  const onSuccessFunc = async (newDeadline: Date) => {
    if (formatDate(currentDeadline, true) == formatDate(newDeadline, true))
      return;

    await onUpdateDeadline({
      taskId,
      type: type,
      projectId,
      isProjectTask,
      deadline: newDeadline,
    });
  };

  atomStore.set(isDeadlineUpdateModalAtom, {
    isModalOpen: true,
    type: type,
    currentDeadline: currentDeadline,
    onClose: onCloseDeadlineUpdateModal,
    onSuccess: onSuccessFunc,
  });
};

/**
 * ------------------------------------------------------------------------------------------------------
 * --------------------------------------- FOR UPDATE PRIORITY ------------------------------------------
 * ------------------------------------------------------------------------------------------------------
 *
 */

export const onClosePriorityUpdateModal = () => {
  atomStore.set(isPriorityUpdateModalAtom, updatePriorityModalDefaultProps);
};

export const onUpdatePriority = async ({
  type,
  taskId,
  projectId,
  priority,
  isProjectTask = false,
}: {
  priority: PriorityLevel;
  taskId?: string;
  projectId?: string;
  type: "PROJECT" | "TASK";
  isProjectTask?: boolean;
}) => {
  try {
    if (!taskId && !projectId) {
      console.log(`uniqueId is not Present in this...`);
      return;
    }

    if (type === "PROJECT" && projectId) {
      store.dispatch(
        updateProjectPriority({
          projectId: projectId,
          priority: priority,
        }),
      );
    } else if (isProjectTask && projectId && taskId) {
      store.dispatch(
        updateProjectTaskPriority({
          taskPriority: priority,
          taskId: taskId,
          projectId: projectId,
        }),
      );
    } else if (type === "TASK" && taskId) {
      store.dispatch(
        updatePrivateTaskPriority({ taskId: taskId, taskPriority: priority }),
      );
    }
  } catch (error) {
    console.error(
      "Err At :: model.utils :: onUpdateProjectStatus :: sending message :: ",
      error,
    );

    // show Error popUp
  }
};

export const onTapUpdatePriority = async ({
  type,
  taskId,
  projectId,
  isProjectTask = false,
  currentPriority,
}: {
  currentPriority: PriorityLevel;
  type: "PROJECT" | "TASK";
  projectId?: string;
  taskId?: string;
  isProjectTask?: boolean;
}) => {
  const succesFunc = async (selectedPriority: PriorityLevel) => {
    if (currentPriority == selectedPriority) return;

    await onUpdatePriority({
      priority: selectedPriority,
      type: type,
      isProjectTask: isProjectTask,
      projectId: projectId,
      taskId: taskId,
    });
  };

  atomStore.set(isPriorityUpdateModalAtom, {
    isModalOpen: true,
    onClose: onClosePriorityUpdateModal,
    type: type,
    onSuccess: succesFunc,
    currentPriority: currentPriority,
  });
};

/**
 * ------------------------------------------------------------------------------------------------------
 * --------------------------------------- FOR UPDATE MEMBER ROLE ---------------------------------------
 * ------------------------------------------------------------------------------------------------------
 *
 */

export const onCloseMemberUpdateModal = () => {
  atomStore.set(isUpdateMemberRoleModalAtom, updateMemberRoleModalDeafultProps);
};

export const onUpdateRole = async ({
  memberId,
  projectId,
  selectedRole,
}: {
  projectId: string;
  memberId: string;
  selectedRole: MemberRole;
}) => {
  try {
    if (!projectId && !memberId) {
      console.log(`projectId or memberId is not Present in this...`);
      return;
    }

    store.dispatch(
      updateMemberRole({
        memberId: memberId,
        projectId: projectId,
        role: selectedRole,
      }),
    );
  } catch (error) {
    console.error(
      "Err At :: model.utils :: onUpdateProjectStatus :: sending message :: ",
      error,
    );
  }
};

export const onTapMemberRoleUpdate = async ({
  currentRole,
  projectId,
  memberId,
}: {
  currentRole: MemberRole;
  projectId: string;
  memberId: string;
}) => {
  const succesFunc = async (selectedRole: MemberRole) => {
    if (currentRole == selectedRole) return;

    await onUpdateRole({
      memberId,
      projectId,
      selectedRole: selectedRole,
    });
  };

  atomStore.set(isUpdateMemberRoleModalAtom, {
    isModalOpen: true,
    onClose: onCloseMemberUpdateModal,
    onSuccess: succesFunc,
    currentRole: currentRole,
  });
};

/**
 * ------------------------------------------------------------------------------------------------------
 * ---------------------------------------- FOR MARK COMPLETE -------------------------------------------
 * ------------------------------------------------------------------------------------------------------
 *
 */

export const onCloseMarkCompleteModal = () => {
  atomStore.set(DisplayCommonModalPopUpAtom, commonModalDefaultProps);
};

const onUpdateStatus = async ({
  taskId,
  type,
  isProjectTask,
  projectId,
  isCompleted,
}: {
  type: "PROJECT" | "TASK";
  taskId?: string;
  projectId?: string;
  isProjectTask?: boolean;
  isCompleted?: boolean;
}) => {
  try {
    if (!taskId && !projectId) {
      console.log(`uniqueId is not Present in this...`);
      return;
    }

    if (type === "PROJECT" && projectId) {
      store.dispatch(updateProjectStatus(projectId)).unwrap();
      store.dispatch(
        updateUserStats({ completedProjectsCount: isCompleted ? -1 : 1 }),
      );
      store.dispatch(
        updateRecentProject({
          projectId: projectId,
          changes: { status: isCompleted ? false : true },
        }),
      );
    } else if (isProjectTask && projectId && taskId) {
      store.dispatch(
        updateProjectTaskStatus({ taskId: taskId, projectId: projectId }),
      );
      await onUpdateGlobalStateForProject({
        entity: "TASK_COMPLETE",
        action: isCompleted ? "DELETE" : "CREATE",
      });
    } else if (type === "TASK" && taskId) {
      await store.dispatch(updatePrivateTaskStatus(taskId)).unwrap();
      await store.dispatch(
        updateUserStats({ completedTasksCount: isCompleted ? -1 : 1 }),
      );
      await store.dispatch(
        updateRecentTask({
          taskId: taskId,
          changes: { status: isCompleted ? false : true },
        }),
      );
    }
  } catch (error) {
    console.error(
      "Err At :: model.utils :: onUpdateProjectStatus :: sending message :: ",
      error,
    );
  }
};

export const onTapMarkComplete = async ({
  type,
  projectId,
  taskId,
  isProjectTask = false,
  isComplete = false,
}: {
  type: "PROJECT" | "TASK";
  projectId?: string;
  taskId?: string;
  isProjectTask?: boolean;
  isComplete?: boolean;
}) => {
  const rightButtonFunc = () =>
    onUpdateStatus({
      type,
      isProjectTask,
      projectId,
      taskId,
      isCompleted: isComplete,
    });

  const titleText = isComplete ? MARK_INCOMPLETE_TITLE : MARK_COMPLETE_TITLE;

  const subTitleText =
    type == "PROJECT"
      ? isComplete
        ? MARK_INCOMPLETE_PROJECT_SUBTITLE
        : MARK_COMPLETE_PROJECT_SUBTITLE
      : isComplete
        ? MARK_INCOMPLETE_TASK_SUBTITLE
        : MARK_COMPLETE_TASK_SUBTITLE;

  const noteText =
    type == "PROJECT"
      ? isComplete
        ? MARK_INCOMPLETE_PROJECT_NOTE
        : MARK_COMPLETE_PROJECT_NOTE
      : isComplete
        ? MARK_INCOMPLETE_TASK_NOTE
        : MARK_COMPLETE_TASK_NOTE;

  const rightButtonText = isComplete
    ? MARK_INCOMPLETE_RIGHT_BUTTON
    : MARK_COMPLETE_RIGHT_BUTTON;
  const leftButtonText = MARK_COMPLETE_LEFT_BUTTON;

  const imgIcon = getAssets(
    type == "PROJECT"
      ? isComplete
        ? "PROJECT_INCOMPLETE_ICON"
        : "MARK_COMPLETE_PROJECT"
      : isComplete
        ? "TASK_INCOMPLETE_ICON"
        : "MARK_COMPLETE_TASK",
  );

  atomStore.set(DisplayCommonModalPopUpAtom, {
    isModalOpen: true,
    title: titleText,
    subTitle: subTitleText,
    leftButtonText: leftButtonText,
    rightButtonText: rightButtonText,
    img: imgIcon,
    note: noteText,
    isShowBothButton: true,
    onClickRightButton: () => {
      rightButtonFunc();
      onCloseMarkCompleteModal();
    },
    onClickLeftButton: onCloseMarkCompleteModal,

    colorConfig: {
      rightButtonBgColor: isComplete ? "orange.500" : "green.600",
      rightButtonTextColor: "white",
      onPressRightButtonBgColor: isComplete ? "orange.600" : "green.700",

      onPressLeftButtonBgColor: "coolGray.200",
      leftButtonBgColor: "coolGray.100",
      leftButtonTextColor: "coolGray.800",
      noteTextColor: "orange.400",
    },
  });
};
