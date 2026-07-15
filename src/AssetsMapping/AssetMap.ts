const AssetMap: Record<string, any> = {
  DELETE_PROJECT: require("../../assets/UI_Images/deleteProjectIcon.png"),
  DELETE_TASK: require("../../assets/UI_Images/deleteTaskIcon.png"),
  MARK_COMPLETE_PROJECT: require("../../assets/UI_Images/projectCompleteIcon.png"),
  MARK_COMPLETE_TASK: require("../../assets/UI_Images/taskCompleteIcon.png"),
  LOGIN_ICON: require("../../assets/UI_Images/login_Icon.png"),
  GOOGLE_ICON: require("../../assets/UI_Images/google_Icon.png"),
  GITHUB_ICON: require("../../assets/UI_Images/gitHub_Icon.png"),
  SIGN_UP_ICON: require("../../assets/UI_Images/signUp_Icon.png"),
  WARNING_ICON: require("../../assets/UI_Images/warning_Icon.png"),
  TASK_INCOMPLETE_ICON: require("../../assets/UI_Images/taskInCompleteIcon.png"),
  PROJECT_INCOMPLETE_ICON: require("../../assets/UI_Images/projectInCompleteIcon.png"),
};

const AnimationMap: Record<string, any> = {
  ADD_PROJECT: require("../../assets/Lottie_Json/ADD FILE.json"),
  ERROR_404: require("../../assets/Lottie_Json/Error 404.json"),
  Loading: require("../../assets/Lottie_Json/Loading animation blue.json"),
  ADD_PROJECT1: require("../../assets/Lottie_Json/Add Media.json"),
  ADD_TASK: require("../../assets/Lottie_Json/add new.json"),
  ADD_TASK2: require("../../assets/Lottie_Json/add post (1).json"),
  ADD_TASK3: require("../../assets/Lottie_Json/add post.json"),
  ADD_TASK6: require("../../assets/Lottie_Json/add.json"),
  ADD_TASK7: require("../../assets/Lottie_Json/list add.json"),
  ADD_TASK8: require("../../assets/Lottie_Json/loading.json"),
  AddMember: require("../../assets/Lottie_Json/add button.json"),
  Loading2: require("../../assets/Lottie_Json/Loading animation blue (1).json"),
  ADD1: require("../../assets/Lottie_Json/add new (2).json"),
  ADD2: require("../../assets/Lottie_Json/add new (1).json"),
  ADD3: require("../../assets/Lottie_Json/add new (3).json"),
  Offline: require("../../assets/Lottie_Json/offline.json"),
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
