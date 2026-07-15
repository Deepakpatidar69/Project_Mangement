import { useDispatch } from "react-redux";
import {
  atomStore,
  displayAddMemberModalAtom,
  DisplayCommonModalPopUpAtom,
  displayMessageModalAtom,
  isDeadlineUpdateModalAtom,
  isDisplayDeleteModalPopUpAtom,
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
  MARK_COMPLETE_PROJECT_TITLE,
  MARK_COMPLETE_RIGHT_BUTTON,
  MARK_COMPLETE_TASK_NOTE,
  MARK_COMPLETE_TASK_SUBTITLE,
  MARK_COMPLETE_TASK_TITLE,
  MARK_INCOMPLETE_PROJECT_NOTE,
  MARK_INCOMPLETE_PROJECT_SUBTITLE,
  MARK_INCOMPLETE_PROJECT_TITLE,
  MARK_INCOMPLETE_RIGHT_BUTTON,
  MARK_INCOMPLETE_TASK_NOTE,
  MARK_INCOMPLETE_TASK_SUBTITLE,
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
  updateProjectDeadline,
  updateProjectPriority,
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
import { MemberRole, PriorityLevel } from "../store/slices/types";
import { formatDate } from "../utils/Helper";
import { updateMemberRole } from "../store/slices/MemberSlice";

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
    } else {
      await store.dispatch(sendMessage({ message: message, taskId: taskId }));
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

export const onOpenAddMemberModal = async ({
  isDisplay,
  projectId,
}: {
  isDisplay: boolean;
  projectId: string;
}) => {
  atomStore.set(displayAddMemberModalAtom, {
    isDisplay: isDisplay,
    onClose: onCloseMemberModal,
    onSuccess: onCloseMemberModal,
    projectId: projectId,
  });
};

/**
 * ------------------------------------------------------------------------------------------------------
 * --------------------------------------- FOR DELETE MODAL ------------------------------------------
 * ------------------------------------------------------------------------------------------------------
 *
 */

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
          projectId: projectId as string,
          taskId: taskId as string,
        }),
      )
      .unwrap();
  } else {
    await store.dispatch(deletePrivateTask(taskId as string)).unwrap();
  }
};

export const onClickDeleteProject = async ({
  projectId,
}: {
  projectId?: string;
}) => {
  store.dispatch(deleteProject(projectId as string));
};

export const onOpenDeleteModal = async ({
  subTitle,
  title,
  type,
  isProjectTask = false,
  note,
  projectId,
  taskId,
}: {
  title: string;
  subTitle: string;
  note?: string;
  type: "PROJECT" | "TASK";
  taskId?: string;
  projectId?: string;
  isProjectTask?: boolean;
}) => {
  const rightButtonText = type == "PROJECT" ? "Delete Project" : "Delete Task";
  const noteText = "this operation can't be undo!";

  const functionToBeCall = async () => {
    type == "PROJECT"
      ? onClickDeleteProject({ projectId: projectId })
      : onClickDeleteTask({
          taskId: taskId,
          isProjectTask: isProjectTask,
          projectId: projectId,
        });
  };

  atomStore.set(isDisplayDeleteModalPopUpAtom, {
    isModalOpen: true,
    title: title,
    subTitle: subTitle,
    leftButtonText: "Cancel",
    rightButtonText: rightButtonText,
    note: noteText,
    onClickRightButton: async () => {
      await functionToBeCall();
    },
    onClickLeftButton: async () => {},
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
      console.log(`uniqueId is not Present in this...`);
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
    console.log(`Current Deadline is :: ${formatDate(currentDeadline, true)} `);
    console.log(`newDeadline Deadline is :: ${formatDate(newDeadline, true)} `);

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
  console.log(
    `Member Details is :: memberId :: ${memberId} :: projectId :: ${projectId}`,
  );

  const succesFunc = async (selectedRole: MemberRole) => {
    if (currentRole == selectedRole) return;

    console.log(`Selected Role is :: ${selectedRole}`);

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
 * ------------------------------------- FOR DELETE TASK & PROJECT --------------------------------------
 * ------------------------------------------------------------------------------------------------------
 *
 */

export const onCloseDeleteModal = () => {
  atomStore.set(DisplayCommonModalPopUpAtom, commonModalDefaultProps);
};

export const onTapDeleteButton = async ({
  type,
  taskId,
  projectId,
  isProjecttask = false,
}: {
  type: "TASK" | "PROJECT";
  taskId?: string;
  projectId?: string;
  isProjecttask?: boolean;
}) => {
  const rightButtonFunc =
    type == "PROJECT"
      ? () => onClickDeleteProject({ projectId: projectId })
      : () =>
          onClickDeleteTask({
            taskId: taskId,
            projectId: projectId,
            isProjectTask: isProjecttask,
          });

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
    onClickRightButton: () => {
      console.log(`OnDelete Delete Confirm Button`);
      onCloseDeleteModal();
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
}: {
  type: "PROJECT" | "TASK";
  taskId?: string;
  projectId?: string;
  isProjectTask?: boolean;
}) => {
  try {
    if (!taskId && !projectId) {
      console.log(`uniqueId is not Present in this...`);
      return;
    }

    if (type === "PROJECT" && projectId) {
      store.dispatch(updateProjectStatus(projectId));
    } else if (isProjectTask && projectId && taskId) {
      store.dispatch(
        updateProjectTaskStatus({ taskId: taskId, projectId: projectId }),
      );
    } else if (type === "TASK" && taskId) {
      store.dispatch(updatePrivateTaskStatus(taskId));
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
    onUpdateStatus({ type, isProjectTask, projectId, taskId });

  const titleText =
    type == "PROJECT"
      ? isComplete
        ? MARK_INCOMPLETE_PROJECT_TITLE
        : MARK_COMPLETE_PROJECT_TITLE
      : isComplete
        ? MARK_COMPLETE_TASK_TITLE
        : MARK_COMPLETE_TASK_TITLE;

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
      onPressRightButtonBgColor: isComplete ? "orange.600" :"green.700",

      onPressLeftButtonBgColor: "coolGray.200",
      leftButtonBgColor: "coolGray.100",
      leftButtonTextColor: "coolGray.800",
      noteTextColor: "orange.400",
    },
  });
};
