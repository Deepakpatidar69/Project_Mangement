import { atom, getDefaultStore } from "jotai";
import { NavigatorEnum } from "../appNavigator/navigator.utils";
import {
  AppLoaderDefultProps,
  commonModalDefaultProps,
  ErrorModalDefaultProps,
  MemberAtomDefaultProps,
  MessageAtomDefaultProps,
  updateDeadlineModalDefaultProps,
  updateMemberRoleModalDeafultProps,
  updatePriorityModalDefaultProps,
} from "./AppDefaultProps";
import {
  AppLoaderProps,
  GlobalMenuState,
  MessageAtomProps,
} from "./props.utils";
import { commonModalProps } from "../modals/CommonModel";
import { UpdateDeadlineModalProps } from "../modals/UpdateDeadlineModal";
import { UpdatePriorityModalProps } from "../modals/UpdatePriorityModal";
import { UpdateRoleModalProps } from "../modals/UpdateMemberRole";

// export const BASE_URL = "http://192.168.1.8:5000/api";
export const BASE_URL = "http://10.242.12.163:5000/api";
export const TOKEN_KEY = "_@token";

export const atomStore = getDefaultStore();

export const HEADER_LENGTH = 500;
export const DESC_LENGTH = 2000;
export const MAX_BIO_LENGTH = 250;

export const DEFAULT_RECENT_TASK_LIMIT = 3;
export const DEFAULT_RECEMT_PROJECT_LIMIT = 3;

export const DEFAULT_RECENT_MESSAGE_LIMIT = 3;
export const DEFAULT_MESSAGE_LIMIT_ON_MESSAGE_SCREEN = 10;

export const DEFAULT_MEMBERS_LIMIT_ON_PROJECT_SCREEN = 3;
export const DEFAULT_MEMBERS_LIMIT_ON_MEMBERSLIST = 10;

export const initialNavigationUrlAtom = atom<NavigatorEnum>(
  NavigatorEnum.Auth_Screen,
);
export const isCheckLoadUserAtom = atom<boolean>(false);

export const NUMBER_OF_PROJECT_DISPLAY_ON_DASHBOARD_SCREEN = 3;
export const NUMBER_OF_TASK_DISPLAY_ON_DASHBOARD_SCREEN = 3;

export const NUMBER_OF_TASKS_DISPLAYED_ON_DETAIL_SCREEN = 3;
export const NUMBER_OF_MESSAGES_DISPLAYED_ON_DETAIL_SCREEN = 3;

export const displayMessageModalAtom = atom<MessageAtomProps>(
  MessageAtomDefaultProps,
);

export const isOnlineAtom = atom(true);

export const displayAddMemberModalAtom = atom<{
  isDisplay: boolean;
  projectId: string;
  onClose: () => void;
  onSuccess: () => void;
}>(MemberAtomDefaultProps);

export const DisplayCommonModalPopUpAtom = atom<commonModalProps>(
  commonModalDefaultProps,
);
export const isDisplayDeleteModalPopUpAtom = atom<commonModalProps>(
  commonModalDefaultProps,
);

export const isDisplayErrorMessageAtom = atom<commonModalProps>(
  ErrorModalDefaultProps,
);

export const isDeadlineUpdateModalAtom = atom<UpdateDeadlineModalProps>(
  updateDeadlineModalDefaultProps,
);

export const isPriorityUpdateModalAtom = atom<UpdatePriorityModalProps>(
  updatePriorityModalDefaultProps,
);

export const isUpdateMemberRoleModalAtom = atom<UpdateRoleModalProps>(
  updateMemberRoleModalDeafultProps,
);

export const globalMenuAtom = atom<GlobalMenuState>({
  isOpen: false,
  x: 0,
  y: 0,
  iconWidth: 0,
  minWidth: 150, // Default fallback width
  options: [],
});

export const AppLoaderAtom = atom<AppLoaderProps>(AppLoaderDefultProps);
