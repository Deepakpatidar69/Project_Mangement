const AssetMap: Record<string, any> = {
  DELETE_PROJECT: require("../../assets/UI_Images/delete_project_icon.png"),
  DELETE_TASK: require("../../assets/UI_Images/delete_task_icon.png"),
  MARK_COMPLETE_PROJECT: require("../../assets/UI_Images/project_complete_icon.png"),
  MARK_COMPLETE_TASK: require("../../assets/UI_Images/task_complete_icon.png"),
  LOGIN_ICON: require("../../assets/UI_Images/login_icon.png"),
  GOOGLE_ICON: require("../../assets/UI_Images/google_icon.png"),
  GITHUB_ICON: require("../../assets/UI_Images/github_icon.png"),
  SIGN_UP_ICON: require("../../assets/UI_Images/signup_icon.png"),
  WARNING_ICON: require("../../assets/UI_Images/warning_icon.png"),
  TASK_INCOMPLETE_ICON: require("../../assets/UI_Images/task_incomplete_icon.png"),
  PROJECT_INCOMPLETE_ICON: require("../../assets/UI_Images/project_incomplete_icon.png"),
};

const AnimationMap: Record<string, any> = {
  ADD_PROJECT: require("../../assets/Lottie_Json/add_project.json"),
  ADD_TASK: require("../../assets/Lottie_Json/add_task.json"),
  ADD_MEMBER: require("../../assets/Lottie_Json/add_member.json"),
  LOADING: require("../../assets/Lottie_Json/loading.json"),
  CENTER_BUTTON: require("../../assets/Lottie_Json/center_button.json"),
  OFFLINE: require("../../assets/Lottie_Json/offline.json"),
};

export const getAssets = (assetKey: string) => {
  if (!assetKey) {
    console.log(`Asset Key is not provided :: ${assetKey}`);
    return;
  }

  return AssetMap[assetKey];
};
export const getAnimationAssets = (assetKey: string) => {
  if (!assetKey) {
    console.log(`Asset Key is not provided :: ${assetKey}`);
    return;
  }

  return AnimationMap[assetKey];
};
